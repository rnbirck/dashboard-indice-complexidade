"""
Metrics component for the Institutional Complexity Index Dashboard.
"""

import streamlit as st
import pandas as pd
from update_load_data import load_complexity_data


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

    # Show total countries and disclaimer about delta
    if previous_year:
        st.info(
            f"📊 **Total countries:** {total} | ℹ️ Position changes are compared to {previous_year}. Negative values indicate improvement in ranking."
        )
    else:
        st.info(f"📊 **Total countries:** {total}")
