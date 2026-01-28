# ==============================================================================
# DATA LOADER MODULE
# ==============================================================================

import pandas as pd
from sqlalchemy import create_engine
import streamlit as st
from typing import List, Optional
from .config import DATABASE_URL, TABLE_NAME


@st.cache_resource
def get_database_engine():
    """Create and return a database engine."""
    return create_engine(DATABASE_URL)


@st.cache_data(ttl=3600)
def load_complexity_data(
    countries: Optional[List[str]] = None, years: Optional[tuple] = None
) -> pd.DataFrame:
    """
    Load institutional complexity index data from the database.

    Parameters:
    -----------
    countries : List[str], optional
        List of country names to filter. If None, loads all countries.
    years : tuple, optional
        Tuple of years to filter. If None, loads all years.

    Returns:
    --------
    pd.DataFrame
        DataFrame containing the complexity index data.
    """
    engine = get_database_engine()

    # Base query
    query = f"SELECT * FROM {TABLE_NAME}"

    # Add filters
    conditions = []
    if countries:
        country_list = "', '".join(countries)
        conditions.append(f"country_name IN ('{country_list}')")

    if years:
        year_list = ", ".join(map(str, years))
        conditions.append(f"year IN ({year_list})")

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY country_name, year"

    # Load data
    df = pd.read_sql(query, engine)

    return df


@st.cache_data(ttl=3600)
def get_country_list() -> List[str]:
    """
    Get a sorted list of all unique countries in the database.

    Returns:
    --------
    List[str]
        Sorted list of country names.
    """
    engine = get_database_engine()
    query = f"SELECT DISTINCT country_name FROM {TABLE_NAME} ORDER BY country_name"
    df = pd.read_sql(query, engine)
    return df["country_name"].tolist()


@st.cache_data(ttl=3600)
def get_year_range() -> tuple:
    """
    Get the min and max years available in the database.

    Returns:
    --------
    tuple
        (min_year, max_year)
    """
    engine = get_database_engine()
    query = f"SELECT MIN(year) as min_year, MAX(year) as max_year FROM {TABLE_NAME}"
    df = pd.read_sql(query, engine)
    return (int(df["min_year"].iloc[0]), int(df["max_year"].iloc[0]))


@st.cache_data(ttl=3600)
def get_country_data(country_name: str) -> pd.DataFrame:
    """
    Get all data for a specific country.

    Parameters:
    -----------
    country_name : str
        Name of the country.

    Returns:
    --------
    pd.DataFrame
        DataFrame containing all data for the specified country.
    """
    return load_complexity_data(countries=[country_name])


@st.cache_data(ttl=3600)
def get_latest_year_data() -> pd.DataFrame:
    """
    Get data for the most recent year available.

    Returns:
    --------
    pd.DataFrame
        DataFrame containing data for the latest year.
    """
    engine = get_database_engine()
    query = f"""
    SELECT * FROM {TABLE_NAME}
    WHERE year = (SELECT MAX(year) FROM {TABLE_NAME})
    ORDER BY indice_total DESC
    """
    df = pd.read_sql(query, engine)
    return df


@st.cache_data(ttl=3600)
def get_comparison_data(
    countries: List[str], years: Optional[tuple] = None
) -> pd.DataFrame:
    """
    Get data for multiple countries for comparison.

    Parameters:
    -----------
    countries : List[str]
        List of country names to compare.
    years : tuple, optional
        Tuple of years to include. If None, includes all years.

    Returns:
    --------
    pd.DataFrame
        DataFrame containing data for the specified countries.
    """
    return load_complexity_data(countries=countries, years=years)
