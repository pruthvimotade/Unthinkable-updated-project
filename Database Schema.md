# 🗄️ Database Schema

## Last-Mile Delivery Tracker

---

# 📖 Overview

The Last-Mile Delivery Tracker uses **PostgreSQL** as its primary relational database with **Prisma ORM** for type-safe database access and schema migrations.

The schema is normalized to reduce redundancy while maintaining data integrity. Core logistics entities such as orders, delivery agents, pricing rules, assignments, and tracking events are connected through well-defined relationships.

---

# 🏛 Database Architecture

```text
                    Users
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
 Customers        Agents         Administrators
                      │
                      ▼
                Agent Status
                      │
                      ▼
                 Assignments
                      │
                      ▼
                    Orders
                      │
      ┌───────────────┼─────────────────┐
      ▼               ▼                 ▼
 Tracking Events   Rate Cards      Notifications
      │
      ▼
 Status Timeline

Zones
 │
 ▼
Areas
 │
 ▼
Orders
```

---

# 📊 Entity Relationship Diagram

> **Tip:** Replace this section with your exported ER Diagram.

```text
docs/database-schema.png
```

```md
<p align="center">
<img src="./docs/database-schema.png" width="900">
</p>
```

---

# 📦 Core Database Entities

---

## 👤 User

Stores authentication and profile information for every system user.

| Field | Description |
|--------|-------------|
| id | Primary Key |
| name | Full Name |
| email | Unique Email |
| password | Hashed Password |
| role | CUSTOMER / AGENT / ADMIN |
| phone | Contact Number |
| createdAt | Account Creation |

### Relationships

- Customer creates many Orders
- Agent receives many Assignments
- Admin manages Rate Cards, Zones and Areas

---

## 📦 Order

Represents a delivery request.

| Field | Description |
|--------|-------------|
| id | Order ID |
| customerId | Owner |
| pickupAddress | Pickup Location |
| dropAddress | Destination |
| orderType | B2B / B2C |
| paymentType | COD / Prepaid |
| weight | Actual Weight |
| volumetricWeight | Calculated Weight |
| chargeableWeight | Higher Weight |
| shippingCharge | Final Price |
| status | Current Status |

### Relationships

- Belongs to one Customer
- Has one Assignment
- Has many Tracking Events

---

## 🚴 Agent Status

Stores the real-time operational status of delivery agents.

| Field | Description |
|--------|-------------|
| agentId | Linked User |
| availability | Available / Busy |
| currentZone | Active Zone |
| activeOrders | Current Deliveries |
| lastSeen | Last Activity |

This table is used by the auto-assignment engine.

---

## 📍 Zone

Represents a logistics zone.

Example

| Zone |
|------|
| Pune East |
| Pune West |
| Mumbai North |

Each zone contains multiple Areas.

---

## 📍 Area

Areas belong to Zones.

Example

| Area | Zone |
|------|------|
| Kothrud | Pune West |
| Baner | Pune West |
| Hadapsar | Pune East |

Areas are used to resolve pickup and drop locations.

---

## 💰 Rate Card

Stores configurable pricing rules.

| Field | Description |
|--------|-------------|
| Zone Type | Intra / Inter |
| Order Type | B2B / B2C |
| Min Weight | Weight Slab Start |
| Max Weight | Weight Slab End |
| Price | Shipping Price |
| COD Charge | COD Surcharge |

No pricing values are hardcoded.

---

## 🚚 Assignment

Links delivery agents with orders.

| Field | Description |
|--------|-------------|
| orderId | Assigned Order |
| agentId | Assigned Agent |
| assignedAt | Timestamp |
| acceptedAt | Acceptance Time |
| status | Pending / Accepted / Rejected |

Supports both manual and automatic assignment.

---

## 📜 Tracking Event

Maintains immutable delivery history.

| Field | Description |
|--------|-------------|
| orderId | Related Order |
| status | Delivery Status |
| updatedBy | User |
| remarks | Optional Notes |
| timestamp | Status Change Time |

Each status update inserts a new record instead of updating existing history.

---

## 📧 Notification

Stores notification history.

| Field | Description |
|--------|-------------|
| recipient | Customer |
| type | Email |
| subject | Message Subject |
| status | Sent / Failed |
| sentAt | Timestamp |

Maintains a communication audit trail.

---

# 🔗 Relationships

| Relationship | Type |
|--------------|------|
| User → Orders | One-to-Many |
| User → Assignments | One-to-Many |
| Order → Tracking Events | One-to-Many |
| Order → Assignment | One-to-One |
| Zone → Areas | One-to-Many |
| Area → Orders | One-to-Many |
| Rate Card → Orders | One-to-Many |

---

# 🛡 Data Integrity

The database uses relational constraints to maintain consistency.

- Foreign Keys
- Primary Keys
- Unique Email Constraint
- Cascading Relationships
- Prisma Validation

These constraints prevent orphan records and ensure every assignment, tracking event, and pricing record remains associated with valid entities.

---

# 📈 Scalability Considerations

The schema is designed to support future expansion.

Potential enhancements include:

- Multi-warehouse support
- Regional pricing
- Vehicle management
- Fleet tracking
- Driver shifts
- Payment transactions
- Invoice generation
- Delivery proof uploads
- Real-time GPS coordinates

---

# 📌 Summary

The database schema is designed around normalized relational models that separate authentication, pricing, assignment, tracking, and operational data. This modular structure improves maintainability, simplifies future feature additions, and supports scalable logistics operations.
