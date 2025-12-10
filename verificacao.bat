@echo off
REM Script de Verificação Rápida do Sistema IoT (Windows)
REM Compatível com: Windows 7+, PowerShell 5.1+

setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   VERIFICAÇÃO RÁPIDA: Sistema IoT com ESP32 + Frontend        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo.
echo ═══════════════════════════════════════════════════════════════
echo 1. VERIFICAÇÃO DE ARQUIVOS
echo ═══════════════════════════════════════════════════════════════
echo.

setlocal enabledelayedexpansion
set "erros=0"

if exist "Iot\include\credentials.h" (
    echo ✓ Iot\include\credentials.h encontrado
) else (
    echo ✗ Iot\include\credentials.h NÃO encontrado
    set /a erros+=1
)

if exist "Iot\src\main.cpp" (
    echo ✓ Iot\src\main.cpp encontrado
) else (
    echo ✗ Iot\src\main.cpp NÃO encontrado
    set /a erros+=1
)

if exist "backend\src\config\mqtt.js" (
    echo ✓ backend\src\config\mqtt.js encontrado
) else (
    echo ✗ backend\src\config\mqtt.js NÃO encontrado
    set /a erros+=1
)

if exist "front-ambiental\src\pages\Sensores.jsx" (
    echo ✓ front-ambiental\src\pages\Sensores.jsx encontrado
) else (
    echo ✗ front-ambiental\src\pages\Sensores.jsx NÃO encontrado
    set /a erros+=1
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo 2. VERIFICAÇÃO DE DEPENDÊNCIAS
echo ═══════════════════════════════════════════════════════════════
echo.

where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo ✓ Node.js instalado (!NODE_VERSION!)
) else (
    echo ✗ Node.js NÃO instalado
    set /a erros+=1
)

where npm >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo ✓ npm instalado (!NPM_VERSION!)
) else (
    echo ✗ npm NÃO instalado
    set /a erros+=1
)

if exist "backend\node_modules\express\package.json" (
    echo ✓ Backend dependencies instaladas (express)
) else (
    echo ⚠ Backend node_modules pode não estar completo
)

if exist "front-ambiental\node_modules\react\package.json" (
    echo ✓ Frontend dependencies instaladas (react)
) else (
    echo ⚠ Frontend node_modules pode não estar completo
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo 3. VERIFICAÇÃO DE CONFIGURAÇÃO
echo ═══════════════════════════════════════════════════════════════
echo.

findstr /m "WIFI_SSID" "Iot\include\credentials.h" >nul 2>nul
if %errorlevel% equ 0 (
    findstr "seu_wifi" "Iot\include\credentials.h" >nul 2>nul
    if %errorlevel% equ 0 (
        echo ⚠ WiFi SSID ainda é 'seu_wifi' ^(não configurado^)
    ) else (
        echo ✓ WiFi SSID configurado
    )
) else (
    echo ✗ WiFi SSID não encontrado em credentials.h
)

findstr "broker.hivemq.com" "backend\src\config\mqtt.js" >nul 2>nul
if %errorlevel% equ 0 (
    echo ✓ MQTT Broker configurado (broker.hivemq.com)
) else (
    echo ⚠ MQTT Broker pode estar configurado diferente
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo 4. DOCUMENTAÇÃO CRIADA
echo ═══════════════════════════════════════════════════════════════
echo.

set "docs[0]=RESUMO_CADASTRO_ESP32.md"
set "docs[1]=GUIA_PRATICO_ESP32.md"
set "docs[2]=FLUXO_CADASTRO_ESP32.md"
set "docs[3]=EXEMPLOS_API_ESP32.http"
set "docs[4]=DIAGRAMA_VISUAL_ESP32.txt"
set "docs[5]=INDICE_DOCUMENTACAO.md"

for /l %%i in (0,1,5) do (
    if exist "!docs[%%i]!" (
        echo ✓ Documento criado: !docs[%%i]!
    ) else (
        echo ✗ Documento FALTANDO: !docs[%%i]!
        set /a erros+=1
    )
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo 5. PRÓXIMOS PASSOS
echo ═══════════════════════════════════════════════════════════════
echo.

echo ✓ Para começar:
echo   1. Editar: Iot\include\credentials.h ^(WiFi^)
echo   2. Upload: ESP32 via PlatformIO
echo   3. Terminal 1: cd backend ^&^& npm run dev
echo   4. Terminal 2: cd front-ambiental ^&^& npm start
echo   5. Abrir: http://localhost:3000
echo.

echo ✓ Para mais informações:
echo   Leia: INDICE_DOCUMENTACAO.md
echo   Ou:   RESUMO_CADASTRO_ESP32.md
echo.

echo ═══════════════════════════════════════════════════════════════
if %erros% equ 0 (
    echo VERIFICAÇÃO CONCLUÍDA - TUDO OK!
) else (
    echo VERIFICAÇÃO CONCLUÍDA - !erros! PROBLEMA(S) ENCONTRADO(S)
)
echo ═══════════════════════════════════════════════════════════════
echo.

pause
