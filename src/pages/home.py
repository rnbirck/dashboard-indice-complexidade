"""
Home page for the Institutional Complexity Index Dashboard.
"""

import streamlit as st


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
