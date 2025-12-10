# ⚡ INÍCIO RÁPIDO (5 minutos)

## 🎯 Seu Objetivo
Cadastrar o ESP32 como sensor no frontend para registrar e visualizar leituras em tempo real.

## ✅ Resumo da Solução

```
┌─ Passo 1: Preparar ESP32 (editar WiFi)
├─ Passo 2: Iniciar Backend
├─ Passo 3: Iniciar Frontend
├─ Passo 4: Fazer Login
├─ Passo 5: Criar Ambiente
├─ Passo 6: Cadastrar Sensor ESP32
└─ Passo 7: Visualizar Dados
```

---

## 🚀 Passo 1: Preparar o ESP32

**Arquivo:** `Iot/include/credentials.h`

Edite com seu WiFi:
```cpp
#define WIFI_SSID "seu_wifi_aqui"
#define WIFI_PASS "sua_senha_aqui"
```

**Depois:** Fazer upload via PlatformIO
- Conectar ESP32 por USB
- Clicar em "Upload" (Ctrl+Shift+U)
- Serial Monitor deve mostrar: "Conectado ao MQTT"

---

## 💻 Passo 2: Iniciar Backend

**Terminal 1:**
```bash
cd backend
npm run dev
```

✅ Esperado:
```
✓ Conectado ao broker MQTT: mqtt://broker.hivemq.com
✓ Inscrito no tópico: ProjetoFinalIot
🚀 Servidor rodando em http://localhost:3000
```

---

## 🎨 Passo 3: Iniciar Frontend

**Terminal 2:**
```bash
cd front-ambiental
npm start
```

✅ Abre automaticamente em: `http://localhost:3000`

---

## 🔐 Passo 4: Fazer Login

1. Digite email e senha
2. Clique em "Entrar"

(Criar usuário se necessário no Register)

---

## 🏢 Passo 5: Criar um Ambiente (Sala)

**Menu → Ambientes → "+ Novo Ambiente"**

```
Nome:               Sala de Servidores
Descrição:          Monitoramento ambiental
Localização:        Andar 2
Temperatura Ideal:  25
Umidade Ideal:      60
```

✅ Clique: **Salvar**

---

## 📡 Passo 6: Cadastrar Sensor ESP32

**Menu → Sensores → "+ Novo Sensor"**

```
Nome:        ESP32-Sala1
Tipo:        temperatura_umidade
Modelo:      ESP32-DEV
Descrição:   Sensor IoT para monitoramento
Ambiente:    Sala de Servidores ← (que você criou)
Status:      ativo
```

✅ Clique: **Salvar**

---

## 🌡️ Passo 7: Visualizar Dados

**Menu → Monitoramento**

Você deve ver:
```
╔════════════════════════════╗
║ ESP32-Sala1  [🟢 Ativo]   ║
╠════════════════════════════╣
║ 🌡️ Temperatura:  28.5°C    ║
║ 💧 Umidade:      65.2%     ║
║ ⏰ Agora                    ║
╚════════════════════════════╝
```

Se não aparecer em 30s, aguarde mais 5-10 segundos (primeira leitura leva tempo).

---

## ✨ PRONTO! 🎉

Seus dados estão sendo:
- ✅ Coletados pelo ESP32
- ✅ Enviados via MQTT
- ✅ Salvos no banco de dados
- ✅ Exibidos em tempo real no frontend

---

## 📊 Fluxo Que Acontece Automaticamente

```
⏱️ A cada 5 segundos:

1. ESP32 lê sensores
2. ESP32 publica via MQTT
3. Backend recebe mensagem
4. Backend salva no banco
5. Frontend busca dados
6. Dashboard atualiza
```

---

## 📈 Próximas Ações

| Ação | Onde |
|------|------|
| Ver histórico | Menu → Histórico |
| Criar alertas | Menu → Alertas |
| Gerenciar sensores | Menu → Sensores |
| Gerenciar ambientes | Menu → Ambientes |
| Ver todas as leituras | Menu → Leituras |

---

## 🐛 Se Algo Não Funcionar

**Nenhum dado aparece?**
- ✓ Backend está rodando? (`npm run dev`)
- ✓ Sensor foi cadastrado no Frontend?
- ✓ Ambiente foi criado e associado?
- ✓ Aguarde 10 segundos (primeira leitura)

**ESP32 não conecta WiFi?**
- ✓ SSID está correto em `credentials.h`?
- ✓ Senha está correta?
- ✓ Está próximo do roteador?

**Frontend não conecta ao Backend?**
- ✓ Backend está em `http://localhost:3000`?
- ✓ Terminal de Backend mostra "🚀 Servidor rodando"?

---

## 📚 Para Mais Detalhes

Leia os documentos completos:

1. **README_SISTEMA_IOT.md** - Visão geral
2. **INDICE_DOCUMENTACAO.md** - Índice de docs
3. **GUIA_PRATICO_ESP32.md** - Detalhes completos
4. **FLUXO_CADASTRO_ESP32.md** - Explicação técnica

---

## 🎓 Conceitos Importantes

**ESP32:** Microcontrolador IoT que lê sensores  
**MQTT:** Protocolo para enviar dados  
**Backend:** Recebe dados e salva no banco  
**Frontend:** Exibe dados em interface visual  
**Ambiente:** Sala ou local a monitorar  
**Sensor:** Dispositivo (ESP32) que mede  
**Leitura:** Dado coletado (temperatura, umidade)

---

## ⏱️ Cronograma

- **5 min:** Este guia
- **10 min:** Configurar ESP32 e Backend
- **5 min:** Iniciar Frontend
- **5 min:** Cadastrar Ambiente e Sensor
- **Total: 25 minutos até dados reais!**

---

## ✅ Checklist

- [ ] Editar credentials.h
- [ ] Upload ESP32
- [ ] Backend rodando (`npm run dev`)
- [ ] Frontend rodando (`npm start`)
- [ ] Fazer login
- [ ] Criar Ambiente
- [ ] Cadastrar Sensor ESP32
- [ ] Dados aparecem em Monitoramento

---

**Status:** ✅ Pronto para Usar  
**Tempo Total:** 25 minutos  
**Dificuldade:** ⭐ Iniciante  

🚀 **Vamos começar!**
