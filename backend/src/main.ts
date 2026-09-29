import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin:      process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // ── Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Validation ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:        true,   // strip unknown properties
      forbidNonWhitelisted: true,
      transform:        true,   // auto-transform payloads to DTO class instances
    }),
  );

  // ── Swagger ──────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Organizational Voting Platform API')
    .setDescription(
      'Secure internal voting platform — Organization · Elections · Blockchain',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // ── Start ────────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`\n🚀 Backend running at: http://localhost:${port}/api`);
  console.log(`📖 Swagger docs at:    http://localhost:${port}/api/docs\n`);
}

await bootstrap();
