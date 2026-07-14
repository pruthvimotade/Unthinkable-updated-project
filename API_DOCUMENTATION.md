# 🌐 API Documentation

## Last-Mile Delivery Tracker

---

# 📖 Overview

The Last-Mile Delivery Tracker exposes a RESTful API that enables **customers**, **delivery agents**, and **administrators** to interact with the logistics platform.

The API follows REST principles with role-based access control (RBAC), JWT authentication, consistent request/response envelopes, and centralized error handling.

---

# 🛠 Base URLs

| Environment | URL |
|-------------|-----|
| Local Development | `http://localhost:4000/api/v1` |
| Production | `https://your-render-url.onrender.com/api/v1` |

**Interactive Docs (Swagger UI):**

| Environment | URL |
|-------------|-----|
| Local | `http://localhost:4000/docs` |
| Production | `https://your-render-url.onrender.com/docs` |

---

# 🗺️ API Surface at a Glance

```mermaid
flowchart LR
    subgraph Client["Clients"]
        C1[Customer App]
        C2[Agent App]
        C3[Admin Dashboard]
    end

    subgraph API["API v1"]
        AUTH[Auth Module]
        ORD[Orders Module]
        PRICE[Pricing Module]
        TRACK[Tracking Module]
        AGENT[Agent Module]
        ADMIN[Admin Module]
        ANALYTICS[Analytics Module]
        NOTIF[Notifications Module]
    end

    DB[(PostgreSQL)]

    C1 --> AUTH
    C1 --> ORD
    C1 --> PRICE
    C1 --> TRACK

    C2 --> AUTH
    C2 --> AGENT

    C3 --> AUTH
    C3 --> ADMIN
    C3 --> ANALYTICS

    AUTH --> DB
    ORD --> DB
    PRICE --> DB
    TRACK --> DB
    AGENT --> DB
    ADMIN --> DB
    ANALYTICS --> DB
    NOTIF --> DB

    ORD -.triggers.-> NOTIF
    AGENT -.triggers.-> NOTIF
```

---

# 🔐 Authentication & Authorization

All protected endpoints require a JWT access token in the header:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Login & Token Flow

```mermaid
sequenceDiagram
    participant U as User (Customer/Agent/Admin)
    participant API as Auth API
    participant DB as Database

    U->>API: POST /auth/login/{role}  { email, password }
    API->>DB: Verify credentials (bcrypt compare)
    DB-->>API: User record + role
    API-->>U: 200 OK  { accessToken, refreshToken }

    Note over U,API: Every subsequent request
    U->>API: GET/POST ... Authorization: Bearer <accessToken>
    API->>API: Verify JWT signature + expiry + role (RBAC)
    API-->>U: 200 OK (data) or 401/403 (denied)

    Note over U,API: When accessToken expires
    U->>API: POST /auth/refresh { refreshToken }
    API-->>U: 200 OK { newAccessToken }
```

### Role-Based Access Summary

| Role | Can Access |
|------|-----------|
| **Customer** | Create/view own orders, calculate pricing, track own shipments |
| **Agent** | View assigned orders, accept/reject assignments, update delivery status |
| **Admin** | Full system access — zones, areas, rate cards, manual assignment, analytics, status overrides |

---

# 👥 API Modules

| Module | Purpose |
|---------|----------|
| 🔑 Authentication | Login, Register, Refresh Token |
| 📦 Orders | Create and manage delivery orders |
| 💰 Pricing | Calculate shipping charges |
| 📍 Tracking | View tracking timeline |
| 🚚 Agent | Delivery workflow |
| 🛡 Admin | System management |
| 📊 Analytics | Dashboard metrics |
| 📧 Notifications | Email/SMS/Push updates |

---

# 🔑 Authentication APIs

| Method | Endpoint | Access | Description |
|---------|-----------|--------|-------------|
| `POST` | `/auth/register` | Public | Register a new customer |
| `POST` | `/auth/login/customer` | Public | Customer login |
| `POST` | `/auth/login/agent` | Public | Agent login |
| `POST` | `/auth/login/admin` | Public | Admin login |
| `POST` | `/auth/refresh` | Authenticated | Refresh access token |
| `POST` | `/auth/logout` | Authenticated | Invalidate refresh token |

<details>
<summary><b>Request/Response example — POST /auth/login/customer</b></summary>

**Request**
```json
{
  "email": "customer@example.com",
  "password": "SecurePass123"
}
```

