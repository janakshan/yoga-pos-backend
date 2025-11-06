# Yoga POS Backend - NestJS + PostgreSQL + Swagger

A production-ready Point of Sale (POS) backend system built with NestJS, PostgreSQL, and comprehensive Swagger documentation.

## 🚀 Features

- **Modern Tech Stack**: NestJS, PostgreSQL, TypeORM, Swagger/OpenAPI
- **Authentication**: JWT-based authentication with refresh tokens, PIN login support
- **Authorization**: Role-Based Access Control (RBAC) with granular permissions
- **Database**: PostgreSQL with TypeORM migrations
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Validation**: Request validation using class-validator
- **Security**: Rate limiting, CORS, secure password hashing
- **Docker**: Full Docker Compose setup for development
- **Testing**: Jest configuration for unit and e2e tests

## 📋 Modules Implemented

### Core Modules
- ✅ **Authentication** - Login, Register, JWT, Refresh Tokens, PIN Login
- ✅ **Users** - User management with roles and permissions
- ✅ **Roles** - Role management system
- ✅ **Permissions** - Granular permission system
- ✅ **Branches** - Multi-branch support
- ✅ **Products** - Product catalog with categories, variants, pricing tiers
- ✅ **Customers** - Customer management with loyalty programs
- ✅ **Inventory** - Stock tracking and management

### Business Modules (Skeleton - Ready to extend)
- ⚙️ **POS** - Point of Sale transactions
- ⚙️ **Invoices** - Invoice management
- ⚙️ **Payments** - Payment processing
- ⚙️ **Expenses** - Expense tracking
- ⚙️ **Suppliers** - Supplier management
- ⚙️ **Purchase Orders** - Purchase order management

## 🛠️ Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x
- **PostgreSQL** >= 14.x (or use Docker)
- **Docker** (optional, for containerized development)

## ⚡ Quick Start

### 1. Clone and Install

\`\`\`bash
# Navigate to project directory
cd yoga-pos-backend

# Install dependencies
npm install
\`\`\`

### 2. Environment Configuration

\`\`\`bash
# Copy environment example
cp .env.example .env

# Edit .env with your configuration
nano .env
\`\`\`

**Key environment variables:**
\`\`\`env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=yoga_pos_db

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this

# Application
PORT=3000
NODE_ENV=development
\`\`\`

### 3. Database Setup

**Option A: Using Docker (Recommended)**

\`\`\`bash
# Start PostgreSQL and pgAdmin with Docker Compose
docker-compose up -d postgres pgadmin

# Wait for PostgreSQL to initialize (5-10 seconds)

# Run migrations
npm run migration:run
\`\`\`

**Option B: Local PostgreSQL**

\`\`\`bash
# Create database
createdb yoga_pos_db

# Run migrations
npm run migration:run
\`\`\`

### 4. Start Development Server

\`\`\`bash
# Start in development mode with hot reload
npm run start:dev
\`\`\`

The API will be available at:
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/v1/docs
- **Health Check**: http://localhost:3000/api/v1/health

### 5. Access pgAdmin (if using Docker)

- **URL**: http://localhost:5050
- **Email**: admin@yoga-pos.com
- **Password**: admin

Add PostgreSQL server:
- **Host**: postgres
- **Port**: 5432
- **Username**: postgres
- **Password**: postgres
- **Database**: yoga_pos_db

## 📚 API Documentation

Interactive API documentation is available at `/api/v1/docs` when the server is running.

### Quick Test with cURL

\`\`\`bash
# Health Check
curl http://localhost:3000/api/v1/health

# Register User
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
\`\`\`

## 🗄️ Database Operations

### Migrations

\`\`\`bash
# Generate a new migration
npm run migration:generate -- src/database/migrations/MigrationName

# Create an empty migration
npm run migration:create -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
\`\`\`

### Seeds

\`\`\`bash
# Run database seeds
npm run seed
\`\`\`

## 🐳 Docker Commands

\`\`\`bash
# Start all services
docker-compose up -d

# Start only database
docker-compose up -d postgres

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove all containers and volumes (WARNING: Deletes data!)
docker-compose down -v
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
\`\`\`

## 📦 Build for Production

\`\`\`bash
# Build the application
npm run build

# Start production server
npm run start:prod
\`\`\`

## 📝 Project Structure

\`\`\`
yoga-pos-backend/
├── src/
│   ├── common/                 # Shared utilities
│   │   ├── decorators/         # Custom decorators
│   │   ├── dto/                # Common DTOs
│   │   ├── filters/            # Exception filters
│   │   ├── guards/             # Auth & permission guards
│   │   └── interceptors/       # Response interceptors
│   ├── config/                 # Configuration files
│   ├── database/               # Database config & migrations
│   ├── modules/                # Feature modules
│   │   ├── auth/               # Authentication
│   │   ├── users/              # User management
│   │   ├── roles/              # Role management
│   │   ├── permissions/        # Permission management
│   │   ├── branches/           # Branch management
│   │   ├── products/           # Product catalog
│   │   ├── customers/          # Customer management
│   │   ├── inventory/          # Inventory tracking
│   │   └── ...                 # Other modules
│   ├── app.module.ts           # Root module
│   └── main.ts                 # Application entry point
├── test/                       # Test files
├── docker-compose.yml          # Docker Compose config
├── Dockerfile                  # Docker build config
├── .env.example                # Environment template
└── package.json                # Dependencies
\`\`\`

## 🔐 Authentication

### JWT Authentication

All protected endpoints require a Bearer token:

\`\`\`bash
# Include in request header
Authorization: Bearer <your-jwt-token>
\`\`\`

### Available Auth Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/login/pin` - Login with PIN
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user
- `POST /auth/pin/set` - Set PIN for user
- `POST /auth/pin/disable` - Disable PIN

