# ==============================================================================
# INSTITUTIONAL COMPLEXITY INDEX DASHBOARD
# ==============================================================================
"""
A comprehensive dashboard for visualizing and analyzing the Institutional
Complexity Index across countries and time periods.

Author: Renan Birck
Version: 1.0.0
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from dotenv import load_dotenv
from streamlit_option_menu import option_menu
from io import BytesIO

# Load environment variables
load_dotenv()

# ==============================================================================
# LOCAL IMPORTS
# ==============================================================================
from src.config import (  # noqa: E402
    INDEX_COLORS,
    INDEX_LABELS,
)
from update_load_data import (  # noqa: E402
    get_country_list,
    get_country_data,
    get_year_range,
    load_complexity_data,
)

# ==============================================================================
# PAGE CONFIGURATION
# ==============================================================================
st.set_page_config(
    layout="wide",
    page_title="Institutional Complexity Index Dashboard",
    page_icon="🌍",
    initial_sidebar_state="expanded",
)

# ==============================================================================
# CUSTOM CSS
# ==============================================================================
st.markdown(
    """
    <style>
    .main {
        padding: 0rem 1rem;
    }
    .stPlotlyChart {
        background-color: white;
        border-radius: 5px;
        padding: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
        color: #2C3E50;
        padding-bottom: 1rem;
        border-bottom: 3px solid #4C82F7;
    }
    h2 {
        color: #34495E;
        margin-top: 2rem;
    }
    h3 {
        color: #7F8C8D;
    }
    .metric-container {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 5px;
        border-left: 4px solid #4C82F7;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================
def get_country_colors(countries: list) -> dict:
    """Generate consistent color mapping for countries."""
    color_palette = [
        "#1f77b4",  # Blue
        "#ff7f0e",  # Orange
        "#2ca02c",  # Green
        "#d62728",  # Red
        "#9467bd",  # Purple
        "#8c564b",  # Brown
        "#e377c2",  # Pink
        "#7f7f7f",  # Gray
        "#bcbd22",  # Yellow-green
        "#17becf",  # Cyan
    ]
    return {
        country: color_palette[i % len(color_palette)]
        for i, country in enumerate(countries)
    }


def render_dashboard_sidebar(countries: list, year_min: int, year_max: int):
    """Render sidebar filters for the dashboard."""
    st.header("🔍 Filters")
    st.markdown("---")

    # Country selection
    st.subheader("Select Main Country")
    selected_country = st.selectbox(
        "Country",
        options=countries,
        index=None,
        placeholder="Choose a country...",
        key="main_country",
    )

    # Comparison countries (optional)
    st.subheader("Compare with (optional)")
    comparison_countries = st.multiselect(
        "Select countries to compare",
        options=[c for c in countries if c != selected_country],
        default=[],
        key="comparison_countries",
    )

    st.markdown("---")

    # Year range filter
    st.subheader("Year Range")
    year_range = st.slider(
        "Select years",
        min_value=year_min,
        max_value=year_max,
        value=(year_min, year_max),
        key="year_range",
    )

    st.markdown("---")

    # Info box
    st.info(
        f"""
        **Dashboard Info**
        
        📊 Total Countries: {len(countries)}
        
        📅 Years Available: {year_min} - {year_max}
        
        🎯 Main Country: {selected_country or "Not selected"}
        """
    )

    return selected_country, comparison_countries, year_range


def render_metrics(df_main_filtered: pd.DataFrame, selected_country: str):
    """Render key metrics cards showing country rankings."""
    latest_year_data = df_main_filtered.iloc[-1]
    latest_year = int(latest_year_data["year"])

    # Load all countries data for the latest year to calculate rankings
    df_all_latest = load_complexity_data(years=[latest_year])

    # Calculate rankings for each index (lower rank = better performance)
    indices = [
        "indice_socio_cultural",
        "indice_mercados_negocios",
        "indice_empreendedorismo",
        "indice_eficiencia_governo",
        "indice_ambiente_juridico",
        "indice_total",
    ]

    # Get rankings and previous year rankings for delta
    rankings_current = {}
    rankings_previous = {}

    for idx in indices:
        # Current year ranking (descending order - higher values = better rank)
        df_all_latest[f"rank_{idx}"] = df_all_latest[idx].rank(
            ascending=False, method="min"
        )
        current_rank = int(
            df_all_latest[df_all_latest["country_name"] == selected_country][
                f"rank_{idx}"
            ].values[0]
        )
        total_countries = len(df_all_latest)
        rankings_current[idx] = (current_rank, total_countries)

    # Get previous year rankings for delta calculation
    if len(df_main_filtered) > 1:
        previous_year = int(df_main_filtered.iloc[-2]["year"])
        df_all_previous = load_complexity_data(years=[previous_year])

        for idx in indices:
            df_all_previous[f"rank_{idx}"] = df_all_previous[idx].rank(
                ascending=False, method="min"
            )
            prev_rank = int(
                df_all_previous[df_all_previous["country_name"] == selected_country][
                    f"rank_{idx}"
                ].values[0]
            )
            rankings_previous[idx] = prev_rank
    else:
        previous_year = None

    # Display key metrics - All 6 indicators
    col1, col2, col3, col4, col5, col6 = st.columns(6)

    with col1:
        rank, total = rankings_current["indice_socio_cultural"]
        delta = None
        delta_color = "off"
        if previous_year and "indice_socio_cultural" in rankings_previous:
            # Delta negativo = melhoria (diminuiu número = subiu posições)
            delta_val = rank - rankings_previous["indice_socio_cultural"]
            delta = f"{delta_val:+d}" if delta_val != 0 else "0"
            delta_color = "inverse" if delta_val != 0 else "off"
        st.metric(
            label=f"👥 Socio-Cultural ({latest_year})",
            value=f"{rank}º",
            delta=delta,
            delta_color=delta_color,
        )

    with col2:
        rank, total = rankings_current["indice_mercados_negocios"]
        delta = None
        delta_color = "off"
        if previous_year and "indice_mercados_negocios" in rankings_previous:
            delta_val = rank - rankings_previous["indice_mercados_negocios"]
            delta = f"{delta_val:+d}" if delta_val != 0 else "0"
            delta_color = "inverse" if delta_val != 0 else "off"
        st.metric(
            label=f"💼 Markets & Business ({latest_year})",
            value=f"{rank}º",
            delta=delta,
            delta_color=delta_color,
        )

    with col3:
        rank, total = rankings_current["indice_empreendedorismo"]
        delta = None
        delta_color = "off"
        if previous_year and "indice_empreendedorismo" in rankings_previous:
            delta_val = rank - rankings_previous["indice_empreendedorismo"]
            delta = f"{delta_val:+d}" if delta_val != 0 else "0"
            delta_color = "inverse" if delta_val != 0 else "off"
        st.metric(
            label=f"🚀 Entrepreneurship ({latest_year})",
            value=f"{rank}º",
            delta=delta,
            delta_color=delta_color,
        )

    with col4:
        rank, total = rankings_current["indice_eficiencia_governo"]
        delta = None
        delta_color = "off"
        if previous_year and "indice_eficiencia_governo" in rankings_previous:
            delta_val = rank - rankings_previous["indice_eficiencia_governo"]
            delta = f"{delta_val:+d}" if delta_val != 0 else "0"
            delta_color = "inverse" if delta_val != 0 else "off"
        st.metric(
            label=f"🏛️ Government Efficiency ({latest_year})",
            value=f"{rank}º",
            delta=delta,
            delta_color=delta_color,
        )

    with col5:
        rank, total = rankings_current["indice_ambiente_juridico"]
        delta = None
        delta_color = "off"
        if previous_year and "indice_ambiente_juridico" in rankings_previous:
            delta_val = rank - rankings_previous["indice_ambiente_juridico"]
            delta = f"{delta_val:+d}" if delta_val != 0 else "0"
            delta_color = "inverse" if delta_val != 0 else "off"
        st.metric(
            label=f"⚖️ Legal Environment ({latest_year})",
            value=f"{rank}º",
            delta=delta,
            delta_color=delta_color,
        )

    with col6:
        rank, total = rankings_current["indice_total"]
        delta = None
        delta_color = "off"
        if previous_year and "indice_total" in rankings_previous:
            delta_val = rank - rankings_previous["indice_total"]
            delta = f"{delta_val:+d}" if delta_val != 0 else "0"
            delta_color = "inverse" if delta_val != 0 else "off"
        st.metric(
            label=f"📊 Total Index ({latest_year})",
            value=f"{rank}º",
            delta=delta,
            delta_color=delta_color,
        )

    # Show total countries
    st.caption(f"📊 Total countries: {total}")


def render_evolution_chart(df_main_filtered: pd.DataFrame, selected_country: str):
    """Render the index evolution chart."""
    st.subheader(f"Index Evolution - {selected_country}")

    fig_evolution = go.Figure()

    indices_cols = [
        "indice_socio_cultural",
        "indice_mercados_negocios",
        "indice_empreendedorismo",
        "indice_eficiencia_governo",
        "indice_ambiente_juridico",
        "indice_total",
    ]

    for col in indices_cols:
        fig_evolution.add_trace(
            go.Scatter(
                x=df_main_filtered["year"],
                y=df_main_filtered[col],
                mode="lines+markers+text",
                name=INDEX_LABELS[col],
                line=dict(color=INDEX_COLORS[col], width=3),
                marker=dict(size=8),
                text=[f"{val:.2f}" for val in df_main_filtered[col]],
                textposition="top center",
                textfont=dict(size=10, color="black"),
                hovertemplate="<b>%{fullData.name}</b><br>Year: %{x}<br>Value: %{y:.6f}<extra></extra>",
            )
        )

    fig_evolution.update_layout(
        xaxis_title="Year",
        yaxis_title="Index Value",
        hovermode="closest",
        height=500,
        template="plotly_white",
        font=dict(color="black"),
        xaxis=dict(
            tickfont=dict(color="black"),
            title=dict(font=dict(color="black")),
            dtick=1,
            tickmode="linear",
        ),
        yaxis=dict(
            tickfont=dict(color="black"),
            title=dict(font=dict(color="black")),
        ),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.3,
            xanchor="center",
            x=0.5,
        ),
    )

    st.plotly_chart(fig_evolution, use_container_width=True)


