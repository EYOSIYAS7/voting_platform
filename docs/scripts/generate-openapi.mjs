import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const openapi = createOpenAPI({
  input: {
    api: path.resolve(__dirname, '../openapi.json'),
  },
});

await generateFiles({
  input: openapi,
  output: path.resolve(__dirname, '../content/docs/api'),
  per: 'tag',
});

console.log('API documentation generated successfully in content/docs/api');
