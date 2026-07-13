# last-mile-delivery-tracker
Enterprise-grade Last Mile Delivery Management Platform with intelligent pricing, automated agent assignment, and real-time order tracking.

### Key Upgrades (Version 2.0)
- **Intelligent Pricing Engine**: Zone-based Rate Card selector, weight band matching, and Google Maps Road Distance backup.
- **Gmail-based OTP Verification**: Registration flow with 6-digit OTP verification and 60-second cooldown rate-limiting.
- **Dynamic Agent Assignment**: 2-step accept/reject flow with 90-second response deadlines, auto-reassignment, 3x search radius expansion, staleness check/penalty, and zone saturation alerts.
- **SMTP & Twilio Integration**: Transactional Gmail alerts (emails for rescheduling, overrides, cancellations, de-assignment) and SMS integrations with fallback logging.

