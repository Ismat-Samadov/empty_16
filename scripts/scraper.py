import asyncio
import aiohttp
import csv
import json
import logging
import os
import random
import re
import signal
import ssl
import sys
import time
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_URL = "https://krisha.kz/prodazha/kvartiry/"
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "data.csv")
CHECKPOINT_FILE = os.path.join(DATA_DIR, ".checkpoint.json")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

FIELDNAMES = [
    "id", "url", "title", "price", "price_per_m2",
    "rooms", "area", "floor", "total_floors",
    "address", "district", "city",
]

MAX_RETRIES = 6
CONCURRENCY = 2                         # conservative — site throttles above this
BASE_DELAY = 1.5                        # seconds between requests per worker
RETRY_BACKOFF = [10, 20, 40, 60, 90, 120]  # seconds (+ jitter) between retries

# Global throttle: when consecutive failures hit this threshold, all workers pause
THROTTLE_THRESHOLD = 2
THROTTLE_PAUSES = [90, 180, 300, 600]   # escalating pauses (seconds) on repeated throttle hits

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(open(sys.stdout.fileno(), mode="w", encoding="utf-8", closefd=False)),
        logging.FileHandler(os.path.join(DATA_DIR, "scraper.log"), encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Graceful shutdown
# ---------------------------------------------------------------------------
_shutdown = asyncio.Event()

def _handle_signal(*_):
    if not _shutdown.is_set():
        log.warning("Interrupt received — finishing in-flight requests and saving progress...")
        _shutdown.set()

# ---------------------------------------------------------------------------
# Checkpoint helpers
# ---------------------------------------------------------------------------
def load_checkpoint() -> dict:
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, encoding="utf-8") as f:
                data = json.load(f)
            log.info(f"Checkpoint loaded: {len(data.get('done_pages', []))} pages done, "
                     f"{len(data.get('listings', []))} listings so far")
            return data
        except Exception as e:
            log.warning(f"Could not read checkpoint ({e}), starting fresh")
    return {"done_pages": [], "listings": []}


def save_checkpoint(done_pages: list[int], listings: list[dict]):
    tmp = CHECKPOINT_FILE + ".tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump({"done_pages": done_pages, "listings": listings}, f, ensure_ascii=False)
        os.replace(tmp, CHECKPOINT_FILE)   # atomic rename
    except Exception as e:
        log.error(f"Failed to save checkpoint: {e}")


def clear_checkpoint():
    try:
        os.remove(CHECKPOINT_FILE)
    except FileNotFoundError:
        pass

# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------
def parse_listings(html: str, page: int) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    listings = []

    cards = soup.select("div.a-card[data-id]")
    if not cards:
        log.warning(f"Page {page}: no cards found — site structure may have changed")

    for card in cards:
        try:
            item = {}

            item["id"] = card.get("data-id", "")

            link_tag = card.select_one("a.a-card__title")
            if link_tag:
                href = link_tag.get("href", "")
                item["url"] = "https://krisha.kz" + href if href.startswith("/") else href
                title = link_tag.get_text(strip=True)
                item["title"] = title
            else:
                item["url"] = item["title"] = ""
                title = ""

            m = re.search(r"(\d+)-комн", title)
            item["rooms"] = m.group(1) if m else ""

            m = re.search(r"([\d,.]+)\s*м²", title)
            item["area"] = m.group(1).replace(",", ".") if m else ""

            m = re.search(r"(\d+)/(\d+)\s*этаж", title)
            item["floor"], item["total_floors"] = (m.group(1), m.group(2)) if m else ("", "")

            price_tag = card.select_one("div.a-card__price")
            raw = price_tag.get_text(strip=True) if price_tag else ""
            item["price"] = re.sub(r"[^\d]", "", raw)

            try:
                item["price_per_m2"] = (
                    str(round(int(item["price"]) / float(item["area"])))
                    if item["price"] and item["area"] else ""
                )
            except (ValueError, ZeroDivisionError):
                item["price_per_m2"] = ""

            addr_tag = card.select_one("div.a-card__subtitle")
            addr_text = addr_tag.get_text(strip=True) if addr_tag else ""
            item["address"] = addr_text

            stats = card.select("div.a-card__stats-item")
            item["city"] = stats[0].get_text(strip=True) if stats else ""

            parts = [p.strip() for p in addr_text.split(",")]
            item["district"] = parts[0] if parts else ""

            listings.append(item)

        except Exception as e:
            log.warning(f"Page {page}: parse error on card {card.get('data-id', '?')}: {e}")

    return listings

