# ==============================================================================
# CONFIGURATION FILE FOR INSTITUTIONAL COMPLEXITY INDEX DASHBOARD
# ==============================================================================

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================
DB_USER = os.getenv("DB_USUARIO")
DB_PASSWORD = os.getenv("DB_SENHA")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_BANCO")
DB_PORT = os.getenv("DB_PORT", "5432")

# Connection string
DATABASE_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# ==============================================================================
# DASHBOARD SETTINGS
# ==============================================================================

# Year range for analysis
YEARS_RANGE = tuple(range(2015, 2024))

# ==============================================================================
# COLOR SCHEMES
# ==============================================================================
PRIMARY_COLOR = "#4C82F7"  # Blue
SECONDARY_COLOR = "#FF6B6B"  # Coral
TERTIARY_COLOR = "#1DD1A1"  # Mint Green
QUATERNARY_COLOR = "#A354FF"  # Purple
QUINARY_COLOR = "#FFA502"  # Orange

# Color mapping for indices
INDEX_COLORS = {
    "indice_socio_cultural": "#4C82F7",
    "indice_mercados_negocios": "#FF6B6B",
    "indice_empreendedorismo": "#1DD1A1",
    "indice_eficiencia_governo": "#A354FF",
    "indice_ambiente_juridico": "#FFA502",
    "indice_total": "#2C3E50",
}

# Index labels in English
INDEX_LABELS = {
    "indice_socio_cultural": "Socio-Cultural Index",
    "indice_mercados_negocios": "Markets & Business Index",
    "indice_empreendedorismo": "Entrepreneurship Index",
    "indice_eficiencia_governo": "Government Efficiency Index",
    "indice_ambiente_juridico": "Legal Environment Index",
    "indice_total": "Total Complexity Index",
}

# ==============================================================================
# TABLE NAMES
# ==============================================================================
TABLE_NAME = "indice_complexidade_institucional"
