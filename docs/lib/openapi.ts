import { createOpenAPI } from 'fumadocs-openapi/server';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openapiPath = path.resolve(__dirname, '../openapi.json');

export const openapi = createOpenAPI({
  input: {
    api: openapiPath,
  },
});
