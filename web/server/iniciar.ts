// Ponto de entrada no Railway: node dist-server/iniciar.js (o build fica ao lado de dist/).
import { fileURLToPath } from 'node:url';
import { criarEnviador } from './envio.ts';
import { criarServidor } from './servidor.ts';

const env = process.env;
const pasta = fileURLToPath(new URL('../dist/', import.meta.url));
const porta = Number(env.PORT || 8080);

const servidor = criarServidor({ pasta, env, enviar: criarEnviador(env) });
servidor.listen(porta, () => console.log(`Servidor no ar na porta ${porta}`));

// O Railway envia SIGTERM ao trocar de versão: termina os pedidos em andamento antes de sair.
process.on('SIGTERM', () => servidor.close(() => process.exit(0)));
