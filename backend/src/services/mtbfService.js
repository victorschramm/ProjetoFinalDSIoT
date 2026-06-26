// MTBF (tempo médio entre falhas), contando falhas automáticas (SENSOR_OFFLINE)
// e manuais (INTERVENCAO_MANUAL) com o mesmo peso.
//
// IMPORTANTE: o AssetHistory é gravado com deviceId = sensor.id_dispositivo quando
// o sensor está vinculado a um dispositivo ESP, e só usa sensor.id como fallback para
// sensores sem dispositivo (mesma convenção usada em mqtt.js e server.js). O MTBF
// precisa consultar a mesma chave, senão fica olhando para o histórico errado.
const { Op } = require('sequelize');
const Sensor = require('../models/Sensor');
const Dispositivo = require('../models/Dispositivo');
const AssetHistory = require('../models/AssetHistory');

const TIPOS_FALHA = ['SENSOR_OFFLINE', 'INTERVENCAO_MANUAL'];

function arredondar(n) {
  return Math.round(n * 10) / 10;
}

// Chave usada no AssetHistory para um sensor (mesma regra de mqtt.js/server.js)
function chaveHistorico(sensor) {
  return String(sensor.id_dispositivo || sensor.id);
}

async function calcularFalhasPorChave(chaves) {
  if (chaves.length === 0) return {};
  const eventos = await AssetHistory.findAll({
    where: {
      deviceId: { [Op.in]: chaves },
      tipoEvento: { [Op.in]: TIPOS_FALHA }
    },
    attributes: ['deviceId']
  });
  const contagem = {};
  eventos.forEach(e => { contagem[e.deviceId] = (contagem[e.deviceId] || 0) + 1; });
  return contagem;
}

// Retorna um mapa { [sensorId]: { falhas, horasObservadas, mtbfHoras } } para todos os sensores.
// O início da observação é o createdAt do dispositivo vinculado (ou do próprio sensor,
// quando não há dispositivo) — assim sensores do mesmo dispositivo compartilham o mesmo MTBF.
async function calcularMTBFTodos() {
  const sensores = await Sensor.findAll({ attributes: ['id', 'id_dispositivo', 'createdAt'] });
  if (sensores.length === 0) return {};

  const dispositivoIds = [...new Set(sensores.map(s => s.id_dispositivo).filter(Boolean))];
  const dispositivos = dispositivoIds.length
    ? await Dispositivo.findAll({ where: { id: { [Op.in]: dispositivoIds } }, attributes: ['id', 'createdAt'] })
    : [];
  const createdAtPorDispositivo = {};
  dispositivos.forEach(d => { createdAtPorDispositivo[d.id] = d.createdAt; });

  const chaves = [...new Set(sensores.map(chaveHistorico))];
  const contagem = await calcularFalhasPorChave(chaves);

  const agora = new Date();
  const resultado = {};
  sensores.forEach(sensor => {
    const chave = chaveHistorico(sensor);
    const falhas = contagem[chave] || 0;
    const inicioObservacao = sensor.id_dispositivo
      ? (createdAtPorDispositivo[sensor.id_dispositivo] || sensor.createdAt)
      : sensor.createdAt;
    const horasObservadas = (agora - new Date(inicioObservacao)) / (1000 * 60 * 60);

    resultado[String(sensor.id)] = {
      falhas,
      horasObservadas: arredondar(horasObservadas),
      mtbfHoras: falhas > 0 ? arredondar(horasObservadas / falhas) : null
    };
  });

  return resultado;
}

// MTBF de um dispositivo específico (usado na tela "Currículo da Máquina",
// que já navega no espaço de Dispositivo.id).
async function calcularMTBFDispositivo(dispositivoId) {
  const dispositivo = await Dispositivo.findByPk(dispositivoId);
  if (!dispositivo) return null;

  const chave = String(dispositivoId);
  const contagem = await calcularFalhasPorChave([chave]);
  const falhas = contagem[chave] || 0;
  const horasObservadas = (new Date() - new Date(dispositivo.createdAt)) / (1000 * 60 * 60);

  return {
    falhas,
    horasObservadas: arredondar(horasObservadas),
    mtbfHoras: falhas > 0 ? arredondar(horasObservadas / falhas) : null
  };
}

module.exports = { calcularMTBFTodos, calcularMTBFDispositivo, chaveHistorico, TIPOS_FALHA };
