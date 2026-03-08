# Inventory Module

## Overview
Manages medicine catalog, stock levels, batch tracking, and inventory transactions with low-stock and expiry alerts.

## Base Path
`/api/inventory`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | INVENTORY:READ | List inventory items |
| GET | `/low-stock` | INVENTORY:READ | Get items below reorder level |
| GET | `/expiring` | INVENTORY:READ | Get expiring batches |
| GET | `/medicines` | INVENTORY:READ | List medicine catalog |
| POST | `/medicines` | INVENTORY:CREATE | Add medicine to catalog |
| GET | `/transactions` | INVENTORY:READ | Get transaction history |
| GET | `/:id` | INVENTORY:READ | Get inventory item by ID |
| POST | `/:id/add` | INVENTORY:UPDATE | Add stock to inventory item |
| POST | `/:id/adjust` | INVENTORY:UPDATE | Adjust stock (corrections, damage, expiry) |

## Models Used
- `Medicine` -- medicine catalog entries
- `Inventory` -- stock levels and batch tracking
- `InventoryTransaction` -- stock movement history
- `Counter` -- auto-increment codes for medicines
- Enums: `MedicineCategory`, `MedicineType`, `TransactionType`

## Special Middleware
- `requireFeature("INVENTORY")` -- subscription gate, requires PROFESSIONAL+ tier
- `inventoryStockRateLimiter` -- rate limiting on `/:id/add` and `/:id/adjust` endpoints

## Seed Data
- File: `src/lib/seed/inventory.seed.ts`
  - Dependencies: `Inventory`, `Medicine`, `Organization`
- File: `src/lib/seed/medicines.seed.ts`
  - Dependencies: `Medicine`, `MedicineCategory`, `MedicineType`, `Organization`

## Menu Items
- Parent: **Inventory** (id: `inventory`, icon: `inventory`, order: 11, permission: `INVENTORY:READ`)
  - Stock Overview: `/dashboard/inventory`
  - Medicine Catalog: `/dashboard/inventory/medicines`
  - Expiring Items: `/dashboard/inventory/expiring`
  - Transactions: `/dashboard/inventory/transactions`

## Related
- Web routes: `apps/web/src/routes/dashboard/inventory/`
- Client: `apps/web/src/lib/inventory-client.ts`
- Hook: `apps/web/src/hooks/use-inventory.ts`
- Docs: `apps/docs/src/content/docs/api/14-inventory.md`
- Tests: `apps/server/__tests__/inventory/`
