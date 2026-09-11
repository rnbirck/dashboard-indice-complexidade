# %%
import sys
import pandas as pd
from sqlalchemy import create_engine

# Credencial do Postgres: vem do dados/.env (ver dados/coleta/README.md).
sys.path.insert(0, r"C:\Users\rnbirck\projetos\dados\coleta")
import _comum  # noqa: E402

# Configuração do banco de dados
usuario = "rnbirck"
senha = _comum.env("POSTGRES_PASSWORD", obrigatorio=True)
host = "localhost"
banco = "cei"
engine = create_engine(f"postgresql+psycopg2://{usuario}:{senha}@{host}/{banco}")

indices_raw = pd.read_excel("data/indice_complexidade_institucional_by_year.xlsx")

indices = indices_raw.rename(columns={"ici": "indice_total"})

indices.to_sql(
    "indice_complexidade_institucional", con=engine, if_exists="replace", index=False
)
