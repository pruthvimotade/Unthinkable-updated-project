# 🚚 Last-Mile Delivery Tracker

A production-inspired logistics management platform built with React, TypeScript, Express, Prisma and PostgreSQL.

**Dynamic pricing • Zone-aware routing • Smart agent assignment • Live tracking • Role-based access control**

---

## 🔗 Quick Links

- **Frontend:** https://unthinkable-updated-project.vercel.app/
- **Backend API:** https://unthinkable-updated-project.onrender.com
- **Swagger:** https://unthinkable-updated-project.onrender.com/api-docs
- **Documentation:** [API Documentation](https://github.com/pruthvimotade/Unthinkable-updated-project/blob/main/API_DOCUMENTATION.md) • [Database Schema](https://github.com/pruthvimotade/Unthinkable-updated-project/blob/main/DATABASE_SCHEMA.md) • [Rate Calculation](https://github.com/pruthvimotade/Unthinkable-updated-project/blob/main/RATE_CALCULATION.md) • [Deployment](https://github.com/pruthvimotade/Unthinkable-updated-project/blob/main/DEPLOYMENT.md) • [System Design](https://github.com/pruthvimotade/Unthinkable-updated-project/blob/main/SYSTEM_DESIGN.md)

---

## 📸 Screenshots

### Landing Page
![Landing Page](docs/screenshots/landing-page.png)
*Public marketing homepage with live platform metrics (total deliveries, active drivers, routing precision, API response time).*

### Customer Portal

| Login | Dashboard |
|---|---|
| ![Customer Login](docs/screenshots/customer-login.png) | ![Customer Dashboard](docs/screenshots/customer-dashboard.png) |

![Create Order](docs/screenshots/create-order.png)
*Order creation flow with pickup/drop address, package dimensions, and real-time price calculation.*

### Admin Console

| Operations Hub | Orders Queue |
|---|---|
| ![Admin Dashboard](docs/screenshots/admin-dashboard.png) | ![Admin Orders Queue](docs/screenshots/admin-orders-queue.png) |

| Rate Cards Manager | Staff Management |
|---|---|
| ![Rate Cards](docs/screenshots/admin-rate-cards.png) | ![Staff Management](docs/screenshots/admin-staff-management.png) |

### Agent Workspace
![Agent Workspace](docs/screenshots/agent-workspace.png)
*Delivery agents accept/reject assignments and track their route stop-by-stop, with live dispatch alerts.*

---

## Overview

Last-Mile Delivery Tracker is a full-stack logistics platform designed to simulate how modern courier companies manage deliveries. Instead of focusing only on CRUD operations, the project implements configurable pricing rules, intelligent order assignment, shipment tracking, role-based authentication, and operational dashboards.

The application supports three user roles:

- Customer
- Delivery Agent
- Administrator

Each role has dedicated authentication, dashboards, permissions, and workflows.

---

## Features

### Customer
- Register/Login
- Google Maps address autocomplete
- Create delivery orders
- Automatic shipping cost calculation
- Track orders
- Email notifications
- Order history

### Administrator
- Analytics dashboard
- Manage customers
- Manage agents
- Manage zones & service areas
- Configure pricing rate cards
- Create orders
- Manual & automatic assignment
- Override order status
- Search & filter orders

### Delivery Agent
- Secure login
- Assigned deliveries
- Accept assignments
- Update delivery status
- Delivery history

---

## Pricing Engine

The shipping engine calculates charges using:

1. Actual weight
2. Volumetric weight
3. Zone classification
4. Rate card lookup
5. COD surcharge (if applicable)

```
Chargeable Weight = max(Actual Weight, Volumetric Weight)
Volumetric Weight = (Length × Width × Height) / 5000
```

Admins can modify pricing without changing application code.

---

## Agent Assignment

Orders may be assigned:

- Manually by administrators
- Automatically using availability, assigned zone and workload

---

## Order Lifecycle

```
Pending
  ↓
Assigned
  ↓
Picked Up
  ↓
In Transit
  ↓
Out for Delivery
  ↓
Delivered
```

Failed deliveries can be reassigned while preserving a complete tracking history.

---

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- React Hook Form
- Axios

**Backend**
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- JWT
- Zod
- Bcrypt
- Nodemailer

**Database**
- PostgreSQL

**Deployment**
- Vercel
- Render

---

## Project Structure

```
Unthinkable-updated-project/
│
├── backend/
├── frontend/
├── Engineering/
├── docs/
│   └── screenshots/
│
├── README.md
├── API_DOCUMENTATION.md
├── DATABASE_SCHEMA.md
├── RATE_CALCULATION.md
├── DEPLOYMENT.md
├── System Design.md
├── package.json
└── package-lock.json
```

---

## Installation

```bash
git clone https://github.com/pruthvimotade/Unthinkable-updated-project.git

cd Unthinkable-updated-project
```

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

```
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_MAPS_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
FRONTEND_URL=
BACKEND_URL=
```

---

## Documentation

- API Documentation → [./API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Database Schema → [./DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- Deployment Guide → [./DEPLOYMENT.md](./DEPLOYMENT.md)
- Rate Calculation → [./RATE_CALCULATION.md](./RATE_CALCULATION.md)
- System Design → [./System Design.md](./System%20Design.md)

---

## Future Improvements

- SMS OTP Authentication
- Real-time GPS Tracking
- Route Optimization
- Payment Gateway
- Mobile App
- Push Notifications
- Driver Analytics
- Delivery Heatmaps

---

## Author

**Pruthviraj Motade**
Computer Engineering • Vishwakarma Institute of Technology, Pune

GitHub: https://github.com/pruthvimotade
LinkedIn: https://www.linkedin.com/in/pruthvimotade/

---

## License

MIT