def render_comparison_chart(
    df_comparison: pd.DataFrame,
    selected_country: str,
    comparison_countries: list,
):
    """Render the country comparison chart."""
    st.subheader("Compare Index Across Countries")

    # Select index to compare
    index_to_compare = st.selectbox(
        "Select Index",
        options=[
            "indice_total",
            "indice_socio_cultural",
            "indice_mercados_negocios",
            "indice_empreendedorismo",
            "indice_eficiencia_governo",
            "indice_ambiente_juridico",
        ],
        format_func=lambda x: INDEX_LABELS[x],
        key="index_comparison",
    )

    # Determine countries to compare
    countries_to_compare = (
        [selected_country] + comparison_countries
        if comparison_countries
        else [selected_country]
    )

    if len(countries_to_compare) == 1:
        st.info(
            "💡 Select comparison countries in the sidebar to compare multiple countries."
        )

    # Get consistent color mapping
    country_colors = get_country_colors(countries_to_compare)

    # Create comparison chart
    fig_comparison = go.Figure()

    for country in countries_to_compare:
        df_country = df_comparison[df_comparison["country_name"] == country]
        fig_comparison.add_trace(
            go.Scatter(
                x=df_country["year"],
                y=df_country[index_to_compare],
                mode="lines+markers+text",
                name=country,
                line=dict(width=3, color=country_colors[country]),
                marker=dict(size=8, color=country_colors[country]),
                text=[f"{val:.2f}" for val in df_country[index_to_compare]],
                textposition="top center",
                textfont=dict(size=10, color="black"),
                hovertemplate="<b>%{fullData.name}</b><br>Year: %{x}<br>Value: %{y:.6f}<extra></extra>",
            )
        )

    fig_comparison.update_layout(
        title=f"{INDEX_LABELS[index_to_compare]} - Country Comparison",
        xaxis_title="Year",
        yaxis_title="Index Value",
        hovermode="closest",
        height=500,
        template="plotly_white",
        font=dict(color="black"),
        xaxis=dict(
            tickfont=dict(color="black"),
            title=dict(font=dict(color="black")),
            dtick=1,
            tickmode="linear",
        ),
        yaxis=dict(
            tickfont=dict(color="black"),
            title=dict(font=dict(color="black")),
        ),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.3,
            xanchor="center",
            x=0.5,
        ),
    )

    st.plotly_chart(fig_comparison, use_container_width=True)


