# Run this script untuk setup dan jalankan NutriScan dengan aman

Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🍎 NutriScan - Secure Backend Setup" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$NodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js tidak ditemukan!" -ForegroundColor Red
    Write-Host "   Download dari: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$NpmVersion = npm --version 2>$null
Write-Host "✅ Node.js: $NodeVersion" -ForegroundColor Green
Write-Host "✅ npm: $NpmVersion" -ForegroundColor Green
Write-Host ""

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file tidak ditemukan!" -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Write-Host "   Membuat .env dari .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env file dibuat" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  PENTING: Edit .env dan pastikan GEMINI_API_KEY sudah benar" -ForegroundColor Yellow
        
        $response = Read-Host "   Lanjut? (y/n)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "Dibatalkan" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "   Buat .env file dengan content:" -ForegroundColor Yellow
        Write-Host "   GEMINI_API_KEY=AIzaSyB8fv3baKrk2sl9rkctHa980eUK86IQ5d0" -ForegroundColor White
        exit 1
    }
}

Write-Host "⚠️  Checking .env configuration..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw

if ($envContent -match "YOUR_API_KEY_HERE") {
    Write-Host "❌ .env masih menggunakan placeholder!" -ForegroundColor Red
    Write-Host "   Edit .env dan ganti YOUR_API_KEY_HERE dengan actual API Key" -ForegroundColor Yellow
    exit 1
}

if ($envContent -notmatch "GEMINI_API_KEY") {
    Write-Host "❌ GEMINI_API_KEY tidak ditemukan di .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ .env sudah dikonfigurasi" -ForegroundColor Green
Write-Host ""

# Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "✅ Dependencies sudah terinstall" -ForegroundColor Green
}

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Setup Complete!" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Untuk menjalankan server:" -ForegroundColor Cyan
Write-Host "  $ npm start" -ForegroundColor White
Write-Host ""
Write-Host "Server akan berjalan di:" -ForegroundColor Cyan
Write-Host "  🌐 http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Buka di browser dan mulai gunakan NutriScan!" -ForegroundColor Green
Write-Host ""
