# Movement Type Test Matrix (MM-FI Entegrasyonu)

| Scenario | Movement Type | Input Combination (movementType+valuationClass+materialType+companyCode) | Expected Inventory Posting | Expected Offset Posting | Transaction Result |
| --- | --- | --- | --- | --- | --- |
| Satınalma Mal Girişi | `GR_PURCHASE_ORDER` (101) | `GR_PURCHASE_ORDER\|3000\|RAW_MATERIAL\|1000` | Debit Stock (Inventory) | Credit GR/IR veya Satıcı Alacak Hesabı | Material document + journal entry committed |
| Üretime Mal Çıkışı | `GI_FOR_ORDER` (261) | `GI_FOR_ORDER\|3000\|RAW_MATERIAL\|1000` | Credit Stock (Inventory) | Debit Üretim Tüketim / WIP hesabı | Material document + journal entry committed |
| Satışa Mal Çıkışı | `GI_SALES_ORDER` (601) | `GI_SALES_ORDER\|7900\|FINISHED_PRODUCT\|1000` | Credit Stock (Inventory) | Debit Satılan Malın Maliyeti (COGS) | Material document + journal entry committed |
| Açılış Stoğu | `INITIAL_STOCK_ENTRY` (561) | `INITIAL_STOCK_ENTRY\|3000\|RAW_MATERIAL\|1000` | Debit Stock (Inventory) | Credit Açılış/Fon hesabı | Material document + journal entry committed |
| Mapping Eksik | any | mapping yok | N/A | N/A | FI posting throw eder, `$transaction` rollback olur, malzeme hareketi kalıcılaşmaz |
| GL Master Eksik | any | mapping var ama GL account bulunamadı | N/A | N/A | FI posting throw eder, `$transaction` rollback olur |

## Kontrol Noktaları
- Journal borç/alacak toplamı her scenario'da eşit olmalı.
- Tüm satırlar aynı `companyCode` altında olmalı; farklı şirket kodu var ise transaction fail olmalı.
- Wildcard fallback sırası: tam eşleşme -> valuation `*` -> materialType `*` -> ikisi `*`.
