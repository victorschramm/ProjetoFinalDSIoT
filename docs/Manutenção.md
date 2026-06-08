# Sistema de Manutenção Preventiva — ManutAI IoT

## Sumário

1. [Visão Geral](#visão-geral)
2. [Arquivos Criados](#arquivos-criados)
3. [Arquivos Modificados](#arquivos-modificados)
4. [Model PreventiveMaintenance](#model-preventivemaintenance)
5. [Lógica de Contagem de Horas](#lógica-de-contagem-de-horas)
6. [Lógica de Sugestão por Alertas](#lógica-de-sugestão-por-alertas)
7. [API](#api)
8. [Interface — Manutenção Preventiva](#interface--manutenção-preventiva)
9. [Card no Dashboard](#card-no-dashboard)
10. [Fluxo Completo](#fluxo-completo)
11. [Regras e Decisões de Projeto](#regras-e-decisões-de-projeto)

---

## Visão Geral

Foi implementado um sistema de **manutenção baseada em uso** no ManutAI, diferente do sistema de alertas existente (que reage a falhas de temperatura e umidade).

O objetivo é simular o comportamento real de sistemas industriais, onde a manutenção é programada com base no **tempo de operação** do equipamento — e não apenas em falhas detectadas pelos sensores.

| Característica | Alerta de Falha (existente) | Manutenção Preventiva (novo) |
|---|---|---|
| Gatilho | Leitura fora do limite ideal | Horas de operação acumuladas |
| Gerado por | Sistema automático | Configurado pelo operador |
| Objetivo | Reagir a problema em curso | Prevenir problema antes que ocorra |
| Exemplo | Temperatura acima de 30°C | Limpeza de filtro após 100h de uso |

O sistema é **genérico e reutilizável**: pode monitorar qualquer tipo de ativo (máquinas, veículos, equipamentos industriais) sem alteração de código.

---

## Arquivos Criados

### Backend

| Arquivo | Descrição |
|---|---|
| `backend/src/models/PreventiveMaintenance.js` | Model Sequelize com todos os campos da manutenção preventiva |
| `backend/src/services/preventiveMaintenanceService.js` | Serviço `updateOperatingHours()` — incrementa horas e verifica limite |
| `backend/src/controllers/preventiveMaintenanceController.js` | Controlador com `list`, `create`, `update` e `reset` |
| `backend/src/routes/maintenanceRoutes.js` | Rotas `/api/maintenance` com autenticação |

### Frontend

| Arquivo | Descrição |
|---|---|
| `frontend/src/services/maintenance.js` | Serviço de chamadas à API com parse seguro de JSON |
| `frontend/src/pages/ManutencaoPreventiva.jsx` | Página "Manutenção Preventiva" com listagem, configuração e reset |
| `frontend/src/styles/ManutencaoPreventiva.css` | Estilos no padrão dark/glass do projeto |

---

## Arquivos Modificados

### Backend

| Arquivo | O que mudou |
|---|---|
| `backend/src/routes/index.js` | Registrou a rota `/maintenance` |
| `backend/src/config/mqtt.js` | Chamada de `updateOperatingHours(id_sensor)` a cada mensagem MQTT recebida |
| `backend/src/server.js` | `require('./models/PreventiveMaintenance')` para sincronização automática da tabela via Sequelize |

### Frontend

| Arquivo | O que mudou |
|---|---|
| `frontend/src/App.js` | Nova rota `/manutencao-preventiva` como `PrivateRoute` |
| `frontend/src/pages/index.js` | Export do componente `ManutencaoPreventiva` |
| `frontend/src/components/Drawer.jsx` | Item "🔧 Manutenção Preventiva" na seção Monitoramento |
| `frontend/src/pages/Dashboard.jsx` | Card "🔧 Manutenção" no Acesso Rápido com contador de pendentes |

---

## Model PreventiveMaintenance

```
id                INTEGER  — chave primária
deviceId          INTEGER  — ID do sensor monitorado (único por sensor)
horasOperadas     FLOAT    — horas acumuladas desde o último reset
limiteHoras       FLOAT    — limite configurado pelo operador (ex: 100)
ultimaAtualizacao DATE     — momento da última atualização de horas
status            STRING   — "OK" ou "MANUTENCAO_PENDENTE"
descricao         STRING   — tipo de manutenção necessária (ex: "Limpeza de filtro")
createdAt         DATE     — gerado automaticamente pelo Sequelize
updatedAt         DATE     — gerado automaticamente pelo Sequelize
```

> O campo `deviceId` referencia o ID de um `Sensor`. A relação não usa `FOREIGN KEY` formal para manter o model desacoplado e reutilizável em outros contextos (veículos, máquinas, etc.).

---

## Lógica de Contagem de Horas

A contagem é feita pelo serviço `updateOperatingHours(deviceId)`, chamado automaticamente toda vez que uma mensagem MQTT é recebida de um sensor.

### Regras de incremento

```
1. Busca o registro de manutenção pelo deviceId
2. Se não existir → retorna sem ação (sensor não configurado pelo operador)
3. Calcula diffHoras = (agora - ultimaAtualizacao) em horas
4. Se diffHoras <= 0 ou > 24 → atualiza apenas ultimaAtualizacao (ignora incremento)
5. novasHoras = horasOperadas + diffHoras
6. Se novasHoras >= limiteHoras → status = "MANUTENCAO_PENDENTE"
7. Salva horasOperadas, ultimaAtualizacao e status no banco
```

### Por que ignorar incrementos maiores que 24h?

Quando o servidor é reiniciado após um longo período offline, a diferença entre `agora` e `ultimaAtualizacao` pode ser de dias. Contabilizar esse tempo como operação seria incorreto — o sensor pode não ter estado ativo durante esse intervalo. O limite de 24h é uma proteção contra essa distorção.

### Geração do evento de manutenção

O evento `MANUTENCAO_PREVENTIVA` é registrado via `logAssetEvent()` **apenas uma vez** — na primeira vez que o status muda de `"OK"` para `"MANUTENCAO_PENDENTE"`. Enquanto o status permanecer `"MANUTENCAO_PENDENTE"`, nenhum novo evento é gerado.

```
status anterior = "OK"  +  novas horas >= limite  →  gera evento + loga no AssetHistory
status anterior = "MANUTENCAO_PENDENTE"            →  nenhuma ação extra
```

### Reset do contador

Quando o operador confirma que a manutenção foi realizada:

```
horasOperadas     = 0
ultimaAtualizacao = agora
status            = "OK"
```

Um evento `MANUTENCAO_REALIZADA` é registrado no histórico do ativo via `logAssetEvent()`.

---

## Lógica de Sugestão por Alertas

Na página de Manutenção Preventiva, os sensores **sem configuração** são exibidos com um badge de sugestão calculado com base no histórico de alertas do sensor:

| Quantidade de alertas | Badge | Cor |
|---|---|---|
| 10 ou mais | 🔴 Alta prioridade | Vermelho |
| 5 a 9 | 🟡 Sugerido | Amarelo |
| 1 a 4 | 🔵 Atenção | Azul |
| 0 | — | Sem badge |

Os sensores sem configuração são ordenados do **maior para o menor número de alertas**, colocando as sugestões mais urgentes no topo.

Quando há pelo menos um sensor com 5 ou mais alertas, um banner aparece no topo da seção incentivando o operador a configurar manutenção preventiva.

> A sugestão é apenas visual — o operador decide se configura ou não. O sistema nunca cria registros de manutenção automaticamente.

---

## API

### `GET /api/maintenance`

Retorna todos os registros de manutenção configurados pelo operador.

**Acesso:** qualquer usuário autenticado  
**Nota:** a listagem completa de sensores é feita pelo frontend via `GET /api/sensores` e cruzada com esses registros.

**Resposta:**

```json
[
  {
    "id": 1,
    "deviceId": 3,
    "horasOperadas": 47.3,
    "limiteHoras": 100,
    "ultimaAtualizacao": "2026-06-08T14:22:00.000Z",
    "status": "OK",
    "descricao": "Limpeza de filtro",
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-08T14:22:00.000Z"
  }
]
```

---

### `POST /api/maintenance`

Operador configura manutenção preventiva para um sensor pela primeira vez.

**Acesso:** qualquer usuário autenticado  
**Body:**

```json
{
  "deviceId": 3,
  "limiteHoras": 100,
  "descricao": "Limpeza de filtro"
}
```

**Respostas:**
- `201` — registro criado com sucesso
- `400` — campos obrigatórios ausentes
- `404` — sensor não encontrado
- `409` — manutenção já configurada para este sensor

---

### `PUT /api/maintenance/:deviceId`

Operador altera o limite de horas ou a descrição de um sensor já configurado.

**Acesso:** qualquer usuário autenticado  
**Body (parcial aceito):**

```json
{
  "limiteHoras": 50,
  "descricao": "Troca de correia"
}
```

---

### `POST /api/maintenance/reset/:deviceId`

Zera o contador de horas após a manutenção ser realizada. O `status` volta para `"OK"` e um evento `MANUTENCAO_REALIZADA` é registrado no histórico do ativo.

**Acesso:** qualquer usuário autenticado

---

## Interface — Manutenção Preventiva

Acessível em `/manutencao-preventiva` pelo menu **Monitoramento > 🔧 Manutenção Preventiva**.

A página é dividida em duas seções:

### Sensores monitorados

Sensores que já possuem configuração de manutenção. Exibe para cada um:

- Nome e tipo do sensor
- Badge de status: **✓ OK** (verde) ou **⚠ PENDENTE** (vermelho pulsante)
- Barra de progresso das horas operadas vs. limite
- Descrição da manutenção definida pelo operador
- Botão **✏ Editar** — abre formulário inline para alterar `limiteHoras` e `descricao`
- Botão **🔧 Realizar Manutenção** — abre confirmação e zera o contador

### Sensores sem manutenção configurada

Todos os sensores cadastrados que ainda não possuem configuração. Exibe para cada um:

- Nome e tipo do sensor
- Badge de sugestão (quando há histórico de alertas)
- Botão **+ Configurar Manutenção** — abre formulário inline com:
  - Campo: *"Após quantas horas de uso emitir alerta?"*
  - Campo: *"Tipo de manutenção necessária"*

> A interface é reutilizável para qualquer tipo de ativo — basta que o ativo esteja cadastrado como `Sensor` no sistema.

---

## Card no Dashboard

Um card "🔧 Manutenção" foi adicionado à seção **Acesso Rápido** do Dashboard.

- **Estado normal:** descrição "Preventiva" em cinza
- **Estado de alerta:** descrição "{N} pendente(s)" em **vermelho** e borda do card em vermelho
- **Ação:** clicar redireciona para `/manutencao-preventiva`

O Dashboard busca os dados de manutenção via `getMaintenance()` usando `Promise.allSettled`, garantindo que uma falha nessa chamada não impeça o restante do dashboard de carregar.

---

## Fluxo Completo

```
[Operador acessa /manutencao-preventiva]
    │
    ├── GET /api/sensores   → lista todos os sensores cadastrados
    ├── GET /api/maintenance → lista registros configurados
    └── GET /api/alertas    → contagem de alertas por sensor (sugestões)
         │
         └── Frontend mescla os três resultados e exibe:
              ├── Seção 1: sensores já configurados (com horas e status)
              └── Seção 2: sensores sem configuração (ordenados por alertas)

[Operador configura um sensor]
    │
    └── POST /api/maintenance { deviceId, limiteHoras, descricao }
         │
         ├── Valida sensor existente
         ├── Cria registro com horasOperadas = 0 e status = "OK"
         └── Registra evento MANUTENCAO_CONFIGURADA no AssetHistory

[ESP32 envia leitura MQTT]
    │
    └── Backend: processarLeitura()
         │
         ├── Salva leitura no banco
         ├── Verifica alertas de temperatura/umidade
         └── updateOperatingHours(id_sensor)
              │
              ├── Sem registro configurado → retorna sem ação
              │
              └── Com registro configurado:
                   ├── Calcula diffHoras desde ultimaAtualizacao
                   ├── Incrementa horasOperadas
                   ├── Se horasOperadas >= limiteHoras:
                   │    ├── status = "MANUTENCAO_PENDENTE"
                   │    └── logAssetEvent(MANUTENCAO_PREVENTIVA) [somente na primeira vez]
                   └── Salva no banco

[Operador realiza a manutenção]
    │
    └── POST /api/maintenance/reset/:deviceId
         │
         ├── horasOperadas = 0
         ├── status = "OK"
         ├── ultimaAtualizacao = agora
         └── logAssetEvent(MANUTENCAO_REALIZADA)
```

---

## Regras e Decisões de Projeto

1. **Configuração manual obrigatória** — o sistema nunca cria registros automaticamente. O operador decide quais sensores monitorar, qual o limite de horas e qual o tipo de manutenção.

2. **Acesso sem restrição de perfil** — tanto administradores quanto usuários comuns podem visualizar, configurar, editar e realizar manutenções. Não há `adminMiddleware` nas rotas.

3. **Parse seguro de JSON no frontend** — todas as funções do serviço `maintenance.js` leem a resposta como texto antes de fazer o parse, evitando erros genéricos de `JSON.parse` quando o servidor retorna HTML (ex: rota não encontrada por falta de reinicialização do backend).

4. **Resiliência do carregamento** — a página usa `Promise.allSettled` para buscar sensores, registros e alertas em paralelo. Se qualquer uma das três chamadas falhar, as outras continuam funcionando. Os sensores sempre aparecem (via `/api/sensores`).

5. **Evento único por limite atingido** — o evento `MANUTENCAO_PREVENTIVA` é registrado apenas na transição de `"OK"` para `"MANUTENCAO_PENDENTE"`, não a cada mensagem MQTT recebida após o limite ser ultrapassado.

6. **Proteção contra reinicialização do servidor** — incrementos de horas maiores que 24h são ignorados, evitando que o tempo em que o servidor ficou offline seja contabilizado como operação do sensor.
