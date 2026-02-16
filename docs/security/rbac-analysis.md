# RBAC Analizi (Yetkilendirme)

Bu analiz, mevcut kod tabanındaki **kimlik doğrulama (authentication)** ve **rol bazlı yetkilendirme (RBAC)** uygulamasının gerçek durumunu ortaya koyar.

## Kısa Özet

- API tarafında JWT tabanlı kimlik doğrulama global guard ile etkin.
- RBAC için `Roles` decorator ve `RolesGuard` tanımlı olsa da pratikte devrede değil.
- `RolesGuard` içindeki kullanıcı rolü okuma şekli (`user.roles`) ile JWT strategy dönüşü (`user.role`) uyumsuz.
- Backend, Prisma `UserRole` enumu (ADMIN/MANAGER/OPERATOR/VIEWER) ile çalışırken, shared katmanda farklı bir rol modeli (`super_admin`, `production_manager` vb.) var; bu durum tasarım/sözleşme uyuşmazlığı yaratıyor.
- Frontend kullanıcı rolünü state'e alıyor fakat route/component seviyesinde yetki kontrolü bulunmuyor.

## Mevcut Mimari İncelemesi

### 1) Authentication akışı

- `AuthService` kullanıcıyı email + şifre ile doğruluyor, JWT içine `role` alanı koyuyor.
- `JwtStrategy` token doğrulandıktan sonra request'e `id, email, role, fullName` dönüyor.
- `JwtAuthGuard` uygulama genelinde (`APP_GUARD`) devrede.
- Public endpointler `@Public()` ile işaretlenmiş (`/auth/login`, `/health`).

**Sonuç:** Kimlik doğrulama katmanı çalışır durumda.

### 2) RBAC akışı

- `Roles` decorator ve `RolesGuard` mevcut.
- Ancak `AppModule` içinde global olarak yalnızca `JwtAuthGuard` register edilmiş; `RolesGuard` register edilmemiş.
- Kod tabanında `@Roles(...)` kullanımı da yok.

**Sonuç:** RBAC tanımları var ama enforcement (zorunlu kılma) yok.

### 3) Kritik veri modeli uyumsuzluğu

- `RolesGuard`, kullanıcı rollerini `user.roles` (array) olarak bekliyor.
- `JwtStrategy` ise `user.role` (tek string) döndürüyor.
- Bu guard aktif edilse bile mevcut kullanıcı objesiyle hatalı/eksik çalışır.

**Sonuç:** RBAC guard etkinleştirilse dahi önce payload/guard kontratı hizalanmalı.

### 4) Rol sözlüğü (role taxonomy) çakışması

- Prisma enum: `ADMIN`, `MANAGER`, `OPERATOR`, `VIEWER`.
- Shared enum: `super_admin`, `admin`, `production_manager`, `quality_manager`, `warehouse_operator`, `operator`, `viewer`.

**Sonuç:** Domain rol modeli tekilleştirilmediği için API, guard ve UI arasında semantik tutarsızlık riski yüksek.

### 5) Frontend yetkilendirme boşluğu

- Frontend `AuthProvider` kullanıcıyı ve rolü tutuyor.
- Ancak menü/route/sayfa bazlı rol kontrolü (örn. protected route by role) görünmüyor.

**Sonuç:** API tarafında RBAC devreye alınsa bile UI tarafında deneyimsel güvenlik ve yönlendirme eksik kalır.

## Risk Değerlendirmesi

- **Yüksek:** Authenticated olan kullanıcıların tüm modül endpointlerine erişebilmesi (rol filtresi yok).
- **Orta:** Guard aktif edilirse kontrat uyumsuzluğu nedeniyle beklenmeyen erişim reddi veya yanlış izin davranışı.
- **Orta:** Çoklu rol sözlüğü nedeniyle ileride migration / entegrasyon hataları.

## Önerilen Yol Haritası

1. **Rol sözlüğünü tekilleştirin**
   - Tek bir canonical rol modeli belirleyin (Prisma + shared + JWT + UI).

