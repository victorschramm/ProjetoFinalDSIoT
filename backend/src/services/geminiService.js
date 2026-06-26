const Groq = require('groq-sdk');
const { Op } = require('sequelize');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Mesmo formato (horas/minutos inteiros, sem decimal) usado nas telas de Manutenção
// Preventiva e Currículo da Máquina (ver frontend/src/utils/format.js formatarMtbf).
// Sem decimal, o modelo não precisa converter nada de cabeça — era isso que o fazia
// ficar repetindo contas erradas quando o usuário perguntava "isso é quantos minutos?".
function formatarTempo(horas) {
  const totalMinutos = Math.round(horas * 60);
  if (totalMinutos < 60) return `${totalMinutos} minutos`;

  const h = Math.floor(totalMinutos / 60);
  const min = totalMinutos % 60;
  if (h < 24) return min > 0 ? `${h}h${min}min` : `${h}h`;

  const dias = Math.floor(h / 24);
  const hRestante = h % 24;
  return hRestante > 0 ? `${dias}d ${hRestante}h` : `${dias} dias`;
}

const STOPWORDS_SENSOR = new Set(['sensor', 'sensores', 'dht11', 'de', 'da', 'do', 'e', 'o', 'a']);

function normalizarTexto(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function tokenizarNomeSensor(str) {
  return normalizarTexto(str)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !STOPWORDS_SENSOR.has(t));
}

// Compara prefixos para tolerar abreviações do banco (ex: "Temp." casa com "temperatura",
// "Umid." casa com "umidade") sem exigir que o modelo acerte a grafia exata do nome do sensor.
function prefixoBate(a, b) {
  const len = Math.min(a.length, b.length, 4);
  return len >= 3 && a.slice(0, len) === b.slice(0, len);
}

// Em vez de exigir que o termo do usuário seja substring literal do nome do sensor
// (frágil contra paráfrases como "sensor de temperatura da sala de servidores" vs
// "DHT11 — Temp. Sala de Servidores"), compara por tokens e pega o(s) sensor(es) com
// mais palavras em comum. Retorna [] se nenhum sensor tiver nenhuma palavra em comum.
function encontrarSensoresPorNome(termo, sensores) {
  const tokensTermo = tokenizarNomeSensor(termo);
  if (tokensTermo.length === 0) return [];

  const candidatos = sensores
    .map(s => {
      const tokensNome = tokenizarNomeSensor(s.nome);
      const score = tokensTermo.filter(t => tokensNome.some(n => prefixoBate(t, n))).length;
      return { sensor: s, score };
    })
    .filter(c => c.score > 0);

  if (candidatos.length === 0) return [];
  const maiorScore = Math.max(...candidatos.map(c => c.score));
  return candidatos.filter(c => c.score === maiorScore).map(c => c.sensor);
}