def render_radar_chart(
    df_comparison: pd.DataFrame,
    selected_country: str,
    comparison_countries: list,
):
    """Render the radar chart for multi-index comparison."""
    st.subheader("Radar Chart - Multi-Index Comparison")

    # Determine countries to compare
    countries_to_compare = (
        [selected_country] + comparison_countries
        if comparison_countries
        else [selected_country]
    )

    if len(countries_to_compare) == 1:
        st.info(
            "💡 Select comparison countries in the sidebar to compare multiple countries."
        )

    # Radar chart options
    col1, col2 = st.columns([1, 1])

    with col1:
        # Select year for radar chart
        available_years = sorted(df_comparison["year"].unique(), reverse=True)
        selected_radar_year = st.selectbox(
            "Select Year",
            options=available_years,
            index=0,
            key="radar_year",
        )

    with col2:
        # Display mode option
        display_mode = st.selectbox(
            "Display Mode",
            options=["Overlay (Single Chart)", "Side by Side (Individual Charts)"],
            index=0,
            key="radar_display_mode",
        )

    # Get consistent color mapping
    country_colors = get_country_colors(countries_to_compare)

    indices = [
        "indice_socio_cultural",
        "indice_mercados_negocios",
        "indice_empreendedorismo",
        "indice_eficiencia_governo",
        "indice_ambiente_juridico",
    ]

    # Create labels without "Index" for cleaner display
    theta_labels_raw = [INDEX_LABELS[idx].replace(" Index", "") for idx in indices]
    theta_labels = theta_labels_raw + [theta_labels_raw[0]]

    if display_mode == "Overlay (Single Chart)":
        # Create single radar chart with improved styling
        fig_radar = go.Figure()

        for country in countries_to_compare:
            df_country_year = df_comparison[
                (df_comparison["country_name"] == country)
                & (df_comparison["year"] == selected_radar_year)
            ]

            if not df_country_year.empty:
                values = [df_country_year[idx].values[0] for idx in indices]
                values.append(values[0])

                color = country_colors[country]

                # First trace: filled area (no hover)
                fig_radar.add_trace(
                    go.Scatterpolar(
                        r=values,
                        theta=theta_labels,
                        name=country,
                        fill="toself",
                        fillcolor=f"rgba{tuple(list(int(color.lstrip('#')[i : i + 2], 16) for i in (0, 2, 4)) + [0.15])}",
                        line=dict(width=3, color=color),
                        mode="lines",
                        showlegend=True,
                        hoverinfo="skip",
                    )
                )

                # Second trace: markers only (with hover)
                fig_radar.add_trace(
                    go.Scatterpolar(
                        r=values,
                        theta=theta_labels,
                        name=country,
                        mode="markers",
                        showlegend=False,
                        hovertemplate=(
                            f"<b>{country}</b><br>"
                            "%{theta}<br>"
                            "<b>%{r:.6f}</b>"
                            "<extra></extra>"
                        ),
                        marker=dict(
                            size=11,
                            color=color,
                            symbol="circle",
                            line=dict(width=1, color="white"),
                        ),
                        hoverlabel=dict(
                            bgcolor=color,
                            font=dict(size=12, color="white", family="Arial"),
                            bordercolor="white",
                        ),
                    )
                )

        fig_radar.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, 100],
                    tickfont=dict(color="black", size=11),
                    gridcolor="lightgray",
                    linecolor="lightgray",
                ),
                angularaxis=dict(
                    tickfont=dict(color="black", size=12),
                    gridcolor="lightgray",
                    linecolor="gray",
                ),
                bgcolor="white",
            ),
            showlegend=True,
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=-0.15,
                xanchor="center",
                x=0.5,
                font=dict(size=12),
            ),
            title=dict(
                text=f"Complexity Indices Comparison - {selected_radar_year}",
                font=dict(size=16, color="black"),
            ),
            height=650,
            template="plotly_white",
            font=dict(color="black"),
            hovermode="closest",
            hoverdistance=30,
        )

        st.plotly_chart(fig_radar, use_container_width=True)

    else:
        # Side by side - Individual charts for each country
        num_countries = len(countries_to_compare)

        if num_countries <= 2:
            cols = st.columns(num_countries)
        elif num_countries <= 4:
            cols = st.columns(2)
        else:
            cols = st.columns(3)

        for i, country in enumerate(countries_to_compare):
            df_country_year = df_comparison[
                (df_comparison["country_name"] == country)
                & (df_comparison["year"] == selected_radar_year)
            ]

            if not df_country_year.empty:
                values = [df_country_year[idx].values[0] for idx in indices]
                values.append(values[0])

                color = country_colors[country]

                fig_individual = go.Figure()

                fig_individual.add_trace(
                    go.Scatterpolar(
                        r=values,
                        theta=theta_labels,
                        name=country,
                        fill="toself",
                        fillcolor=f"rgba{tuple(list(int(color.lstrip('#')[i : i + 2], 16) for i in (0, 2, 4)) + [0.3])}",
                        line=dict(width=3, color=color),
                        mode="lines+markers+text",
                        text=[f"{v:.1f}" for v in values],
                        textposition="top center",
                        textfont=dict(size=10, color="black"),
                        hovertemplate=(
                            "<b>%{theta}</b><br>"
                            f"Country: {country}<br>"
                            "Value: %{r:.2f}<br>"
                            f"Year: {selected_radar_year}"
                            "<extra></extra>"
                        ),
                        marker=dict(size=8, color=color),
                    )
                )

                fig_individual.update_layout(
                    polar=dict(
                        radialaxis=dict(
                            visible=True,
                            range=[0, 100],
                            tickfont=dict(color="black", size=9),
                            gridcolor="lightgray",
                        ),
                        angularaxis=dict(
                            tickfont=dict(color="black", size=10),
                            gridcolor="lightgray",
                        ),
                        bgcolor="white",
                    ),
                    showlegend=False,
                    title=dict(
                        text=f"<b>{country}</b>",
                        font=dict(size=14, color=color),
                        x=0.5,
                    ),
                    height=400,
                    margin=dict(t=60, b=30, l=30, r=30),
                    template="plotly_white",
                )

                col_idx = i % len(cols)
                with cols[col_idx]:
                    st.plotly_chart(fig_individual, use_container_width=True)


