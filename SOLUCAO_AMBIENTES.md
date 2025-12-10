# 🔧 Solução: Ambientes não aparecem no formulário de Sensores

## Diagnóstico

Se ambientes não aparecem ao criar um sensor, é por uma de 3 razões:

1. ❌ Ambientes não foram criados no banco
2. ❌ Token de autenticação inválido
3. ❌ API de ambientes não está respondendo

## ✅ Solução Passo a Passo

### Passo 1: Verificar o Backend

Certifique-se que o backend está rodando:

```bash
cd backend
npm run dev
```

Você deve ver:
```
✓ Banco de dados sincronizado
✓ Conectado ao broker MQTT
🚀 Servidor rodando em http://localhost:3000
```

### Passo 2: Popular o Banco com Dados de Teste

Execute o script de seed para criar ambientes, dispositivos e sensores:

```bash
npm run seed
```

Você deve ver:
```
✓ Banco de dados sincronizado
👤 Criando usuário admin...
✓ Usuário criado: admin@test.com
🏢 Criando ambientes...
✓ Ambientes criados: 3
📡 Criando dispositivos ESP...
✓ Dispositivos criados: 2
🎛️ Criando sensores...
✓ Sensores criados: 3
✅ Banco de dados populado com sucesso!
```

### Passo 3: Iniciar o Frontend

Em outra aba do terminal:

```bash
cd front-ambiental
npm start
```

### Passo 4: Login

- Email: `admin@test.com`
- Senha: `senha123`

### Passo 5: Verificar Console do Navegador

Abra Developer Tools (F12) → Console

Ao clicar em **"+ Novo Sensor"**, você verá logs como:

```
📝 Abrindo modal de criar sensor
   Ambientes disponíveis: 3
   Dados de ambientes: 
   (3) [{…}, {…}, {…}]
   ✓ Sensores carregados: 3
   ✓ Ambientes carregados: 3
   Ambientes: (3) […]
```

Se ver `Ambientes disponíveis: 0`, o problema está na API.

### Passo 6: Testar a API Manualmente

Execute o script de teste:

```bash
cd backend
node testAPI.js
```

Você verá:

```
✓ Servidor respondendo
✓ Login bem-sucedido
✓ 3 ambiente(s) encontrado(s)
   1. Sala Principal
      ID: 1
      Localização: Primeiro andar

   2. Laboratório
      ID: 2
      Localização: Segundo andar

   3. Armazém
      ID: 3
      Localização: Terceiro andar
```

Se ver erro, verifique:
- Backend está rodando? (`npm run dev`)
- Banco tem dados? (`npm run seed`)

## 🎯 Se Ainda Não Funcionar

### Opção A: Limpar Tudo e Começar do Zero

```bash
# 1. Backend
cd backend
rm database.sqlite      # Apaga banco antigo
npm run seed           # Cria novo banco com dados
npm run dev            # Inicia backend

# 2. Frontend (nova aba)
cd front-ambiental
npm start
```

### Opção B: Criar Ambiente Manualmente via API

Use Postman, Insomnia ou curl:

```bash
curl -X POST http://localhost:3000/api/ambientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Sala Principal",
    "descricao": "Sala de controle",
    "localizacao": "Primeiro andar",
    "temperatura_ideal": 22,
    "umidade_ideal": 50
  }'
```

### Opção C: Criar no Frontend

1. Vá para **Configurações > Ambientes**
2. Clique em **"+ Novo Ambiente"**
3. Preencha os dados e clique em **Cadastrar**
4. Recarregue a página de Sensores (F5)

## ✨ Após Resolver

Você verá no modal de criar sensor:

```
Ambiente *
┌─────────────────────────────┐
│ Selecione o ambiente        │
│ 1. Sala Principal           │
│ 2. Laboratório              │
│ 3. Armazém                  │
└─────────────────────────────┘
```

## 📊 Fluxo Correto

```
1. npm run seed
   ↓
2. npm run dev (backend)
   ↓
3. npm start (frontend)
   ↓
4. Login: admin@test.com / senha123
   ↓
5. Sensores > + Novo Sensor
   ↓
6. Ambientes aparecem no dropdown ✓
```

## 🆘 Ainda com Problema?

Verifique:

1. **Backend respondendo?**
   ```
   curl http://localhost:3000/api/ambientes
   ```
   Deve retornar erro 401 (autenticação) não 404

2. **Banco tem dados?**
   ```
   cd backend
   sqlite3 database.sqlite "SELECT * FROM Ambientes;"
   ```
   Deve listar os ambientes

3. **Token válido?**
   Faça logout e login novamente

4. **Console do navegador?**
   Pressione F12, vá em "Console", veja os logs

---

**Pronto! 🎉 Agora os ambientes devem aparecer!**
