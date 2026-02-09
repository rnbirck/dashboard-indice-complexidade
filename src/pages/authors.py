"""
Authors page for the Institutional Complexity Index Dashboard.
"""

import streamlit as st


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

    st.markdown("---")

    # Author 3
    col1, col2 = st.columns([1, 3])

    with col1:
        st.image("https://via.placeholder.com/150", width=150)

    with col2:
        st.markdown("""
        ### [Author Name 3]
        **Position:** Research Analyst | Policy Specialist
        
        **Institution:** [University/Research Center]
        
        **Research Interests:** Public Policy, Comparative Politics, Institutional Analysis
        
        **Education:**
        - M.A. in Public Policy, [University], [Year]
        - B.A. in Political Science, [University], [Year]
        
        **Selected Publications:**
        - Paper 1 (Journal, Year)
        - Paper 2 (Journal, Year)
        
        **Contact:** [email@university.edu](mailto:email@university.edu) | [LinkedIn](https://linkedin.com)
        """)
