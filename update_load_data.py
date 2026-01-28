# ==============================================================================
# UPDATE & LOAD DATA MODULE - ÍNDICE DE COMPLEXIDADE INSTITUCIONAL
# ==============================================================================
# Este módulo centraliza:
# 1. UPLOAD: Transferência de dados do PostgreSQL local para o Supabase
# 2. LOAD: Funções de leitura dos dados do Supabase para o dashboard
# ==============================================================================

import os
import time
import pandas as pd
import numpy as np
import streamlit as st
from typing import List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Carrega variáveis de ambiente
load_dotenv()

# ==============================================================================
# CONFIGURAÇÃO DO SUPABASE
# ==============================================================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

# Nome da tabela no Supabase
TABLE_NAME = "dados_indice_complexidade_institucional"

# Cliente Supabase (inicializado uma vez)
supabase_client: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Conexão com Supabase estabelecida com sucesso.")
    except Exception as e:
        print(f"❌ Erro ao conectar ao Supabase: {e}")
else:
    print("⚠️ Variáveis SUPABASE_URL ou SUPABASE_KEY não encontradas.")


# ==============================================================================
# FUNÇÕES DE LEITURA (LOAD) - Usadas pelo Dashboard
# ==============================================================================
CACHE_TTL = None  # Cache infinito


@st.cache_data(ttl=CACHE_TTL)
def load_complexity_data(
    countries: Optional[List[str]] = None, years: Optional[tuple] = None
) -> pd.DataFrame:
    """
    Carrega dados do índice de complexidade institucional do Supabase.

    Parameters:
    -----------
    countries : List[str], optional
        Lista de países para filtrar. Se None, carrega todos.
    years : tuple, optional
        Tupla de anos para filtrar. Se None, carrega todos.

    Returns:
    --------
    pd.DataFrame
        DataFrame com os dados do índice de complexidade.
    """
    if not supabase_client:
        st.error("Conexão com Supabase não estabelecida.")
        return pd.DataFrame()

    try:
        query = supabase_client.table(TABLE_NAME).select("*")

        if countries:
            query = query.in_("country_name", list(countries))

        if years:
            query = query.in_("year", list(years))

        response = query.order("country_name").order("year").execute()
        return pd.DataFrame(response.data)

    except Exception as e:
        st.error(f"Erro ao carregar dados: {e}")
        return pd.DataFrame()


@st.cache_data(ttl=CACHE_TTL)
def get_country_list() -> List[str]:
    """
    Retorna lista ordenada de todos os países únicos no banco.
    """
    if not supabase_client:
        st.error("Conexão com Supabase não estabelecida.")
        return []

    try:
        response = supabase_client.table(TABLE_NAME).select("country_name").execute()
        df = pd.DataFrame(response.data)

        if df.empty:
            return []

        return sorted(df["country_name"].unique().tolist())

    except Exception as e:
        st.error(f"Erro ao carregar lista de países: {e}")
        return []


@st.cache_data(ttl=CACHE_TTL)
def get_year_range() -> tuple:
    """
    Retorna o intervalo de anos disponíveis (min, max).
    """
    if not supabase_client:
        st.error("Conexão com Supabase não estabelecida.")
        return (2015, 2023)

    try:
        response = supabase_client.table(TABLE_NAME).select("year").execute()
        df = pd.DataFrame(response.data)

        if df.empty:
            return (2015, 2023)

        return (int(df["year"].min()), int(df["year"].max()))

    except Exception as e:
        st.error(f"Erro ao carregar range de anos: {e}")
        return (2015, 2023)


@st.cache_data(ttl=CACHE_TTL)
def get_country_data(country_name: str) -> pd.DataFrame:
    """
    Retorna todos os dados de um país específico.
    """
    return load_complexity_data(countries=[country_name])


@st.cache_data(ttl=CACHE_TTL)
def get_latest_year_data() -> pd.DataFrame:
    """
    Retorna dados do ano mais recente disponível.
    """
    if not supabase_client:
        st.error("Conexão com Supabase não estabelecida.")
        return pd.DataFrame()

    try:
        _, max_year = get_year_range()

        response = (
            supabase_client.table(TABLE_NAME)
            .select("*")
            .eq("year", max_year)
            .order("indice_total", desc=True)
            .execute()
        )

        return pd.DataFrame(response.data)

    except Exception as e:
        st.error(f"Erro ao carregar dados do último ano: {e}")
        return pd.DataFrame()


