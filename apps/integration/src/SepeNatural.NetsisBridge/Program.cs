using SepeNatural.Integration.Contracts;
using SepeNatural.Integration.Providers;

var builder = WebApplication.CreateBuilder(args);

// --- Service Registration ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "SepeNatural Integration Bridge", Version = "v1" });
});

// Stock Provider: Decoupled via interface.
// Switch to NetsisStockProvider when real DLL is available.
var useRealNetsis = builder.Configuration.GetValue<bool>("StockProvider:UseReal");
if (useRealNetsis)
{
    builder.Services.AddSingleton<IStockProvider, NetsisStockProvider>();
}
else
{
    builder.Services.AddSingleton<IStockProvider, MockStockProvider>();
}

// CORS for NestJS API consumption
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowApi", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3001", // NestJS API (Default if configured)
                "http://localhost:4000", // Current NestJS API Port
                "http://localhost:3000"  // Next.js Dev
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// --- Middleware Pipeline ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowApi");
app.MapControllers();

app.Run();
