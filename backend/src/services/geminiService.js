const Groq = require('groq-sdk');
const { Op } = require('sequelize');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_INSTRUCTION = `Você é o ManutAI, assistente inteligente oficial do sistema de monitoramento ambiental IoT desenvolvido por estudantes do SENAI.
Responda sempre em português brasileiro de forma clara, objetiva e amigável.
Você pode responder qualquer tipo de pergunta: sobre o projeto, guia de uso, dados em tempo real ou dúvidas gerais.
Quando o usuário pedir dados do sistema (temperatura, alertas, sensores, etc.), use as ferramentas disponíveis para buscar informações reais antes de responder. Nunca invente dados do banco.
Para perguntas gerais sobre o projeto, uso do sistema ou dúvidas, responda com base no conhecimento abaixo.

## O QUE É O MANUTAI
ManutAI é um sistema completo de monitoramento ambiental IoT voltado para manutenção preditiva em ambientes industriais e comerciais. O nome une "Manutenção" com "IA" (Inteligência Artificial). Foi desenvolvido como projeto final de curso de Desenvolvimento de Sistemas IoT no SENAI.

## ARQUITETURA DO SISTEMA
- Sensor DHT11 conectado a um microcontrolador ESP32
- ESP32 envia dados de temperatura e umidade via protocolo MQTT com criptografia TLS para a nuvem (HiveMQ Cloud)
- Backend Node.js recebe os dados, salva no banco de dados e gera alertas automáticos
- Frontend React exibe os dados em dashboards em tempo real com gráficos interativos
- Assistente IA (você) integrado via Groq (Llama 3.3) para consultas em linguagem natural

## PÁGINAS E FUNCIONALIDADES

### Dashboard
Página inicial após o login. Exibe um resumo geral: total de sensores, temperatura média, umidade média e alertas pendentes. Possui gráficos rápidos e acesso rápido às principais seções.

### Monitoramento
Exibe dados em tempo real de todos os ambientes e sensores. Os dados são atualizados automaticamente a cada 5 segundos. Mostra temperatura e umidade de cada sensor com indicação visual de status.

### Histórico e Gráficos
Permite visualizar o histórico completo de leituras com filtros por período, sensor ou ambiente. Gera gráficos de linha com evolução de temperatura e umidade ao longo do tempo.

### Alertas
Lista todos os alertas gerados pelo sistema. Alertas são criados automaticamente quando a temperatura ou umidade sai dos limites configurados para o ambiente. Cada alerta tem status: pendente, resolvido ou ignorado. É possível resolver ou ignorar alertas por esta tela.

### Ambientes
Permite cadastrar, editar e excluir ambientes monitorados (ex: Sala de Servidores, Almoxarifado). Cada ambiente tem temperatura ideal e umidade ideal configuráveis — esses valores são usados para gerar alertas automáticos.

### Sensores
Gerenciamento dos sensores cadastrados no sistema. Cada sensor é vinculado a um ambiente e a um dispositivo ESP32. Mostra status (ativo/offline) e última vez que enviou dados.

### Dispositivos
Gerenciamento dos dispositivos ESP32 cadastrados. Cada dispositivo tem um tópico MQTT único pelo qual envia os dados dos sensores.

### Leituras
Consulta detalhada de todas as leituras registradas no banco de dados. Permite filtrar por sensor, tipo (temperatura/umidade) e período.

### Currículo da Máquina (Histórico de Ativos)
Registro cronológico de eventos importantes de cada sensor/dispositivo: quando ficou online, offline, gerou alertas, recebeu manutenção, etc.

### Administração (apenas admin)
- Usuários: gerenciar contas de usuários do sistema
- Níveis de Acesso: definir perfis de permissão
- Histórico de Ações: log completo de todas as ações realizadas no sistema

## ALERTAS AUTOMÁTICOS
O sistema gera alertas automaticamente quando:
- Temperatura ultrapassa ±2°C do valor ideal configurado no ambiente
- Umidade ultrapassa ±10% do valor ideal configurado no ambiente
O sistema não gera alertas duplicados — apenas um alerta pendente por sensor/tipo por vez.

## COMO FAZER LOGIN
1. Acesse a tela de login
2. Digite e-mail e senha cadastrados
3. Clique em "Entrar"
Caso esqueça a senha, use a opção "Esqueci minha senha" para receber um link de redefinição por e-mail.

## PERFIS DE USUÁRIO
- Usuário comum: acessa monitoramento, histórico, alertas, leituras, sensores, ambientes e dispositivos
- Administrador: acesso completo, incluindo gerenciamento de usuários, níveis de acesso e histórico de ações

## TECNOLOGIAS UTILIZADAS
- Hardware: ESP32 + Sensor DHT11
- Protocolo IoT: MQTT com TLS (HiveMQ Cloud)
- Backend: Node.js + Express + Sequelize ORM
- Banco de dados: SQLite (desenvolvimento) / MySQL (produção)
- Frontend: React 19 + React Router + Recharts
- Autenticação: JWT (token expira em 24h)
- IA: Groq (Llama 3.3 70B) com Function Calling
- Deploy: Vercel (frontend e backend serverless)
- CI/CD: GitHub Actions

## SUGESTÕES DE MANUTENÇÃO (CRITÉRIOS)
Para sugerir manutenção, analise os dados reais do sistema:
- Sensores com status OFFLINE por mais de 5 minutos → verificar conexão WiFi do ESP32
- Muitos alertas de temperatura alta → verificar ventilação do ambiente ou calibração do sensor
- Muitos alertas de umidade → verificar vedação do ambiente ou presença de vazamentos
- Sensor sem leituras recentes → verificar alimentação elétrica do ESP32
- Alertas recorrentes no mesmo sensor → considerar substituição ou recalibração do sensor`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'buscarLeiturasRecentes',
      description: 'Busca as leituras mais recentes de temperatura e/ou umidade dos sensores.',
      parameters: {
        type: 'object',
        properties: {
          minutos: { type: 'number', description: 'Minutos para buscar (padrão: 60). Use 1440 para 24h.' },
          tipo_leitura: { type: 'string', description: 'Filtrar por: "temperatura", "umidade" ou "potenciometro". Omita para todos.' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'buscarAlertas',
      description: 'Busca alertas do sistema por status ou severidade.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '"pendente", "resolvido" ou "ignorado". Omita para todos.' },
          nivel_severidade: { type: 'string', description: '"alto", "médio" ou "baixo". Omita para todos.' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'buscarAmbientes',
      description: 'Busca todos os ambientes monitorados com limites de temperatura e umidade.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'buscarSensores',
      description: 'Busca sensores com status (ativo/OFFLINE) e última vez que enviaram dados.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '"ativo" ou "OFFLINE". Omita para todos.' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'buscarEstatisticas',
      description: 'Calcula média, mínimo e máximo de leituras em um período.',
      parameters: {
        type: 'object',
        properties: {
          tipo_leitura: { type: 'string', description: '"temperatura", "umidade" ou "potenciometro".' },
          horas: { type: 'number', description: 'Período em horas (padrão: 24). Use 168 para 7 dias.' }
        },
        required: ['tipo_leitura']
      }
    }
  }
];

async function executarFuncao(nome, args) {
  const Leitura = require('../models/Leitura');
  const Alerta = require('../models/Alerta');
  const Ambiente = require('../models/Ambiente');
  const Sensor = require('../models/Sensor');

  try {
    if (nome === 'buscarLeiturasRecentes') {
      const minutos = args.minutos || 60;
      const dataLimite = new Date(Date.now() - minutos * 60 * 1000);
      const where = { timestamp: { [Op.gte]: dataLimite } };
      if (args.tipo_leitura) where.tipo_leitura = args.tipo_leitura;

      const leituras = await Leitura.findAll({
        where,
        include: [{ association: 'sensor', attributes: ['id', 'nome', 'tipo'] }],
        order: [['timestamp', 'DESC']],
        limit: 50
      });

      if (leituras.length === 0) return { mensagem: `Nenhuma leitura nos últimos ${minutos} minutos.`, dados: [] };

      return {
        total: leituras.length,
        periodo: `últimos ${minutos} minutos`,
        dados: leituras.map(l => ({
          sensor: l.sensor?.nome || `Sensor ${l.id_sensor}`,
          tipo: l.tipo_leitura,
          valor: l.valor,
          unidade: l.unidade,
          horario: new Date(l.timestamp).toLocaleString('pt-BR')
        }))
      };
    }

    if (nome === 'buscarAlertas') {
      const where = {};
      if (args.status) where.status = args.status;
      if (args.nivel_severidade) where.nivel_severidade = args.nivel_severidade;

      const alertas = await Alerta.findAll({
        where,
        include: [{ association: 'sensor', attributes: ['id', 'nome'] }],
        order: [['timestamp', 'DESC']],
        limit: 20
      });

      if (alertas.length === 0) return { mensagem: 'Nenhum alerta encontrado.', dados: [] };

      return {
        total: alertas.length,
        dados: alertas.map(a => ({
          id: a.id,
          tipo: a.tipo,
          mensagem: a.mensagem,
          severidade: a.nivel_severidade,
          valor_detectado: a.valor_detectado,
          status: a.status,
          sensor: a.sensor?.nome || `Sensor ${a.id_sensor}`,
          horario: new Date(a.timestamp).toLocaleString('pt-BR')
        }))
      };
    }

    if (nome === 'buscarAmbientes') {
      const ambientes = await Ambiente.findAll({
        include: [{ association: 'sensores', attributes: ['id', 'nome', 'status'] }]
      });

      if (ambientes.length === 0) return { mensagem: 'Nenhum ambiente cadastrado.', dados: [] };

      return {
        total: ambientes.length,
        dados: ambientes.map(a => ({
          id: a.id,
          nome: a.nome,
          localizacao: a.localizacao,
          temperatura_ideal: a.temperatura_ideal,
          umidade_ideal: a.umidade_ideal,
          sensores: a.sensores?.map(s => ({ id: s.id, nome: s.nome, status: s.status })) || []
        }))
      };
    }

    if (nome === 'buscarSensores') {
      const where = {};
      if (args.status) where.status = args.status;

      const sensores = await Sensor.findAll({
        where,
        include: [{ association: 'ambiente', attributes: ['id', 'nome'] }],
        order: [['id', 'ASC']]
      });

      if (sensores.length === 0) return { mensagem: 'Nenhum sensor encontrado.', dados: [] };

      return {
        total: sensores.length,
        dados: sensores.map(s => ({
          id: s.id,
          nome: s.nome,
          tipo: s.tipo,
          status: s.status,
          ambiente: s.ambiente?.nome || 'Sem ambiente',
          ultimo_dado: s.lastSeen ? new Date(s.lastSeen).toLocaleString('pt-BR') : 'Nunca registrado'
        }))
      };
    }

    if (nome === 'buscarEstatisticas') {
      const horas = args.horas || 24;
      const dataLimite = new Date(Date.now() - horas * 60 * 60 * 1000);

      const leituras = await Leitura.findAll({
        where: { tipo_leitura: args.tipo_leitura, timestamp: { [Op.gte]: dataLimite } },
        attributes: ['valor']
      });

      if (leituras.length === 0) return { mensagem: `Nenhuma leitura de ${args.tipo_leitura} nas últimas ${horas} horas.` };

      const valores = leituras.map(l => parseFloat(l.valor));
      const soma = valores.reduce((a, b) => a + b, 0);

      return {
        tipo: args.tipo_leitura,
        periodo: `últimas ${horas} horas`,
        total_leituras: leituras.length,
        media: (soma / valores.length).toFixed(2),
        minimo: Math.min(...valores).toFixed(2),
        maximo: Math.max(...valores).toFixed(2)
      };
    }

    return { erro: `Função desconhecida: ${nome}` };
  } catch (error) {
    return { erro: `Erro ao executar ${nome}: ${error.message}` };
  }
}

async function chat(mensagem, historico = []) {
  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...historico,
    { role: 'user', content: mensagem }
  ];

  let response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages,
    tools,
    tool_choice: 'auto',
    max_tokens: 1024
  });

  let assistantMessage = response.choices[0].message;
  messages.push(assistantMessage);

  // Loop de Function Calling
  while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    for (const toolCall of assistantMessage.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments);
      const resultado = await executarFuncao(toolCall.function.name, args);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(resultado)
      });
    }

    response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 1024
    });

    assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);
  }

  // Histórico sem a system message (adicionada novamente na próxima chamada)
  const historico_atualizado = messages.slice(1);

  return {
    resposta: assistantMessage.content,
    historico_atualizado
  };
}

module.exports = { chat };
