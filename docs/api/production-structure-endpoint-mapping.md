# Production Structure API Mapping

Bu doküman, eski `production-structure` endpoint'lerinden yeni kanonik sözleşmeye geçişi özetler.

## Endpoint Mapping

| Eski endpoint | Yeni endpoint | Not |
| --- | --- | --- |
| `GET /production-structure/organizations` | `GET /plant-hierarchy/plants` | Organizasyon katmanı kaldırıldı, tesisler (Plant) doğrudan listelenir. |
| `GET /production-structure/sites` | `GET /plant-hierarchy/plants` | Site kavramı Plant ile eşlendi. |
| `GET /production-structure/work-stations` | `GET /plant-hierarchy/work-centers` | İstasyon kavramı WorkCenter ile eşlendi. `plantId` filtresi desteklenir. |
| `POST /production-structure/work-stations` | `POST /plant-hierarchy/work-centers` | Yeni iş merkezi oluşturur. |
| `PATCH /production-structure/work-stations/:id/status` | `PATCH /plant-hierarchy/work-centers/:id` | Durum değişikliği `isActive` alanı üzerinden yapılır. |
| `GET /production-structure/plans` | `GET /production-plans` | Üretim planları ayrı modülde sunulur. |
| `POST /production-structure/plans` | `POST /production-plans` | Üretim planı oluşturma endpoint’i yeni path’e taşındı. |

## Canonical Production Contract

- Üretim yapısı (tesis, adım, iş merkezi, ekipman): `PlantHierarchyModule`
- Üretim planı (listeleme/oluşturma): `ProductionPlanModule`