def render_methodology_page():
    """Render the methodology page."""
    st.subheader("📚 Methodology & Data Sources")

    st.markdown("""
    ### Institutional Complexity Index
    
    The Institutional Complexity Index is a comprehensive measure designed to assess the quality 
    and efficiency of institutional frameworks across countries.
    
    #### Index Components
    
    The total index comprises five key dimensions:
    
    **1. 👥 Socio-Cultural Index**
    - Measures social cohesion, cultural diversity, and educational attainment
    - Key indicators: literacy rates, social trust, cultural openness
    - Weight: 20%
    
    **2. 💼 Markets & Business Index**
    - Evaluates market efficiency, business environment, and economic openness
    - Key indicators: ease of doing business, market competition, trade openness
    - Weight: 20%
    
    **3. 🚀 Entrepreneurship Index**
    - Assesses entrepreneurial activity, innovation capacity, and startup ecosystem
    - Key indicators: startup rates, R&D investment, innovation output
    - Weight: 20%
    
    **4. 🏛️ Government Efficiency Index**
    - Measures public sector effectiveness, regulatory quality, and rule of law
    - Key indicators: government effectiveness, regulatory efficiency, corruption control
    - Weight: 20%
    
    **5. ⚖️ Legal Environment Index**
    - Evaluates legal framework quality, property rights, and judicial independence
    - Key indicators: contract enforcement, property rights protection, judicial efficiency
    - Weight: 20%
    
    #### Calculation Methodology
    
    - Each index ranges from 0 to 100, where higher values indicate better institutional quality
    - The Total Complexity Index is calculated as the weighted average of all five components
    - All indicators are normalized and standardized for cross-country comparability
    - Data is updated annually
    
    #### Data Sources
    
    - World Bank: Governance Indicators, Doing Business Reports
    - World Economic Forum: Global Competitiveness Reports
    - United Nations: Human Development Index
    - Heritage Foundation: Economic Freedom Index
    - Transparency International: Corruption Perceptions Index
    - National Statistical Offices: Country-specific data
    
    #### Reference Period
    
    - Data coverage: 2015 - 2023
    - Annual updates
    - Historical comparisons available
    """)


