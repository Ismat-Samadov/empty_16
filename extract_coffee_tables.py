#!/usr/bin/env python3
"""
Script to extract coffee production tables from multiple URLs and save them as CSV files.
"""

import requests
import pandas as pd
from bs4 import BeautifulSoup
import os
from urllib.parse import urlparse

# List of URLs to scrape
urls = [
    "https://en.wikipedia.org/wiki/List_of_countries_by_coffee_production",
    "https://www.fas.usda.gov/data/production/commodity/0711100",
    "https://uk.atlasbig.com/countries-by-coffee-production"
]

def sanitize_filename(url):
    """Create a safe filename from a URL."""
    parsed = urlparse(url)
    domain = parsed.netloc.replace('www.', '').replace('.', '_')
    path = parsed.path.replace('/', '_').replace('.', '_')
    return f"{domain}{path}"

def extract_tables_from_url(url, index):
    """Extract all tables from a given URL and save them as CSV files."""
    print(f"\n{'='*80}")
    print(f"Processing: {url}")
    print(f"{'='*80}")

    try:
        # Send HTTP request with headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        # Parse HTML content
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find all tables
        tables = soup.find_all('table')

        if not tables:
            print(f"⚠ No tables found on {url}")
            return

        print(f"✓ Found {len(tables)} table(s)")

        # Extract each table using pandas
        base_filename = sanitize_filename(url)

        for i, table in enumerate(tables, 1):
            try:
                # Use pandas to read the HTML table
                df = pd.read_html(str(table))[0]

                # Skip empty tables
                if df.empty:
                    print(f"  - Table {i}: Empty (skipped)")
                    continue

                # Create filename
                if len(tables) > 1:
                    filename = f"{base_filename}_table_{i}.csv"
                else:
                    filename = f"{base_filename}.csv"

                # Save to CSV
                df.to_csv(filename, index=False, encoding='utf-8')
                print(f"  ✓ Table {i}: Saved as '{filename}' ({df.shape[0]} rows × {df.shape[1]} columns)")

            except Exception as e:
                print(f"  ✗ Table {i}: Error - {str(e)}")

    except requests.exceptions.RequestException as e:
        print(f"✗ Failed to fetch {url}: {str(e)}")
    except Exception as e:
        print(f"✗ Error processing {url}: {str(e)}")

def main():
    """Main function to process all URLs."""
    print("Coffee Production Table Extractor")
    print("=" * 80)

    # Create output directory if needed
    output_dir = "coffee_data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")

    # Change to output directory
    os.chdir(output_dir)

    # Process each URL
    for idx, url in enumerate(urls, 1):
        extract_tables_from_url(url, idx)

    print("\n" + "=" * 80)
    print("✓ Extraction complete!")
    print(f"CSV files saved in: {os.getcwd()}")
    print("=" * 80)

if __name__ == "__main__":
    main()