@st.cache_data(ttl=CACHE_TTL)
def get_comparison_data(
    countries: List[str], years: Optional[tuple] = None
) -> pd.DataFrame:
    """
    Retorna dados de múltiplos países para comparação.
    """
    return load_complexity_data(countries=countries, years=years)


# ==============================================================================
# FUNÇÕES DE UPLOAD - Transferência PostgreSQL Local → Supabase
# ==============================================================================

# Query para extrair dados do banco local
QUERY_INDICE = """
SELECT country_name,
       country_cod,
       year,
       indice_socio_cultural,
       indice_mercados_negocios,
       indice_empreendedorismo,
       indice_eficiencia_governo,
       indice_ambiente_juridico,
       n_dims_ok,
       indice_total
FROM indice_complexidade_institucional
"""


def upload_data_to_supabase(batch_size: int = 500):
    """
    Faz upload dos dados do PostgreSQL local para o Supabase.
    Esta função só deve ser executada localmente (não no Streamlit Cloud).
    """
    # Importa SQLAlchemy apenas quando necessário (para upload)
    from sqlalchemy import create_engine, text

    # Configuração do banco local
    DB_USUARIO = os.getenv("DB_USUARIO")
    DB_SENHA = os.getenv("DB_SENHA")
    DB_HOST = os.getenv("DB_HOST")
    DB_BANCO = os.getenv("DB_BANCO")

    if not all([DB_USUARIO, DB_SENHA, DB_HOST, DB_BANCO]):
        print("❌ Variáveis de conexão com banco local não encontradas no .env")
        return

    try:
        local_engine = create_engine(
            f"postgresql+psycopg2://{DB_USUARIO}:{DB_SENHA}@{DB_HOST}/{DB_BANCO}"
        )
        print("✅ Conexão com banco local estabelecida.")
    except Exception as e:
        print(f"❌ Erro ao conectar ao banco local: {e}")
        return

    if not supabase_client:
        print("❌ Conexão com Supabase não estabelecida.")
        return

    print(f"\n--- Processando tabela: {TABLE_NAME} ---")

    try:
        start_time = time.time()

        # 1. Buscar dados do banco local
        print("1/4: Buscando dados do banco local...")
        df = pd.read_sql_query(text(QUERY_INDICE), local_engine)

        if df.empty:
            print("(!) Aviso: A query não retornou dados.")
            return

        print(f"-> Encontrados {len(df)} registros.")

        # 2. Corrigir tipos de dados
        print("2/4: Corrigindo tipos de dados...")
        for col in df.columns:
            if pd.api.types.is_float_dtype(df[col]):
                if (df[col].dropna() % 1 == 0).all():
                    df[col] = df[col].astype("Int64")

        df.replace([np.inf, -np.inf], None, inplace=True)
        df = df.astype(object).where(pd.notna(df), None)

        # 3. Limpar tabela de destino
        print(f"3/4: Limpando tabela '{TABLE_NAME}' no Supabase...")
        supabase_client.table(TABLE_NAME).delete().gt("year", 0).execute()

        # 4. Inserir em lotes
        print(f"4/4: Inserindo dados em lotes de {batch_size} registros...")
        total_batches = (len(df) // batch_size) + (1 if len(df) % batch_size > 0 else 0)

        for i, start in enumerate(range(0, len(df), batch_size)):
            end = start + batch_size
            batch_df = df.iloc[start:end]
            data_to_insert = batch_df.to_dict(orient="records")

            response = (
                supabase_client.table(TABLE_NAME).insert(data_to_insert).execute()
            )

            if hasattr(response, "error") and response.error:
                print(f"   -> ERRO no lote {i + 1}/{total_batches}: {response.error}")
            else:
                print(f"   -> Lote {i + 1}/{total_batches} inserido com sucesso.")

        end_time = time.time()
        print(f"✅ Upload concluído em {end_time - start_time:.2f} segundos.")

    except Exception as e:
        print(f"❌ ERRO ao processar upload: {e}")
        with open("log_erros.txt", "a", encoding="utf-8") as log_file:
            log_file.write(f"Erro no upload: {e}\n")


# ==============================================================================
# EXECUÇÃO DIRETA (Upload)
# ==============================================================================
if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("UPLOAD DE DADOS - ÍNDICE DE COMPLEXIDADE INSTITUCIONAL")
    print("=" * 70)

    upload_data_to_supabase()

    print("\n" + "=" * 70)
    print("PROCESSO CONCLUÍDO!")
    print("=" * 70)
