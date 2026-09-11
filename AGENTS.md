# Instrucoes — INDICE-COMPLEXIDADE

App de indice de complexidade institucional. Le e escreve no banco `cei`
(`indice_complexidade_institucional`), e tambem consome o **Supabase**.

`app.py` e a aplicacao; `db.py` cuida da conexao. Ha `Procfile`, entao roda hospedado.

## O que nao pode acontecer

- **Nao ha teste nenhum neste projeto.** Qualquer mudanca precisa de conferencia manual.
- E o unico dashboard que **escreve** no `cei`. Uma carga errada aqui contamina a base que
  os outros projetos leem.


## Dados compartilhados

Para localizar fontes ou alterar coleta/carga, consulte as seções pertinentes de `C:/Users/rnbirck/PROJETOS/AGENTS.md`. Execute a busca a partir de `C:/Users/rnbirck/PROJETOS`: `python DADOS/coleta/buscar.py <termo>`. Uma tarefa que só consulta dados não autoriza gravar tabelas.
