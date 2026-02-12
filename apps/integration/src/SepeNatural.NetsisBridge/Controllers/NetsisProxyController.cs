using Microsoft.AspNetCore.Mvc;
using SepeNatural.NetsisBridge.Contracts;
using SepeNatural.NetsisBridge.Services;

namespace SepeNatural.NetsisBridge.Controllers;

/// <summary>
/// Proxy controller that exposes Netsis operations as REST endpoints.
/// Called by the NestJS backend (NetsisBridgeAdapter).
/// </summary>
[ApiController]
[Route("api/netsis")]
public class NetsisProxyController : ControllerBase
{
    private readonly INetsisGateway _gateway;
    private readonly ILogger<NetsisProxyController> _logger;

    public NetsisProxyController(
        INetsisGateway gateway,
        ILogger<NetsisProxyController> logger)
    {
        _gateway = gateway;
        _logger = logger;
    }

    [HttpGet("health")]
    public async Task<IActionResult> Health()
    {
        var connected = await _gateway.TestConnectionAsync();
        return Ok(new { connected, version = "1.0.0-placeholder" });
    }

    [HttpGet("stock/{sku}")]
    public async Task<IActionResult> GetStock(string sku)
    {
        var result = await _gateway.GetStockAsync(sku);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("stock/batch")]
    public async Task<IActionResult> GetStockBatch([FromBody] BatchStockRequest request)
    {
        var result = await _gateway.GetStockBatchAsync(request.Skus);
        return Ok(result);
    }

    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] OrderRequest request)
    {
        var result = await _gateway.CreateOrderAsync(request);
        return Ok(result);
    }
}

public record BatchStockRequest(List<string> Skus);
