import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import * as fs from 'fs';
import * as path from 'path';

async function generateSwagger() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Organizational Voting Platform API')
    .setDescription(
      'Secure internal voting platform — Organization · Elections · Blockchain',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const outDir = path.resolve(process.cwd(), '../docs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(outDir, 'openapi.json'),
    JSON.stringify(document, null, 2),
  );
  console.log('Successfully exported openapi.json to', path.join(outDir, 'openapi.json'));
  await app.close();
  process.exit(0);
}

generateSwagger().catch((err) => {
  console.error('Error generating Swagger spec:', err);
  process.exit(1);
});

