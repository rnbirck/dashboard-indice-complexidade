# %%
"""Gera src/data/indice.json a partir do Postgres local (banco cei). Somente leitura.

Execute da pasta web: python -X utf8 scripts/gerar_dados.py

Substitui o upload para o Supabase: o painel React lê este JSON estático, embutido no
build, e as funções de e-mail usam o mesmo arquivo para montar os anexos.
"""
import json
import math
from pathlib import Path

from dados_comuns import ler_sql

DESTINO = Path(__file__).resolve().parents[1] / "src" / "data" / "indice.json"

# Mesma consulta do antigo upload para o Supabase. A ordem (país, ano) com collate "C"
# é a ordem em que o Supabase devolvia as linhas, e por isso a ordem dos downloads.
CONSULTA = """
SELECT country_name,
       country_cod,
       year,
       indice_socio_cultural,
       indice_mercados_negocios,
       indice_empreendedorismo,
       indice_eficiencia_governo,
       indice_ambiente_juridico,
       indice_total
FROM indice_complexidade_institucional
ORDER BY country_name COLLATE "C", year
"""

INDICES = [
    "indice_socio_cultural",
    "indice_mercados_negocios",
    "indice_empreendedorismo",
    "indice_eficiencia_governo",
    "indice_ambiente_juridico",
    "indice_total",
]


# %%
df = ler_sql(CONSULTA, banco="cei")
colunas = list(df.columns)

if df.empty:
    raise SystemExit("A consulta não retornou linhas; JSON não alterado.")
if df[["country_name", "country_cod", "year"]].isna().any().any():
    raise SystemExit("Há país, código ou ano vazio; JSON não alterado.")
if df.duplicated(["country_name", "year"]).any():
    raise SystemExit("Há país-ano duplicado; JSON não alterado.")

linhas = []
for registro in df.itertuples(index=False):
    linha = []
    for coluna, valor in zip(colunas, registro):
        if coluna == "year":
            linha.append(int(valor))
        elif coluna in INDICES:
            valor = float(valor)
            # O painel calcula rankings e radares com todos os índices; vazio quebraria a página.
            if not math.isfinite(valor):
                raise SystemExit(f"Valor inválido em {registro.country_name}/{registro.year}/{coluna}.")
            linha.append(valor)
        else:
            linha.append(str(valor))
    linhas.append(linha)

DESTINO.parent.mkdir(parents=True, exist_ok=True)
DESTINO.write_text(
    json.dumps({"colunas": colunas, "linhas": linhas}, ensure_ascii=False, separators=(",", ":")),
    encoding="utf-8",
)

anos = sorted(df["year"].unique())
print(f"{len(linhas)} linhas, {df['country_name'].nunique()} países, {anos[0]}-{anos[-1]} -> {DESTINO}")
