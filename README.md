::: {align="center"}
# 🚚 Last-Mile Delivery Tracker

**A production-inspired logistics management platform built with React,
TypeScript, Express, Prisma and PostgreSQL.**

Dynamic pricing • Zone-aware routing • Smart agent assignment • Live
tracking • Role-based access control

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](#)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](#)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](#)

### 🔗 Quick Links

**Frontend:** https://unthinkable-updated-project.vercel.app/

**Backend API:** https://unthinkable-updated-project.onrender.com

**Swagger:** https://unthinkable-updated-project.onrender.com/api-docs

**Documentation:** [API Documentation](./API_DOCUMENTATION.md) •
[Database Schema](./DATABASE_SCHEMA.md) • [Rate
Calculation](./RATE_CALCULATION.md) • [Deployment](./DEPLOYMENT.md) •
[System Design](./SYSTEM%20Design.md)
:::

------------------------------------------------------------------------

# Overview

Last-Mile Delivery Tracker is a full-stack logistics platform designed
to simulate how modern courier companies manage deliveries. Instead of
focusing only on CRUD operations, the project implements configurable
pricing rules, intelligent order assignment, shipment tracking,
role-based authentication, and operational dashboards.

The application supports three user roles:

-   Customer
-   Delivery Agent
-   Administrator

Each role has dedicated authentication, dashboards, permissions, and
workflows.

------------------------------------------------------------------------

# Features

## Customer

-   Register/Login
-   Google Maps address autocomplete
-   Create delivery orders
-   Automatic shipping cost calculation
-   Track orders
-   Email notifications
-   Order history

## Administrator

-   Analytics dashboard
-   Manage customers
-   Manage agents
-   Manage zones & service areas
-   Configure pricing rate cards
-   Create orders
-   Manual & automatic assignment
-   Override order status
-   Search & filter orders

## Delivery Agent

-   Secure login
-   Assigned deliveries
-   Accept assignments
-   Update delivery status
-   Delivery history

------------------------------------------------------------------------

# Pricing Engine

The shipping engine calculates charges using:

1.  Actual weight
2.  Volumetric weight
3.  Zone classification
4.  Rate card lookup
5.  COD surcharge (if applicable)

Chargeable Weight = max(Actual Weight, Volumetric Weight)

Volumetric Weight = (Length × Width × Height) / 5000

Admins can modify pricing without changing application code.

------------------------------------------------------------------------

# Agent Assignment

Orders may be assigned:

-   Manually by administrators
-   Automatically using availability, assigned zone and workload

------------------------------------------------------------------------

# Order Lifecycle

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

Failed deliveries can be reassigned while preserving a complete tracking
history.

------------------------------------------------------------------------

# Tech Stack

## Frontend

-   React
-   TypeScript
-   Vite
-   React Router
-   Tailwind CSS
-   React Hook Form
-   Axios

## Backend

-   Node.js
-   Express.js
-   TypeScript
-   Prisma ORM
-   JWT
-   Zod
-   Bcrypt
-   Nodemailer

## Database

-   PostgreSQL

## Deployment

-   Vercel
-   Render

------------------------------------------------------------------------

# Project Structure

``` text
Unthinkable-updated-project/
│
├── backend/
├── frontend/
├── Engineering/
├── docs/
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

------------------------------------------------------------------------

# Installation

``` bash
git clone https://github.com/pruthvimotade/Unthinkable-updated-project.git

cd Unthinkable-updated-project
```

Backend

``` bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Frontend

``` bash
cd frontend
npm install
npm run dev
```

------------------------------------------------------------------------

# Environment Variables

``` env
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

------------------------------------------------------------------------

# Documentation

-   API Documentation → ./API_DOCUMENTATION.md
-   Database Schema → ./DATABASE_SCHEMA.md
-   Deployment Guide → ./DEPLOYMENT.md
-   Rate Calculation → ./RATE_CALCULATION.md
-   System Design → ./System Design.md

------------------------------------------------------------------------

# Future Improvements

-   SMS OTP Authentication
-   Real-time GPS Tracking
-   Route Optimization
-   Payment Gateway
-   Mobile App
-   Push Notifications
-   Driver Analytics
-   Delivery Heatmaps

------------------------------------------------------------------------

# Author

**Pruthviraj Motade**

Computer Engineering • Vishwakarma Institute of Technology, Pune

GitHub: https://github.com/pruthvimotade

LinkedIn: https://www.linkedin.com/in/pruthvimotade/

------------------------------------------------------------------------

# License

MIT
