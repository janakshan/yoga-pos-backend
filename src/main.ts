import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get('app.apiPrefix');
  app.setGlobalPrefix(apiPrefix);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get('app.corsOrigin'),
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Yoga POS API')
    .setDescription(
      'Complete API documentation for the Yoga POS system covering all features, endpoints, request/response formats, and data types.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Authentication and authorization endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Roles', 'Role and permission management')
    .addTag('Branches', 'Branch management endpoints')
    .addTag('Products', 'Product catalog and management')
    .addTag('Customers', 'Customer management and loyalty')
    .addTag('Inventory', 'Inventory tracking and management')
    .addTag('POS', 'Point of Sale transactions')
    .addTag('Invoices', 'Invoice management')
    .addTag('Payments', 'Payment processing')
    .addTag('Expenses', 'Expense tracking')
    .addTag('Suppliers', 'Supplier management')
    .addTag('Purchase Orders', 'Purchase order management')
    .addTag('Reports', 'Business reports generation')
    .addTag('Analytics', 'Analytics and insights')
    .addTag('Export', 'Data export functionality')
    .addTag('Notifications', 'Notification system')
    .addTag('Backup', 'Backup and recovery')
    .addTag('Settings', 'Application settings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Yoga POS API Documentation',
  });

  const port = configService.get('app.port');
  await app.listen(port);

  console.log(`\n🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs\n`);
}

bootstrap();
