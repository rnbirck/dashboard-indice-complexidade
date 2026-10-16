# Railway: o painel React (web/) no lugar do app Streamlit, no mesmo serviço e no mesmo endereço.
# O build roda os testes; a imagem final leva só o site (dist/) e o servidor (dist-server/), sem node_modules.
FROM node:24.16-slim AS build
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm test && npm run build

FROM node:24.16-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
USER node
EXPOSE 8080
CMD ["node", "dist-server/iniciar.js"]