def render_authors_page():
    """Render the authors page."""
    st.subheader("👥 About the Authors")

    st.markdown("""
    This dashboard was developed by a team of researchers specializing in institutional 
    economics, development studies, and data science.
    """)

    st.markdown("---")

    # Author 1
    col1, col2 = st.columns([1, 3])

    with col1:
        st.image("https://via.placeholder.com/150", width=150)

    with col2:
        st.markdown("""
        ### Dr. [Author Name 1]
        **Position:** Senior Research Fellow | Professor of Economics
        
        **Institution:** [University/Research Center]
        
        **Research Interests:** Institutional Economics, Economic Development, Governance
        
        **Education:**
        - Ph.D. in Economics, [University], [Year]
        - M.A. in Development Studies, [University], [Year]
        - B.A. in Economics, [University], [Year]
        
        **Selected Publications:**
        - Paper 1 (Journal, Year)
        - Paper 2 (Journal, Year)
        - Paper 3 (Journal, Year)
        
        **Contact:** [email@university.edu](mailto:email@university.edu) | [LinkedIn](https://linkedin.com)
        """)

    st.markdown("---")

    # Author 2
    col1, col2 = st.columns([1, 3])

    with col1:
        st.image("https://via.placeholder.com/150", width=150)

    with col2:
        st.markdown("""
        ### Dr. [Author Name 2]
        **Position:** Research Associate | Data Scientist
        
        **Institution:** [University/Research Center]
        
        **Research Interests:** Quantitative Methods, Data Analysis, Institutional Quality
        
        **Education:**
        - Ph.D. in Statistics, [University], [Year]
        - M.Sc. in Data Science, [University], [Year]
        - B.Sc. in Mathematics, [University], [Year]
        
        **Selected Publications:**
        - Paper 1 (Journal, Year)
        - Paper 2 (Journal, Year)
        - Paper 3 (Journal, Year)
        
        **Contact:** [email@university.edu](mailto:email@university.edu) | [LinkedIn](https://linkedin.com)
        """)


