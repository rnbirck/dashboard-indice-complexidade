# Índice de Complexidade

Painel React do índice de complexidade institucional, em [`web/`](web/README.md). Os dados
vão embutidos no build como JSON gerado do banco `cei` por `web/scripts/gerar_dados.py`, e
um servidor Node entrega o site e envia os e-mails dos formulários pelo SMTP do Gmail. O
`Dockerfile` e o `railway.json` da raiz publicam o painel no serviço do Railway. Consulte as
[instruções](AGENTS.md) antes de carregar dados, porque `db.py` grava no banco.

- `db.py`: carga de `data/indice_complexidade_institucional_by_year.xlsx` em
  `cei.indice_complexidade_institucional`.
- `docs/`: [configuração de e-mail](docs/CONFIGURACAO_EMAIL.md).
- `.local/`: configuração pessoal preservada e ignorada pelo Git.
- `data/`: atalho oculto para `DADOS/derivados/indice_complexidade/planilhas_modelo`.

A extração `db_csv.csv` está em `DADOS/derivados/indice_complexidade`.

O antigo app Streamlit (`app.py`, `src/` e `update_load_data.py`, que enviava os dados ao
Supabase) saiu do repositório em 17/10/2026 e continua no histórico do git até o commit
`a54d10d`.
