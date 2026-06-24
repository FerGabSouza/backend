// backend/test/utils/setup-env.ts
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carrega variáveis do arquivo .env.test da raiz do backend
dotenv.config({
  path: resolve(__dirname, '..', '.env.test'),
});