def render_download_page():
    """Render the data download page."""
    st.subheader("📥 Data Download")

    st.markdown("""
    Download the Institutional Complexity Index data in various formats for your analysis.
    """)

    # Filter options for download
    st.markdown("### Filter Data")

    col1, col2 = st.columns(2)

    with col1:
        download_countries = st.multiselect(
            "Select Countries (leave empty for all)",
            options=get_country_list(),
            default=[],
            key="download_countries",
        )

    with col2:
        year_min_dl, year_max_dl = get_year_range()
        download_years = st.slider(
            "Select Year Range",
            min_value=year_min_dl,
            max_value=year_max_dl,
            value=(year_min_dl, year_max_dl),
            key="download_years",
        )

    # Load data for download
    if download_countries:
        df_download = load_complexity_data(
            countries=download_countries,
            years=tuple(range(download_years[0], download_years[1] + 1)),
        )
    else:
        df_download = load_complexity_data(
            years=tuple(range(download_years[0], download_years[1] + 1))
        )

    # Remove n_dims_ok column and rename columns to descriptive names
    df_download = df_download.drop(columns=["n_dims_ok"], errors="ignore")

    df_download = df_download.rename(
        columns={
            "country_name": "Country Name",
            "country_cod": "Country Code",
            "year": "Year",
            "indice_socio_cultural": "Socio-Cultural Index",
            "indice_mercados_negocios": "Markets & Business Index",
            "indice_empreendedorismo": "Entrepreneurship Index",
            "indice_eficiencia_governo": "Government Efficiency Index",
            "indice_ambiente_juridico": "Legal Environment Index",
            "indice_total": "Total Complexity Index",
        }
    )

    st.markdown(f"**Total records:** {len(df_download):,}")

    # Preview data
    st.markdown("### Data Preview")
    st.dataframe(df_download.head(10), use_container_width=True)

    st.markdown("---")

    # Download buttons
    st.markdown("### Download Options")

    col1, col2 = st.columns(2)

    with col1:
        # CSV download
        csv = df_download.to_csv(index=False).encode("utf-8")
        st.download_button(
            label="📄 Download as CSV",
            data=csv,
            file_name=f"institutional_complexity_index_{download_years[0]}_{download_years[1]}.csv",
            mime="text/csv",
            use_container_width=True,
        )

    with col2:
        # Excel download
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df_download.to_excel(writer, index=False, sheet_name="Complexity Index")

        st.download_button(
            label="📊 Download as Excel",
            data=buffer.getvalue(),
            file_name=f"institutional_complexity_index_{download_years[0]}_{download_years[1]}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
        )

    st.markdown("---")

    st.info("""
    **Note:** All index values range from 0 to 100, where higher values indicate 
    better institutional quality. The total index is calculated as the average of 
    the five component indices.
    """)


