# Implementação do Buzzer — ManutAI IoT

## Sumário

1. [Visão Geral](#visão-geral)
2. [Hardware Utilizado](#hardware-utilizado)
3. [Escolha da Porta GPIO](#escolha-da-porta-gpio)
4. [Arquitetura da Solução](#arquitetura-da-solução)
5. [Lógica dos Bips](#lógica-dos-bips)
6. [Etapas de Implementação](#etapas-de-implementação)
7. [Erros de Produção](#erros-de-produção)
8. [Fluxo Completo](#fluxo-completo)

---

## Visão Geral

O buzzer foi integrado ao ESP32 para fornecer **alertas sonoros em tempo real** quando os sensores DHT11 detectam temperatura ou umidade fora dos limites ideais configurados no sistema.

A solução foi projetada com três comportamentos distintos:

| Evento | Comportamento |
|---|---|
| Sistema ligado e online (MQTT conectado) | 1 bip contínuo de 2 segundos |
| Leitura **abaixo** do limite | 2 bips curtos |
| Leitura **acima** do limite | 3 bips curtos |

> O alerta sonoro respeita as mesmas regras das notificações do sistema: dispara **apenas uma vez por alerta ativo**, evitando poluição sonora.

---

## Hardware Utilizado

- **Buzzer ativo 12mm 5V**
- Conectado diretamente ao GPIO do ESP32 (sem transistor driver)

> **Nota importante:** O ESP32 opera a **3,3V** enquanto o buzzer é especificado para **5V**. A operação direta a 3,3V funciona com volume reduzido. Para volume máximo, recomenda-se um transistor NPN (BC547 ou 2N2222) como driver de corrente entre o GPIO e o buzzer.

---

## Escolha da Porta GPIO

Durante a implementação, três GPIOs foram considerados:

| GPIO | Status | Motivo |
|---|---|---|
| 16 / 17 | Descartados | Não disponíveis no modelo de ESP32 utilizado |
| 5 | Descartado | Strapping pin — controla timing do SDIO durante o boot |
| **18** | **Escolhido** | Livre, sem restrições, não é strapping pin, suporta output digital |

### Por que evitar strapping pins para o buzzer?

Os strapping pins (GPIO 0, 2, 5, 12, 15) são lidos pelo ESP32 **durante o boot** para configurar parâmetros de inicialização. Se um buzzer estiver conectado e puxar o pino para um nível inesperado durante essa janela, pode impedir o boot ou alterar o modo de operação do chip.

O GPIO 18 não tem essa restrição e é ideal para periféricos de saída digital.

---

## Arquitetura da Solução

A implementação é dividida entre **backend (Node.js)** e **firmware (ESP32)**:

```
Sensor DHT11
    │
    │  leitura JSON via MQTT
    ▼
Backend Node.js
    │  verifica limites no banco de dados
    │  se alerta NOVO → publica em manutai/buzzer
    ▼
Broker HiveMQ Cloud (manutai/buzzer)
    │
    │  comando: "2" ou "3"
    ▼
ESP32 — acumula por 300ms → executa o bip de maior criticidade
    │
    ▼
Buzzer GPIO 18
```

### Tópicos MQTT utilizados

| Tópico | Direção | Payload | Finalidade |
|---|---|---|---|
| `manutai/leitura` | ESP32 → Backend | JSON | Envio de leituras dos sensores |
| `manutai/config` | Backend → ESP32 | String (ms) | Ajuste do intervalo de leitura |
| `manutai/buzzer` | Backend → ESP32 | `"2"` ou `"3"` | Comando de alerta sonoro |

---

## Lógica dos Bips

### Regra de disparo

O backend chama `verificarEGerarAlerta()` a cada leitura recebida. A função:

1. Compara o valor com o limite ideal do ambiente (mais/menos a margem configurada)
2. Verifica se **já existe um alerta pendente** para aquele sensor e tipo
3. Se não existir → cria o alerta **e** publica o comando de bip

```
valor > (limiteIdeal + margem)  →  acima do limite  →  publica "3"
valor < (limiteIdeal - margem)  →  abaixo do limite →  publica "2"
alerta já existe (pendente)     →  nenhuma ação     →  sem bip
```

> A verificação de alerta existente é o mesmo mecanismo que controla as notificações por e-mail — o controle sonoro e o controle de notificação compartilham o mesmo guard, garantindo comportamento consistente.

### Prioridade entre alertas simultâneos

Temperatura e umidade geram leituras separadas com ~100ms de intervalo entre elas. Se ambas estiverem fora do limite ao mesmo tempo, o backend publicaria dois comandos em `manutai/buzzer` em sequência rápida.

**Sem tratamento:** os dois bips tocariam em sequência (ex: 3 bips + 2 bips = 5 bips confusos).

**Com debounce de prioridade (implementado):**

```
Temperatura acima → backend envia "3" → bipPendente = 3, timer = agora
Umidade abaixo   → backend envia "2" → bipPendente = max(3, 2) = 3  ← não muda
300ms depois     → executa bip(3)    → apenas 3 bips tocam
```

A regra é: **3 bips sempre prevalece sobre 2 bips**. Estar acima do limite é considerado o estado mais crítico.

### Tabela de prioridade

| Situação | Bips enviados | Bip executado |
|---|---|---|
| Somente temperatura acima | "3" | 3 bips |
| Somente umidade abaixo | "2" | 2 bips |
| Temperatura acima + Umidade abaixo | "3" e "2" | **3 bips** |
| Temperatura abaixo + Umidade acima | "2" e "3" | **3 bips** |
| Temperatura acima + Umidade acima | "3" e "3" | 3 bips |
| Temperatura abaixo + Umidade abaixo | "2" e "2" | 2 bips |

---

## Etapas de Implementação

### 1. Backend — `mqtt.js`

- Adicionada variável `acima` em `verificarEGerarAlerta()` para rastrear a direção do alerta
- Após criação de alerta novo (`!alertaExistente`), publica em `manutai/buzzer`:
  - `"3"` se o valor estiver acima do limite
  - `"2"` se estiver abaixo

### 2. Firmware ESP32 — `Iot/src/main.cpp`

- Definido `BUZZER_PIN 18` e `mqtt_topic_buzzer`
- Adicionada função `bip(int vezes)` com temporização por `delay()`
- `mqttCallback()` atualizado para rotear por tópico (`strcmp`)
- Sistema de debounce com `bipPendente` e `bipRecebidoEm`
- Bip de boot (100ms) adicionado no `setup()` logo após inicialização do pino
- Bip de inicialização online (2s) disparado na primeira conexão MQTT bem-sucedida

### 3. Arquivo de credenciais — `Iot/include/credentials.h`

- Arquivo estava ausente no projeto, causaria falha de compilação
- Criado com credenciais WiFi e MQTT separadas do código-fonte

---

## Erros de Produção

### Erro 1 — Buzzer apitando constantemente ao ligar

**Sintoma:** Ao fazer upload do firmware, o buzzer emitia tom contínuo sem parar desde o momento em que o ESP32 era energizado.

**Causa:** Confusão entre buzzer **ativo HIGH** e **ativo LOW**. O código inicializava o pino com `LOW` (assumindo que seria o estado desligado), mas o buzzer ativo LOW interpreta `LOW` como sinal de ativação — ficando ligado continuamente.

**Diagnóstico:** Tom contínuo desde o boot, sem padrão de bips, indica que o GPIO está no nível de ativação do buzzer desde a inicialização.

**Correção:** Invertida toda a lógica de nível lógico:

```cpp
// Antes (incorreto para buzzer ativo LOW)
digitalWrite(BUZZER_PIN, HIGH);  // ligado
digitalWrite(BUZZER_PIN, LOW);   // desligado ← GPIO ficava aqui = buzzer ON

// Depois (corrigido e então revertido ao pedido do usuário)
digitalWrite(BUZZER_PIN, LOW);   // desligado (estado padrão)
digitalWrite(BUZZER_PIN, HIGH);  // ligado
```

> O estado final adotado foi `LOW = desligado / HIGH = ligado`, conforme preferência e comportamento do hardware específico utilizado.

---

### Erro 2 — Buzzer silencioso após correção (sem apitar em nenhum momento)

**Sintoma:** Após corrigir o erro anterior, o buzzer ficou completamente silencioso — nem o bip de inicialização de 2 segundos acontecia.

**Causa:** O bip de inicialização estava condicionado ao sucesso da **primeira conexão MQTT**. Se o broker MQTT demorava para responder, ou se havia algum problema de rede, o `primeiraConexao` nunca era consumido e o bip nunca disparava. Sem feedback sonoro, não havia como saber se era falha de hardware ou de conectividade.

**Correção:** Separação em dois momentos distintos de feedback sonoro:

```
Boot do ESP32
    └── setup() → bip de 100ms → confirma que o hardware funciona

Primeira conexão MQTT bem-sucedida
    └── reconnect() → bip de 2s → confirma que o sistema está online
```

---

### Erro 3 — Conflito de bips simultâneos

**Sintoma (potencial):** Quando temperatura e umidade disparam alertas ao mesmo tempo, o ESP32 recebe dois comandos MQTT em sequência rápida e executa os dois bips consecutivamente, gerando uma sequência confusa e mais longa do que o esperado.

**Causa:** A função `bip()` usa `delay()`, bloqueando o loop do ESP32. O `client.loop()` não é chamado durante a execução do bip, então o segundo comando fica na fila do broker e é processado logo após o primeiro bip terminar.

**Solução:** Implementado sistema de **debounce com prioridade**:

- `mqttCallback` não chama `bip()` diretamente — apenas armazena o valor em `bipPendente` (mantendo sempre o maior)
- O `loop()` aguarda **300ms** sem novos comandos antes de executar o bip
- Isso garante que todos os alertas simultâneos sejam recebidos antes de qualquer bip tocar
- Apenas o bip de maior criticidade é executado

```cpp
// Em mqttCallback — acumula sem executar
if (bips > bipPendente) bipPendente = bips;
bipRecebidoEm = millis();

// Em loop() — executa após debounce
if (bipPendente > 0 && millis() - bipRecebidoEm >= 300) {
  int b = bipPendente;
  bipPendente = 0;
  bip(b);
}
```

---

## Fluxo Completo

```
[ESP32 liga]
    │
    ├── setup(): inicializa GPIO 18 como OUTPUT, LOW (desligado)
    ├── setup(): bip de 100ms → hardware OK
    ├── setup_wifi(): conecta ao WiFi
    │
    └── loop(): primeira iteração sem MQTT
         │
         └── reconnect(): conecta ao HiveMQ Cloud
              │
              ├── subscribe(manutai/config)
              ├── subscribe(manutai/buzzer)
              └── primeiraConexao → bip de 2s → sistema ONLINE

[Durante operação]
    │
    ├── loop() a cada PUBLISH_INTERVAL ms:
    │    └── publica temperatura e umidade em manutai/leitura
    │
    └── Backend recebe leitura:
         ├── verifica limites do ambiente no banco
         │
         ├── [alerta já existe] → nenhuma ação
         │
         └── [alerta NOVO]
              ├── cria registro no banco (status: pendente)
              ├── envia notificação por e-mail
              └── publica em manutai/buzzer:
                   ├── "3" → acima do limite
                   └── "2" → abaixo do limite

[ESP32 recebe comando de bip]
    │
    ├── mqttCallback → bipPendente = max(atual, novo)
    ├── aguarda 300ms (janela de debounce)
    │
    └── loop() → executa bip(bipPendente) → apenas o mais crítico
```
