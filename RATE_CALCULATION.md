# 💰 Rate Calculation Engine

## Last-Mile Delivery Tracker

---

# 📖 Overview

The Rate Calculation Engine is the core business component of the Last-Mile Delivery Tracker. It determines the final shipping charge for every order using configurable business rules instead of hardcoded values.

The engine considers:

- 📍 Pickup Zone
- 📍 Drop Zone
- 📦 Package Dimensions
- ⚖️ Actual Weight
- 📐 Volumetric Weight
- 🏢 Order Type (B2B/B2C)
- 💵 Payment Type (Prepaid/COD)
- 📋 Admin Configured Rate Cards

This ensures pricing remains flexible and can be modified without changing application code.

---

# ⚙️ Pricing Workflow

```text
Customer Creates Order
        │
        ▼
Validate Address
        │
        ▼
Resolve Pickup Area
        │
        ▼
Resolve Drop Area
        │
        ▼
Determine Pickup Zone
        │
        ▼
Determine Drop Zone
        │
        ▼
Determine Zone Type
(Intra / Inter)
        │
        ▼
Calculate Volumetric Weight
        │
        ▼
Compare Actual Weight
        │
        ▼
Select Chargeable Weight
        │
        ▼
Lookup Rate Card
        │
        ▼
Apply COD Charges
        │
        ▼
Return Final Shipping Cost
```

---

# 📍 Step 1 — Zone Detection

Every serviceable address belongs to an Area.

Every Area belongs to a Zone.

Example

| Pickup | Drop | Result |
|---------|------|---------|
| Pune East | Pune East | Intra Zone |
| Pune East | Mumbai North | Inter Zone |

Zone detection is fully data-driven.

Administrators can add new cities by simply creating new Zones and Areas.

---

# 📦 Step 2 — Package Dimensions

The customer enters:

| Field | Example |
|--------|----------|
| Length | 40 cm |
| Breadth | 30 cm |
| Height | 20 cm |
| Actual Weight | 4.5 kg |

---

# 📐 Step 3 — Volumetric Weight

The logistics industry bills packages based on whichever is larger:

- Actual Weight
- Volumetric Weight

Formula

```
Volumetric Weight =
(Length × Breadth × Height)
/ 5000
```

Example

```
Length = 40

Breadth = 30

Height = 20

Volume = 24,000

24000 / 5000

= 4.8 kg
```

---

# ⚖️ Step 4 — Chargeable Weight

```
Chargeable Weight

=

MAX(
Actual Weight,
Volumetric Weight
)
```

Example

| Actual | Volumetric | Chargeable |
|----------|--------------|----------------|
| 4.5 kg | 4.8 kg | 4.8 kg |
| 7 kg | 5.2 kg | 7 kg |

---

# 🏢 Step 5 — Order Type

The customer selects

| Order Type | Description |
|------------|-------------|
| B2B | Business Delivery |
| B2C | Customer Delivery |

Separate Rate Cards are maintained for each.

---

# 🚚 Step 6 — Rate Card Lookup

The engine searches using

- Zone Type
- Order Type
- Weight Slab

Example

| Zone | Order | Weight | Price |
|-------|--------|------------|----------|
| Intra | B2C | 0-5 kg | ₹90 |
| Intra | B2B | 0-5 kg | ₹75 |
| Inter | B2C | 0-5 kg | ₹180 |
| Inter | B2B | 0-5 kg | ₹150 |

All prices are configurable by the Administrator.

---

# 💵 Step 7 — COD Surcharge

If

```
Payment Type = COD
```

then

```
Final Price

=

Shipping Charge

+

COD Surcharge
```

Example

Shipping

₹180

COD

₹40

Total

₹220

---

# 🧮 Example Calculation

Customer enters

| Field | Value |
|--------|---------|
| Pickup | Pune |
| Drop | Mumbai |
| Length | 40 cm |
| Breadth | 30 cm |
| Height | 20 cm |
| Actual Weight | 4.5 kg |
| Order Type | B2C |
| Payment | COD |

System performs

```
Volumetric Weight

=

4.8 kg

Chargeable Weight

=

4.8 kg

Zone Type

=

Inter Zone

Rate Card

=

₹180

COD

=

₹40

Final Price

=

₹220
```

---

# 🔒 Why This Design?

The pricing engine follows a configuration-driven architecture.

Advantages

✅ No hardcoded prices

✅ New pricing without redeployment

✅ Easy maintenance

✅ Scalable to new cities

✅ Business users can update pricing

---

# 🚀 Future Enhancements

- Distance-based pricing
- Surge pricing
- Dynamic holiday pricing
- Fuel surcharge
- AI price prediction
- Multi-currency support
- GST calculations
- Coupon engine

---

# 📌 Summary

The Rate Calculation Engine provides a flexible, configurable, and scalable pricing mechanism for logistics operations by combining zone detection, volumetric weight calculation, configurable rate cards, and payment-based surcharges into a single pricing workflow.