def render_home_page():
    """Render the home/welcome page."""

    # Welcome section
    st.markdown("""
    ## Welcome to the Institutional Complexity Index Dashboard
    
    This interactive platform provides comprehensive analysis and visualization tools for exploring 
    institutional quality metrics across countries worldwide.
    """)

    st.markdown("---")

    # What is this dashboard section
    st.markdown("""
    ### 📊 What is this Dashboard?
    
    The **Institutional Complexity Index (ICI)** is a composite measure that evaluates the quality 
    and efficiency of institutional frameworks across different countries. This dashboard allows you to:
    
    - **Explore** institutional quality metrics for 100+ countries
    - **Compare** multiple countries side-by-side
    - **Analyze** trends over time (2015-2023)
    - **Download** data for your own research
    
    The index comprises **five key dimensions**:
    
    | Dimension | Description |
    |-----------|-------------|
    | 👥 **Socio-Cultural** | Social cohesion, education, cultural factors |
    | 💼 **Markets & Business** | Market efficiency, business environment |
    | 🚀 **Entrepreneurship** | Innovation capacity, startup ecosystem |
    | 🏛️ **Government Efficiency** | Public sector effectiveness, regulatory quality |
    | ⚖️ **Legal Environment** | Legal framework, property rights, judicial system |
    """)

    st.markdown("---")

    # How to navigate section
    st.markdown("""
    ### 🧭 How to Navigate
    
    Use the **navigation menu** at the top of the page to explore different sections:
    """)

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown(
            """
        <div style="background-color: #e8f4f8; padding: 20px; border-radius: 10px; text-align: center; height: 150px;">
            <h4>📊 Dashboard</h4>
            <p style="font-size: 13px;">Interactive visualizations, country comparisons, and trend analysis</p>
        </div>
        """,
            unsafe_allow_html=True,
        )

    with col2:
        st.markdown(
            """
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 10px; text-align: center; height: 150px;">
            <h4>📚 Methodology</h4>
            <p style="font-size: 13px;">Learn about index calculation, data sources, and methodology</p>
        </div>
        """,
            unsafe_allow_html=True,
        )

    with col3:
        st.markdown(
            """
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 10px; text-align: center; height: 150px;">
            <h4>👥 Authors</h4>
            <p style="font-size: 13px;">Meet the research team behind this project</p>
        </div>
        """,
            unsafe_allow_html=True,
        )

    with col4:
        st.markdown(
            """
        <div style="background-color: #fce4ec; padding: 20px; border-radius: 10px; text-align: center; height: 150px;">
            <h4>📥 Data Download</h4>
            <p style="font-size: 13px;">Download data in CSV, Excel, or JSON format</p>
        </div>
        """,
            unsafe_allow_html=True,
        )

    st.markdown("---")

    # Getting started section
    st.markdown(
        """
    ### 🚀 Getting Started
    
    1. **Click on "Dashboard"** in the navigation menu at the top of the page
    2. **Select a country** from the sidebar dropdown
    3. **Explore the visualizations** - switch between different chart types
    4. **Compare countries** by selecting additional countries in the sidebar
    5. **Adjust the year range** to focus on specific time periods
    """,
        unsafe_allow_html=True,
    )