# ---------------------------------------------------------------------------
# Fetching with retry
# ---------------------------------------------------------------------------
def _jitter(base: float, pct: float = 0.3) -> float:
    """Add ±pct random jitter to a delay so retries don't slam simultaneously."""
    return base * (1 + random.uniform(-pct, pct))


async def fetch_page(
    session: aiohttp.ClientSession,
    page: int,
    throttle_event: asyncio.Event,
    fail_counter: list,
    throttle_count: list | None = None,
) -> str:
    if throttle_count is None:
        throttle_count = [0]
    url = BASE_URL if page == 1 else f"{BASE_URL}?page={page}"
    last_exc = None

    for attempt in range(MAX_RETRIES):
        if _shutdown.is_set():
            raise asyncio.CancelledError("shutdown requested")

        # wait if global throttle is active
        if throttle_event.is_set():
            log.info(f"Page {page}: global throttle active, waiting...")
            await asyncio.sleep(_jitter(5))

        try:
            async with session.get(
                url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=45), ssl=False
            ) as resp:
                if resp.status == 429:
                    wait = _jitter(RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)] * 2)
                    log.warning(f"Page {page}: rate-limited (429), waiting {wait:.1f}s...")
                    fail_counter[0] += 1
                    await asyncio.sleep(wait)
                    continue
                resp.raise_for_status()
                fail_counter[0] = 0  # reset on success
                return await resp.text()

        except asyncio.CancelledError:
            raise
        except (aiohttp.ClientError, asyncio.TimeoutError, OSError) as e:
            last_exc = e
            fail_counter[0] += 1
            wait = _jitter(RETRY_BACKOFF[min(attempt, len(RETRY_BACKOFF) - 1)])

            exc_name = type(e).__name__
            exc_msg = str(e) or "connection reset"
            log.warning(
                f"Page {page}: attempt {attempt + 1}/{MAX_RETRIES} failed "
                f"[{exc_name}: {exc_msg}], retrying in {wait:.1f}s..."
            )

            # trigger global throttle if too many concurrent failures
            if fail_counter[0] >= THROTTLE_THRESHOLD and not throttle_event.is_set():
                throttle_event.set()
                pause = THROTTLE_PAUSES[min(throttle_count[0], len(THROTTLE_PAUSES) - 1)]
                throttle_count[0] += 1
                log.warning(
                    f"Too many failures ({fail_counter[0]}) — "
                    f"pausing all workers for {pause}s (throttle #{throttle_count[0]})..."
                )
                await asyncio.sleep(pause)
                fail_counter[0] = 0
                throttle_event.clear()
                log.info("Resuming after throttle pause.")
            else:
                await asyncio.sleep(wait)

    raise RuntimeError(
        f"Page {page}: all {MAX_RETRIES} attempts failed. "
        f"Last error: {type(last_exc).__name__}: {last_exc}"
    )


async def get_total_pages(session: aiohttp.ClientSession, throttle_event: asyncio.Event, fail_counter: list, throttle_count: list) -> tuple[int, list]:
    html = await fetch_page(session, 1, throttle_event, fail_counter, throttle_count)
    soup = BeautifulSoup(html, "lxml")
    pag = soup.select(".paginator__btn--to-page, [class*='paginator'] a")
    pages = [int(t.get_text(strip=True)) for t in pag if t.get_text(strip=True).isdigit()]
    total = max(pages) if pages else 1
    return total, parse_listings(html, 1)