**Response — 200 OK**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "dGhpcyBpcy...",
    "user": {
      "id": "usr_8f3a",
      "name": "Riya Sharma",
      "role": "CUSTOMER"
    }
  }
}
```
</details>

---

# 📦 Order APIs

| Method | Endpoint | Access | Description |
|---------|-----------|--------|-------------|
| `POST` | `/orders` | Customer/Admin | Create a new order |
| `GET` | `/orders` | Customer/Admin | List orders (filterable, paginated) |
| `GET` | `/orders/:id` | Authenticated | Get single order details |
| `PATCH` | `/orders/:id` | Customer/Admin | Update order (before pickup only) |
| `DELETE` | `/orders/:id` | Admin | Cancel order |

### Order Status Lifecycle

Every order moves through a strict state machine — this maps directly to the `Order.status` enum and generates a `TrackingEvent` row at each transition.

```mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> PICKED_UP: Agent picks up
    PICKED_UP --> IN_TRANSIT: En route
    IN_TRANSIT --> OUT_FOR_DELIVERY: Nearing destination
    OUT_FOR_DELIVERY --> DELIVERED: Successful delivery
    OUT_FOR_DELIVERY --> FAILED: Delivery attempt failed
    FAILED --> OUT_FOR_DELIVERY: Rescheduled
    FAILED --> RTO: Return to origin
    CREATED --> RTO: Cancelled before pickup
    DELIVERED --> [*]
    RTO --> [*]
```

### Query Parameters — `GET /orders`

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by order status |
| `orderType` | string | `B2B` / `B2C` |
| `page` | number | Pagination page (default `1`) |
| `limit` | number | Page size (default `20`, max `100`) |
| `from`, `to` | ISO date | Date range filter on `createdAt` |

---

# 💰 Pricing APIs

| Method | Endpoint | Access | Description |
|---------|-----------|--------|-------------|
| `POST` | `/pricing/calculate` | Customer/Admin | Calculate shipping charges before order creation |

### Pricing Engine Logic

```mermaid
flowchart TD
    A[Input: dimensions, weight, pickup/drop, orderType, paymentType] --> B["Resolve Areas → Zones"]
    B --> C{Same Zone?}
    C -->|Yes| D[zoneType = INTRA]
    C -->|No| E[zoneType = INTER]
    D --> F[Compute Volumetric Weight<br/>L × B × H / 5000]
    E --> F
    F --> G[Chargeable Weight = MAX weight, volumetricWeight]
    G --> H["Lookup Rate Card<br/>(zoneType + orderType + weight slab)"]
    H --> I{paymentType = COD?}
    I -->|Yes| J[+ COD Charge]
    I -->|No| K[No COD Charge]
    J --> L[Final Shipping Price]
    K --> L
```

<details>
<summary><b>Request/Response example — POST /pricing/calculate</b></summary>

**Request**
```json
{
  "pickupAddress": "Kothrud, Pune",
  "dropAddress": "Andheri, Mumbai",
  "length": 40,
  "breadth": 30,
  "height": 20,
  "weight": 4.5,
  "orderType": "B2C",
  "paymentType": "COD"
}
```

**Response — 200 OK**
```json
{
  "success": true,
  "data": {
    "zoneType": "INTER",
    "volumetricWeight": 4.8,
    "chargeableWeight": 4.8,
    "baseCharge": 190,
    "codCharge": 30,
    "finalPrice": 220
  }
}
```
</details>

---

# 🚚 Agent APIs

| Method | Endpoint | Access | Description |
|---------|-----------|--------|-------------|
| `GET` | `/agent/orders` | Agent | View orders assigned to the logged-in agent |
| `PATCH` | `/agent/orders/:id/status` | Agent | Update delivery status (creates a Tracking Event) |
| `POST` | `/agent/accept/:assignmentId` | Agent | Accept an assignment |
| `POST` | `/agent/reject/:assignmentId` | Agent | Reject an assignment (triggers reassignment) |

### Assignment → Delivery Flow

```mermaid
sequenceDiagram
    participant Sys as Assignment Engine
    participant Ag as Agent
    participant Ord as Order

    Sys->>Ag: New Assignment (PENDING)
    alt Agent accepts
        Ag->>Sys: POST /agent/accept/:id
        Sys->>Ord: Assignment.status = ACCEPTED
        Ag->>Ord: PATCH /agent/orders/:id/status (PICKED_UP)
        Ag->>Ord: PATCH .../status (IN_TRANSIT)
        Ag->>Ord: PATCH .../status (OUT_FOR_DELIVERY)
        Ag->>Ord: PATCH .../status (DELIVERED)
    else Agent rejects
        Ag->>Sys: POST /agent/reject/:id
        Sys->>Sys: Assignment.status = REJECTED
        Sys->>Sys: Re-run auto-assignment for order
    end
