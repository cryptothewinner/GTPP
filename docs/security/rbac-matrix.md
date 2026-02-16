# RBAC Matrix (P0 Scope)

Bu matris, P0 kapsamındaki kritik endpointlerde minimum rol gereksinimini standartlaştırır.

## Legend
- `viewer`: Okuma erişimi
- `operator`: Operasyonel yazma/işlem erişimi
- `admin`: Finansal/operasyonel kritik aksiyonlar ve sistem yönetimi

## Production Orders (`/production-orders`)
| Endpoint | Method | Required Role |
|---|---|---|
| `/production-orders` | GET | viewer |
| `/production-orders/summary` | GET | viewer |
| `/production-orders/:id` | GET | viewer |
| `/production-orders/:id/availability` | GET | viewer |
| `/production-orders` | POST | operator |
| `/production-orders/:id` | PATCH | operator |
| `/production-orders/:id/start` | POST | operator |
| `/production-orders/:id/complete` | POST | operator |
| `/production-orders/:id/reschedule` | PATCH | operator |
| `/production-orders/:id/operations/:opId/confirm` | POST | operator |

## Production Plans (`/production-plans`)
| Endpoint | Method | Required Role |
|---|---|---|
| `/production-plans` | GET | viewer |
| `/production-plans/:id` | GET | viewer |
| `/production-plans` | POST | operator |

## Material Documents (`/inventory/material-documents`)
| Endpoint | Method | Required Role |
|---|---|---|
| `/inventory/material-documents` | GET | viewer |
| `/inventory/material-documents/:id` | GET | viewer |
| `/inventory/material-documents/material/:materialId` | GET | viewer |
| `/inventory/material-documents` | POST | operator |

## Billing - Invoices (`/invoices`)
| Endpoint | Method | Required Role |
|---|---|---|
| `/invoices` | GET | viewer |
| `/invoices/:id` | GET | viewer |
| `/invoices` | POST | operator |
| `/invoices/:id/post` | POST | admin |

## Outbound Deliveries (`/outbound-deliveries`)
| Endpoint | Method | Required Role |
|---|---|---|
| `/outbound-deliveries` | GET | viewer |
| `/outbound-deliveries/:id` | GET | viewer |
| `/outbound-deliveries` | POST | operator |
| `/outbound-deliveries/:id/post-goods-issue` | POST | operator |

## Monitoring (`/monitoring`)
| Endpoint | Method | Required Role |
|---|---|---|
| `/monitoring/*` | GET/POST/PATCH | admin |

