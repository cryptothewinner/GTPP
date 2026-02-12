using Microsoft.AspNetCore.Mvc;
using SepeNatural.Integration.Contracts;

namespace SepeNatural.Integration.Controllers;

[ApiController]
[Route("api/netsis/[controller]")]
public class StockController : ControllerBase
{
    private readonly IStockProvider _stockProvider;
    private readonly ILogger<StockController> _logger;

    public StockController(IStockProvider stockProvider, ILogger<StockController> logger)
    {
        _stockProvider = stockProvider;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated stock list with filtering and sorting.
    /// Mirrors the data shape that Netsis would return.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(StockPagedResponse), 200)]
    public async Task<ActionResult<StockPagedResponse>> GetStocks(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 100,
        [FromQuery] string? filter = null,
        [FromQuery] string? sortField = null,
        [FromQuery] string? sortDirection = "asc",
        [FromQuery] string? warehouseCode = null,
        [FromQuery] bool? isActive = null,
        CancellationToken ct = default)
    {
        var request = new StockQueryRequest
        {
            Page = page,
            Limit = limit,
            FilterText = filter,
            SortField = sortField,
            SortDirection = sortDirection,
            WarehouseCode = warehouseCode,
            IsActive = isActive
        };

        var result = await _stockProvider.GetStocksAsync(request, ct);
        return Ok(result);
    }

    /// <summary>
    /// Get a single stock item by SKU.
    /// </summary>
    [HttpGet("{sku}")]
    [ProducesResponseType(typeof(StockItemDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<StockItemDto>> GetStockBySku(
        string sku,
        CancellationToken ct = default)
    {
        var item = await _stockProvider.GetStockBySkuAsync(sku, ct);
        if (item == null) return NotFound(new { message = $"Stock item '{sku}' not found" });
        return Ok(item);
    }

    /// <summary>
    /// Health check for the Netsis bridge.
    /// </summary>
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            status = "healthy",
            provider = _stockProvider.GetType().Name,
            timestamp = DateTime.UtcNow,
            mockItemCount = Providers.MockStockDataGenerator.GenerateAll().Count
        });
    }
}
