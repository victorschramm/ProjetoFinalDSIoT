#!/bin/bash
# Script de Verificação Rápida do Sistema IoT

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   VERIFICAÇÃO RÁPIDA: Sistema IoT com ESP32 + Frontend        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_mark() {
    echo -e "${GREEN}✓${NC} $1"
}

error_mark() {
    echo -e "${RED}✗${NC} $1"
}

warning_mark() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "1. VERIFICAÇÃO DE ARQUIVOS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar arquivos essenciais
if [ -f "Iot/include/credentials.h" ]; then
    check_mark "Iot/include/credentials.h encontrado"
else
    error_mark "Iot/include/credentials.h NÃO encontrado"
fi

if [ -f "Iot/src/main.cpp" ]; then
    check_mark "Iot/src/main.cpp encontrado"
else
    error_mark "Iot/src/main.cpp NÃO encontrado"
fi

if [ -f "backend/src/config/mqtt.js" ]; then
    check_mark "backend/src/config/mqtt.js encontrado"
else
    error_mark "backend/src/config/mqtt.js NÃO encontrado"
fi

if [ -f "front-ambiental/src/pages/Sensores.jsx" ]; then
    check_mark "front-ambiental/src/pages/Sensores.jsx encontrado"
else
    error_mark "front-ambiental/src/pages/Sensores.jsx NÃO encontrado"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "2. VERIFICAÇÃO DE DEPENDÊNCIAS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_mark "Node.js instalado ($NODE_VERSION)"
else
    error_mark "Node.js NÃO instalado"
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_mark "npm instalado ($NPM_VERSION)"
else
    error_mark "npm NÃO instalado"
fi

# Verificar Backend dependencies
if [ -f "backend/node_modules/express/package.json" ]; then
    check_mark "Backend dependencies instaladas (express)"
else
    warning_mark "Backend node_modules pode não estar completo"
fi

# Verificar Frontend dependencies
if [ -f "front-ambiental/node_modules/react/package.json" ]; then
    check_mark "Frontend dependencies instaladas (react)"
else
    warning_mark "Frontend node_modules pode não estar completo"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "3. VERIFICAÇÃO DE CONFIGURAÇÃO"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar WiFi configurado
if grep -q "WIFI_SSID" Iot/include/credentials.h; then
    if grep -q "seu_wifi" Iot/include/credentials.h; then
        warning_mark "WiFi SSID ainda é 'seu_wifi' (não configurado)"
    else
        check_mark "WiFi SSID configurado"
    fi
else
    error_mark "WiFi SSID não encontrado em credentials.h"
fi

# Verificar MQTT no backend
if grep -q "broker.hivemq.com" backend/src/config/mqtt.js; then
    check_mark "MQTT Broker configurado (broker.hivemq.com)"
else
    warning_mark "MQTT Broker pode estar configurado diferente"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "4. DOCUMENTAÇÃO CRIADA"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar documentação
docs=(
    "RESUMO_CADASTRO_ESP32.md"
    "GUIA_PRATICO_ESP32.md"
    "FLUXO_CADASTRO_ESP32.md"
    "EXEMPLOS_API_ESP32.http"
    "DIAGRAMA_VISUAL_ESP32.txt"
    "INDICE_DOCUMENTACAO.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        check_mark "Documento criado: $doc"
    else
        error_mark "Documento FALTANDO: $doc"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "5. PRÓXIMOS PASSOS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "✓ Para começar:"
echo "  1. Editar: Iot/include/credentials.h (WiFi)"
echo "  2. Upload: ESP32 via PlatformIO"
echo "  3. Terminal 1: cd backend && npm run dev"
echo "  4. Terminal 2: cd front-ambiental && npm start"
echo "  5. Abrir: http://localhost:3000"
echo ""

echo "✓ Para mais informações:"
echo "  Leia: INDICE_DOCUMENTACAO.md"
echo "  Ou:   RESUMO_CADASTRO_ESP32.md"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "VERIFICAÇÃO CONCLUÍDA"
echo "═══════════════════════════════════════════════════════════════"
