import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  getProfile
} from '../services/api';
import '../styles/Monitoramento.css';

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
  
  // Atualização automática
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const REFRESH_INTERVAL = 30000; // 30 segundos

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
    try {
      const [ambientesData, sensoresData, leiturasData, alertasData] = await Promise.all([
        getAmbientes(),
        getSensores(),
        getLeituras(),
        getAlertas()
      ]);
      
      setAmbientes(ambientesData);
      setSensores(sensoresData);
      setLeituras(leiturasData);
      setAlertas(alertasData);
      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do monitoramento');
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar mapa de últimas leituras por sensor
  const criarMapaLeituras = () => {
    const mapa = {};
    
    // Ordena leituras por data (mais recente primeiro)
    const leiturasOrdenadas = [...leituras].sort((a, b) => {
      const dataA = new Date(a.data_hora || a.createdAt);
      const dataB = new Date(b.data_hora || b.createdAt);
      return dataB - dataA;
    });
    
    // Pega a última leitura de cada sensor
    leiturasOrdenadas.forEach(leitura => {
      const sensorId = leitura.id_sensor || leitura.sensor_id || leitura.sensorId;
      if (!mapa[sensorId]) {
        mapa[sensorId] = leitura;
      }
    });
    
    return mapa;
  };

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const alertasAtivos = alertas.filter(a => 
      a.status === 'aberto' || a.status === 'ativo'
    );
    
    const alertasCriticos = alertasAtivos.filter(a => 
      (a.nivel_severidade || a.severidade) === 'alto'
    );
    
    const sensoresOnline = sensores.filter(sensor => {
      const ultimaLeitura = criarMapaLeituras()[sensor.id];
      if (!ultimaLeitura) return false;
      
      const dataLeitura = new Date(ultimaLeitura.data_hora || ultimaLeitura.createdAt);
      const agora = new Date();
      const diffMinutos = (agora - dataLeitura) / (1000 * 60);
      
      return diffMinutos < 10; // Considera online se teve leitura nos últimos 10 min
    });
    
    return {
      totalAmbientes: ambientes.length,
      totalSensores: sensores.length,
      sensoresOnline: sensoresOnline.length,
      alertasAtivos: alertasAtivos.length,
      alertasCriticos: alertasCriticos.length,
      leiturasHoje: leituras.filter(l => {
        const data = new Date(l.data_hora || l.createdAt);
        const hoje = new Date();
        return data.toDateString() === hoje.toDateString();
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
  }, [navigate, carregarDados]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      carregarDados();
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [autoRefresh, carregarDados]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const stats = calcularEstatisticas();
  const leiturasMap = criarMapaLeituras();

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
            <span className="update-icon">🔄</span>
            <span>Última atualização: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}</span>
          </div>
          <div className="refresh-toggle">
            <label className="toggle-label">
              <input 
                type="checkbox" 
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Auto-refresh</span>
            </label>
            <button 
              className="btn-refresh"
              onClick={carregarDados}
              title="Atualizar agora"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="stats-grid">
          <StatsCard 
            title="Ambientes"
            value={stats.totalAmbientes}
            icon="🏠"
            color="primary"
            subtitle="Monitorados"
          />
          <StatsCard 
            title="Sensores Online"
            value={`${stats.sensoresOnline}/${stats.totalSensores}`}
            icon="📡"
            color="success"
            subtitle="Ativos agora"
          />
          <StatsCard 
            title="Alertas Ativos"
            value={stats.alertasAtivos}
            icon="⚠️"
            color={stats.alertasCriticos > 0 ? 'danger' : 'warning'}
            subtitle={stats.alertasCriticos > 0 ? `${stats.alertasCriticos} crítico(s)` : 'Em aberto'}
          />
          <StatsCard 
            title="Leituras Hoje"
            value={stats.leiturasHoje}
            icon="📊"
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
              <span className="empty-icon">🏠</span>
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
              <h2>⚠️ Alertas Ativos</h2>
              <button 
                className="btn-ver-todos"
                onClick={() => navigate('/alertas')}
              >
                Ver todos →
              </button>
            </div>
            <div className="alertas-preview">
              {alertas
                .filter(a => a.status === 'aberto' || a.status === 'ativo')
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
                        {(alerta.nivel_severidade || alerta.severidade) === 'alto' ? '🔴' : (alerta.nivel_severidade || alerta.severidade) === 'medio' ? '🟡' : '🟢'}
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
