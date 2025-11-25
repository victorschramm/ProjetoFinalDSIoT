# Sistema de Monitoramento Ambiental - API REST

Este é um sistema de monitoramento ambiental que permite o gerenciamento de ambientes, sensores, leituras e alertas através de uma API REST segura.

## 📋 Requisitos

- Node.js
- NPM ou Yarn
- SQLite

## 🚀 Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo `.env` na raiz do projeto:
```env
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite
PORT=3000
NODE_ENV=development
```

4. Inicie o servidor:
```bash
npm start
```

## 🔑 Autenticação

A API utiliza autenticação JWT (JSON Web Token). Para acessar as rotas protegidas, é necessário incluir o token no header das requisições:

```http
Authorization: Bearer seu_token_jwt
```

### Endpoints de Autenticação

#### Registrar Novo Usuário
```http
POST /api/register
Content-Type: application/json

{
  "name": "Nome do Usuário",
  "email": "usuario@email.com",
  "password": "senha123",
  "tipo_usuario": "admin",
  "id_nivel_acesso": 1
}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

#### Consultar Perfil
```http
GET /api/profile
Authorization: Bearer seu_token_jwt
```

## 📍 Níveis de Acesso

### Endpoints de Níveis de Acesso

#### Criar Nível de Acesso
```http
POST /api/niveis-acesso
{
  "nome": "Supervisor",
  "descricao": "Acesso total ao sistema",
  "nivel": 2
}
```

#### Listar, Atualizar e Deletar
- GET /api/niveis-acesso
- GET /api/niveis-acesso/:id
- PUT /api/niveis-acesso/:id
- DELETE /api/niveis-acesso/:id

## 🏢 Ambientes

### Endpoints de Ambientes

#### Criar Ambiente
```http
POST /api/ambientes
{
  "nome": "Sala de Servidores",
  "descricao": "Sala principal de servidores",
  "localizacao": "Andar 1",
  "temperatura_ideal": 20,
  "umidade_ideal": 50
}
```

#### Listar, Atualizar e Deletar
- GET /api/ambientes
- GET /api/ambientes/:id
- PUT /api/ambientes/:id
- DELETE /api/ambientes/:id

## 📡 Sensores

### Endpoints de Sensores

#### Criar Sensor
```http
POST /api/sensores
{
  "nome": "Sensor Temperatura 01",
  "tipo": "temperatura",
  "modelo": "DHT22",
  "descricao": "Sensor de temperatura principal",
  "id_ambiente": 1,
  "status": "ativo"
}
```

#### Listar, Atualizar e Deletar
- GET /api/sensores
- GET /api/sensores/:id
- PUT /api/sensores/:id
- DELETE /api/sensores/:id

## 📊 Leituras

### Endpoints de Leituras

#### Registrar Leitura
```http
POST /api/leituras
{
  "id_sensor": 1,
  "valor": 22.5,
  "tipo_leitura": "temperatura",
  "timestamp": "2025-10-24T10:00:00Z"
}
```

#### Consultas Disponíveis
- GET /api/leituras
- GET /api/leituras/:id
- GET /api/leituras/sensor/:id
- GET /api/leituras/periodo?inicio=2025-10-23T00:00:00Z&fim=2025-10-24T23:59:59Z

## ⚠️ Alertas

### Endpoints de Alertas

#### Criar Alerta
```http
POST /api/alertas
{
  "id_sensor": 1,
  "tipo": "temperatura_alta",
  "mensagem": "Temperatura acima do limite",
  "nivel_severidade": "alto",
  "valor_detectado": 28.5,
  "timestamp": "2025-10-24T10:15:00Z"
}
```

#### Consultas e Atualizações
- GET /api/alertas
- GET /api/alertas/:id
- GET /api/alertas/sensor/:id
- GET /api/alertas/severidade/:nivel
- PUT /api/alertas/:id
- DELETE /api/alertas/:id

## 🔒 Segurança

O sistema implementa várias camadas de segurança:

- Autenticação JWT
- Rate limiting para prevenção de força bruta
- Validação de campos obrigatórios
- Sanitização de inputs
- Níveis de acesso por usuário

## ⚙️ Limitações de Rate

Para proteger a API contra abusos, existem limites de requisições:

- Endpoints de autenticação: 5 tentativas por 15 minutos
- Demais endpoints: Requerem autenticação válida

## 🚨 Tratamento de Erros

A API retorna erros no seguinte formato:

```json
{
  "error": "Mensagem do erro",
  "details": [
    {
      "message": "Descrição detalhada do erro",
      "field": "Campo com problema (quando aplicável)"
    }
  ]
}
```

## 📝 Logs

O sistema mantém logs de:
- Tentativas de autenticação
- Criação/modificação de recursos
- Erros e exceções
- Alertas gerados

## 💻 Desenvolvimento

Para executar em modo desenvolvimento:

```bash
npm run dev
```

## 🧪 Testes

Para executar os testes:

```bash
npm test
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.