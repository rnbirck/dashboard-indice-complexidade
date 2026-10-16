# Índice de Complexidade

Aplicação Python/Streamlit com entrada em `app.py`, acesso a dados em `db.py` e
atualização em `update_load_data.py`. Consulte as [instruções](AGENTS.md) antes de
executar a atualização, que possui efeitos no banco e em serviços externos.

- `requirements.txt` e `Procfile`: dependências e entrada de hospedagem.
- `docs/`: [configuração de e-mail](docs/CONFIGURACAO_EMAIL.md).
- `logs/`: registros de execução; a atualização grava aqui `log_erros.txt`.
- `.local/`: configuração pessoal preservada e ignorada pelo Git.
- `data/`: atalho oculto para `DADOS/derivados/indice_complexidade/planilhas_modelo`.

A extração `db_csv.csv` está em `DADOS/derivados/indice_complexidade`.

## Versão React (em validação)

`web/` replica este app em React, com os dados num JSON estático e sem Supabase. Um
servidor Node entrega o site e envia os e-mails dos formulários pelo mesmo SMTP do Gmail.
O `Dockerfile` e o `railway.json` da raiz fazem o serviço do Railway publicar a versão
React no mesmo endereço; o código Streamlit continua no repositório para voltar, se
preciso. Veja o [README da versão React](web/README.md).
