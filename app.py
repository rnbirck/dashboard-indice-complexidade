# ==============================================================================
# INSTITUTIONAL COMPLEXITY INDEX DASHBOARD
# ==============================================================================
"""
A comprehensive dashboard for visualizing and analyzing the Institutional
Complexity Index across countries and time periods.

Author: Renan Birck
Version: 2.0.0 (Refactored)
"""

import streamlit as st
from dotenv import load_dotenv
from streamlit_option_menu import option_menu
from update_load_data import (
    get_country_list,
    get_country_data,
    get_year_range,
    load_complexity_data,
)
from src.components import (
    render_dashboard_sidebar,
    render_metrics,
    render_evolution_chart,
    render_comparison_chart,
    render_radar_chart,
)
from src.pages import (
    render_home_page,
    render_methodology_page,
    render_authors_page,
    render_download_page,
    render_contact_page,
)

# Load environment variables
load_dotenv()

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
    selected_page = option_menu(
        menu_title=None,
        options=[
            "Home",
            "Dashboard",
            "Methodology",
            "Authors",
            "Contact Us",
            "Data Download",
        ],
        icons=[
            "house-door",
            "bar-chart-line",
            "file-text",
            "person-badge",
            "envelope",
            "download",
        ],
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
    # PAGE ROUTING
    # ==========================================================================
    if selected_page == "Home":
        render_home_page()

    elif selected_page == "Dashboard":
        _render_dashboard_page(selected_country, comparison_countries, year_range)

    elif selected_page == "Methodology":
        render_methodology_page()

    elif selected_page == "Authors":
        render_authors_page()

    elif selected_page == "Contact Us":
        render_contact_page()

    elif selected_page == "Data Download":
        render_download_page(get_country_list, get_year_range, load_complexity_data)

    # ==========================================================================
    # FOOTER
    # ==========================================================================
    st.markdown("---")
    st.caption(
        "Institutional Complexity Index Dashboard | Data Source: PostgreSQL Database"
    )


def _render_dashboard_page(selected_country, comparison_countries, year_range):
    """Render the main dashboard page with visualizations."""
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

    # ==========================================================================
    # VISUALIZATION TABS
    # ==========================================================================
    selected_tab = option_menu(
        menu_title=None,
        options=["Index Evolution", "Country Comparison", "Radar Chart"],
        icons=["graph-up", "globe", "pentagon"],
        menu_icon="cast",
        default_index=0,
        orientation="horizontal",
        key="visualization_tabs",
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
                "font-size": "16px",
            },
            "nav-link": {
                "font-size": "14px",
                "font-weight": "500",
                "text-align": "center",
                "padding": "10px 24px",
                "border-radius": "20px",
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
                "box-shadow": "0 3px 10px rgba(76, 130, 247, 0.3)",
            },
        },
    )

    # Render selected visualization
    if selected_tab == "Index Evolution":
        render_evolution_chart(df_main_filtered, selected_country)
    elif selected_tab == "Country Comparison":
        render_comparison_chart(df_comparison, selected_country, comparison_countries)
    elif selected_tab == "Radar Chart":
        render_radar_chart(df_comparison, selected_country, comparison_countries)


# ==============================================================================
# ENTRY POINT
# ==============================================================================
if __name__ == "__main__":
    main()