# ==============================================================================
# MAIN APPLICATION
# ==============================================================================
def main():
    """Main application function."""

    # ==========================================================================
    # HEADER
    # ==========================================================================
    st.title("🌍 Institutional Complexity Index Dashboard")

    # ==========================================================================
    # TOP NAVIGATION MENU
    # ==========================================================================
    # Check if navigation was triggered from home page buttons
    selected_page = option_menu(
        menu_title=None,
        options=["Home", "Dashboard", "Methodology", "Authors", "Data Download"],
        icons=["house-door", "bar-chart-line", "file-text", "person-badge", "download"],
        menu_icon="cast",
        default_index=0,
        orientation="horizontal",
        styles={
            "container": {
                "padding": "8px",
                "background-color": "transparent",
                "margin": "0",
                "display": "flex",
                "justify-content": "center",
                "gap": "10px",
            },
            "icon": {
                "color": "inherit",
                "font-size": "15px",
            },
            "nav-link": {
                "font-size": "14px",
                "font-weight": "500",
                "text-align": "center",
                "padding": "12px 28px",
                "border-radius": "25px",
                "color": "#1a1a1a",
                "background-color": "#f0f2f6",
                "--hover-color": "#e0e4eb",
                "transition": "all 0.2s ease",
                "border": "1px solid #e0e4eb",
            },
            "nav-link-selected": {
                "background": "linear-gradient(135deg, #4C82F7 0%, #3a6fd8 100%)",
                "color": "white",
                "font-weight": "600",
                "border": "none",
                "box-shadow": "0 4px 15px rgba(76, 130, 247, 0.35)",
            },
        },
    )

    # ==========================================================================
    # SIDEBAR - Always visible with filters
    # ==========================================================================
    with st.spinner("Loading countries..."):
        countries = get_country_list()
        year_min, year_max = get_year_range()

    with st.sidebar:
        selected_country, comparison_countries, year_range = render_dashboard_sidebar(
            countries, year_min, year_max
        )

    # ==========================================================================
    # HOME PAGE
    # ==========================================================================
    if selected_page == "Home":
        render_home_page()

    # ==========================================================================
    # DASHBOARD PAGE
    # ==========================================================================
    elif selected_page == "Dashboard":
        # Check if a country is selected
        if not selected_country:
            st.info(
                "👈 Please select a country from the sidebar to begin exploring the data."
            )
            return

        # Load data
        with st.spinner(f"Loading data for {selected_country}..."):
            df_main = get_country_data(selected_country)
            df_main_filtered = df_main[
                (df_main["year"] >= year_range[0]) & (df_main["year"] <= year_range[1])
            ]

            if comparison_countries:
                all_countries = [selected_country] + comparison_countries
                df_comparison = load_complexity_data(
                    countries=all_countries,
                    years=tuple(range(year_range[0], year_range[1] + 1)),
                )
            else:
                df_comparison = df_main_filtered

        # Check if data is available
        if df_main_filtered.empty:
            st.warning(
                f"No data available for {selected_country} in the selected year range."
            )
            return

        # Display overview section
        st.header(f"📈 Overview: {selected_country}")
        render_metrics(df_main_filtered, selected_country)

        st.markdown("---")

        # ======================================================================
        # VISUALIZATION TABS
        # ======================================================================
        selected_tab = option_menu(
            menu_title=None,
            options=["Index Evolution", "Country Comparison", "Radar Chart"],
            icons=["graph-up", "globe", "pentagon"],
            menu_icon="cast",
            default_index=0,
            orientation="horizontal",
            key="visualization_tabs",
            styles={
                "container": {"padding": "0!important", "background-color": "#fafafa"},
                "icon": {"color": "#4C82F7", "font-size": "18px"},
                "nav-link": {
                    "font-size": "14px",
                    "text-align": "center",
                    "margin": "0px",
                    "--hover-color": "#eee",
                },
                "nav-link-selected": {"background-color": "#4C82F7"},
            },
        )

        # Render selected visualization
        if selected_tab == "Index Evolution":
            render_evolution_chart(df_main_filtered, selected_country)
        elif selected_tab == "Country Comparison":
            render_comparison_chart(
                df_comparison, selected_country, comparison_countries
            )
        elif selected_tab == "Radar Chart":
            render_radar_chart(df_comparison, selected_country, comparison_countries)

    # ==========================================================================
    # INFORMATION & RESOURCES PAGES
    # ==========================================================================
    elif selected_page == "Methodology":
        render_methodology_page()
    elif selected_page == "Authors":
        render_authors_page()
    elif selected_page == "Data Download":
        render_download_page()

    # ==========================================================================
    # FOOTER
    # ==========================================================================
    st.markdown("---")
    st.caption(
        "Institutional Complexity Index Dashboard | Data Source: PostgreSQL Database"
    )


# ==============================================================================
# ENTRY POINT
# ==============================================================================
if __name__ == "__main__":
    main()