## 🔑 Default Roles & Permissions

The system implements RBAC (Role-Based Access Control):

- **admin** - Full system access
- **manager** - Branch management, reports
- **staff** - Basic POS operations
- **instructor** - Class and customer management

## 🚦 Rate Limiting

Default rate limits:
- **Authenticated requests**: 1000 requests/hour
- **Unauthenticated requests**: 100 requests/hour

## 📊 Monitoring & Logging

### Health Check Endpoint

\`\`\`bash
GET /api/v1/health
\`\`\`

Response:
\`\`\`json
{
  "status": "healthy",
  "uptime": 1234.56,
  "timestamp": "2025-11-06T10:00:00.000Z",
  "environment": "development"
}
\`\`\`

## 🐛 Troubleshooting

### Database Connection Issues

\`\`\`bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
\`\`\`

### Port Already in Use

\`\`\`bash
# Change port in .env file
PORT=3001

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
\`\`\`

### Module Not Found Errors

\`\`\`bash
# Clean install
rm -rf node_modules package-lock.json
npm install
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues and questions:
- Check the [API Documentation](http://localhost:3000/api/v1/docs)
- Review the `/documentations` folder for detailed feature specs
- Open an issue on GitHub

## 🎯 Next Steps

After setup, you can:

1. **Explore the API**: Visit http://localhost:3000/api/v1/docs
2. **Create test data**: Use Swagger UI to create users, products, etc.
3. **Extend modules**: Implement the skeleton modules (POS, Invoices, etc.)
4. **Add business logic**: Customize for your specific needs
5. **Deploy**: Use Docker for production deployment

## 🔗 Related Documentation

- [API Documentation](./documentations/API_DOCUMENTATION.md)
- [Features Documentation](./documentations/FEATURES.md)
- [Product Management](./documentations/PRODUCT_MANAGEMENT_FEATURES.md)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)

---

**Built with ❤️ using NestJS, PostgreSQL, and TypeScript**