const SYSTEM_INSTRUCTION = `Você é o ManutAI, assistente técnico do sistema de monitoramento ambiental IoT desenvolvido por estudantes do SENAI.
Responda sempre em português brasileiro de forma direta, objetiva e técnica. Sem enrolação — vá direto ao ponto.
Sempre que o usuário perguntar sobre dados do sistema (temperatura, umidade, alertas, sensores, manutenção), use as ferramentas disponíveis para buscar informações reais antes de responder. Nunca invente dados.
Para sugestões de manutenção, use sempre a ferramenta analisarManutencao para ter dados reais e forneça ações concretas e priorizadas.
Para perguntas sobre MTBF (Mean Time Between Failures / Tempo Médio Entre Falhas), use a ferramenta calcularMTBF. MTBF estourado significa que o sensor está offline há mais tempo do que sua média histórica entre falhas — indicando falha crítica que precisa de intervenção imediata.
"Pendente" é status de ALERTA, não de sensor (sensor só tem status "ativo" ou "OFFLINE"). Se o usuário perguntar por que um sensor "está pendente", ele quer saber por que existe um alerta pendente daquele sensor — chame buscarAlertas com status "pendente" E o parâmetro sensor preenchido com o nome do sensor perguntado, e explique o motivo usando o campo mensagem/tipo/valor_detectado do(s) alerta(s) retornado(s). Nunca diga que não entendeu a pergunta nesse caso — sempre traduza para "alerta pendente do sensor X".
NUNCA atribua um alerta a um sensor diferente do que está no campo "sensor" do resultado da ferramenta. Se buscarAlertas (filtrado por sensor) retornar "dados": [] ou a mensagem "Nenhum alerta encontrado para o sensor", diga exatamente isso ao usuário — não pegue o alerta de outro sensor parecido para "preencher" a resposta. Confundir sensores é o pior tipo de erro que você pode cometer aqui.

## REGRAS DE RESPOSTA
- Seja direto: responda o que foi perguntado sem introduções longas
- Para manutenção: sempre liste as ações em ordem de prioridade (CRÍTICO > ALTO > MÉDIO)
- Para dados: cite valores exatos com horário
- Para guia de uso: explique o passo a passo numerado
- Tempos e durações (MTBF, tempo offline etc.) já vêm formatados pelas ferramentas como "Hh Mmin" (ex: "22h36min") — o mesmo formato exibido nas telas de Manutenção Preventiva e Currículo da Máquina. Repita esse texto exatamente como veio — nunca converta, arredonde ou refaça a conta de cabeça. Se o usuário perguntar "isso é quantos minutos?" ou pedir para confirmar o valor, apenas repita o mesmo valor já formatado, sem recalcular
- Nunca se autocorrija múltiplas vezes na mesma resposta. Se não tiver certeza de um valor, chame a ferramenta novamente em vez de adivinhar ou listar várias respostas contraditórias

## CRITÉRIOS DE PRIORIDADE PARA MANUTENÇÃO
- CRÍTICO: sensor OFFLINE (verificar imediatamente conexão WiFi e alimentação do ESP32)
- ALTO: sensor com 3+ alertas pendentes em 7 dias (recalibrar ou substituir sensor)
- ALTO: alertas de severidade alta recorrentes no mesmo sensor
- MÉDIO: alertas de temperatura fora do ideal (verificar ventilação do ambiente)
- MÉDIO: alertas de umidade fora do ideal (verificar vedação ou vazamentos)
- BAIXO: sensor sem leituras há mais de 1 hora mas ainda ONLINE (verificar firmware do ESP32)

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

## FORMATO DE RESPOSTA PARA MANUTENÇÃO
Quando o usuário pedir sugestões de manutenção, use a ferramenta analisarManutencao e responda assim:

Se houver problemas:
"Com base nos dados do sistema, aqui estão as manutenções necessárias:

🔴 CRÍTICO
- [sensor]: [ação específica]

🟠 ALTO
- [sensor]: [ação específica]

🟡 MÉDIO
- [sensor]: [ação específica]

🟢 BAIXO
- [sensor]: [ação específica]"

Se não houver problemas:
"Sistema operando normalmente. Nenhuma manutenção necessária no momento."`;


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
      description: 'Busca alertas do sistema por status, severidade ou sensor. Sempre informe "sensor" quando o usuário perguntar sobre um sensor específico — sem esse filtro a busca retorna alertas de TODOS os sensores.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '"pendente", "resolvido" ou "ignorado". Omita para todos.' },
          nivel_severidade: { type: 'string', description: '"alto", "médio" ou "baixo". Omita para todos.' },
          sensor: { type: 'string', description: 'Nome (ou parte do nome) do sensor para filtrar, ex: "Laboratório" ou "Umid. Almoxarifado". Omita para todos os sensores.' }
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
  },
  {
    type: 'function',
    function: {
      name: 'calcularMTBF',
      description: 'Retorna o MTBF (Tempo Médio Entre Falhas) de cada sensor — o mesmo valor exibido na tela de Manutenção Preventiva. Conta falhas automáticas (SENSOR_OFFLINE) e manuais (INTERVENCAO_MANUAL) desde o cadastro do dispositivo. Identifica sensores com MTBF estourado (offline há mais tempo que sua média histórica). Use para perguntas sobre MTBF, confiabilidade, falhas recorrentes ou sensores com comportamento anormal.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analisarManutencao',
      description: 'Analisa o estado do sistema e retorna uma lista priorizada de manutenções necessárias. Use sempre que o usuário pedir sugestões de manutenção, relatório de saúde do sistema ou quais sensores precisam de atenção.',
      parameters: {
        type: 'object',
        properties: {
          dias: { type: 'number', description: 'Período de análise de alertas em dias (padrão: 60).' }
        },
        required: []
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

      if (args.sensor) {
        const todosSensores = await Sensor.findAll({ attributes: ['id', 'nome'] });
        const encontrados = encontrarSensoresPorNome(args.sensor, todosSensores);
        if (encontrados.length === 0) {
          return { mensagem: `Nenhum sensor encontrado com o nome "${args.sensor}". Confira o nome exato com buscarSensores.`, dados: [] };
        }
        where.id_sensor = { [Op.in]: encontrados.map(s => s.id) };
      }

      const alertas = await Alerta.findAll({
        where,
        include: [{ association: 'sensor', attributes: ['id', 'nome'] }],
        order: [['timestamp', 'DESC']],
        limit: 20
      });

      if (alertas.length === 0) {
        return {
          mensagem: args.sensor
            ? `O sensor "${args.sensor}" não tem nenhum alerta com esse filtro.`
            : 'Nenhum alerta encontrado.',
          dados: []
        };
      }

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

    if (nome === 'calcularMTBF') {
      const { calcularMTBFTodos } = require('./mtbfService');
      const agora = Date.now();

      const [mtbfPorSensor, sensores] = await Promise.all([
        calcularMTBFTodos(),
        Sensor.findAll({ include: [{ association: 'ambiente', attributes: ['nome'] }] })
      ]);

      const resultados = sensores
        .filter(s => (mtbfPorSensor[String(s.id)]?.falhas || 0) > 0)
        .map(s => {
          const { falhas, horasObservadas, mtbfHoras } = mtbfPorSensor[String(s.id)];
          const estaOffline = s.status === 'OFFLINE';
          const tempoOfflineAtualHoras = estaOffline && s.lastSeen ? (agora - new Date(s.lastSeen).getTime()) / 3600000 : 0;
          const mtbfEstourou = estaOffline && mtbfHoras !== null && tempoOfflineAtualHoras > mtbfHoras;

          return {
            sensor: s.nome,
            ambiente: s.ambiente?.nome || 'Sem ambiente',
            status_atual: s.status,
            numero_falhas: falhas,
            horas_observadas: horasObservadas,
            mtbf: mtbfHoras !== null ? formatarTempo(mtbfHoras) : 'dados insuficientes (nenhuma falha registrada)',
            tempo_offline_atual: estaOffline ? formatarTempo(tempoOfflineAtualHoras) : null,
            mtbf_estourou: mtbfEstourou,
            diagnostico: mtbfEstourou
              ? `⚠️ MTBF ESTOURADO — offline há ${formatarTempo(tempoOfflineAtualHoras)}, mas MTBF histórico é ${formatarTempo(mtbfHoras)}`
              : estaOffline
                ? `Offline, mas dentro do MTBF histórico`
                : 'Operando normalmente'
          };
        });

      const estourados = resultados.filter(r => r.mtbf_estourou);

      if (resultados.length === 0) {
        return {
          mensagem: 'Nenhum histórico de falhas encontrado. O sistema pode não ter registrado falhas (SENSOR_OFFLINE ou INTERVENCAO_MANUAL) ainda.'
        };
      }

      return {
        total_sensores_com_historico: resultados.length,
        sensores_com_mtbf_estourado: estourados.length,
        resumo: estourados.length > 0
          ? `${estourados.length} sensor(es) com MTBF estourado — intervenção necessária`
          : 'Nenhum MTBF estourado. Sistema dentro dos parâmetros históricos.',
        detalhes: resultados
      };
    }

    if (nome === 'analisarManutencao') {
      const dias = args.dias || 60;
      const dataLimite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

      const [todosOsSensores, alertasRecentes] = await Promise.all([
        Sensor.findAll({
          include: [{ association: 'ambiente', attributes: ['id', 'nome'] }],
          order: [['id', 'ASC']]
        }),
        Alerta.findAll({
          where: { timestamp: { [Op.gte]: dataLimite } },
          include: [{ association: 'sensor', attributes: ['id', 'nome'] }],
          order: [['timestamp', 'DESC']]
        })
      ]);

      // Sensores offline
      const agora = Date.now();
      const sensoresOffline = todosOsSensores
        .filter(s => s.status === 'OFFLINE')
        .map(s => ({
          id: s.id,
          nome: s.nome,
          ambiente: s.ambiente?.nome || 'Sem ambiente',
          ultimo_dado: s.lastSeen ? new Date(s.lastSeen).toLocaleString('pt-BR') : 'Nunca registrado',
          minutos_offline: s.lastSeen ? Math.floor((agora - new Date(s.lastSeen)) / 60000) : null,
          prioridade: 'CRÍTICO'
        }));

      // Contagem de alertas por sensor
      const contagemPorSensor = {};
      for (const alerta of alertasRecentes) {
        const key = alerta.id_sensor;
        if (!contagemPorSensor[key]) {
          contagemPorSensor[key] = {
            id_sensor: key,
            nome: alerta.sensor?.nome || `Sensor ${key}`,
            total_alertas: 0,
            alertas_pendentes: 0,
            severidade_alta: 0,
            tipos: {}
          };
        }
        contagemPorSensor[key].total_alertas++;
        if (alerta.status === 'pendente') contagemPorSensor[key].alertas_pendentes++;
        if (alerta.nivel_severidade === 'alto') contagemPorSensor[key].severidade_alta++;
        contagemPorSensor[key].tipos[alerta.tipo] = (contagemPorSensor[key].tipos[alerta.tipo] || 0) + 1;
      }

      const rankingSensores = Object.values(contagemPorSensor)
        .filter(s => s.total_alertas >= 2)
        .sort((a, b) => b.severidade_alta - a.severidade_alta || b.total_alertas - a.total_alertas)
        .map(s => ({
          ...s,
          prioridade: s.severidade_alta >= 2 || s.alertas_pendentes >= 3 ? 'ALTO' : 'MÉDIO'
        }));

      // Sensores online sem dados recentes (> 1 hora)
      const umaHoraAtras = new Date(agora - 60 * 60 * 1000);
      const sensoresSemDados = todosOsSensores
        .filter(s => s.status !== 'OFFLINE' && s.lastSeen && new Date(s.lastSeen) < umaHoraAtras)
        .map(s => ({
          id: s.id,
          nome: s.nome,
          ambiente: s.ambiente?.nome || 'Sem ambiente',
          ultimo_dado: new Date(s.lastSeen).toLocaleString('pt-BR'),
          minutos_sem_dados: Math.floor((agora - new Date(s.lastSeen)) / 60000),
          prioridade: 'BAIXO'
        }));

      const temProblemas = sensoresOffline.length > 0 || rankingSensores.length > 0 || sensoresSemDados.length > 0;

      return {
        periodo_analisado: `últimos ${dias} dias`,
        total_sensores: todosOsSensores.length,
        total_alertas_periodo: alertasRecentes.length,
        sistema_ok: !temProblemas,
        manutencoes_necessarias: {
          critico: sensoresOffline,
          alto: rankingSensores.filter(s => s.prioridade === 'ALTO'),
          medio: rankingSensores.filter(s => s.prioridade === 'MÉDIO'),
          baixo: sensoresSemDados
        }
      };
    }

    return { erro: `Função desconhecida: ${nome}` };
  } catch (error) {
    return { erro: `Erro ao executar ${nome}: ${error.message}` };
  }
}

const REGEX_CHAMADA_TEXTO = /<function=([a-zA-Z0-9_]+)>([\s\S]*?)<\/function>/g;

// Modelos pequenos/rápidos (ex: llama-3.1-8b-instant) nem sempre respeitam o
// tool_calls estruturado da API — às vezes "escrevem" a chamada como texto solto
// (ex: "<function=buscarSensores>{...}</function>"), que sem isso ia direto pro
// usuário como se fosse a resposta final, em vez de executar a ferramenta.
function extrairChamadasDeTexto(content) {
  if (!content) return [];
  const chamadas = [];
  let m;
  REGEX_CHAMADA_TEXTO.lastIndex = 0;
  while ((m = REGEX_CHAMADA_TEXTO.exec(content)) !== null) {
    const argsRaw = m[2].trim().replace(/"\s*$/, '').trim();
    let args = {};
    try { args = argsRaw ? JSON.parse(argsRaw) : {}; } catch (e) { args = {}; }
    chamadas.push({ nome: m[1], args });
  }
  return chamadas;
}

function normalizarMensagem(msg) {
  if (msg.tool_calls && msg.tool_calls.length > 0) return msg;
  const chamadas = extrairChamadasDeTexto(msg.content);
  if (chamadas.length === 0) return msg;

  msg.tool_calls = chamadas.map((c, i) => ({
    id: `fallback-${Date.now()}-${i}`,
    type: 'function',
    function: { name: c.nome, arguments: JSON.stringify(c.args) }
  }));
  msg.content = msg.content.replace(REGEX_CHAMADA_TEXTO, '').trim() || null;
  return msg;
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

  let assistantMessage = normalizarMensagem(response.choices[0].message);
  messages.push(assistantMessage);

  // Loop de Function Calling
  // Llama, às vezes, manda `arguments` vazio ou malformado para ferramentas sem
  // parâmetros obrigatórios (ex: buscarAmbientes, calcularMTBF) — sem o try/catch
  // abaixo, isso derrubava a conversa inteira com "Erro ao processar mensagem".
  let iteracoes = 0;
  while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iteracoes < 5) {
    iteracoes++;
    for (const toolCall of assistantMessage.tool_calls) {
      let args = {};
      try {
        args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
      } catch (e) {
        args = {};
      }
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

    assistantMessage = normalizarMensagem(response.choices[0].message);
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
