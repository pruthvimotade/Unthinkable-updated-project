# System Architecture

## Version

1.0

---

# Architecture Style

The application follows a **Modular Monolith** architecture using Feature-Based Design.

The application is divided into independent business modules that communicate through well-defined services while sharing a single codebase and PostgreSQL database.

This approach provides:

- Simple deployment
- Easy maintenance
- Clear separation of concerns
- Scalability for future microservice migration

---

# High Level Architecture

```
                    React Frontend
                           │
                           ▼
                    REST API (Express)
                           │
                    Authentication Layer
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
      Customer          Delivery         Administrator
                           │
         └─────────────────┼─────────────────┘
                           ▼
                   Business Modules
                           │
 ┌──────────┬──────────┬──────────┬──────────┬──────────┐
 ▼          ▼          ▼          ▼          ▼
Auth      Orders    Pricing   Assignment  Tracking
                           │
                           ▼
                  Notification Service
                           │
                           ▼
                     PostgreSQL Database
```

---

# Core Modules

## Authentication Module

Responsible for:

- Login
- Registration
- JWT Authentication
- Authorization
- Password Encryption

---

## Customer Module

Responsible for:

- Customer Profile
- Order History
- Order Tracking

---

## Order Module

Responsible for:

- Order Creation
- Quote Generation
- Order Details

---

## Pricing Module

Responsible for:

- Weight Calculation
- Zone Detection
- Rate Lookup
- COD Charges
- Final Pricing

---

## Assignment Module

Responsible for:

- Agent Discovery
- Agent Scoring
- Capacity Validation
- Automatic Assignment
- Manual Assignment

---

## Tracking Module

Responsible for:

- Order Timeline
- Tracking History
- Status Validation
- Event Logging

---

## Notification Module

Responsible for:

- Email Notifications
- SMS Integration (Future)
- Notification Logs

---

## Admin Module

Responsible for:

- Zone Management
- Area Management
- Rate Cards
- COD Configuration
- User Management
- Delivery Partner Management

---

# Request Lifecycle

Customer Request

↓

Authentication

↓

Validation

↓

Business Logic

↓

Database

↓

Response

---

# Technology Stack

Backend

- Node.js
- Express
- TypeScript

Frontend

- React
- Vite
- Tailwind CSS
- TanStack Query

Database

- PostgreSQL

ORM

- Prisma

Authentication

- JWT
- bcrypt

Validation

- Zod

Documentation

- Swagger

Logging

- Pino

Deployment

- Render
- Vercel

---

# Design Principles

The system follows:

- Feature-based architecture
- Separation of concerns
- Configuration over hardcoding
- SOLID principles
- Immutable tracking history
- Modular business engines
- Database-first design