# ---------------------------------------------------------------------------
# CSV helpers
# ---------------------------------------------------------------------------
def write_csv(listings: list[dict]):
    tmp = OUTPUT_FILE + ".tmp"
    with open(tmp, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(listings)
    os.replace(tmp, OUTPUT_FILE)   # atomic rename — never leaves a half-written file

# ---------------------------------------------------------------------------
# Main scrape loop
# ---------------------------------------------------------------------------
async def scrape(start_page: int = 1, end_page: int | None = None):
    os.makedirs(DATA_DIR, exist_ok=True)

    # --- register OS signals for graceful shutdown ---
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _handle_signal)
        except NotImplementedError:
            # Windows doesn't support add_signal_handler for all signals
            signal.signal(sig, _handle_signal)

    # --- load checkpoint ---
    checkpoint = load_checkpoint()
    done_pages: set[int] = set(checkpoint["done_pages"])
    all_listings: list[dict] = checkpoint["listings"]
    seen_ids: set[str] = {item["id"] for item in all_listings}

    throttle_event = asyncio.Event()  # set when workers should pause
    fail_counter = [0]                # shared mutable counter [failures since last success]
    throttle_count = [0]              # how many times we've hit the global throttle

    # force_close + permissive SSL avoids Windows "semaphore timeout" on SSL handshake
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connector = aiohttp.TCPConnector(
        limit=10,
        ttl_dns_cache=300,
        force_close=True,
        enable_cleanup_closed=True,
        ssl=ssl_ctx,
    )
    async with aiohttp.ClientSession(connector=connector) as session:

        # --- detect total pages ---
        if end_page is None:
            log.info("Detecting total pages...")
            try:
                end_page, page1_listings = await get_total_pages(session, throttle_event, fail_counter, throttle_count)
                log.info(f"Total pages: {end_page}")
                if 1 not in done_pages:
                    for item in page1_listings:
                        if item["id"] not in seen_ids:
                            seen_ids.add(item["id"])
                            all_listings.append(item)
                    done_pages.add(1)
                    log.info(f"Page 1: {len(page1_listings)} listings parsed")
            except Exception as e:
                log.error(f"Could not detect total pages: {e}")
                sys.exit(1)

        pages_to_fetch = [p for p in range(start_page, end_page + 1) if p not in done_pages]
        log.info(f"Pages to fetch: {len(pages_to_fetch)} "
                 f"(skipping {len(done_pages)} already done)")

        sem = asyncio.Semaphore(CONCURRENCY)

        async def fetch_one(page: int):
            async with sem:
                if _shutdown.is_set():
                    return None
                try:
                    html = await fetch_page(session, page, throttle_event, fail_counter, throttle_count)
                    await asyncio.sleep(_jitter(BASE_DELAY))
                    return page, html
                except asyncio.CancelledError:
                    return None
                except Exception as e:
                    log.error(f"Page {page}: permanently failed — {type(e).__name__}: {e}")
                    return page, None

        tasks = [asyncio.create_task(fetch_one(p)) for p in pages_to_fetch]

        for coro in asyncio.as_completed(tasks):
            result = await coro
            if result is None:
                continue
            page, html = result
            if html is None:
                continue

            listings = parse_listings(html, page)
            log.info(f"Page {page}/{end_page}: {len(listings)} listings")

            for item in listings:
                if item["id"] not in seen_ids:
                    seen_ids.add(item["id"])
                    all_listings.append(item)

            done_pages.add(page)
            save_checkpoint(sorted(done_pages), all_listings)

            if _shutdown.is_set():
                log.info("Shutdown flag set — stopping early")
                for t in tasks:
                    t.cancel()
                break

    # --- write final CSV ---
    log.info(f"\nTotal unique listings collected: {len(all_listings)}")
    write_csv(all_listings)
    log.info(f"Saved → {OUTPUT_FILE}")

    if _shutdown.is_set():
        log.info("Partial run saved. Re-run the script to resume from where it stopped.")
    else:
        clear_checkpoint()
        log.info("Checkpoint cleared.")

    return all_listings


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Krisha.kz apartment scraper")
    parser.add_argument("start", nargs="?", type=int, default=1, help="Start page (default: 1)")
    parser.add_argument("end",   nargs="?", type=int, default=None, help="End page (default: auto-detect)")
    parser.add_argument("--wait", type=int, default=0, metavar="SECONDS",
                        help="Wait N seconds before starting (useful after a rate-limit block)")
    args = parser.parse_args()

    if args.wait:
        log.info(f"Waiting {args.wait}s before starting (--wait)...")
        time.sleep(args.wait)

    try:
        asyncio.run(scrape(start_page=args.start, end_page=args.end))
    except KeyboardInterrupt:
        pass