```

---

# 🛡 Admin APIs

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `GET` | `/admin/orders` | View all orders across the platform |
| `GET` | `/admin/analytics` | Dashboard metrics |
| `POST` | `/admin/zones` | Create a zone |
| `POST` | `/admin/areas` | Create an area (linked to a zone) |
| `POST` | `/admin/rate-cards` | Create a pricing rule |
| `POST` | `/admin/assign` | Manually assign an order to an agent |
| `PATCH` | `/admin/orders/:id/status` | Override order status |

---

# 📍 Tracking APIs

| Method | Endpoint | Access | Description |
|---------|-----------|--------|-------------|
| `GET` | `/tracking/:trackingNumber` | Public | Public tracking lookup — no login required |
| `GET` | `/orders/:id/tracking` | Customer/Admin | Full tracking timeline for an order |

<details>
<summary><b>Response example — GET /tracking/:trackingNumber</b></summary>

```json
{
  "success": true,
  "data": {
    "trackingNumber": "ORD-1001",
    "currentStatus": "OUT_FOR_DELIVERY",
    "timeline": [
      { "status": "CREATED", "timestamp": "2026-07-10T09:00:00Z" },
      { "status": "PICKED_UP", "timestamp": "2026-07-10T11:20:00Z" },
      { "status": "IN_TRANSIT", "timestamp": "2026-07-11T06:00:00Z" },
      { "status": "OUT_FOR_DELIVERY", "timestamp": "2026-07-12T08:45:00Z" }
    ]
  }
}
```
</details>

---

# 📧 Notification APIs

Notifications are triggered automatically (no direct client-facing "send" endpoint) whenever an order crosses a key event:

```mermaid
flowchart LR
    E1[Order Created] --> N[Notification Service]
    E2[Agent Assigned] --> N
    E3[Picked Up] --> N
    E4[In Transit] --> N
    E5[Out for Delivery] --> N
    E6[Delivered] --> N
    E7[Failed Delivery] --> N
    E8[Rescheduled] --> N
    N --> Email[📧 Email]
    N --> SMS[📱 SMS]
    N --> Push[🔔 Push]
```

Each send attempt — successful or not — is logged as a `Notification` row (`SENT` / `FAILED` / `PENDING`) for audit purposes.

---

# 📊 Analytics APIs

| Endpoint | Description |
|-----------|-------------|
| `GET /admin/analytics` | Overall dashboard metrics (volume, revenue, SLA adherence) |
| `GET /admin/orders` | Order statistics with filters |
| `GET /admin/agents` | Agent performance (deliveries, acceptance rate, avg. time) |

---

# 📥 Sample Request

## Create Order

```http
POST /api/v1/orders
```

```json
{
  "pickupAddress": "Pune",
  "dropAddress": "Mumbai",
  "length": 40,
  "breadth": 30,
  "height": 20,
  "weight": 4.5,
  "orderType": "B2C",
  "paymentType": "COD"
}
```

---

# 📤 Sample Response

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ORD-1001",
    "shippingCharge": 220,
    "status": "CREATED"
  }
}
```

---

# ❌ Error Response

Every error follows the same envelope, regardless of module:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "pickupAddress",
      "message": "Pickup address is required"
    }
  ]
}
```

### Standard HTTP Status Codes

| Code | Meaning | Typical Cause |
|------|---------|----------------|
| `200` | OK | Successful GET/PATCH |
| `201` | Created | Successful POST (resource created) |
| `400` | Bad Request | Validation failure (Zod schema) |
| `401` | Unauthorized | Missing/expired/invalid JWT |
| `403` | Forbidden | Valid token, wrong role (RBAC denial) |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate email, double-assignment, etc. |
| `500` | Internal Server Error | Unhandled exception |

---

# 🔒 Security Features

- ✅ JWT Authentication (access + refresh token pair)
- ✅ Password Hashing (bcrypt)
- ✅ RBAC Authorization on every protected route
- ✅ Input Validation (Zod schemas at controller boundary)
- ✅ Centralized Error Handling middleware
- ✅ Protected Routes via auth middleware
- ✅ Environment-based Configuration (`.env`, never hardcoded secrets)

---

# 📌 API Design Principles

- RESTful architecture, resource-oriented URLs
- Feature-based routing (one router per module)
- Consistent `{ success, message, data | errors }` response envelope
- Proper, meaningful HTTP status codes
- Stateless authentication (JWT, no server-side session)
- Modular **controller → service → repository** pattern

```mermaid
flowchart LR
    Req[Incoming Request] --> MW[Auth + Validation Middleware]
    MW --> Ctrl[Controller<br/>parses request, sends response]
    Ctrl --> Svc[Service<br/>business logic]
    Svc --> Repo[Repository<br/>Prisma queries]
    Repo --> DB[(PostgreSQL)]
```

---

# 🚀 Future API Enhancements

| Enhancement | Benefit |
|-------------|---------|
| Versioned APIs (`v2`) | Non-breaking evolution of the contract |
| WebSocket support | Real-time order status push instead of polling |
| GraphQL gateway | Flexible querying for dashboard/analytics clients |
| Rate limiting | Abuse prevention, fair usage |
| API key support | Enable B2B partner integrations |
| OpenAPI code generation | Auto-generate typed SDKs from the Swagger spec |

---

# 📖 Complete Documentation

For detailed request bodies, response schemas, and interactive testing, refer to the Swagger documentation:

- **Local:** `http://localhost:4000/docs`
- **Production:** `https://your-render-url.onrender.com/docs`
