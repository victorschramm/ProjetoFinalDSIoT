// UI pode ser reutilizada para histórico de usuários, pedidos, etc.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Activity } from 'lucide-react';
import { Header, Drawer, Footer, Loading } from '../components';
import {
  getDispositivos,
  getAssetHistory,
  getAssetMTBF,
  isAuthenticated,
  logout as apiLogout,
  getUserEmail,
  isAdmin as checkIsAdmin
} from '../services/api';
import '../styles/HistoricoAtivo.css';

const TIPO_EVENTO_LABELS = {
  ALERTA_TEMPERATURA: 'Alerta de Temperatura',
  ALERTA_UMIDADE: 'Alerta de Umidade',
  SENSOR_OFFLINE: 'Sensor Offline',
  SENSOR_ONLINE: 'Sensor Online',
  MANUTENCAO: 'Manutenção',
  INTERVENCAO_MANUAL: 'Intervenção Manual',
  RETORNO_NORMALIDADE: 'Retorno à Normalidade',
  ALERTA_ATIVADO: 'Alerta Ativado',
  ALERTA_PENDENTE: 'Alerta Pendente'
};

// Classifica cada tipo de evento para fins de destaque visual
function getEventoCategoria(tipoEvento) {
  if (tipoEvento.startsWith('ALERTA_') || tipoEvento === 'SENSOR_OFFLINE') return 'alerta';
  if (tipoEvento === 'MANUTENCAO' || tipoEvento === 'INTERVENCAO_MANUAL') return 'manutencao';
  return 'normal';
}

