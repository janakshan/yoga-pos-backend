# Yoga POS Backend

A production-ready Point of Sale (POS) backend system built with **NestJS**, **PostgreSQL**, and **Swagger/OpenAPI**.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL with Docker
docker-compose up -d postgres

# Start development server
npm run start:dev
```

**API Documentation**: http://localhost:3000/api/v1/docs

## 📚 Full Documentation

See [README_SETUP.md](./README_SETUP.md) for complete setup instructions, features, and API documentation.

## 🎯 Features

- ✅ JWT Authentication (with refresh tokens & PIN login)
- ✅ Role-Based Access Control (RBAC)
- ✅ User Management
- ✅ Product Catalog
- ✅ Customer Management
- ✅ Inventory Tracking
- ✅ Multi-branch Support
- ✅ Interactive Swagger Documentation
- ✅ Docker Support

## 🛠️ Tech Stack

- **NestJS** - Progressive Node.js framework
- **PostgreSQL** - Relational database
- **TypeORM** - ORM with migrations
- **Swagger/OpenAPI** - API documentation
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **class-validator** - Request validation

## 📋 Project Status

**Core modules implemented:**
- Auth, Users, Roles, Permissions ✅
- Branches, Products, Customers, Inventory ✅

**Business modules (ready to extend):**
- POS, Invoices, Payments, Expenses ⚙️
- Suppliers, Purchase Orders ⚙️

See `/documentations` folder for detailed API specifications.

---

Built with ❤️ using NestJS, PostgreSQL, and TypeScript
