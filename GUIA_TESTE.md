# Instruções para Teste da Aplicação

## 1. Iniciar o Backend

```bash
cd backend
npm install  # Se não tiver instalado as dependências
npm run dev  # Ou: node src/server.js
```

Será exibido algo como:
```
✓ Banco de dados sincronizado
✓ Conectado ao broker MQTT: mqtt://broker.hivemq.com
✓ Inscrito no tópico: ProjetoFinalIot
🚀 Servidor rodando em http://localhost:3000
```

## 2. Iniciar o Frontend

```bash
cd front-ambiental
npm install  # Se não tiver instalado as dependências
npm start
```

O navegador abrirá em `http://localhost:3000` (mas isso conflita com o backend!)
**Solução**: Mude para a porta 3001 no arquivo `.env`:

```bash
REACT_APP_API_URL=http://localhost:3000/api
PORT=3001
```

Então acesse em `http://localhost:3001`

## 3. Criar Dados de Teste

### A. Login/Cadastro
1. Abra `http://localhost:3001`
2. Clique em "Cadastro" ou use credenciais de teste:
   - Email: `admin@test.com`
   - Senha: `senha123`

### B. Criar Ambientes
1. Vá para **Configurações > Ambientes**
2. Clique em **"+ Novo Ambiente"**
3. Preencha:
   - Nome: "Sala Principal"
   - Localização: "Primeiro andar"
   - Temperatura Ideal: 22
   - Umidade Ideal: 50
4. Clique em **Cadastrar**

### C. Criar Dispositivos ESP
1. Vá para **Configurações > Dispositivos ESP**
2. Clique em **"+ Novo Dispositivo"**
3. Preencha:
   - Nome: "ESP32 Sala"
   - Tipo: ESP32
   - Tópico MQTT: `ProjetoFinalIot` (mesmo do seu ESP)
   - MAC Address: (deixe em branco ou coloque o do seu ESP)
4. Clique em **Cadastrar**

### D. Criar Sensores
1. Vá para **Configurações > Sensores**
2. Clique em **"+ Novo Sensor"**
3. Preencha:
   - Nome: "Temperatura Sala"
   - Tipo: "🌡️ Temperatura"
   - Modelo: "DHT22"
   - Ambiente: "Sala Principal" (aqui aparecerá o ambiente criado)
   - Dispositivo: "ESP32 Sala" (aqui aparecerá o dispositivo)
4. Clique em **Cadastrar**

## 4. Enviar Dados do ESP32

Configure no `Iot/include/credentials.h`:

```cpp
#define WIFI_SSID "sua_rede_wifi"
#define WIFI_PASS "sua_senha_wifi"
```

O ESP enviará JSON no tópico `ProjetoFinalIot`:

```json
{
  "Temp": 25.5,
  "Umidade": 60,
  "Potenciometro": 75
}
```

## 5. Visualizar Dados

- **Dashboard**: Mostra resumo com estatísticas
- **Tempo Real**: Monitoramento em tempo real (atualiza a cada 5s)
- **Histórico**: Gráficos com dados dos últimos dias
- **Leituras**: Lista completa de todas as leituras

## Troubleshooting

### Problema: "Ambientes não aparecem no formulário"
**Solução**: 
1. Verifique se há ambientes criados (vá em Ambientes)
2. Se não tiver, crie um novo ambiente
3. Recarregue a página (F5)

### Problema: "Erro ao conectar ao servidor"
**Solução**:
1. Verifique se o backend está rodando na porta 3000
2. Verifique se há erro no console do node
3. Tente: `npm run dev` em vez de `node src/server.js`

### Problema: "MQTT não conecta"
**Solução**:
1. Verifique sua conexão de internet
2. Tente com um broker público: `broker.hivemq.com` (padrão)
3. Verifique o tópico MQTT (deve ser igual ao do ESP)

### Problema: "Sensores não recebem leituras"
**Solução**:
1. Verifique se o ESP está enviando dados (serial monitor)
2. Verifique se o tópico MQTT no cadastro é exatamente igual ao do ESP
3. Verifique se o Dispositivo foi cadastrado com o tópico correto
4. Verifique o status do Dispositivo (deve ser "ativo")

