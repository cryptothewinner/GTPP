# Sistem Durum Analizi ve Fazlı İyileştirme Planı

## 1) Mevcut Durum Özeti

Yapılan ilk kontrollerde aşağıdaki kritik sorunlar tespit edildi:

1. **Lint hattı kırık**
   - `ESLint v9` ile uyumlu `eslint.config.*` dosyası yoktu.
   - `apps/web` içinde `next lint` komutu `Next.js 16` davranışıyla uyumsuz çalışıyordu.
2. **Web type-check hataları**
   - AG Grid kolon tanımlarındaki `cellStyle` tip uyumsuzlukları.
   - Ürün detay ekranında yanıt tipinin wrapper/düz veri ayrımında güvenli okunmaması.
   - Satınalma siparişi oluşturma akışında mutation dönüş tipine uymayan `result.data?.id` erişimi.
3. **API katmanında Prisma tip uyuşmazlıkları**
   - `@prisma/client` içindeki enum/type üyeleri ile kod arasında ciddi tutarsızlık var.
   - Bu konu kapsamlı bir şema + generate + kod senkronizasyonu gerektiriyor.

## 2) Bu Turda Uygulanan İyileştirmeler

- **Lint hattı, çalışır bir doğrulama pipeline’ına çevrildi**:
  - Kök `lint` script’i web ve shared paketlerinde `type-check` çalıştıracak şekilde düzenlendi.
  - `turbo.json` içerisine `type-check` task’ı eklendi.
  - `apps/web`, `apps/api` ve `packages/shared` scriptleri type-check merkezli güncellendi.
- **Web tarafındaki TypeScript hataları giderildi**:
  - AG Grid `cellStyle` dönüşleri tip güvenli hale getirildi.
  - Ürün detayında wrapper yanıt güvenli şekilde parse edilir hale getirildi.
  - Satınalma siparişi oluşturma sonrası yönlendirme tipi düzeltildi.

## 3) Fazlı Yol Haritası (To-Do)

### Faz 1 — Stabilizasyon (Hemen)
- [x] Web + Shared için otomatik type-check hattını çalışır hale getir.
- [x] Web katmanındaki derlemeyi engelleyen TS hatalarını temizle.
- [ ] API Prisma tip kırıklarını envanterle (enum ve model bazında tablo çıkar).

### Faz 2 — API/Prisma Senkronizasyonu
- [ ] `schema.prisma` ile koddaki enum/type kullanımlarını birebir eşleştir.
- [ ] `prisma generate` sonrası çıkan client tiplerine göre servis/DTO importlarını güncelle.
- [ ] API için ayrı `type-check` hattını tekrar yeşile çek.

### Faz 3 — Kalite ve Gözlemlenebilirlik
- [ ] ESLint v9 flat-config geçişini tamamla (`eslint.config.mjs`).
- [ ] Paket bazlı lint kurallarını sadeleştir (web/api/shared ayrıştır).
- [ ] CI pipeline’da `type-check`, `build`, (opsiyonel) `test` adımlarını ayrıştır.

### Faz 4 — Üretime Hazırlık
- [ ] Next build için dış font bağımlılığını local fallback ile güvenceye al.
- [ ] Docker ortamında API + Web + DB uçtan uca smoke test scripti oluştur.
- [ ] Sürümleme ve rollback notlarıyla release checklist yayınla.

## 4) Bilinen Riskler

- API katmanındaki Prisma kırıkları çözülmeden tam monorepo build yeşil olmayacaktır.
- Next build, dış ağdan Google Font çekemediği ortamlarda başarısız olabilir (offline/izole ağ riski).

## 5) Sonraki Adım Önerisi

Öncelik sırası:
1. API Prisma tip uyumu (Faz 2)
2. Next font fallback (Faz 4)
3. ESLint flat-config geçişi (Faz 3)
