"""
Methodology page for the Institutional Complexity Index Dashboard.
"""

import streamlit as st


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
