import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  // O preview do Claude atribui a porta pela variável PORT; sem ela vale o padrão do Vite.
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
  build: {
    // O ECharts, reduzido a linhas e radar, fica em arquivo próprio, carregado em segundo plano.
    chunkSizeWarningLimit: 700,
    // A pasta public/ vai só para o site, não para o build do servidor.
    copyPublicDir: !isSsrBuild,
  },
  // Servidor do Railway (vite build --ssr server/iniciar.ts): um arquivo só, com nodemailer e os
  // dados embutidos, que roda sem node_modules.
  ssr: { noExternal: true },
}));
