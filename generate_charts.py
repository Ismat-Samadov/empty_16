#!/usr/bin/env python3
"""
Coffee Production Analysis and Visualization Script
Generates comprehensive charts and extracts insights from coffee production data.
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import os
import json
from pathlib import Path

# Set style for better-looking charts
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# Create charts directory
CHARTS_DIR = Path("charts")
CHARTS_DIR.mkdir(exist_ok=True)

# Data paths
DATA_DIR = Path("coffee_data")
WIKI_FILE = DATA_DIR / "en_wikipedia_org_wiki_List_of_countries_by_coffee_production_table_1.csv"
ATLAS_FILE = DATA_DIR / "uk_atlasbig_com_countries-by-coffee-production.csv"

# Global insights storage
insights = {
    "key_findings": [],
    "statistics": {}
}


def load_data():
    """Load and clean the dataset."""
    print("Loading data...")

    # Load Wikipedia data
    wiki_df = pd.read_csv(WIKI_FILE)
    wiki_df = wiki_df[~wiki_df['Country'].str.contains('World|Source', na=False)]
    wiki_df['Production (tonnes)'] = pd.to_numeric(wiki_df['Production (tonnes)'], errors='coerce')

    # Load AtlasBig data (more detailed)
    atlas_df = pd.read_csv(ATLAS_FILE)
    atlas_df = atlas_df.dropna(subset=['Country'])
    atlas_df = atlas_df[atlas_df['Production (Tons)'] > 0]

    print(f"✓ Loaded {len(wiki_df)} countries from Wikipedia")
    print(f"✓ Loaded {len(atlas_df)} countries from AtlasBig")

    return wiki_df, atlas_df


def add_continent_data(df):
    """Add continent information to the dataframe."""
    continent_mapping = {
        'Brazil': 'South America', 'Vietnam': 'Asia', 'Indonesia': 'Asia',
        'Colombia': 'South America', 'Ethiopia': 'Africa', 'Honduras': 'North America',
        'Uganda': 'Africa', 'Peru': 'South America', 'India': 'Asia',
        'Guatemala': 'North America', 'Mexico': 'North America', 'Nicaragua': 'North America',
        'Laos': 'Asia', 'Côte d\'Ivoire': 'Africa', 'China': 'Asia',
        'Costa Rica': 'North America', 'Tanzania': 'Africa', 'Philippines': 'Asia',
        'Venezuela': 'South America', 'Congo-Kinshasa': 'Africa', 'Madagascar': 'Africa',
        'Papua New Guinea': 'Oceania', 'Guinea': 'Africa', 'Cameroon': 'Africa',
        'Kenya': 'Africa', 'El Salvador': 'North America', 'Thailand': 'Asia',
        'Bolivia': 'South America', 'Yemen': 'Asia', 'Haiti': 'North America',
        'Rwanda': 'Africa', 'Burundi': 'Africa', 'Togo': 'Africa',
        'Dominican Republic': 'North America', 'East Timor': 'Asia', 'Angola': 'Africa',
        'Central African Republic': 'Africa', 'Malawi': 'Africa', 'Cuba': 'North America',
        'Myanmar': 'Asia', 'Jamaica': 'North America', 'Panama': 'North America',
        'Zambia': 'Africa', 'Sri Lanka': 'Asia', 'Ecuador': 'South America',
        'Malaysia': 'Asia', 'Equatorial Guinea': 'Africa', 'Congo-Brazzaville': 'Africa',
        'Sierra Leone': 'Africa', 'United States of America': 'North America',
        'Nigeria': 'Africa', 'Taiwan': 'Asia', 'Mozambique': 'Africa',
        'Ghana': 'Africa', 'Zimbabwe': 'Africa', 'Liberia': 'Africa',
        'Ivory Coast': 'Africa', 'Democratic Republic of the Congo': 'Africa',
        'Chinaβ': 'Asia'
    }
    df['Continent'] = df['Country'].map(continent_mapping)
    return df


def chart_top_producers(wiki_df):
    """Generate chart for top 10 coffee producing countries."""
    print("\n1. Creating Top 10 Coffee Producers chart...")

    top10 = wiki_df.nlargest(10, 'Production (tonnes)')

    fig, ax = plt.subplots(figsize=(12, 7))
    bars = ax.barh(top10['Country'], top10['Production (tonnes)']/1000, color=sns.color_palette("rocket", 10))

    ax.set_xlabel('Production (Million Tonnes)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Country', fontsize=12, fontweight='bold')
    ax.set_title('Top 10 Coffee Producing Countries', fontsize=16, fontweight='bold', pad=20)
    ax.invert_yaxis()

    # Add value labels
    for i, (bar, value) in enumerate(zip(bars, top10['Production (tonnes)']/1000)):
        ax.text(value, bar.get_y() + bar.get_height()/2, f'{value:.2f}M',
                va='center', fontweight='bold', fontsize=10)

    plt.tight_layout()
    plt.savefig(CHARTS_DIR / "01_top10_producers.png", dpi=300, bbox_inches='tight')
    plt.close()

    # Add insight
    top_country = top10.iloc[0]
    second_country = top10.iloc[1]
    insights["key_findings"].append({
        "title": "Brazil Dominates Global Coffee Production",
        "description": f"Brazil leads with {top_country['Production (tonnes)']/1000:.2f}M tonnes, producing {(top_country['Production (tonnes)']/wiki_df['Production (tonnes)'].sum()*100):.1f}% of global coffee. This is {(top_country['Production (tonnes)']/second_country['Production (tonnes)']):.1f}x more than Vietnam, the second-largest producer."
    })

    print("  ✓ Saved: 01_top10_producers.png")


def chart_continental_distribution(atlas_df):
    """Generate pie chart for coffee production by continent."""
    print("\n2. Creating Continental Distribution chart...")

    atlas_df = add_continent_data(atlas_df)
    continent_prod = atlas_df.groupby('Continent')['Production (Tons)'].sum().sort_values(ascending=False)

    fig, ax = plt.subplots(figsize=(10, 8))
    colors = sns.color_palette("Set2", len(continent_prod))

    wedges, texts, autotexts = ax.pie(continent_prod, labels=continent_prod.index, autopct='%1.1f%%',
                                        colors=colors, startangle=90, textprops={'fontsize': 11, 'fontweight': 'bold'})

    ax.set_title('Global Coffee Production by Continent', fontsize=16, fontweight='bold', pad=20)

    # Add legend with absolute values
    legend_labels = [f'{cont}: {val/1000:.1f}M tonnes' for cont, val in continent_prod.items()]
    ax.legend(legend_labels, loc='center left', bbox_to_anchor=(1, 0, 0.5, 1))

    plt.tight_layout()
    plt.savefig(CHARTS_DIR / "02_continental_distribution.png", dpi=300, bbox_inches='tight')
    plt.close()

    # Add insight
    top_continent = continent_prod.index[0]
    insights["key_findings"].append({
        "title": f"{top_continent} Leads Continental Production",
        "description": f"{top_continent} accounts for {(continent_prod.iloc[0]/continent_prod.sum()*100):.1f}% of global coffee production, followed by {continent_prod.index[1]} at {(continent_prod.iloc[1]/continent_prod.sum()*100):.1f}%."
    })

    print("  ✓ Saved: 02_continental_distribution.png")


def chart_production_per_capita(atlas_df):
    """Generate chart for production per capita (efficiency)."""
    print("\n3. Creating Production per Capita chart...")

    # Filter for meaningful data (top producers with > 100K tonnes)
    significant = atlas_df[atlas_df['Production (Tons)'] > 100000].copy()
    top15_percapita = significant.nlargest(15, 'Production per Person (Kg)')

    fig, ax = plt.subplots(figsize=(12, 8))
    bars = ax.barh(top15_percapita['Country'], top15_percapita['Production per Person (Kg)'],
                    color=sns.color_palette("viridis", 15))

    ax.set_xlabel('Production per Capita (Kg per Person)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Country', fontsize=12, fontweight='bold')
    ax.set_title('Coffee Production per Capita - Top 15 Countries\n(Major Producers Only)',
                 fontsize=16, fontweight='bold', pad=20)
    ax.invert_yaxis()

    # Add value labels
    for bar in bars:
        width = bar.get_width()
        ax.text(width, bar.get_y() + bar.get_height()/2, f'{width:.1f} kg',
                va='center', fontweight='bold', fontsize=9)

    plt.tight_layout()
    plt.savefig(CHARTS_DIR / "03_production_per_capita.png", dpi=300, bbox_inches='tight')
    plt.close()

    # Add insight
    top_percapita = top15_percapita.iloc[0]
    insights["key_findings"].append({
        "title": "Honduras Shows Highest Production Efficiency per Capita",
        "description": f"{top_percapita['Country']} leads in per capita production with {top_percapita['Production per Person (Kg)']:.1f} kg per person, indicating coffee is a crucial part of their economy and agricultural sector."
    })

    print("  ✓ Saved: 03_production_per_capita.png")


def chart_yield_analysis(atlas_df):
    """Generate chart for yield per hectare (productivity)."""
    print("\n4. Creating Yield per Hectare analysis chart...")

    # Filter for countries with yield data and significant production
    yield_data = atlas_df[(atlas_df['Yield (Kg / Hectare)'] > 0) &
                          (atlas_df['Production (Tons)'] > 100000)].copy()
    top15_yield = yield_data.nlargest(15, 'Yield (Kg / Hectare)')

    fig, ax = plt.subplots(figsize=(12, 8))
    bars = ax.barh(top15_yield['Country'], top15_yield['Yield (Kg / Hectare)'],
                    color=sns.color_palette("mako", 15))

    ax.set_xlabel('Yield (Kg per Hectare)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Country', fontsize=12, fontweight='bold')
    ax.set_title('Coffee Yield Efficiency - Top 15 Countries\n(Major Producers Only)',
                 fontsize=16, fontweight='bold', pad=20)
    ax.invert_yaxis()

    # Add value labels
    for bar in bars:
        width = bar.get_width()
        ax.text(width, bar.get_y() + bar.get_height()/2, f'{width:.0f}',
                va='center', fontweight='bold', fontsize=9)

    plt.tight_layout()
    plt.savefig(CHARTS_DIR / "04_yield_per_hectare.png", dpi=300, bbox_inches='tight')
    plt.close()

    # Add insight
    top_yield = top15_yield.iloc[0]
    avg_yield = yield_data['Yield (Kg / Hectare)'].mean()
    insights["key_findings"].append({
        "title": "China Demonstrates Superior Agricultural Efficiency",
        "description": f"{top_yield['Country']} achieves the highest yield at {top_yield['Yield (Kg / Hectare)']:.0f} kg/hectare, {(top_yield['Yield (Kg / Hectare)']/avg_yield):.1f}x higher than the average of {avg_yield:.0f} kg/hectare, showcasing advanced farming techniques."
    })

    print("  ✓ Saved: 04_yield_per_hectare.png")


def chart_production_vs_acreage(atlas_df):
    """Generate scatter plot comparing production volume vs land use."""
    print("\n5. Creating Production vs Acreage scatter plot...")

    # Filter data
    scatter_data = atlas_df[(atlas_df['Production (Tons)'] > 50000) &
                            (atlas_df['Acreage (Hectare)'] > 0)].copy()

    fig, ax = plt.subplots(figsize=(14, 9))

    # Create scatter plot
    scatter = ax.scatter(scatter_data['Acreage (Hectare)']/1000,
                        scatter_data['Production (Tons)']/1000,
                        s=scatter_data['Yield (Kg / Hectare)']/2,
                        alpha=0.6, c=range(len(scatter_data)), cmap='coolwarm', edgecolors='black', linewidth=1)

    # Add country labels for top producers
    top_countries = scatter_data.nlargest(8, 'Production (Tons)')
    for _, row in top_countries.iterrows():
        ax.annotate(row['Country'],
                   xy=(row['Acreage (Hectare)']/1000, row['Production (Tons)']/1000),
                   xytext=(5, 5), textcoords='offset points', fontsize=9, fontweight='bold')

    ax.set_xlabel('Coffee Acreage (Thousand Hectares)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Production (Thousand Tonnes)', fontsize=12, fontweight='bold')
    ax.set_title('Coffee Production vs Agricultural Land Use\n(Bubble size represents yield efficiency)',
                 fontsize=16, fontweight='bold', pad=20)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(CHARTS_DIR / "05_production_vs_acreage.png", dpi=300, bbox_inches='tight')
    plt.close()

    # Add insight
    correlation = scatter_data['Production (Tons)'].corr(scatter_data['Acreage (Hectare)'])
    insights["key_findings"].append({
        "title": "Strong Correlation Between Land Use and Production",
        "description": f"There is a {correlation:.2f} correlation between acreage and production. However, bubble size variations show that yield efficiency varies significantly, with some countries producing more with less land through advanced agricultural practices."
    })

    print("  ✓ Saved: 05_production_vs_acreage.png")


def chart_regional_comparison(wiki_df, atlas_df):
    """Generate grouped bar chart comparing different metrics across regions."""
    print("\n6. Creating Regional Comparison chart...")

    atlas_df = add_continent_data(atlas_df)

    # Aggregate by continent
    regional_stats = atlas_df.groupby('Continent').agg({
        'Production (Tons)': 'sum',
        'Acreage (Hectare)': 'sum',
        'Yield (Kg / Hectare)': 'mean'
    }).reset_index()

    regional_stats = regional_stats.sort_values('Production (Tons)', ascending=False)

    # Create figure with subplots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

    # Chart 1: Production and Acreage
    x = np.arange(len(regional_stats))
    width = 0.35

    bars1 = ax1.bar(x - width/2, regional_stats['Production (Tons)']/1000, width,
                    label='Production (K Tonnes)', color='#2ecc71', alpha=0.8)

    ax1_twin = ax1.twinx()
    bars2 = ax1_twin.bar(x + width/2, regional_stats['Acreage (Hectare)']/1000, width,
                         label='Acreage (K Hectares)', color='#e74c3c', alpha=0.8)

    ax1.set_xlabel('Continent', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Production (K Tonnes)', fontsize=11, fontweight='bold', color='#2ecc71')
    ax1_twin.set_ylabel('Acreage (K Hectares)', fontsize=11, fontweight='bold', color='#e74c3c')
    ax1.set_title('Production & Land Use by Continent', fontsize=14, fontweight='bold')
    ax1.set_xticks(x)
    ax1.set_xticklabels(regional_stats['Continent'], rotation=45, ha='right')
    ax1.tick_params(axis='y', labelcolor='#2ecc71')
    ax1_twin.tick_params(axis='y', labelcolor='#e74c3c')

    # Add legends
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax1_twin.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right')

    # Chart 2: Average Yield
    bars3 = ax2.bar(regional_stats['Continent'], regional_stats['Yield (Kg / Hectare)'],
                    color=sns.color_palette("viridis", len(regional_stats)), alpha=0.8)

    ax2.set_xlabel('Continent', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Average Yield (Kg/Hectare)', fontsize=12, fontweight='bold')
    ax2.set_title('Average Coffee Yield by Continent', fontsize=14, fontweight='bold')
    ax2.set_xticklabels(regional_stats['Continent'], rotation=45, ha='right')

    # Add value labels
    for bar in bars3:
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.0f}', ha='center', va='bottom', fontweight='bold', fontsize=9)

    plt.tight_layout()
    plt.savefig(CHARTS_DIR / "06_regional_comparison.png", dpi=300, bbox_inches='tight')
    plt.close()

    # Add insight
    highest_yield_continent = regional_stats.loc[regional_stats['Yield (Kg / Hectare)'].idxmax()]
    insights["key_findings"].append({
        "title": "Regional Efficiency Varies Significantly",
        "description": f"{highest_yield_continent['Continent']} shows the highest average yield at {highest_yield_continent['Yield (Kg / Hectare)']:.0f} kg/hectare, while production volume is concentrated in South America and Asia due to larger agricultural areas dedicated to coffee cultivation."
    })

    print("  ✓ Saved: 06_regional_comparison.png")


def chart_top20_comparison(wiki_df):
    """Generate chart showing production shares of top 20 producers."""
    print("\n7. Creating Top 20 Market Share chart...")

    top20 = wiki_df.nlargest(20, 'Production (tonnes)')
    total_production = wiki_df['Production (tonnes)'].sum()
    top20['Market Share (%)'] = (top20['Production (tonnes)'] / total_production * 100)

    fig, ax = plt.subplots(figsize=(14, 8))

    bars = ax.bar(range(len(top20)), top20['Market Share (%)'],
                  color=sns.color_palette("rocket_r", 20), alpha=0.8, edgecolor='black', linewidth=0.5)

    ax.set_xlabel('Country', fontsize=12, fontweight='bold')
    ax.set_ylabel('Global Market Share (%)', fontsize=12, fontweight='bold')
    ax.set_title('Top 20 Coffee Producers - Global Market Share', fontsize=16, fontweight='bold', pad=20)
    ax.set_xticks(range(len(top20)))
    ax.set_xticklabels(top20['Country'], rotation=45, ha='right', fontsize=9)

    # Add percentage labels
    for i, (bar, pct) in enumerate(zip(bars, top20['Market Share (%)'])):
        if pct > 1.5:
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
                   f'{pct:.1f}%', ha='center', va='bottom', fontweight='bold', fontsize=8)

    # Add cumulative line
    ax2 = ax.twinx()
    cumulative = top20['Market Share (%)'].cumsum()
    ax2.plot(range(len(top20)), cumulative, color='darkred', marker='o',
             linewidth=2, markersize=4, label='Cumulative %')
    ax2.set_ylabel('Cumulative Market Share (%)', fontsize=11, fontweight='bold', color='darkred')
    ax2.tick_params(axis='y', labelcolor='darkred')
    ax2.set_ylim([0, 105])
    ax2.legend(loc='upper left')

    plt.tight_layout()
    plt.savefig(CHARTS_DIR / "07_market_share_top20.png", dpi=300, bbox_inches='tight')
    plt.close()

    # Add insight
    top5_share = top20.head(5)['Market Share (%)'].sum()
    top10_share = top20.head(10)['Market Share (%)'].sum()
    insights["key_findings"].append({
        "title": "Market Concentration in Top Producers",
        "description": f"The top 5 coffee producing countries control {top5_share:.1f}% of global production, while the top 10 account for {top10_share:.1f}%. This shows significant market concentration in a few major producing nations."
    })

    print("  ✓ Saved: 07_market_share_top20.png")


def generate_statistics(wiki_df, atlas_df):
    """Calculate key statistics for the README."""
    print("\n8. Calculating statistics...")

    total_countries = len(wiki_df)
    total_production = wiki_df['Production (tonnes)'].sum()

    # Calculate statistics
    insights["statistics"] = {
        "total_countries": total_countries,
        "total_production_tonnes": int(total_production),
        "total_production_million": f"{total_production/1000000:.2f}",
        "top_producer": wiki_df.iloc[0]['Country'],
        "top_producer_tonnes": int(wiki_df.iloc[0]['Production (tonnes)']),
        "top_producer_share": f"{(wiki_df.iloc[0]['Production (tonnes)']/total_production*100):.1f}",
        "countries_with_detailed_data": len(atlas_df),
        "avg_yield": f"{atlas_df['Yield (Kg / Hectare)'].mean():.0f}",
        "highest_yield_country": atlas_df.loc[atlas_df['Yield (Kg / Hectare)'].idxmax(), 'Country'],
        "highest_yield_value": f"{atlas_df['Yield (Kg / Hectare)'].max():.0f}"
    }

    print("  ✓ Statistics calculated")


def save_insights():
    """Save insights to JSON for README generation."""
    print("\n9. Saving insights...")

    with open('insights.json', 'w') as f:
        json.dump(insights, f, indent=2)

    print("  ✓ Insights saved to insights.json")


def main():
    """Main execution function."""
    print("=" * 80)
    print("COFFEE PRODUCTION ANALYSIS & VISUALIZATION")
    print("=" * 80)

    # Load data
    wiki_df, atlas_df = load_data()

    # Generate all charts
    chart_top_producers(wiki_df)
    chart_continental_distribution(atlas_df)
    chart_production_per_capita(atlas_df)
    chart_yield_analysis(atlas_df)
    chart_production_vs_acreage(atlas_df)
    chart_regional_comparison(wiki_df, atlas_df)
    chart_top20_comparison(wiki_df)

    # Generate statistics
    generate_statistics(wiki_df, atlas_df)

    # Save insights
    save_insights()

    print("\n" + "=" * 80)
    print("✓ ANALYSIS COMPLETE!")
    print(f"✓ Generated {len(list(CHARTS_DIR.glob('*.png')))} charts in '{CHARTS_DIR}' directory")
    print("✓ Insights saved to 'insights.json'")
    print("=" * 80)


if __name__ == "__main__":
    main()
