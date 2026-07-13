# Business Rules

## Version

1.0

---

# Introduction

This document defines the business rules that govern the behavior of the Last Mile Delivery Tracker platform.

These rules ensure that operational logic remains consistent, configurable, and independent of application code.

No business values should be hardcoded inside the application.

All configurable values must be managed by the Administrator.

---

# Rule Group 1 — User Management

## Customer

A customer can:

- Register
- Login
- Create Orders
- View Orders
- Track Orders
- Reschedule Failed Deliveries

---

## Delivery Partner

A delivery partner can:

- Login
- Update Availability
- Accept Assigned Orders
- Update Delivery Status
- View Assigned Orders

---

## Administrator

Administrator can:

- Manage Users
- Manage Delivery Partners
- Manage Zones
- Manage Areas
- Configure Rate Cards
- Configure COD Charges
- Override Order Status
- Assign Delivery Partners
- View Analytics

---

# Rule Group 2 — Order Creation

When a customer creates an order:

1. Validate input.
2. Detect Pickup Zone.
3. Detect Drop Zone.
4. Calculate Volumetric Weight.
5. Calculate Billable Weight.
6. Fetch Rate Card.
7. Apply COD Charge if required.
8. Generate Final Quote.
9. Show Quote.
10. Customer Confirms.
11. Order Created.

---

# Rule Group 3 — Weight Calculation

Volumetric Weight

= (Length × Width × Height) / 5000

Billable Weight

= Higher of

- Actual Weight
- Volumetric Weight

---

# Rule Group 4 — Zone Detection

Every Area belongs to one Zone.

Pickup Address → Pickup Zone

Drop Address → Drop Zone

If Pickup Zone == Drop Zone

Order Type

= Intra Zone

Else

Order Type

= Inter Zone

---

# Rule Group 5 — Pricing

Pricing Pipeline

Base Rate

↓

Weight Charge

↓

Zone Charge

↓

COD Charge

↓

Priority Charge (Future)

↓

Discount (Future)

↓

Final Price

---

# Rule Group 6 — Assignment

Assignment is NOT based only on nearest distance.

Every available delivery partner receives an Assignment Score.

Highest Score wins.

Assignment Score depends on:

- Zone Match
- Distance
- Current Load
- Remaining Capacity
- Idle Time

---

# Rule Group 7 — Delivery Lifecycle

Valid Status Flow

Order Created

↓

Assigned

↓

Accepted

↓

Picked Up

↓

In Transit

↓

Out For Delivery

↓

Delivered

Alternative

Out For Delivery

↓

Failed

↓

Rescheduled

↓

Assigned Again

---

# Rule Group 8 — Tracking

Every status change creates a new tracking event.

Tracking history cannot be modified.

Tracking history cannot be deleted.

Current Order Status is always the latest tracking event.

---

# Rule Group 9 — Notifications

Customer receives notifications on:

- Order Created
- Agent Assigned
- Picked Up
- Out For Delivery
- Delivered
- Failed Delivery
- Rescheduled

---

# Rule Group 10 — Validation

The system shall reject:

- Invalid Dimensions
- Invalid Weight
- Invalid Zone
- Missing Address
- Invalid Payment Type
- Invalid Order Type

Validation occurs before pricing calculation.