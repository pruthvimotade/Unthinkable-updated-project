# Logistics Platform — Backend Infrastructure

This is **infrastructure only**. No business modules (Auth, Orders, etc.),
no APIs, and no Prisma models are implemented. It is the foundation those
features will be built on top of.

## Stack
Node.js · Express 5 · TypeScript · PostgreSQL · Prisma · JWT (lib only) ·
bcrypt (lib only) · Zod · Pino · Swagger · dotenv

## Getting started
```bash
cp .env.example .env      # fill in DATABASE_URL etc.
npm install
npm run prisma:generate
npm run dev                # tsx watch, http://localhost:4000
```

- Health check: `GET /api/v1/health/live`, `GET /api/v1/health/ready`
- API docs: `GET /docs` or `GET /api-docs`

## Folder structure
```
src/
  app.ts                  Express app factory (middleware + route wiring)
  server.ts               HTTP server entrypoint + graceful shutdown
  config/                 Environment, logger, HTTP logger, Swagger setup
  middlewares/             Global error handler, 404 handler, validation middleware
  routes/                 Central route registrar + health check route
  modules/                Empty — one folder per feature module, added later
  lib/                    Shared singletons (Prisma client)
  utils/                  ApiError, asyncHandler
  types/                  Ambient TypeScript declarations
prisma/
  schema.prisma           Datasource + generator only, no models
```

## Adding a feature module later
Create `src/modules/<feature>/` with `*.routes.ts`, `*.controller.ts`,
`*.service.ts`, `*.schema.ts`, then mount its router in `src/routes/index.ts`.
