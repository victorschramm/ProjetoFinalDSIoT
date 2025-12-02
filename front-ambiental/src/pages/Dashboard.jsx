import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Header, Drawer, Footer, StatsCard, SensorChart, Loading } from '../components';
import { 
  getProfile, 
  getAmbientes,
  getSensores,
  getLeituras,
  getAlertas,
  logout as apiLogout, 
  isAuthenticated, 
  getUserEmail, 
  isAdmin as checkIsAdmin 
} from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // UI States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Data States
  const [ambientes, setAmbientes] = useState([]);
  const [sensores, setSensores] = useState([]);
  const [leituras, setLeituras] = useState([]);
  const [alertas, setAlertas] = useState([]);

  // Função de logout
  const handleLogout = useCallback(() => {
    apiLogout();
    navigate('/login');
  }, [navigate]);

  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Fechar drawer
  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  // Carregar dados do dashboard
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
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do dashboard');
    }
  }, []);

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const alertasAtivos = alertas.filter(a => 
      a.status === 'aberto' || a.status === 'ativo'
    );
    
    const alertasCriticos = alertasAtivos.filter(a => 
      (a.nivel_severidade || a.severidade) === 'alto'
    );
    
    const hoje = new Date();
    const leiturasHoje = leituras.filter(l => {
      const data = new Date(l.data_hora || l.createdAt);
      return data.toDateString() === hoje.toDateString();
    });
    
    return {
      totalAmbientes: ambientes.length,
      totalSensores: sensores.length,
      alertasAtivos: alertasAtivos.length,
      alertasCriticos: alertasCriticos.length,
      leiturasHoje: leiturasHoje.length,
      totalLeituras: leituras.length
    };
  };

  // Pegar leituras recentes para gráfico
  const getLeiturasRecentes = (tipoSensor) => {
    const sensoresDoTipo = sensores.filter(s => 
      s.tipo?.toLowerCase().includes(tipoSensor.toLowerCase())
    );
    
    if (sensoresDoTipo.length === 0) return [];
    
    const sensorId = sensoresDoTipo[0].id;
    
    return leituras
      .filter(l => (l.id_sensor || l.sensor_id || l.sensorId) === sensorId)
      .sort((a, b) => {
        const dataA = new Date(a.data_hora || a.createdAt);
        const dataB = new Date(b.data_hora || b.createdAt);
        return dataB - dataA;
      })
      .slice(0, 24);
  };

  // Carregar dados do usuário
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const email = getUserEmail();
    setUserEmail(email || '');
    
    const adminFromStorage = checkIsAdmin();
    setIsUserAdmin(adminFromStorage);

    const loadData = async () => {
      try {
        const profile = await getProfile();
        setUserProfile(profile);
        if (profile) {
          const tipoUsuario = profile.tipo_Usuario || profile.tipo_usuario;
          setIsUserAdmin(tipoUsuario === 'admin');
        }
        await carregarDados();
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, carregarDados]);

  // Fechar drawer com ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Fechar drawer ao redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && drawerOpen) {
        closeDrawer();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawerOpen]);

  const stats = calcularEstatisticas();
  const leiturasTemperatura = getLeiturasRecentes('temperatura');
  const leiturasUmidade = getLeiturasRecentes('umidade');

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="dashboard-page">
      {/* Drawer */}
      <Drawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer} 
        onLogout={handleLogout}
        isAdmin={isUserAdmin}
      />

      {/* Header */}
      <Header 
        title="Dashboard"
        userEmail={userEmail}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      {/* Conteúdo */}
      <div className="container">
        {/* Saudação */}
        <div className="welcome-section">
          <h1>
            Olá, {userProfile?.name || 'Usuário'}! 👋
          </h1>
          <p className="welcome-subtitle">
            Aqui está um resumo do seu sistema de monitoramento ambiental
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="stats-grid">
          <StatsCard 
            title="Ambientes"
            value={stats.totalAmbientes}
            icon="🏠"
            color="primary"
            subtitle="Cadastrados"
          />
          <StatsCard 
            title="Sensores"
            value={stats.totalSensores}
            icon="📡"
            color="success"
            subtitle="Ativos"
          />
          <StatsCard 
            title="Alertas"
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
            subtitle={`${stats.totalLeituras} total`}
          />
        </div>

        {/* Ações Rápidas */}
        <div className="quick-actions">
          <h2>Acesso Rápido</h2>
          <div className="actions-grid">
            <button 
              className="action-card"
              onClick={() => navigate('/monitoramento')}
            >
              <span className="action-icon">📊</span>
              <span className="action-title">Monitoramento</span>
              <span className="action-desc">Tempo real</span>
            </button>
            <button 
              className="action-card"
              onClick={() => navigate('/historico')}
            >
              <span className="action-icon">📈</span>
              <span className="action-title">Histórico</span>
              <span className="action-desc">Gráficos e dados</span>
            </button>
            <button 
              className="action-card"
              onClick={() => navigate('/alertas')}
            >
              <span className="action-icon">🔔</span>
              <span className="action-title">Alertas</span>
              <span className="action-desc">{stats.alertasAtivos} ativo(s)</span>
            </button>
            <button 
              className="action-card"
              onClick={() => navigate('/ambientes')}
            >
              <span className="action-icon">🏢</span>
              <span className="action-title">Ambientes</span>
              <span className="action-desc">Gerenciar</span>
            </button>
          </div>
        </div>

        {/* Gráficos */}
        <div className="charts-section">
          <h2>Visão Geral</h2>
          <div className="charts-grid">
            {leiturasTemperatura.length > 0 && (
              <SensorChart
                data={leiturasTemperatura}
                tipo="temperatura"
                title="🌡️ Temperatura (últimas leituras)"
                chartType="area"
                height={200}
              />
            )}
            {leiturasUmidade.length > 0 && (
              <SensorChart
                data={leiturasUmidade}
                tipo="umidade"
                title="💧 Umidade (últimas leituras)"
                chartType="area"
                height={200}
              />
            )}
            {leiturasTemperatura.length === 0 && leiturasUmidade.length === 0 && (
              <div className="empty-charts">
                <span className="empty-icon">📊</span>
                <p>Nenhuma leitura disponível para exibir gráficos</p>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/leituras')}
                >
                  Registrar Leituras
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Alertas Recentes */}
        {stats.alertasAtivos > 0 && (
          <div className="alerts-section">
            <div className="section-header">
              <h2>⚠️ Alertas Ativos</h2>
              <button 
                className="btn-link"
                onClick={() => navigate('/alertas')}
              >
                Ver todos →
              </button>
            </div>
            <div className="alerts-list">
              {alertas
                .filter(a => a.status === 'aberto' || a.status === 'ativo')
                .slice(0, 5)
                .map(alerta => {
                  const sensor = sensores.find(s => s.id === (alerta.id_sensor || alerta.sensor_id || alerta.sensorId));
                  const ambiente = sensor 
                    ? ambientes.find(a => a.id === (sensor.id_ambiente || sensor.ambiente_id || sensor.ambienteId))
                    : null;
                  
                  return (
                    <div 
                      key={alerta.id}
                      className={`alert-item severidade-${alerta.nivel_severidade || alerta.severidade}`}
                    >
                      <span className="alert-icon">
                        {(alerta.nivel_severidade || alerta.severidade) === 'alto' ? '🔴' : 
                         (alerta.nivel_severidade || alerta.severidade) === 'medio' ? '🟡' : '🟢'}
                      </span>
                      <div className="alert-info">
                        <span className="alert-tipo">{alerta.tipo}</span>
                        <span className="alert-local">
                          {ambiente?.nome || '--'} • {sensor?.nome || '--'}
                        </span>
                      </div>
                      <span className="alert-time">
                        {new Date(alerta.data_hora || alerta.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Dashboard;
