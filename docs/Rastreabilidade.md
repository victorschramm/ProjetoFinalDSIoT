# Sistema de Rastreabilidade de Ações

## Visão Geral

Foi implementado um sistema completo de **rastreabilidade de ações** no ManutAI, permitindo responder:

- **Quem** fez a ação (usuário)
- **O que** foi feito (ação e entidade afetada)
- **Quando** foi feito (data e hora)
- **Como** foi feito (origem: WEB, API, MQTT)

---

## Arquivos Criados

### Backend

| Arquivo | Descrição |
|---|---|
| `backend/src/models/AuditLog.js` | Model Sequelize com os campos de auditoria |
| `backend/src/services/auditLogService.js` | Serviço central `logAction()` — desacoplado, reutilizável |
| `backend/src/controllers/auditLogController.js` | Listagem com filtros e paginação |
| `backend/src/routes/auditLogRoutes.js` | Rota `GET /api/audit-logs` (somente admin) |

### Frontend

| Arquivo | Descrição |
|---|---|
| `frontend/src/services/auditLogs.js` | Serviço de chamada à API com suporte a filtros |
| `frontend/src/pages/HistoricoAcoes.jsx` | Página "Histórico de Ações" (somente admin) |
| `frontend/src/styles/HistoricoAcoes.css` | Estilos seguindo o tema dark/glass do projeto |

---

## Arquivos Modificados

### Backend

| Arquivo | O que mudou |
|---|---|
| `backend/src/routes/index.js` | Registrou a rota `/audit-logs` |
| `backend/src/controllers/alertaController.js` | Adicionado `logAction()` nas ações de alerta |
| `backend/src/controllers/usuarioController.js` | Adicionado `logAction()` em edição e exclusão |
| `backend/src/controllers/authController.js` | Adicionado `logAction()` no cadastro de usuário |
| `backend/src/controllers/sensorController.js` | Adicionado `logAction()` em criação, edição e exclusão |
| `backend/src/__tests__/api.test.js` | 8 novos testes para o sistema de auditoria |

### Frontend

| Arquivo | O que mudou |
|---|---|
| `frontend/src/App.js` | Nova rota `/historico-acoes` como `AdminRoute` |
| `frontend/src/pages/index.js` | Export do componente `HistoricoAcoes` |
| `frontend/src/components/Drawer.jsx` | Item "📋 Histórico de Ações" no menu de Administração |
| `frontend/src/services/api.js` | Re-export de `getAuditLogs` |

---

## Model AuditLog

```
id          INTEGER  — chave primária
userId      INTEGER  — ID do usuário que executou a ação (nullable)
acao        STRING   — ex: "FECHOU_ALERTA", "CRIOU_USUARIO"
entidade    STRING   — ex: "ALERTA", "USUARIO", "SENSOR"
entidadeId  INTEGER  — ID do objeto afetado (nullable)
descricao   TEXT     — texto descritivo da ação
origem      STRING   — "WEB", "API" ou "MQTT" (padrão: "WEB")
dataAcao    DATE     — data e hora da ação
createdAt   DATE     — gerado automaticamente pelo Sequelize
updatedAt   DATE     — gerado automaticamente pelo Sequelize
```

---

## Ações Registradas

| Ação | Entidade | Controlador |
|---|---|---|
| `CRIOU_USUARIO` | USUARIO | authController (register) |
| `EDITOU_USUARIO` | USUARIO | usuarioController (update) |
| `EXCLUIU_USUARIO` | USUARIO | usuarioController (delete) |
| `FECHOU_ALERTA` | ALERTA | alertaController (update → resolvido) |
| `IGNOROU_ALERTA` | ALERTA | alertaController (update → ignorado) |
| `REABRIU_ALERTA` | ALERTA | alertaController (update → ativo) |
| `ALTEROU_STATUS_ALERTA` | ALERTA | alertaController (update genérico) |
| `EXCLUIU_ALERTA` | ALERTA | alertaController (delete) |
| `CRIOU_SENSOR` | SENSOR | sensorController (create) |
| `EDITOU_SENSOR` | SENSOR | sensorController (update) |
| `ALTEROU_STATUS_SENSOR` | SENSOR | sensorController (update com mudança de status) |
| `EXCLUIU_SENSOR` | SENSOR | sensorController (delete) |

---

## API

### `GET /api/audit-logs`

**Acesso:** somente administradores (requer token JWT + tipo_usuario = 'admin')  
**Logs não podem ser editados nem excluídos via API.**

**Parâmetros de query (todos opcionais):**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `userId` | integer | Filtrar por usuário |
| `entidade` | string | Filtrar por entidade (ex: ALERTA) |
| `acao` | string | Filtrar por ação (ex: FECHOU_ALERTA) |
| `dataInicio` | date (YYYY-MM-DD) | Início do período |
| `dataFim` | date (YYYY-MM-DD) | Fim do período |
| `page` | integer | Página (padrão: 1) |
| `limit` | integer | Registros por página (padrão: 50) |

**Resposta:**

```json
{
  "total": 42,
  "page": 1,
  "totalPages": 1,
  "logs": [
    {
      "id": 1,
      "userId": 2,
      "acao": "FECHOU_ALERTA",
      "entidade": "ALERTA",
      "entidadeId": 7,
      "descricao": "Alerta \"TEMPERATURA\" alterado de \"pendente\" para \"resolvido\".",
      "origem": "WEB",
      "dataAcao": "2026-06-02T14:30:00.000Z",
      "usuario": {
        "id": 2,
        "name": "João Silva",
        "email": "joao@empresa.com"
      }
    }
  ]
}
```

---

## Interface — Histórico de Ações

Acessível em `/historico-acoes` pelo menu **Administração > 📋 Histórico de Ações**.

**Funcionalidades:**
- Tabela com: Usuário, Ação, Entidade, Descrição, Origem e Data
- Filtros por: Usuário, Tipo de Ação, Data Início e Data Fim
- Destaque visual: ações críticas em **vermelho**, ações comuns em **azul**
- Paginação automática quando há mais de 50 registros
- Somente administradores têm acesso (redirecionamento automático para não-admins)

**Ações consideradas críticas** (destaque vermelho):
`FECHOU_ALERTA`, `EXCLUIU_ALERTA`, `EXCLUIU_USUARIO`, `EXCLUIU_SENSOR`, `IGNOROU_ALERTA`, `ALTEROU_STATUS_SENSOR`

---

## Regras de Segurança

1. Logs **não podem ser editados ou excluídos** — não há rota PUT/DELETE para AuditLog
2. Apenas administradores acessam os logs (`authMiddleware` + `adminMiddleware`)
3. O serviço `logAction()` nunca lança exceção — falha silenciosa para não impactar o fluxo principal

---

## Testes (18/18 passando)

Novos testes adicionados em `backend/src/__tests__/api.test.js`:

| Teste | Resultado |
|---|---|
| `logAction` registra ação no banco sem lançar erro | ✅ |
| `logAction` não quebra com `userId` nulo | ✅ |
| `logAction` não lança erro se o banco falhar | ✅ |
| `GET /audit-logs` retorna 401 sem token | ✅ |
| `GET /audit-logs` retorna 403 para usuário comum | ✅ |
| `GET /audit-logs` retorna lista de logs para admin | ✅ |
| Filtro por `acao` retorna apenas registros corretos | ✅ |
| Filtro por `entidade` retorna apenas registros corretos | ✅ |