2. **JWT kullanıcı kontratını standardize edin**
   - Tek rol kullanılacaksa her yerde `user.role`.
   - Çoklu rol kullanılacaksa her yerde `user.roles: UserRole[]`.

3. **RolesGuard’ı gerçekten devreye alın**
   - `APP_GUARD` olarak ekleyin (JwtAuthGuard sonrası).
   - Veya controller seviyesinde `@UseGuards(JwtAuthGuard, RolesGuard)` modeli uygulayın.

4. **Endpoint bazlı yetki matrisi çıkarın ve `@Roles` ile işaretleyin**
   - Örn: satınalma, üretim, stok, finans modülleri için min. rol seti.

5. **Frontend role-aware navigation / route gate ekleyin**
   - Yetkisiz kullanıcıyı sayfaya sokmama + aksiyon butonlarını role göre gizleme/disable etme.

6. **Test katmanı ekleyin**
   - Guard unit testleri (rol eşleşmesi, super-admin bypass, public route davranışı).
   - E2E: farklı rol ile kritik endpoint erişim denemeleri.

## Hızlı Teknik Check-list

- [ ] `RolesGuard` guard chain'e eklendi mi?
- [ ] `@Roles(...)` anotasyonları kritik endpointlerde var mı?
- [ ] JWT payload ile guard user modeli birebir uyumlu mu?
- [ ] DB enumu ile shared enum birebir eşleşiyor mu?
- [ ] UI route/aksiyon bazlı role control uygulanmış mı?

## Sonuç

Sistemde authentication temel olarak sağlam; ancak RBAC şu anda **tasarım seviyesinde mevcut, çalışma zamanında etkin değil**. En kritik ihtiyaç, rol modelini tekilleştirip guard zincirine RBAC enforcement eklemek.


## Kapsamlı Uygulama Görevleri (Backlog)

> Aşağıdaki görevler, RBAC’i tasarımdan üretim kalitesine taşımak için önceliklendirilmiştir.

### Faz 1 — Kritik Güvenlik Kapanışları (hemen)

- [x] **G1.1** `RolesGuard` ile JWT kullanıcı modeli kontratını hizala (`user.role` merkezli).
- [x] **G1.2** `RolesGuard`’ı global guard zincirine ekle.
- [x] **G1.3** Rol hiyerarşisini guard içinde standartlaştır (`ADMIN > MANAGER > OPERATOR > VIEWER`).
- [x] **G1.4** Kritik controller’larda sınıf/metot seviyesinde `@Roles` anotasyonlarını başlat.

### Faz 2 — Rol Sözlüğü Tekilleştirme (kısa vade)

- [ ] **G2.1** Prisma `UserRole` ile shared role enum için tek canonical sözlük kararı al.
- [ ] **G2.2** Auth payload (`JwtPayload`), request user tipi ve frontend user tipini canonical role sözlüğüne geçir.
- [ ] **G2.3** Legacy role alias’larını (varsa) migration planı ile kaldır.

### Faz 3 — Yetki Matrisi ve Uygulama Kapsamı (kısa/orta vade)

- [ ] **G3.1** Modül bazlı yetki matrisi oluştur (stok, üretim, satınalma, satış, finans).
- [ ] **G3.2** Tüm controller endpointlerini yetki matrisine göre `@Roles` ile işaretle.
- [ ] **G3.3** “Sadece okuma” ve “durum değiştirme” aksiyonlarını ayrı rollerle sınırla.

### Faz 4 — Frontend Role-Aware Deneyim (orta vade)

- [ ] **G4.1** Route-level guard (sayfa bazlı) ekle.
- [ ] **G4.2** Action-level guard (buton/işlem bazlı) ekle.
- [ ] **G4.3** Yetkisiz erişim için standart UX (403 ekranı + yönlendirme) tanımla.

### Faz 5 — Doğrulama ve Operasyonel Kalite (orta vade)

- [ ] **G5.1** `RolesGuard` için unit testleri yaz (hiyerarşi, yok rol, public endpoint davranışı).
- [ ] **G5.2** Kritik endpointler için rol bazlı entegrasyon/e2e testleri ekle.
- [ ] **G5.3** AuthZ denemeleri için audit log event alanlarını standardize et.
