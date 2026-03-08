import csv
import os
import sys
import collections
import statistics

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR   = os.path.join(os.path.dirname(__file__), "..")
DATA_FILE  = os.path.join(BASE_DIR, "data", "data.csv")
CHARTS_DIR = os.path.join(BASE_DIR, "charts")
os.makedirs(CHARTS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Style
# ---------------------------------------------------------------------------
BRAND_COLORS = [
    "#2563EB", "#16A34A", "#DC2626", "#D97706", "#7C3AED",
    "#0891B2", "#BE123C", "#15803D", "#9333EA", "#B45309",
    "#1D4ED8", "#065F46", "#991B1B", "#92400E", "#4C1D95",
]
PRIMARY   = "#2563EB"
SECONDARY = "#16A34A"
DANGER    = "#DC2626"
NEUTRAL   = "#64748B"

plt.rcParams.update({
    "figure.facecolor":  "#FAFAFA",
    "axes.facecolor":    "#FFFFFF",
    "axes.edgecolor":    "#E2E8F0",
    "axes.grid":         True,
    "grid.color":        "#F1F5F9",
    "grid.linewidth":    0.8,
    "axes.spines.top":   False,
    "axes.spines.right": False,
    "font.family":       "DejaVu Sans",
    "font.size":         11,
    "axes.titlesize":    14,
    "axes.titleweight":  "bold",
    "axes.titlepad":     14,
    "axes.labelsize":    11,
    "axes.labelcolor":   "#334155",
    "xtick.color":       "#64748B",
    "ytick.color":       "#64748B",
})

# ---------------------------------------------------------------------------
# Load & clean data
# ---------------------------------------------------------------------------
with open(DATA_FILE, encoding="utf-8-sig") as f:
    raw = list(csv.DictReader(f))

rows = []
for r in raw:
    try:
        price    = int(r["price"])   if r["price"].isdigit()         else None
        area_s   = r["area"].replace(",", ".")
        area     = float(area_s)     if area_s.replace(".", "").isdigit() else None
        ppm2     = int(r["price_per_m2"]) if r["price_per_m2"].isdigit() else None
        rooms    = int(r["rooms"])   if r["rooms"].isdigit()          else None
        floor    = int(r["floor"])   if r["floor"].isdigit()          else None
        tot_fl   = int(r["total_floors"]) if r["total_floors"].isdigit() else None

        if price and price > 1_000_000:          # exclude obvious bad data
            rows.append({
                **r,
                "price_n":    price,
                "area_n":     area,
                "ppm2_n":     ppm2,
                "rooms_n":    rooms,
                "floor_n":    floor,
                "tot_fl_n":   tot_fl,
            })
    except Exception:
        continue

# Helper: city name clean-up
def city_label(c):
    return c.strip() if c else "Unknown"

# KZT formatting
def fmt_kzt(v, millions=False):
    if millions:
        return f"{v/1e6:.1f}M ₸"
    return f"{v:,.0f}"

def add_bar_labels(ax, bars, fmt="M", offset_frac=0.01):
    max_v = max(b.get_height() for b in bars)
    for b in bars:
        h = b.get_height()
        if h == 0:
            continue
        label = f"{h/1e6:.1f}M" if fmt == "M" else f"{h:,.0f}" if fmt == "int" else f"{h:.1f}"
        ax.text(
            b.get_x() + b.get_width() / 2,
            h + max_v * offset_frac,
            label,
            ha="center", va="bottom",
            fontsize=9, fontweight="bold", color="#1E293B",
        )

def save(fig, name):
    path = os.path.join(CHARTS_DIR, name)
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {name}")


# ===========================================================================
# Chart 1 — Listings by City (supply distribution)
# ===========================================================================
city_counts = collections.Counter(city_label(r["city"]) for r in rows)
top_cities  = city_counts.most_common(10)
labels, vals = zip(*top_cities)

fig, ax = plt.subplots(figsize=(11, 6))
bars = ax.bar(labels, vals, color=BRAND_COLORS[:len(labels)], width=0.6, zorder=3)
add_bar_labels(ax, bars, fmt="int")
ax.set_title("Apartment Listings by City\nWhich cities dominate the sales market?")
ax.set_xlabel("City")
ax.set_ylabel("Number of Listings")
ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{int(x):,}"))
plt.xticks(rotation=25, ha="right")
save(fig, "01_listings_by_city.png")


# ===========================================================================
# Chart 2 — Average Price per m² by City
# ===========================================================================
city_ppm2 = collections.defaultdict(list)
for r in rows:
    if r["ppm2_n"] and r["ppm2_n"] > 50_000:
        city_ppm2[city_label(r["city"])].append(r["ppm2_n"])

top_city_keys = [c for c, _ in city_counts.most_common(10) if c in city_ppm2]
avg_ppm2 = [(c, statistics.median(city_ppm2[c])) for c in top_city_keys]
avg_ppm2.sort(key=lambda x: -x[1])
labels2, vals2 = zip(*avg_ppm2)

fig, ax = plt.subplots(figsize=(11, 6))
bars = ax.bar(labels2, vals2, color=PRIMARY, width=0.6, zorder=3)
max_v = max(vals2)
for b, v in zip(bars, vals2):
    ax.text(b.get_x() + b.get_width()/2, v + max_v*0.01,
            f"{v/1000:.0f}K ₸", ha="center", va="bottom",
            fontsize=9, fontweight="bold", color="#1E293B")
ax.set_title("Median Price per m² by City\nWhere is real estate most expensive?")
ax.set_xlabel("City")
ax.set_ylabel("Price per m² (₸)")
ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{x/1000:.0f}K"))
plt.xticks(rotation=25, ha="right")
save(fig, "02_price_per_m2_by_city.png")


# ===========================================================================
# Chart 3 — Supply by Room Count
# ===========================================================================
room_counts = collections.Counter(r["rooms_n"] for r in rows if r["rooms_n"])
room_labels_map = {1: "1-room", 2: "2-room", 3: "3-room", 4: "4-room", 5: "5-room", 6: "6-room"}
room_data = sorted([(k, v) for k, v in room_counts.items() if k], key=lambda x: x[0])
r_labels  = [room_labels_map.get(k, f"{k}-room") for k, _ in room_data]
r_vals    = [v for _, v in room_data]

fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.bar(r_labels, r_vals, color=BRAND_COLORS[:len(r_labels)], width=0.55, zorder=3)
add_bar_labels(ax, bars, fmt="int")
ax.set_title("Apartment Supply by Room Count\nWhat inventory types are most available?")
ax.set_xlabel("Apartment Type")
ax.set_ylabel("Number of Listings")
save(fig, "03_supply_by_rooms.png")


# ===========================================================================
# Chart 4 — Median Price by Room Count
# ===========================================================================
room_prices = collections.defaultdict(list)
for r in rows:
    if r["rooms_n"] and r["price_n"]:
        room_prices[r["rooms_n"]].append(r["price_n"])

rp_data   = sorted([(k, statistics.median(v)) for k, v in room_prices.items()], key=lambda x: x[0])
rp_labels = [room_labels_map.get(k, f"{k}-room") for k, _ in rp_data]
rp_vals   = [v for _, v in rp_data]

fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.bar(rp_labels, rp_vals, color=SECONDARY, width=0.55, zorder=3)
max_v = max(rp_vals)
for b, v in zip(bars, rp_vals):
    ax.text(b.get_x() + b.get_width()/2, v + max_v*0.01,
            f"{v/1e6:.1f}M ₸", ha="center", va="bottom",
            fontsize=9, fontweight="bold", color="#1E293B")
ax.set_title("Median Asking Price by Room Count\nHow does price scale with apartment size?")
ax.set_xlabel("Apartment Type")
ax.set_ylabel("Median Price (₸)")
ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{x/1e6:.0f}M"))
save(fig, "04_median_price_by_rooms.png")


# ===========================================================================
# Chart 5 — Top 12 Districts by Listing Count
# ===========================================================================
dist_counts = collections.Counter(r["district"] for r in rows if r["district"])
top_dists   = dist_counts.most_common(12)
d_labels, d_vals = zip(*top_dists)

fig, ax = plt.subplots(figsize=(13, 6))
bars = ax.bar(d_labels, d_vals, color=BRAND_COLORS[:len(d_labels)], width=0.65, zorder=3)
add_bar_labels(ax, bars, fmt="int")
ax.set_title("Apartment Supply by District (Top 12)\nWhere is inventory most concentrated?")
ax.set_xlabel("District")
ax.set_ylabel("Number of Listings")
plt.xticks(rotation=35, ha="right", fontsize=9)
save(fig, "05_supply_by_district.png")


# ===========================================================================
# Chart 6 — Median Price per m² by District (Top 10 by volume)
# ===========================================================================
top_dist_names = [d for d, _ in dist_counts.most_common(10)]
dist_ppm2 = collections.defaultdict(list)
for r in rows:
    if r["district"] in top_dist_names and r["ppm2_n"] and r["ppm2_n"] > 50_000:
        dist_ppm2[r["district"]].append(r["ppm2_n"])

dp_data  = [(d, statistics.median(dist_ppm2[d])) for d in top_dist_names if d in dist_ppm2]
dp_data.sort(key=lambda x: -x[1])
dp_labels, dp_vals = zip(*dp_data)

fig, ax = plt.subplots(figsize=(13, 6))
colors = [PRIMARY if v == max(dp_vals) else (DANGER if v == min(dp_vals) else NEUTRAL) for v in dp_vals]
bars = ax.bar(dp_labels, dp_vals, color=colors, width=0.65, zorder=3)
max_v = max(dp_vals)
for b, v in zip(bars, dp_vals):
    ax.text(b.get_x() + b.get_width()/2, v + max_v*0.01,
            f"{v/1000:.0f}K ₸", ha="center", va="bottom",
            fontsize=9, fontweight="bold", color="#1E293B")
ax.set_title("Median Price per m² by District (Top 10 by Listings)\nPremium vs affordable neighbourhoods")
ax.set_xlabel("District")
ax.set_ylabel("Price per m² (₸)")
ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{x/1000:.0f}K"))
plt.xticks(rotation=35, ha="right", fontsize=9)
save(fig, "06_price_per_m2_by_district.png")


# ===========================================================================
# Chart 7 — Price Affordability Bands by City (stacked bar)
# ===========================================================================
BANDS = [
    ("< 20M ₸",    0,         20_000_000),
    ("20–40M ₸",   20_000_000, 40_000_000),
    ("40–70M ₸",   40_000_000, 70_000_000),
    ("70–120M ₸",  70_000_000, 120_000_000),
    ("> 120M ₸",   120_000_000, float("inf")),
]
BAND_COLORS = ["#16A34A", "#2563EB", "#D97706", "#DC2626", "#7C3AED"]

top5_cities = [c for c, _ in city_counts.most_common(5)]
band_matrix = {city: [0]*len(BANDS) for city in top5_cities}

for r in rows:
    city = city_label(r["city"])
    if city not in top5_cities or not r["price_n"]:
        continue
    for i, (_, lo, hi) in enumerate(BANDS):
        if lo <= r["price_n"] < hi:
            band_matrix[city][i] += 1
            break

fig, ax = plt.subplots(figsize=(12, 7))
x = np.arange(len(top5_cities))
bottoms = np.zeros(len(top5_cities))
for i, (band_name, _, __) in enumerate(BANDS):
    heights = np.array([band_matrix[c][i] for c in top5_cities])
    bars = ax.bar(x, heights, bottom=bottoms, label=band_name,
                  color=BAND_COLORS[i], width=0.6, zorder=3)
    for j, (b, h) in enumerate(zip(bars, heights)):
        if h > 3:
            ax.text(b.get_x() + b.get_width()/2,
                    bottoms[j] + h/2,
                    str(int(h)), ha="center", va="center",
                    fontsize=9, fontweight="bold", color="white")
    bottoms += heights

ax.set_title("Price Affordability Segments by City (Top 5)\nHow is inventory distributed across price bands?")
ax.set_xlabel("City")
ax.set_ylabel("Number of Listings")
ax.set_xticks(x)
ax.set_xticklabels(top5_cities)
ax.legend(title="Price Band", bbox_to_anchor=(1.01, 1), loc="upper left", frameon=False)
save(fig, "07_affordability_bands_by_city.png")


# ===========================================================================
# Chart 8 — Floor Level Distribution
# ===========================================================================
floor_bins = {"1st floor": 0, "2–5": 0, "6–10": 0, "11–16": 0, "17+": 0}
for r in rows:
    f = r["floor_n"]
    if f is None:
        continue
    if f == 1:
        floor_bins["1st floor"] += 1
    elif f <= 5:
        floor_bins["2–5"] += 1
    elif f <= 10:
        floor_bins["6–10"] += 1
    elif f <= 16:
        floor_bins["11–16"] += 1
    else:
        floor_bins["17+"] += 1

fl_labels = list(floor_bins.keys())
fl_vals   = list(floor_bins.values())

fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.bar(fl_labels, fl_vals, color=BRAND_COLORS[:len(fl_labels)], width=0.55, zorder=3)
add_bar_labels(ax, bars, fmt="int")
ax.set_title("Listings by Floor Level\nWhat floor range dominates apartment supply?")
ax.set_xlabel("Floor Range")
ax.set_ylabel("Number of Listings")
save(fig, "08_floor_level_distribution.png")


# ===========================================================================
# Chart 9 — Median Price per m² vs Room Count (line)
# ===========================================================================
room_ppm2 = collections.defaultdict(list)
for r in rows:
    if r["rooms_n"] and r["ppm2_n"] and r["ppm2_n"] > 50_000:
        room_ppm2[r["rooms_n"]].append(r["ppm2_n"])

rpp_data   = sorted([(k, statistics.median(v)) for k, v in room_ppm2.items()], key=lambda x: x[0])
rpp_labels = [room_labels_map.get(k, f"{k}-room") for k, _ in rpp_data]
rpp_vals   = [v for _, v in rpp_data]

fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(rpp_labels, rpp_vals, color=PRIMARY, linewidth=2.5, marker="o",
        markersize=9, markerfacecolor="white", markeredgewidth=2.5, zorder=3)
for x_pos, (label, v) in enumerate(zip(rpp_labels, rpp_vals)):
    ax.text(x_pos, v + max(rpp_vals)*0.02,
            f"{v/1000:.0f}K ₸", ha="center", va="bottom",
            fontsize=9, fontweight="bold", color="#1E293B")
ax.set_title("Price Efficiency: Median Price per m² by Room Count\nDo larger apartments offer better value per square metre?")
ax.set_xlabel("Apartment Type")
ax.set_ylabel("Median Price per m² (₸)")
ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{x/1000:.0f}K"))
ax.fill_between(range(len(rpp_labels)), rpp_vals, alpha=0.07, color=PRIMARY)
save(fig, "09_price_per_m2_by_rooms_line.png")


# ===========================================================================
# Chart 10 — Area Distribution by Room Count (grouped bar: avg area)
# ===========================================================================
room_areas = collections.defaultdict(list)
for r in rows:
    if r["rooms_n"] and r["area_n"] and 10 < r["area_n"] < 500:
        room_areas[r["rooms_n"]].append(r["area_n"])

ra_data   = sorted([(k, statistics.median(v)) for k, v in room_areas.items()], key=lambda x: x[0])
ra_labels = [room_labels_map.get(k, f"{k}-room") for k, _ in ra_data]
ra_vals   = [v for _, v in ra_data]

fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.bar(ra_labels, ra_vals, color=BRAND_COLORS[:len(ra_labels)], width=0.55, zorder=3)
max_v = max(ra_vals)
for b, v in zip(bars, ra_vals):
    ax.text(b.get_x() + b.get_width()/2, v + max_v*0.01,
            f"{v:.0f} m²", ha="center", va="bottom",
            fontsize=9, fontweight="bold", color="#1E293B")
ax.set_title("Median Apartment Size by Room Count\nTypical footprint of each apartment type")
ax.set_xlabel("Apartment Type")
ax.set_ylabel("Median Area (m²)")
save(fig, "10_median_area_by_rooms.png")


print("\nAll charts generated successfully.")
