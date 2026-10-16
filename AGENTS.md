# Instrucoes — INDICE-COMPLEXIDADE

App de indice de complexidade institucional. Le e escreve no banco `cei`
(`indice_complexidade_institucional`), e tambem consome o **Supabase**.

`app.py` e a aplicacao; `db.py` nao e importado pelo app: rodado direto, faz carga destrutiva (`to_sql replace`) de `data/indice_complexidade_institucional_by_year.xlsx` em `cei.indice_complexidade_institucional`. Ha `Procfile`, entao roda hospedado.

## O que nao pode acontecer

- **O app Streamlit nao tem teste.** Qualquer mudanca nele precisa de conferencia manual; `web/` tem `npm test`.
- E o unico dashboard que **escreve** no `cei`. Uma carga errada aqui contamina a base que
  os outros projetos leem.

## Versao React (`web/`)

- Mantem a estrutura do app Streamlit (seis paginas, filtros na lateral, tres abas no
  Dashboard), os mesmos dados e as mesmas regras de ranking e download; o visual foi
  redesenhado. Cores das dimensoes e dos paises ficam em `web/src/lib/tema.ts` e
  `web/shared/dados.ts`. Ver [web/README.md](web/README.md).
- Le o `cei` apenas por `web/scripts/gerar_dados.py` (somente leitura) e nunca escreve.
- Tem testes: `npm test` em `web/`. Antes de publicar, rode tambem `npm run build`.
- O `Dockerfile` e o `railway.json` da raiz publicam a versao React no servico do Railway
  que rodava o Streamlit, no mesmo endereco. Push para a branch do servico e publicacao
  externa: so com pedido. E-mails pelo SMTP do Gmail, com as variaveis do Railway.
