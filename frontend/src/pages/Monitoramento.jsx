import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { RefreshCw, Home, Radio, AlertTriangle, BarChart3, ArrowRight } from 'lucide-react';
import { Header, Drawer, Footer, StatsCard, AmbientePanel, Loading } from '../components';
import {
  getAmbientes,
  getSensores,
  getLeituras,
  getAlertas,
  logout as apiLogout,
  isAuthenticated,
  getUserEmail,
  isAdmin as checkIsAdmin,
  getProfile,
  getSensorInterval,
  setSensorInterval
} from '../services/api';
import { obterLeiturasRecentes } from '../services/leituras';
import '../styles/Monitoramento.css';

const INTERVAL_OPTIONS = [
  { label: 'Instantâneo', value: 30000 },
  { label: '2 min',       value: 120000 },
  { label: '5 min',       value: 300000 },
  { label: '10 min',      value: 600000 },
];

const Monitoramento = () => {
  const navigate = useNavigate();

  // UI States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data States
  const [ambientes, setAmbientes] = useState([]);
  const [sensores, setSensores] = useState([]);
  const [leituras, setLeituras] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [leiturasTempoReal, setLeiturasTempoReal] = useState([]);
  const isRefreshing = useRef(false);

  // Atualização automática
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());
  const [readingInterval, setReadingInterval] = useState(30000);

  const handleIntervalChange = useCallback(async (value) => {
    setReadingInterval(value);
    try {
      await setSensorInterval(value);
    } catch (err) {
      console.warn('Não foi possível sincronizar intervalo com o ESP:', err.message);
    }
  }, []);

  // Logout
  const handleLogout = useCallback(() => {
    apiLogout();
    navigate('/login');
  }, [navigate]);

  // Toggle drawer
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  // Carregar dados
  const carregarDados = useCallback(async () => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;
    try {
      const [ambientesData, sensoresData, leiturasData, alertasData, leiturasRecentesData] = await Promise.all([
        getAmbientes(),
        getSensores(),
        getLeituras(),
        getAlertas(),
        obterLeiturasRecentes(60)
      ]);

      setAmbientes(ambientesData);
      setSensores(sensoresData);
      setLeituras(leiturasData);
      setAlertas(alertasData);
      setLeiturasTempoReal(leiturasRecentesData);

      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do monitoramento');
    } finally {
      setLoading(false);
      isRefreshing.current = false;
    }
  }, []);

  // Criar mapa de últimas leituras por sensor
  // Usa leiturasTempoReal (últimos 60 min, sem limit) como fonte principal
  const criarMapaLeituras = () => {
    const mapa = {};
    const source = leiturasTempoReal.length > 0 ? leiturasTempoReal : leituras;

    const leiturasOrdenadas = [...source].sort((a, b) => {
      const dataA = new Date(a.timestamp || a.data_hora || a.createdAt);
      const dataB = new Date(b.timestamp || b.data_hora || b.createdAt);
      return dataB - dataA;
    });

    leiturasOrdenadas.forEach(leitura => {
      const sensorId = leitura.id_sensor || leitura.sensor_id || leitura.sensorId;
      const tipo = leitura.tipo_leitura || leitura.tipo || '';
      const key = `${sensorId}-${tipo}`;
      if (!mapa[key]) mapa[key] = leitura;
    });

    return mapa;
  };

  // Calcular estatísticas — recebe o mapa já computado para não duplicar o cálculo
  const calcularEstatisticas = (mapaLeituras) => {
    const alertasAtivos = alertas.filter(a =>
      a.status === 'ativo' || a.status === 'pendente'
    );

    const alertasCriticos = alertasAtivos.filter(a =>
      (a.nivel_severidade || a.severidade) === 'alto'
    );

    const sensoresOnline = sensores.filter(sensor => {
      const entradas = Object.entries(mapaLeituras)
        .filter(([k]) => k.startsWith(`${sensor.id}-`))
        .map(([, v]) => v);

      if (!entradas.length) return false;

      const ultima = entradas.sort((a, b) =>
        new Date(b.timestamp || b.data_hora || b.createdAt) -
        new Date(a.timestamp || a.data_hora || a.createdAt)
      )[0];

      const diffMinutos = (new Date() - new Date(ultima.timestamp || ultima.data_hora || ultima.createdAt)) / 60000;
      return diffMinutos < 10;
    });

    return {
      totalAmbientes: ambientes.length,
      totalSensores: sensores.length,
      sensoresOnline: sensoresOnline.length,
      alertasAtivos: alertasAtivos.length,
      alertasCriticos: alertasCriticos.length,
      leiturasHoje: leituras.filter(l => {
        const data = new Date(l.timestamp || l.data_hora || l.createdAt);
        return data.toDateString() === new Date().toDateString();
      }).length
    };
  };

  // Efeito de autenticação
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    setUserEmail(getUserEmail() || '');
    setIsUserAdmin(checkIsAdmin());

    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        if (profile) {
          const tipoUsuario = profile.tipo_Usuario || profile.tipo_usuario;
          setIsUserAdmin(tipoUsuario === 'admin');
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };

    loadProfile();
    carregarDados();

    getSensorInterval()
      .then(({ interval }) => setReadingInterval(interval))
      .catch(() => {});
  }, [navigate, carregarDados]);

  // Auto-refresh com intervalo configurável
  useEffect(() => {
    const interval = setInterval(() => {
      carregarDados();
    }, readingInterval);

    return () => clearInterval(interval);
  }, [readingInterval, carregarDados]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const leiturasMap = criarMapaLeituras();
  const stats = calcularEstatisticas(leiturasMap);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="monitoramento-page">
      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onLogout={handleLogout}
        isAdmin={isUserAdmin}
      />

      <Header
        title="Monitoramento em Tempo Real"
        userEmail={userEmail}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      <div className="container">
        {/* Barra de status */}
        <div className="status-bar">
          <div className="last-update">
            <span className="update-icon"><RefreshCw size={14} className="icon-inline" /></span>
            <span>Última atualização: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}</span>
          </div>
          <div className="interval-control">
            <span className="interval-label">Tempo de leitura:</span>
            <div className="interval-options">
              {INTERVAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`interval-btn${readingInterval === opt.value ? ' active' : ''}`}
                  onClick={() => handleIntervalChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              className="btn-refresh"
              onClick={carregarDados}
              title="Atualizar agora"
            >
              <RefreshCw size={16} className="icon-inline" />
            </button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="stats-grid">
          <StatsCard
            title="Ambientes"
            value={stats.totalAmbientes}
            icon={Home}
            color="primary"
            subtitle="Monitorados"
          />
          <StatsCard
            title="Sensores Online"
            value={`${stats.sensoresOnline}/${stats.totalSensores}`}
            icon={Radio}
            color="success"
            subtitle="Ativos agora"
          />
          <StatsCard
            title="Alertas Ativos"
            value={stats.alertasAtivos}
            icon={AlertTriangle}
            color={stats.alertasCriticos > 0 ? 'danger' : 'warning'}
            subtitle={stats.alertasCriticos > 0 ? `${stats.alertasCriticos} crítico(s)` : 'Em atenção'}
          />
          <StatsCard
            title="Leituras Hoje"
            value={stats.leiturasHoje}
            icon={BarChart3}
            color="primary"
            subtitle="Registradas"
          />
        </div>

        {/* Ambientes com sensores */}
        <div className="section-header">
          <h2>Ambientes Monitorados</h2>
          <span className="section-count">{ambientes.length} ambiente(s)</span>
        </div>

        <div className="ambientes-list">
          {ambientes.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon"><Home size={32} className="icon-muted" /></span>
              <h3>Nenhum ambiente cadastrado</h3>
              <p>Cadastre ambientes para iniciar o monitoramento</p>
              <button
                className="btn-primary"
                onClick={() => navigate('/ambientes')}
              >
                Cadastrar Ambiente
              </button>
            </div>
          ) : (
            ambientes.map(ambiente => (
              <AmbientePanel
                key={ambiente.id}
                ambiente={ambiente}
                sensores={sensores}
                leiturasMap={leiturasMap}
                alertas={alertas}
              />
            ))
          )}
        </div>

        {/* Alertas ativos */}
        {stats.alertasAtivos > 0 && (
          <>
            <div className="section-header alerts-header">
              <h2><AlertTriangle size={18} className="icon-inline" /> Alertas Ativos</h2>
              <button
                className="btn-ver-todos"
                onClick={() => navigate('/alertas')}
              >
                Ver todos <ArrowRight size={14} className="icon-inline" />
              </button>
            </div>
            <div className="alertas-preview">
              {alertas
                .filter(a => a.status === 'ativo' || a.status === 'pendente')
                .slice(0, 3)
                .map(alerta => {
                  const sensor = sensores.find(s => s.id === (alerta.id_sensor || alerta.sensor_id || alerta.sensorId));
                  const ambiente = sensor
                    ? ambientes.find(a => a.id === (sensor.id_ambiente || sensor.ambiente_id || sensor.ambienteId))
                    : null;

                  return (
                    <div
                      key={alerta.id}
                      className={`alerta-preview-item severidade-${alerta.nivel_severidade || alerta.severidade}`}
                    >
                      <div className="alerta-icon">
                        <span
                          className="status-dot"
                          style={{
                            background: (alerta.nivel_severidade || alerta.severidade) === 'alto' ? '#ef4444' :
                              (alerta.nivel_severidade || alerta.severidade) === 'medio' ? '#f59e0b' : '#10b981'
                          }}
                        />
                      </div>
                      <div className="alerta-content">
                        <span className="alerta-tipo">{alerta.tipo}</span>
                        <span className="alerta-local">
                          {ambiente?.nome || '--'} • {sensor?.nome || '--'}
                        </span>
                      </div>
                      <span className="alerta-tempo">
                        {new Date(alerta.data_hora || alerta.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Monitoramento;
