namespace SepeNatural.Integration.Providers;

using SepeNatural.Integration.Contracts;

/// <summary>
/// Generates realistic mock data representing SepeNatural's natural product inventory.
/// Deterministic: same seed = same data, enabling consistent testing.
/// </summary>
public static class MockStockDataGenerator
{
    private static readonly string[] ProductPrefixes = {
        "Organik", "Doğal", "Saf", "Taze", "Ev Yapımı", "Geleneksel",
        "Yöresel", "El Yapımı", "Katkısız", "Takviye"
    };

    private static readonly string[] ProductCategories = {
        "Bal", "Pekmez", "Zeytinyağı", "Baharat", "Kuruyemiş",
        "Çay", "Bitki Çayı", "Sabun", "Krem", "Yağ",
        "Reçel", "Sirke", "Sos", "Tahin", "Helva",
        "Pollen", "Propolis", "Arı Sütü", "Toz Karışım", "Macun"
    };

    private static readonly string[] ProductDetails = {
        "500g", "1kg", "250ml", "500ml", "1L", "100g",
        "200g", "750ml", "2kg", "50ml", "150g", "300g"
    };

    private static readonly string[] WarehouseCodes = { "WH-01", "WH-02", "WH-03" };

    private static readonly string[] GroupCodes = {
        "GIDA-BAL", "GIDA-PKM", "GIDA-YAG", "GIDA-BHR", "GIDA-KYM",
        "ICECEK-CAY", "ICECEK-BIT", "KZMT-SBN", "KZMT-KRM", "KZMT-YAG",
        "GIDA-RCL", "GIDA-SRK", "GIDA-SOS", "GIDA-THN", "GIDA-HLV",
        "TKVYE-PLN", "TKVYE-PRP", "TKVYE-ARS", "TKVYE-TOZ", "TKVYE-MCN"
    };

    private static readonly string[] ShelfPrefixes = { "A", "B", "C", "D", "E", "F" };

    private static readonly string[] Units = { "KG", "LT", "AD", "GR", "ML" };

    private static readonly string[] Currencies = { "TRY", "TRY", "TRY", "USD", "EUR" };

    private static List<StockItemDto>? _cachedItems;
    private static readonly object _lock = new();

    public static IReadOnlyList<StockItemDto> GenerateAll(int count = 1200)
    {
        if (_cachedItems != null) return _cachedItems;

        lock (_lock)
        {
            if (_cachedItems != null) return _cachedItems;

            var random = new Random(42); // Deterministic seed
            var items = new List<StockItemDto>(count);

            for (int i = 0; i < count; i++)
            {
                var categoryIndex = i % ProductCategories.Length;
                var prefix = ProductPrefixes[random.Next(ProductPrefixes.Length)];
                var category = ProductCategories[categoryIndex];
                var detail = ProductDetails[random.Next(ProductDetails.Length)];
                var warehouse = WarehouseCodes[random.Next(WarehouseCodes.Length)];

                var sku = $"SPN-{categoryIndex:D2}-{(i + 1):D5}";
                var barcode = $"869{random.Next(1000000000, 1999999999)}";
                var shelfCode = $"{ShelfPrefixes[random.Next(ShelfPrefixes.Length)]}-{random.Next(1, 20):D2}-{random.Next(1, 6):D2}";

                var stockAmount = Math.Round((decimal)(random.NextDouble() * 500), 2);
                var criticalLevel = Math.Round(stockAmount * 0.1m + (decimal)(random.NextDouble() * 10), 2);
                var purchasePrice = Math.Round((decimal)(random.NextDouble() * 450 + 10), 2);
                var salePrice = Math.Round(purchasePrice * (1.15m + (decimal)(random.NextDouble() * 0.35)), 2);

                items.Add(new StockItemDto
                {
                    Sku = sku,
                    ProductName = $"{prefix} {category} - {detail}",
                    Barcode = barcode,
                    GroupCode = GroupCodes[categoryIndex],
                    UnitOfMeasure = Units[random.Next(Units.Length)],
                    StockAmount = stockAmount,
                    CriticalLevel = criticalLevel,
                    PurchasePrice = purchasePrice,
                    SalePrice = salePrice,
                    WarehouseCode = warehouse,
                    ShelfCode = shelfCode,
                    IsActive = random.NextDouble() > 0.08, // 92% active
                    LastUpdated = DateTime.UtcNow.AddDays(-random.Next(0, 90)).AddHours(-random.Next(0, 24)),
                    Currency = Currencies[random.Next(Currencies.Length)]
                });
            }

            _cachedItems = items;
            return _cachedItems;
        }
    }
}
