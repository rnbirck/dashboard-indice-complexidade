"""
Chart components for the Institutional Complexity Index Dashboard.
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from src.config import INDEX_COLORS, INDEX_LABELS


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
