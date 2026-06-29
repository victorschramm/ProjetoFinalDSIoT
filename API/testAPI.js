/**
 * Script para testar a API e diagnosticar problemas
 * Execute: node testAPI.js
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api';
let authToken = '';

async function test() {
  try {
    console.log('🧪 Iniciando testes da API...\n');

    // 1. Teste de conexão básica
    console.log('1️⃣ Testando conexão com servidor...');
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: { 'Authorization': 'Bearer test' }
      });
      console.log(`   ✓ Servidor respondendo (status: ${response.status})\n`);
    } catch (error) {
      console.log(`   ❌ Servidor não respondeu: ${error.message}`);
      console.log('   → Certifique-se de que o backend está rodando: npm run dev\n');
      return;
    }

    // 2. Fazer login
    console.log('2️⃣ Tentando fazer login...');
    const loginResponse = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'senha123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log(`   ❌ Login falhou: ${loginData.error}`);
      console.log('   → Verifique se o usuário existe no banco de dados');
      console.log('   → Execute: npm run seed\n');
      return;
    }

    authToken = loginData.token;
    console.log(`   ✓ Login bem-sucedido`);
    console.log(`   Token: ${authToken.substring(0, 20)}...\n`);

    // 3. Buscar ambientes
    console.log('3️⃣ Buscando ambientes...');
    const ambientesResponse = await fetch(`${API_URL}/ambientes`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const ambientesData = await ambientesResponse.json();

    if (!ambientesResponse.ok) {
      console.log(`   ❌ Erro ao buscar ambientes: ${ambientesData.error}\n`);
      return;
    }

    console.log(`   ✓ ${ambientesData.length} ambiente(s) encontrado(s)\n`);
    
    if (ambientesData.length === 0) {
      console.log('   ⚠️  Nenhum ambiente no banco de dados!');
      console.log('   Criando ambiente de teste...\n');

      // Criar ambiente
      const createResponse = await fetch(`${API_URL}/ambientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          nome: 'Sala Principal',
          descricao: 'Sala de controle principal',
          localizacao: 'Primeiro andar',
          temperatura_ideal: 22,
          umidade_ideal: 50
        })
      });

      if (createResponse.ok) {
        const newAmbiente = await createResponse.json();
        console.log(`   ✓ Ambiente criado: ${newAmbiente.nome}`);
        console.log(`     ID: ${newAmbiente.id}\n`);
      }
    } else {
      // Listar ambientes
      ambientesData.forEach((amb, idx) => {
        console.log(`   ${idx + 1}. ${amb.nome}`);
        console.log(`      ID: ${amb.id}`);
        console.log(`      Localização: ${amb.localizacao}\n`);
      });
    }

    // 4. Buscar dispositivos
    console.log('4️⃣ Buscando dispositivos...');
    const dispositivosResponse = await fetch(`${API_URL}/dispositivos`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const dispositivosData = await dispositivosResponse.json();

    if (!dispositivosResponse.ok) {
      console.log(`   ⚠️  Erro ao buscar dispositivos: ${dispositivosData.error}\n`);
    } else {
      console.log(`   ✓ ${dispositivosData.length} dispositivo(s) encontrado(s)\n`);
      
      if (dispositivosData.length === 0) {
        console.log('   ⚠️  Nenhum dispositivo no banco de dados!');
        console.log('   Execute: npm run seed\n');
      } else {
        dispositivosData.forEach((disp, idx) => {
          console.log(`   ${idx + 1}. ${disp.nome}`);
          console.log(`      Tópico: ${disp.topico_mqtt}`);
          console.log(`      Status: ${disp.status}\n`);
        });
      }
    }

    // 5. Buscar sensores
    console.log('5️⃣ Buscando sensores...');
    const sensoresResponse = await fetch(`${API_URL}/sensores`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const sensoresData = await sensoresResponse.json();

    if (!sensoresResponse.ok) {
      console.log(`   ⚠️  Erro ao buscar sensores: ${sensoresData.error}\n`);
    } else {
      console.log(`   ✓ ${sensoresData.length} sensor(es) encontrado(s)\n`);
      
      if (sensoresData.length > 0) {
        sensoresData.forEach((sensor, idx) => {
          console.log(`   ${idx + 1}. ${sensor.nome}`);
          console.log(`      Tipo: ${sensor.tipo}`);
          console.log(`      Ambiente ID: ${sensor.id_ambiente}\n`);
        });
      }
    }

    console.log('\n✅ Diagnóstico completo!\n');
    console.log('📋 Resumo:');
    console.log(`   ✓ Backend respondendo`);
    console.log(`   ✓ Autenticação OK`);
    console.log(`   ✓ Ambientes: ${ambientesData.length} cadastrados`);
    console.log(`   ✓ Dispositivos: ${dispositivosData.length} cadastrados`);
    console.log(`   ✓ Sensores: ${sensoresData.length} cadastrados\n`);

  } catch (error) {
    console.error('❌ Erro não tratado:', error.message);
  }
}

test();
