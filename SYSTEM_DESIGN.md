# Last-Mile Delivery Tracker - System Design

## 1. Overview
The Last-Mile Delivery Tracker is a comprehensive logistics management platform designed to automate and streamline the delivery lifecycle. It supports role-based access control, real-time pricing calculation based on physical dimensions and zones, automated agent assignment, and real-time tracking with status overrides.

## 2. Architecture Diagram & Tech Stack
The application follows a **Modular Monolith** architecture with clear separation of concerns (Controllers, Services, Repositories).

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query v5, shadcn/ui.
- **Backend**: Node.js 18+, Express 5, TypeScript, Prisma ORM, PostgreSQL.
- **Tools**: Zod for validation, Pino for logging, Swagger for API docs.

## 3. Database Schema
Key models include:
- `User`: Handles authentication and roles (`CUSTOMER`, `AGENT`, `DISPATCHER`, `WAREHOUSE`, `ADMIN`).
- `Order`: Core entity storing delivery addresses, dimensions, calculated price, and status.
- `Assignment`: Links orders to delivery agents with assignment statuses and scores.
- `TrackingEvent`: Immutable logs of an order's status transitions.
- `Zone` & `Area`: Spatial definitions for pricing calculation.
- `RateCard`: Defines pricing tiers based on zones, dimensions, and weights.
- `StatusOverrideLog`: Audits manual status overrides performed by administrators.

## 4. Key Workflows

### Order Creation & Pricing
1. Customers or Admins input pickup and drop locations, and package dimensions.
2. The Frontend queries the Pricing API (`/api/v1/pricing/calculate`) to present a quote.
3. Upon confirmation, the Backend persists the Order and an initial `TrackingEvent`.
4. Pricing relies on calculating the **Volumetric Weight** vs. **Actual Weight**, selecting the highest (**Billable Weight**), and looking up the relevant Rate Card (`BASE`, `PER_KG`, `FLAT`, etc.).

### Agent Assignment
- **Auto-Assignment**: Ranks available agents based on current capacity and matching criteria. 
- **Manual Assignment**: Admins/Dispatchers can assign specific orders to specific agents overriding the automated logic.

### Tracking and Status Management
- State transitions (`PENDING` -> `ASSIGNED` -> `PICKED_UP` -> `IN_TRANSIT` -> `DELIVERED`).
- Admins can override the tracking flow, logging the manual intervention in the `StatusOverrideLog` table.
- Email and mocked SMS notifications are dispatched upon critical state changes.

## 5. Security & Access Control
- **JWT Authentication**: Short-lived access tokens via `Authorization: Bearer <token>`.
- **RBAC**: Middleware functions restrict endpoint execution (e.g., `requireRole("ADMIN")`).
- **Data Scoping**: Customers can only view their own orders; Agents can only view assigned orders; Admins can view and override all.

## 6. Deployment
- **Backend Deployment**: Ready for platforms like Render or Railway. Configuration via `render.yaml`.
- **Frontend Deployment**: Configured for Vercel with SPA routing rewrites via `vercel.json`.

## 7. Version 2.0 Upgrade Enhancements

### 7.1. Intelligent Pricing Engine
- Enforces zone-based billing (`INTRA_ZONE`, `INTER_ZONE`) matching specific order types (`B2B`, `B2C`) and billable weights.
- Incorporates extra weight fees using `perUnitPrice` for weights exceeding the matched rate card's `maxWeight`.
- Degrades gracefully to Google Road/Haversine distance-based pricing if zones are missing, setting the `pricingSource` property to `fallback_distance`.

### 7.2. Gmail-based OTP Verification
- Replaces link-based registration activation with a 6-digit OTP mail verification flow.
- Enforces an email-scoped 60-second cooldown rate limit on resending verification codes.

### 7.3. Transactional Notifications & Auditing
- Dispatches transactional updates to both customers (status, updates, rescheduling) and agents (assignments, cancellations, de-assignment, admin overrides) via SMTP.
- Logs all outgoing Email and SMS alerts to the `Notification` table to maintain a detailed message dispatch audit history.

### 7.4. Dynamic Agent Assignment
- Sets a 90-second response deadline (`respondByAt`) on new assignments which start in `PENDING` state.
- Supports active accept/reject actions for agents. Rejections or timeout expirations trigger automatic reassignment.
- Incorporates a 3x search radius expansion fallback (base -> 2x -> 3x) during auto-assignment.
- Applies a -50 point penalty to stale agents (>5 minutes last seen) and excludes them from auto-assignments.
- Reverts orders to the `PENDING` queue if no suitable online agent is found, alerting administrators.
- Triggers zone saturation alerts if more than 80% of active zone agents are at capacity.

### 7.5. Twilio SMS Integration
- Replaces mock logger SMS dispatches with a production-ready Twilio client, falling back cleanly to log files if configuration keys are missing.
