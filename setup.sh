#!/bin/bash
# NutriScan Quick Start Guide
# Run this script untuk setup dan jalankan NutriScan dengan aman

echo "═════════════════════════════════════════════════════════════"
echo "  🍎 NutriScan - Secure Backend Setup"
echo "═════════════════════════════════════════════════════════════"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js tidak ditemukan!"
    echo "   Download dari: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""

# Check .env file
if [ ! -f .env ]; then
    echo "⚠️  .env file tidak ditemukan!"
    if [ -f .env.example ]; then
        echo "   Membuat .env dari .env.example..."
        cp .env.example .env
        echo "✅ .env file dibuat"
        echo ""
        echo "⚠️  PENTING: Edit .env dan pastikan GEMINI_API_KEY sudah benar"
        read -p "   Lanjut? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Dibatalkan"
            exit 1
        fi
    else
        echo "   Buat .env file dengan content:"
        echo "   GEMINI_API_KEY=AIzaSyB8fv3baKrk2sl9rkctHa980eUK86IQ5d0"
        exit 1
    fi
fi

echo "⚠️  Checking .env configuration..."
if grep -q "YOUR_API_KEY_HERE" .env; then
    echo "❌ .env masih menggunakan placeholder!"
    echo "   Edit .env dan ganti YOUR_API_KEY_HERE dengan actual API Key"
    exit 1
fi

if ! grep -q "GEMINI_API_KEY" .env; then
    echo "❌ GEMINI_API_KEY tidak ditemukan di .env"
    exit 1
fi

echo "✅ .env sudah dikonfigurasi"
echo ""

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies sudah terinstall"
fi

echo ""
echo "═════════════════════════════════════════════════════════════"
echo "  ✅ Setup Complete!"
echo "═════════════════════════════════════════════════════════════"
echo ""
echo "Untuk menjalankan server:"
echo "  $ npm start"
echo ""
echo "Server akan berjalan di:"
echo "  🌐 http://localhost:3000"
echo ""
echo "Buka di browser dan mulai gunakan NutriScan!"
echo ""
