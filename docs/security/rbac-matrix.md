# RBAC Matrix (P0 Kritik Endpoint Kapsamı)

Bu döküman P0 kapsamında korunan kritik endpointler için başlangıç rol matrisini içerir.

## Rol Hiyerarşisi

- `admin`
- `operator`
- `viewer`

> Not: `RolesGuard` hiyerarşik karşılaştırma yapar, üst rol alt rol izinlerini kapsar.

## Üretim

### `production-orders`

- `GET /production-orders` → `viewer`
- `GET /production-orders/summary` → `viewer`
- `GET /production-orders/:id` → `viewer`
- `GET /production-orders/:id/availability` → `viewer`
- `POST /production-orders` → `operator | admin`
- `PATCH /production-orders/:id` → `operator | admin`
- `POST /production-orders/:id/start` → `operator | admin`
- `POST /production-orders/:id/complete` → `operator | admin`
- `PATCH /production-orders/:id/reschedule` → `operator | admin`
- `POST /production-orders/:id/operations/:opId/confirm` → `operator | admin`

### `production-plans`

- `GET /production-plans` → `viewer`
- `GET /production-plans/:id` → `viewer`
- `POST /production-plans` → `operator | admin`

## Envanter & Lojistik

### `inventory/material-documents`

- `GET /inventory/material-documents` → `viewer`
- `GET /inventory/material-documents/material/:materialId` → `viewer`
- `GET /inventory/material-documents/:id` → `viewer`
- `POST /inventory/material-documents` → `operator | admin`

### `outbound-deliveries`

- `GET /outbound-deliveries` → `viewer`
- `GET /outbound-deliveries/:id` → `viewer`
- `POST /outbound-deliveries` → `operator | admin`
- `POST /outbound-deliveries/:id/post-goods-issue` → `operator | admin`

## Finans

### `invoices`

- `GET /invoices` → `viewer`
- `GET /invoices/:id` → `viewer`
- `POST /invoices` → `operator | admin`
- `POST /invoices/:id/post` → `operator | admin`

## Operasyon / İzleme

### `monitoring`

- `GET /monitoring/logs` → `admin`
- `GET /monitoring/logs/:id` → `admin`
- `GET /monitoring/stats` → `admin`
- `POST /monitoring/retry/:logId` → `admin`
- `PATCH /monitoring/archive/:logId` → `admin`

## Sonraki Adımlar

1. P0 kapsamı dışında kalan modülleri de endpoint bazında matrise eklemek.
2. Matrisi test senaryoları ile eşlemek (rol x endpoint x beklenen HTTP kodu).
3. CI aşamasında en az kritik endpointler için sözleşme testini zorunlu kılmak.
