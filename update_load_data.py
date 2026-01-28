# %%
import os
import time
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from supabase import create_client, Client
import numpy as np


# --- CARREGAR VARIÁVEIS DE AMBIENTE DO ARQUIVO .env ---
load_dotenv()

# CONFIGURAÇÃO DA CONEXÃO LOCAL ---
DB_USUARIO = os.getenv("DB_USUARIO")
DB_SENHA = os.getenv("DB_SENHA")
DB_HOST = os.getenv("DB_HOST")
DB_BANCO = os.getenv("DB_BANCO")

try:
    local_engine = create_engine(
        f"postgresql+psycopg2://{DB_USUARIO}:{DB_SENHA}@{DB_HOST}/{DB_BANCO}"
    )
    print("✅ Conexão com o banco de dados local estabelecida com sucesso.")
except Exception as e:
    print(f"❌ Erro ao conectar ao banco de dados local: {e}")
    exit()

# --- 2. CONFIGURAÇÃO DA CONEXÃO SUPABASE ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")


if not SUPABASE_URL or not SUPABASE_KEY:
    print(
        "❌ Erro: Variáveis SUPABASE_URL ou SUPABASE_KEY não encontradas no arquivo .env."
    )
    exit()

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Conexão com o Supabase estabelecida com sucesso.")
except Exception as e:
    print(f"❌ Erro ao conectar ao Supabase: {e}")
    exit()

# ===================================================================
# --- DEFINIÇÃO DA QUERY ---
# ===================================================================

QUERY_INDICADORE_INDICE = """
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

# ===================================================================
# --- FUNÇÃO DE UPLOAD DE DADOS ---
# ===================================================================


def process_and_upload(
    query_string,
    target_table_name,
    engine,
    supabase_client,
    params=None,
    batch_size=500,
):
    """
    Executa uma query no banco local, corrige os tipos
    de dados e insere em lotes numa tabela do Supabase.
    """
    print(f"\n--- Processando tabela: {target_table_name} ---")

    try:
        start_time = time.time()

        # Executar a query e carregar para o DataFrame
        print("1/4: Buscando dados do banco local...")
        df = pd.read_sql_query(text(query_string), engine, params=params)

        if df.empty:
            print("(!) Aviso: A query não retornou dados. Tabela pulada.")
            return

        print(f"-> Encontrados {len(df)} registros.")

        # Corrigir os tipos de dados
        print("2/4: Corrigindo tipos de dados no DataFrame...")
        for col in df.columns:
            if pd.api.types.is_float_dtype(df[col]):
                if (df[col].dropna() % 1 == 0).all():
                    print(
                        f"   - Convertendo coluna float '{col}' para inteiro anulável (Int64)."
                    )
                    df[col] = df[col].astype("Int64")

        df.replace([np.inf, -np.inf], None, inplace=True)
        df = df.astype(object).where(pd.notna(df), None)

        # Apagar dados existentes na tabela de destino
        print(f"3/4: Limpando a tabela de destino '{target_table_name}' no Supabase...")
        # Deleta todos os dados existentes para garantir uma carga limpa
        supabase_client.table(target_table_name).delete().gt("year", 0).execute()

        # Inserir dados em lotes
        print(f"4/4: Inserindo dados em lotes de {batch_size} registros...")
        total_batches = (len(df) // batch_size) + (1 if len(df) % batch_size > 0 else 0)

        for i, start in enumerate(range(0, len(df), batch_size)):
            end = start + batch_size
            batch_df = df.iloc[start:end]
            data_to_insert = batch_df.to_dict(orient="records")

            response = (
                supabase_client.table(target_table_name)
                .insert(data_to_insert)
                .execute()
            )

            if hasattr(response, "error") and response.error:
                print(f"   -> ERRO no lote {i + 1}/{total_batches}: {response.error}")
            else:
                print(f"   -> Lote {i + 1}/{total_batches} inserido com sucesso.")

        end_time = time.time()
        print(
            f"✅ Tabela '{target_table_name}' concluída com sucesso em {end_time - start_time:.2f} segundos."
        )

    except Exception as e:
        print(f"❌ ERRO GERAL ao processar a tabela '{target_table_name}': {e}")
        with open("log_erros.txt", "a", encoding="utf-8") as log_file:
            log_file.write(f"Erro na tabela {target_table_name}: {e}\n")


# ===================================================================
# --- FUNÇÃO DE CARREGAMENTO DE DADOS (COM CACHE) ---
# ===================================================================
_cache = {}
CACHE_TTL = None


def carregar_dados_indice_complexidade():
    """
    Carrega os dados da tabela dados_indice_complexidade_institucional do Supabase.
    Retorna um DataFrame com os dados.
    """
    cache_key = "indice_complexidade"

    # Verificar se existe cache válido
    if cache_key in _cache:
        cached_time, cached_data = _cache[cache_key]
        if time.time() - cached_time < CACHE_TTL:
            print("📦 Dados carregados do cache.")
            return cached_data

    print("🔄 Carregando dados do Supabase...")

    if not supabase:
        print("❌ Conexão com Supabase não estabelecida.")
        return pd.DataFrame()

    try:
        response = (
            supabase.table("dados_indice_complexidade_institucional")
            .select("*")
            .execute()
        )
        df = pd.DataFrame(response.data)

        # Salvar no cache
        _cache[cache_key] = (time.time(), df)

        print(f"✅ {len(df)} registros carregados com sucesso.")
        return df

    except Exception as e:
        print(f"❌ Erro ao carregar dados: {e}")
        return pd.DataFrame()


# ===================================================================
# --- FUNÇÃO PRINCIPAL ---
# ===================================================================


def main():
    """
    Executa o upload dos dados da tabela de índice de complexidade institucional.
    """
    print("\n" + "=" * 70)
    print("INICIANDO UPLOAD DE DADOS - ÍNDICE DE COMPLEXIDADE INSTITUCIONAL")
    print("=" * 70)

    process_and_upload(
        query_string=QUERY_INDICADORE_INDICE,
        target_table_name="dados_indice_complexidade_institucional",
        engine=local_engine,
        supabase_client=supabase,
        params=None,
        batch_size=500,
    )

    print("\n" + "=" * 70)
    print("UPLOAD CONCLUÍDO!")
    print("=" * 70)


if __name__ == "__main__":
    main()
