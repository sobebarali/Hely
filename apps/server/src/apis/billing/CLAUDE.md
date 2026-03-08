# Billing Module

## Overview
Manages subscription billing via Dodo Payments -- checkout flows, subscription status, customer portal, and webhook processing for payment/subscription lifecycle events.

## Base Path
`/api/billing`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/plans` | Public | Get available subscription plans (for pricing page) |
| POST | `/webhook` | Public | Handle Dodo Payments webhooks (signature-verified) |
| GET | `/subscription` | SUBSCRIPTION:READ | Get current subscription details |
| GET | `/checkout` | BILLING:MANAGE | Static checkout via query params |
| POST | `/checkout` | BILLING:MANAGE | Dynamic checkout with JSON body |
| POST | `/checkout/session` | BILLING:MANAGE | Session checkout (recommended, most secure) |
| GET | `/portal` | BILLING:READ | Get customer portal link |

## Models Used
- `Hospital` -- organization billing info and Dodo customer ID
- `Subscription` -- subscription records with status and billing cycle
- `Patient` -- patient count for subscription usage
- `Staff` -- staff count for subscription usage
- Types: `PricingTierValue`, `BillingCycleValue`, `SubscriptionStatusValue`

## Special Middleware
- `/plans` and `/webhook` are **public routes** (no authentication required)
- Webhook uses `Webhooks()` from `@dodopayments/express` for automatic signature verification
- Webhook only registered when `DODO_PAYMENTS_WEBHOOK_KEY` env var is configured and valid (length > 20)
- Protected routes apply `authenticate` per-route (not via `router.use`)

### Webhook Handlers
- `onSubscriptionActive`, `onSubscriptionOnHold`, `onSubscriptionCancelled`
- `onSubscriptionExpired`, `onSubscriptionRenewed`, `onSubscriptionPlanChanged`
- `onSubscriptionFailed`, `onPaymentSucceeded`, `onPaymentFailed`

## Seed Data
None

## Menu Items
None -- billing is accessed via Settings, not as a standalone menu item.

## Related
- Web routes: None (no `/dashboard/billing/` route directory)
- Client: `apps/web/src/lib/billing-client.ts`
- Hook: `apps/web/src/hooks/use-billing.ts`
- Docs: `apps/docs/src/content/docs/api/19-billing.md`
- Tests: `apps/server/__tests__/billing/`
