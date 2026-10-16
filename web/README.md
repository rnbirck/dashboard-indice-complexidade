# Índice de Complexidade — versão React

Versão React + Vite do app Streamlit (`../app.py`), sem Supabase. Os dados vão
embutidos no build como JSON estático. Um servidor Node pequeno entrega o site e recebe
os formulários **Contact Us** e **Data Download**, que enviam e-mail pelo SMTP do Gmail
com as mesmas variáveis do app Streamlit. Roda no mesmo serviço do Railway e no mesmo
endereço (https://institutionalcomplexityindex.up.railway.app/).

Mantém a estrutura do original (as seis páginas, os filtros na lateral e as abas Index
Evolution, Country Comparison e Radar Chart), os mesmos dados, as mesmas regras de
ranking (`rank(ascending=False, method="min")`) e os mesmos arquivos de download (CSV e
Excel conferidos contra a saída do pandas). O visual foi redesenhado para ser mais
compacto:

- A lateral de filtros começa aberta, como no original; só no celular começa fechada,
  porque ali ela cobre a página. O menu de páginas fica logo depois do nome do painel.
- Cada dimensão tem uma cor fixa em todas as páginas, também em tom claro no fundo dos
  cartões dela; o azul do realce marca destaques e o que é clicável; nos gráficos de comparação, cada
  país tem a sua, a mesma na faixa de posições, nas etiquetas do filtro e nas legendas.
- O Dashboard abre com a faixa de posições: onde o país está entre os 109 em cada
  dimensão, com a variação desde o ano anterior e os países comparados na mesma trilha.
  Passar o mouse (ou tocar) numa trilha abre na hora a lista dos países selecionados com
  valor e posição; a legenda de cores acima destaca um país e escreve a posição dele em
  cada linha.
- Gráficos em ECharts (linhas e radar, em SVG), com tooltip, legenda clicável e
  alternância para tabela em cada gráfico. Nas linhas, o último valor vem rotulado
  ("Latest"); "Every year" rotula todos os pontos com duas casas, como no original. Passar o
  mouse numa linha mostra os valores de todos os anos dela. As dicas mostram seis casas,
  como no original; o radar tem a escala de 0 a 100 no eixo de cima.
- No radar sobreposto, o país principal fica por cima e responde ao mouse; a tabela ao
  lado mostra os valores, destaca um país no radar ao passar o mouse e esconde ou mostra
  ao clicar.
- A comparação aceita até 7 países além do principal, o limite da paleta validada para
  daltonismo.
- Página e filtros ficam na URL (`?page=Dashboard&country=Brazil&compare=Chile,Germany&years=2018-2023`),
  então um link abre a mesma visão.

## Estrutura

- `src/`: páginas (`pages/`), componentes (`components/`), tokens dos gráficos
  (`lib/tema.ts`), ECharts reduzido (`lib/echarts.ts`), estilos (`styles.css`) e
  `data/indice.json`, gerado do Postgres.
- `shared/`: dados, ranking, geração de CSV/Excel e textos dos e-mails, usados pelo
  navegador e pelo servidor.
- `server/`: o servidor do Railway. `servidor.ts` entrega o site e as rotas
  `/api/contact` e `/api/download` (com checagem de origem e limite de 10 envios por
  endereço a cada 10 minutos); `formularios.ts` valida os pedidos e monta os e-mails e o
  anexo a partir do mesmo JSON; `envio.ts` faz o SMTP com nodemailer; `iniciar.ts` é a
  entrada (`node dist-server/iniciar.js`).
- `../Dockerfile`, `../railway.json` e `../.dockerignore`: o build do Railway. A imagem
  roda os testes, faz o build e leva só `dist/` e `dist-server/` (o servidor é um arquivo
  único, sem `node_modules`).
- `scripts/gerar_dados.py`: lê `cei.indice_complexidade_institucional` (só leitura) e
  grava `src/data/indice.json`.

## Comandos

```bash
npm install
npm run dados:gerar   # atualiza src/data/indice.json a partir do Postgres local
npm test              # ranking, arquivos, textos dos e-mails e servidor
npm run dev           # site em http://127.0.0.1:5173 (sem envio de e-mail)
npm run build         # site em dist/ e servidor em dist-server/
npm run local         # build + servidor completo em http://127.0.0.1:8080 (PORT muda a porta)
```

Para testar o envio sem mandar e-mail de verdade, rode o servidor com `SMTP_SERVER` e
`SMTP_PORT` apontando para um SMTP local de teste.

## Publicação no Railway

O serviço do Railway que hoje roda o Streamlit passa a construir o `Dockerfile` da raiz
(indicado no `railway.json`), no mesmo endereço. Um push para a branch que o serviço
acompanha publica a nova versão; o Railway só troca quando `/healthz` responde. Para
voltar ao Streamlit, use "Redeploy" numa implantação anterior no painel do Railway, ou
reverta o commit.

As variáveis são as mesmas que o serviço já tem:

| Variável | Uso |
|---|---|
| `SMTP_SERVER` | opcional; padrão `smtp.gmail.com` |
| `SMTP_PORT` | opcional; padrão `587` (STARTTLS); `465` usa TLS direto |
| `SENDER_EMAIL` | conta do Gmail que envia, também o remetente |
| `SENDER_PASSWORD` | senha de app do Gmail |
| `ADMIN_EMAIL` | recebe as notificações de contato e de download |
| `ADDITIONAL_NOTIFICATION_EMAILS` | opcional; outros destinatários, separados por vírgula |

`PORT` vem do próprio Railway. As variáveis do Supabase deixam de ser usadas. Sem as do
e-mail, os formulários mostram a mesma mensagem do original ("Email configuration not
found").

## Atualizar os dados

Quando a tabela `indice_complexidade_institucional` do `cei` mudar, rode
`npm run dados:gerar`, confira o diff de `src/data/indice.json`, rode `npm test`, faça o
commit e o push. Não há mais upload para o Supabase.

## Diferenças conhecidas em relação ao original

- Se o SMTP falhar, a mensagem diz "the email could not be sent" em vez do erro técnico
  do servidor de e-mail; o detalhe fica no log do Railway.
- Há um limite de 10 envios por endereço a cada 10 minutos, para que o formulário não
  seja usado para disparar e-mails pela conta do Gmail.
- Se o envio do download falhar, os botões de download direto funcionam. No original,
  `st.download_button` dentro de `st.form` gerava erro.
- O botão de envio fica desabilitado enquanto o e-mail é enviado.
- Layout e textos de interface redesenhados (mesmo conteúdo). A Home citava download
  em JSON, que não existe; agora diz CSV ou Excel. Em Authors, as fotos de exemplo
  (serviço desativado) viraram iniciais.
- O sinal da variação de posição foi invertido na leitura: "Up 6" quando o país subiu
  seis posições (no original, "-6").
- As linhas começam com só o último valor rotulado (no original, todos os pontos). Em
  "Every year", os rótulos que colidiriam são escondidos (o Plotly os sobrepunha); o
  valor continua na dica e na tabela.
- A comparação aceita até 7 países (no original, sem limite). No radar lado a lado, três
  países ficam numa linha só (no original, 2 + 1).

## Conferência com o original (16/10/2026)

- Dados: o JSON é idêntico à tabela do Supabase lida pelo Streamlit e ao Postgres `cei`
  (981 linhas, 109 países, 2015–2023, mesmos valores e mesma ordem).
- Ranking: as 5.886 posições (país × ano × índice) iguais ao `rank(ascending=False,
  method="min")` do pandas; variações conferidas em Brazil 2015–2023 e Germany 2016–2020.
- Arquivos: CSV byte a byte igual ao do pandas (fim de linha do Linux, como no Railway) e
  Excel com a mesma aba, colunas e valores, inclusive os anexos enviados pelas funções.
- E-mails: destinatários, assuntos, ordem de envio, corpos, acentos e anexos conferidos
  com um SMTP local com STARTTLS e login, nos casos de sucesso, validação, falha e sem
  configuração. A imagem Docker foi construída e testada localmente.
- Interface: todas as páginas, botões, filtros (limite, troca e limpeza do país), abas,
  seletores de índice, ano e modo, e a alternância gráfico/tabela.
