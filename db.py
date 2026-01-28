# %%
import pandas as pd
from sqlalchemy import create_engine

# Configuração do banco de dados
usuario = "rnbirck"
senha = "ceiunisinos"
host = "localhost"
banco = "cei"
engine = create_engine(f"postgresql+psycopg2://{usuario}:{senha}@{host}/{banco}")

indices_raw = pd.read_excel("data/indice_complexidade_institucional_by_year.xlsx")

indices = indices_raw.drop(columns=["ici_all5"]).rename(columns={"ici": "indice_total"})

indices.to_sql(
    "indice_complexidade_institucional", con=engine, if_exists="replace", index=False
)
