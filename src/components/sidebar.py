"""
Sidebar component for the Institutional Complexity Index Dashboard.
"""

import streamlit as st


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
