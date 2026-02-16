# Prisma Type Analizi ve Başlatılan İyileştirmeler (2026-02-16)

## Amaç
API `type-check` sürecinde görülen Prisma tip hatalarının kök nedenini doğrulamak ve hızlıca uygulanabilir bir başlangıç iyileştirmesi yapmak.

## Çalıştırılan doğrulamalar
- `pnpm run type-check`
- `pnpm --filter @sepenatural/api type-check`
- `pnpm --filter @sepenatural/api prisma:generate`
- Prisma şema enumları ve `@prisma/client` importları için kod taraması

## Bulgular

### 1) Birincil kırılma: `prisma generate` bağımlılığı type-check öncesi garanti edilmiyordu
- API tarafındaki enum/type importları (`MaterialType`, `BPRole`, `POStatus` vb.) Prisma şemasında tanımlı.
- Ancak kök type-check akışında `prisma generate` zorunlu adım değildi.
- Sonuç: Özellikle temiz CI/agent ortamlarında `@prisma/client` tipleri güncel üretilmeden type-check başladığında çok sayıda “has no exported member” hatası alınıyor.

### 2) Bulguların doğrulanması
- `pnpm --filter @sepenatural/api type-check` komutu, `prisma generate` sonrası başarılı çalışıyor.
- Bu da tip isimlerinin şema ile tamamen uyumsuz olmasından çok, üretim (generate) adımının kalite kapısına bağlanmaması sorununa işaret ediyor.

## Başlatılan iyileştirme

### Uygulanan değişiklikler
1. Kök `type-check` scripti, `db:generate` sonrası çalışacak şekilde güncellendi.
2. API paketine `pretype-check` eklendi, böylece API type-check çağrıları her seferinde generate ile başlar.

## Sonraki teknik adımlar (öneri)
1. **Kalıcı kontrol:** `prisma generate` sonrası `pnpm --filter @sepenatural/api type-check` adımını CI’da fail-fast tutmak.
2. **Kontrat raporu:** Şemadaki enumlar ile kodda kullanılan enum/type importlarını karşılaştıran script (drift report) eklemek.
3. **İkinci faz:** Prisma namespace özel tip kullanımlarını (`Prisma.*`) Prisma 6 tip yapısına göre otomatik/yarı otomatik sadeleştirmek.

## Kısa sonuç
Şu aşamada en hızlı ve etkili kazanım, type-check öncesinde Prisma client üretimini zorunlu hale getirmektir. Bu adım uygulandı; sonraki fazda import/type drift raporlaması eklenerek sürdürülebilirlik artırılmalıdır.
