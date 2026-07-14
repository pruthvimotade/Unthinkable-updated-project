# 🚀 Deployment Guide

## Last-Mile Delivery Tracker

---

# 📖 Overview

This guide explains how to set up and run the Last-Mile Delivery Tracker locally and deploy it to production.

The application consists of three major components:

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma |

---

# 🛠 Prerequisites

Install the following software before starting:

| Software | Version |
|----------|----------|
| Node.js | 18+ |
| npm | Latest |
| PostgreSQL | 16+ |
| Git | Latest |

Verify installation

```bash
node -v
npm -v
psql --version
```

---

# 📂 Clone Repository

```bash
git clone https://github.com/pruthvimotade/Unthinkable-updated-project.git

cd Unthinkable-updated-project
```

---

# 📦 Backend Setup

Navigate to backend

```bash
cd backend
```

Install dependencies

```bash
npm install
```

---

# ⚙️ Environment Variables

Create

```
backend/.env
```

Example

```env
DATABASE_URL="postgresql://username:password@localhost:5432/logistics_db"

PORT=4000

JWT_SECRET=your-secret

JWT_REFRESH_SECRET=your-refresh-secret

FRONTEND_URL=http://localhost:5173

GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_API_KEY

SMTP_HOST=smtp.gmail.com

SMTP_PORT=587

SMTP_USER=example@gmail.com

SMTP_PASS=YOUR_APP_PASSWORD
```

---

# 🗄 Database Setup

Generate Prisma Client

```bash
npx prisma generate
```

Run migrations

```bash
npx prisma migrate deploy
```

For development

```bash
npx prisma migrate dev
```

Seed the database

```bash
npm run seed
```

---

# ▶️ Run Backend

```bash
npm run dev
```

Server starts on

```
http://localhost:4000
```

Swagger

```
http://localhost:4000/docs
```

---

# 💻 Frontend Setup

Open another terminal

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Create

```
frontend/.env
```

Example

```env
VITE_API_URL=http://localhost:4000/api/v1

VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY
```

Run frontend

```bash
npm run dev
```

Application

```
http://localhost:5173
```

---

# 🌍 Production Deployment

## Backend (Render)

1. Create a Render Web Service
2. Connect GitHub repository
3. Root Directory

```
backend
```

Build Command

```bash
npm install && npm run build
```

Start Command

```bash
npm start
```

Environment Variables

```
DATABASE_URL

JWT_SECRET

JWT_REFRESH_SECRET

SMTP_HOST

SMTP_PORT

SMTP_USER

SMTP_PASS

GOOGLE_MAPS_API_KEY

FRONTEND_URL
```

---

## Frontend (Vercel)

Import GitHub Repository

Root Directory

```
frontend
```

Framework

```
Vite
```

Build Command

```bash
npm run build
```

Output Directory

```
dist
```

Environment Variables

```
VITE_API_URL

VITE_GOOGLE_MAPS_API_KEY
```

---

# 🗄 PostgreSQL

The production database can be hosted on

- Render PostgreSQL
- Railway
- Neon
- Supabase

Update

```
DATABASE_URL
```

accordingly.

---

# 📧 Email Notifications

The system uses SMTP for transactional email notifications.

Supported providers

- Gmail App Password
- Brevo SMTP
- SendGrid SMTP

Email notifications are triggered when:

- Order Created
- Agent Assigned
- Picked Up
- In Transit
- Out for Delivery
- Delivered
- Failed
- Rescheduled

---

# 🔑 Default Credentials (Development)

> ⚠️ **Do not include real passwords in a public repository.**

Example format:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | ******** |
| Agent | agent@example.com | ******** |
| Customer | customer@example.com | ******** |

If you seed sample data, update these credentials accordingly.

---

# 📂 Project Structure

```
Unthinkable-updated-project

backend/

frontend/

docs/

screenshots/

README.md

SYSTEM_DESIGN.md

DATABASE_SCHEMA.md

RATE_CALCULATION.md

API_DOCUMENTATION.md

DEPLOYMENT.md

FEATURES.md
```

---

# 🐞 Troubleshooting

## Prisma Client Error

```bash
npx prisma generate
```

---

## Migration Failed

```bash
npx prisma migrate reset
```

---

## Seed Error

```bash
npm run seed
```

---

## Port Already in Use

Backend

```bash
PORT=4001
```

Frontend

```bash
5174
```

---

## Build Errors

Delete

```
node_modules
```

and

```
package-lock.json
```

then

```bash
npm install
```

---

# ✅ Deployment Checklist

- Backend deployed successfully
- Frontend deployed successfully
- PostgreSQL connected
- Prisma migrations executed
- Seed data inserted
- Email notifications configured
- Google Maps API configured
- Swagger available
- Authentication working
- Order creation working

---

# 🎉 Application URLs

| Service | URL |
|---------|-----|
| Frontend | https://YOUR-VERCEL-URL.vercel.app |
| Backend | https://YOUR-RENDER-URL.onrender.com |
| Swagger | https://YOUR-RENDER-URL.onrender.com/docs |