function formatarData(dataStr) {
  if (!dataStr) return '—';
  return new Date(dataStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

const TIPOS_EVENTO_OPCOES = [
  '', 'ALERTA_TEMPERATURA', 'ALERTA_UMIDADE', 'SENSOR_OFFLINE', 'SENSOR_ONLINE',
  'MANUTENCAO', 'INTERVENCAO_MANUAL', 'RETORNO_NORMALIDADE', 'ALERTA_ATIVADO', 'ALERTA_PENDENTE'
];

function HistoricoAtivo() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const [dispositivos, setDispositivos] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carregouUmaVez, setCarregouUmaVez] = useState(false);
  const [mtbf, setMtbf] = useState(null);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFim, setFiltroFim] = useState('');

  const handleLogout = useCallback(() => {
    apiLogout();
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    setUserEmail(getUserEmail() || '');
    setIsUserAdmin(checkIsAdmin());

    getDispositivos()
      .then(data => setDispositivos(data))
      .catch(() => {});
  }, [navigate]);

  // MTBF é uma métrica do dispositivo inteiro (não depende dos filtros de evento)
  useEffect(() => {
    if (!deviceId) { setMtbf(null); return; }
    getAssetMTBF(deviceId)
      .then(setMtbf)
      .catch(() => setMtbf(null));
  }, [deviceId]);

  const buscarHistorico = useCallback(async () => {
    if (!deviceId) {
      toast.warn('Selecione um dispositivo.');
      return;
    }
    setLoading(true);
    try {
      const filtros = {};
      if (filtroTipo) filtros.tipoEvento = filtroTipo;
      if (filtroInicio) filtros.inicio = new Date(filtroInicio).toISOString();
      if (filtroFim) filtros.fim = new Date(filtroFim + 'T23:59:59').toISOString();

      const data = await getAssetHistory(deviceId, filtros);
      setEventos(data);
      setCarregouUmaVez(true);
    } catch (err) {
      toast.error('Erro ao buscar histórico do dispositivo.');
    } finally {
      setLoading(false);
    }
  }, [deviceId, filtroTipo, filtroInicio, filtroFim]);

  const limparFiltros = () => {
    setFiltroTipo('');
    setFiltroInicio('');
    setFiltroFim('');
  };

  const dispositivoSelecionado = dispositivos.find(d => String(d.id) === String(deviceId));

  return (
    <div className="historico-ativo-page">
      <Header
        userEmail={userEmail}
        onMenuToggle={() => setDrawerOpen(true)}
        onLogout={handleLogout}
      />
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogout}
        isAdmin={isUserAdmin}
      />

      <main className="historico-ativo-main">
        <div className="historico-ativo-header">
          <h1>Currículo da Máquina</h1>
          <p className="historico-ativo-subtitle">
            Histórico completo de eventos por dispositivo
          </p>
        </div>

        {/* Painel de Filtros */}
        <section className="historico-ativo-filtros">
          <div className="filtro-grupo">
            <label htmlFor="select-device">Dispositivo</label>
            <select
              id="select-device"
              value={deviceId}
              onChange={e => { setDeviceId(e.target.value); setCarregouUmaVez(false); setEventos([]); }}
            >
              <option value="">— Selecione —</option>
              {dispositivos.map(d => (
                <option key={d.id} value={d.id}>{d.nome} ({d.topico_mqtt})</option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label htmlFor="filtro-tipo">Tipo de Evento</label>
            <select
              id="filtro-tipo"
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
            >
              {TIPOS_EVENTO_OPCOES.map(t => (
                <option key={t} value={t}>{t ? (TIPO_EVENTO_LABELS[t] || t) : 'Todos os tipos'}</option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label htmlFor="filtro-inicio">De</label>
            <input
              type="date"
              id="filtro-inicio"
              value={filtroInicio}
              onChange={e => setFiltroInicio(e.target.value)}
            />
          </div>

          <div className="filtro-grupo">
            <label htmlFor="filtro-fim">Até</label>
            <input
              type="date"
              id="filtro-fim"
              value={filtroFim}
              onChange={e => setFiltroFim(e.target.value)}
            />
          </div>

          <div className="filtro-acoes">
            <button className="btn-buscar" onClick={buscarHistorico} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button className="btn-limpar" onClick={limparFiltros}>
              Limpar filtros
            </button>
          </div>
        </section>

        {/* Info do dispositivo selecionado */}
        {dispositivoSelecionado && (
          <div className="historico-device-info">
            <span className="device-nome">{dispositivoSelecionado.nome}</span>
            <span className={`device-status status-${dispositivoSelecionado.status}`}>
              {dispositivoSelecionado.status}
            </span>
            <span className="device-topico">{dispositivoSelecionado.topico_mqtt}</span>
            {mtbf && (
              <span className="device-mtbf">
                <Activity size={14} className="icon-inline icon-muted" /> MTBF:{' '}
                {mtbf.mtbfHoras != null ? `${mtbf.mtbfHoras.toFixed(1)}h` : 'Sem falhas registradas'}
                {mtbf.falhas > 0 && ` (${mtbf.falhas} falha${mtbf.falhas > 1 ? 's' : ''} em ${Math.round(mtbf.horasObservadas / 24)}d)`}
              </span>
            )}
          </div>
        )}

        {/* Conteúdo principal */}
        {loading && <Loading message="Buscando histórico..." />}

        {!loading && carregouUmaVez && eventos.length === 0 && (
          <div className="historico-vazio">
            <p>Nenhum evento encontrado para os filtros aplicados.</p>
          </div>
        )}

        {!loading && eventos.length > 0 && (
          <>
            <div className="historico-contagem">
              {eventos.length} evento{eventos.length !== 1 ? 's' : ''} encontrado{eventos.length !== 1 ? 's' : ''}
            </div>

            {/* Timeline */}
            <ul className="historico-timeline">
              {eventos.map(evento => {
                const categoria = getEventoCategoria(evento.tipoEvento);
                return (
                  <li key={evento.id} className={`timeline-item categoria-${categoria}`}>
                    <div className="timeline-marcador" aria-hidden="true" />
                    <div className="timeline-conteudo">
                      <div className="timeline-header">
                        <span className={`timeline-badge badge-${categoria}`}>
                          {TIPO_EVENTO_LABELS[evento.tipoEvento] || evento.tipoEvento}
                        </span>
                        <span className="timeline-data">{formatarData(evento.dataEvento)}</span>
                      </div>
                      <p className="timeline-descricao">{evento.descricao}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {!carregouUmaVez && !loading && (
          <div className="historico-instrucao">
            <p>Selecione um dispositivo e clique em <strong>Buscar</strong> para ver o histórico completo.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default HistoricoAtivo;
