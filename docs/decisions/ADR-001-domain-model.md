# ADR-001: Domain Model and Core Entities

## Status

Accepted

## Context

The platform manages logistics operations involving customers, delivery agents, administrators, pricing rules, assignments, and shipment tracking.

The domain model must support configurable business rules, immutable tracking history, intelligent assignment, and future scalability without unnecessary complexity.

## Decision

The platform will use the following core entities:

- User
- Zone
- Area
- RateCard
- Order
- Assignment
- TrackingEvent
- AgentStatus
- Notification
- AuditLog

The system will follow a modular monolith architecture with Orders as the aggregate root.

Tracking history will be immutable.

Assignment decisions will be stored for auditability.

Pricing values will be snapshotted at order creation to preserve historical accuracy.

## Consequences

### Benefits

- Simple authentication model
- Clean business separation
- Easy future scaling
- Historical correctness
- Better debugging and auditing

### Trade-offs

- Slightly more tables than a basic CRUD system
- More explicit relationships
- Additional snapshot storage