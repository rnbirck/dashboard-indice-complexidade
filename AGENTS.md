# Instrucoes — INDICE-COMPLEXIDADE

Painel React (`web/`) do indice de complexidade institucional. Le o banco `cei`
(`indice_complexidade_institucional`) por `web/scripts/gerar_dados.py`, somente leitura.

`db.py` roda direto e faz carga destrutiva (`to_sql replace`) de `data/indice_complexidade_institucional_by_year.xlsx` em `cei.indice_complexidade_institucional`.

## O que nao pode acontecer

- E o unico dashboard que **escreve** no `cei`, por `db.py`. Uma carga errada aqui contamina a base que
  os outros projetos leem.
- O app Streamlit e o upload para o Supabase sairam em 17/10/2026 (historico do git ate `a54d10d`);
  nao os recrie sem pedido.

## Versao React (`web/`)

- Mantem a estrutura do antigo app Streamlit (seis paginas, filtros na lateral, tres abas no
  Dashboard), os mesmos dados e as mesmas regras de ranking e download; o visual foi
  redesenhado. Cores das dimensoes e dos paises ficam em `web/src/lib/tema.ts` e
  `web/shared/dados.ts`. Ver [web/README.md](web/README.md).
- Le o `cei` apenas por `web/scripts/gerar_dados.py` (somente leitura) e nunca escreve.
- Tem testes: `npm test` em `web/`. Antes de publicar, rode tambem `npm run build`.
- O `Dockerfile` e o `railway.json` da raiz publicam a versao React no servico do Railway,
  no mesmo endereco. Push para a branch do servico e publicacao
  externa: so com pedido. E-mails pelo SMTP do Gmail, com as variaveis do Railway.
