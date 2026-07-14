# 🏗️ System Design

### Last-Mile Delivery Tracker

---

## Overview

The **Last-Mile Delivery Tracker** is a full-stack logistics management platform designed to automate delivery operations end-to-end — from order creation through to successful delivery. The system is built around four pillars: **configurable pricing**, **intelligent delivery-agent assignment**, **real-time order tracking**, and **automated customer notifications**, all sitting on a scalable, modular backend.

The backend follows a layered, feature-based architecture with clearly separated modules for authentication, order management, pricing, agent assignment, notifications, and administration. This separation lets each module evolve independently, keeping the system maintainable as new business requirements are added.

---

## System Architecture

The application follows a client-server architecture: the frontend communicates **exclusively** through REST APIs exposed by the Express backend. All business logic — pricing rules, assignment decisions, status transitions — lives entirely on the server, so none of it can be manipulated from the client.

```mermaid
flowchart TD
    U["Customer / Admin / Agent"] --> UI["React + TypeScript Frontend"]
    UI -->|REST API| API["Express.js Backend (TypeScript)"]

    API --> AUTH["Authentication"]
    API --> ORD["Order Management"]
    API --> ADM["Administration"]

    AUTH --> PRICE["Pricing Engine"]
    ORD --> PRICE
    PRICE --> ASSIGN["Assignment Engine"]
    ASSIGN --> NOTIF["Notification Service"]

    NOTIF --> ORM["Prisma ORM"]
    ADM --> ORM
    ORM --> DB[("PostgreSQL")]
```

---

## Authentication & Authorization

The system implements **Role-Based Access Control (RBAC)** across three user roles:

| Role | Access |
|---|---|
| **Customer** | Own orders, own tracking history, own profile |
| **Delivery Agent** | Assigned orders, delivery status updates, own delivery history |
| **Administrator** | Full platform visibility — zones, rate cards, agents, all orders |

Authentication is handled via **JWT access tokens**. Passwords are hashed with **bcrypt** before storage — plaintext passwords never touch the database. Middleware validates the JWT on every protected request and authorizes access based on the caller's role, ensuring customers and agents can only ever touch their own resources while administrative operations stay locked down.

---

## Rate Calculation Engine

The pricing engine is fully configurable through the administration panel — **no pricing logic requires a code change or redeploy** to update.

For every order, the engine runs this sequence:

```mermaid
flowchart LR
    A["1. Resolve pickup area"] --> B["2. Resolve drop area"]
    B --> C["3. Identify pickup & drop zones"]
    C --> D["4. Classify: Intra-zone or Inter-zone"]
    D --> E["5. Calculate volumetric weight"]
    E --> F["6. Compare vs. actual weight"]
    F --> G["7. Select chargeable weight = max(actual, volumetric)"]
    G --> H["8. Look up rate card by zone type, order type, weight slab"]
    H --> I["9. Apply COD surcharge if applicable"]
    I --> J["10. Return final shipping cost"]
```

**Volumetric weight formula:**

$$\text{Volumetric Weight} = \frac{\text{Length} \times \text{Breadth} \times \text{Height}}{5000}$$

This modular design means administrators can retune pricing — new weight slabs, new zone rates, new COD surcharges — entirely through configuration, with the application logic untouched.

---

## Zone Detection

Every serviceable location belongs to a predefined **Area**, and every Area is mapped to a logistics **Zone**.

On order creation, the backend resolves the zone for both the pickup and drop address:

- **Same zone** → classified as **Intra-Zone Delivery**
- **Different zones** → classified as **Inter-Zone Delivery**

That classification feeds directly into the rate card lookup, keeping pricing logic decoupled from geography — expanding into a new city is a data-configuration change (new Zone + Areas), not a code change.

---

## Auto-Assignment Logic

The assignment engine minimizes manual dispatcher work by automatically allocating the best available delivery agent to a new order.

**Selection criteria:**

| Factor | Role in scoring |
|---|---|
| **Availability** | Only agents currently online/available are considered |
| **Active workload** | Agents nearing capacity are deprioritized |
| **Assigned zone** | Candidates are filtered to the order's operational zone |
| **Delivery capacity** | Agents must have remaining capacity for a new order |

When triggered, the engine filters all available agents within the required zone and, where multiple agents qualify, selects the strongest candidate by proximity and current load. Administrators retain the ability to **override** the automatic selection and manually assign an order whenever operational judgment is needed.

---

## Order Lifecycle & Tracking

Every order progresses through a predefined, enforced state machine:

```mermaid
flowchart LR
    P[Pending] --> A[Assigned]
    A --> PU[Picked Up]
    PU --> IT[In Transit]
    IT --> OFD[Out For Delivery]
    OFD --> D[Delivered]

    OFD -.delivery fails.-> F[Failed]
    F --> CN[Customer Notification]
    CN --> R[Reschedule]
    R --> AR[Agent Reassignment]
    AR --> PU
```

Every state transition writes an **immutable** tracking record containing:

- Current status
- Timestamp
- User responsible for the update
- Optional remarks

This tracking history can never be modified or deleted after the fact — it's an append-only audit trail, giving both customers and administrators full operational transparency into exactly what happened and when.

---

## Notification Service

Customers receive automated email notifications the moment an order's status changes:

`Order Confirmation` → `Agent Assignment` → `Picked Up` → `In Transit` → `Out for Delivery` → `Delivered` / `Failed Delivery` → `Rescheduled Delivery`

This keeps customers informed throughout the delivery journey without any manual intervention, while reducing inbound support volume from "where's my order" queries.

---

## Database Design

The application uses **PostgreSQL** with **Prisma ORM** for type-safe schema access and migrations.

**Primary entities:**

| Entity | Purpose |
|---|---|
| `Users` | Customers, agents, and admins with role-based fields |
| `Orders` | Core delivery order records and pricing snapshot |
| `AgentStatus` | Agent availability, capacity, location, and performance metrics |
| `Zones` / `Areas` | Geographic hierarchy driving pricing and assignment |
| `RateCards` | Admin-configurable pricing rules |
| `Assignments` | Order ↔ agent assignment records and outcomes |
| `TrackingEvent` | Immutable status-change history per order |

Relationships are normalized to minimize redundancy while preserving referential integrity, and Prisma migrations keep schema versions consistent across development and deployment environments.

Full field-level schema reference: [`docs/DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)

---

## Scalability Considerations

The project uses a **feature-based modular architecture**, allowing new business capabilities to be integrated with minimal impact on existing modules — pricing, assignment, notifications, and authentication each evolve independently.

**Planned production enhancements:**

- Redis-based caching for hot-path reads (rate cards, zone lookups)
- Background job queues for notification delivery and retries
- Real-time tracking via WebSockets (replacing polling)
- SMS notifications alongside email
- Route optimization for multi-stop agent assignment
- AI-powered ETA prediction
- Containerized deployment with Docker and Kubernetes
- Horizontal backend scaling behind a load balancer

---

## Conclusion

The Last-Mile Delivery Tracker demonstrates the core design principles of a modern logistics platform: configurable pricing, secure role-based authentication, intelligent agent assignment, immutable tracking history, and automated customer communication — all built on a modular architecture designed for maintainability and future scale.
