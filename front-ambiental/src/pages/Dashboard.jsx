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
      // Carregar dados de forma independente para evitar falha total
      const [ambientesResult, sensoresResult, leiturasResult, alertasResult] = await Promise.allSettled([
        getAmbientes(),
        getSensores(),
        getLeituras(),
        getAlertas()
      ]);
      
      // Processar resultados individualmente
      if (ambientesResult.status === 'fulfilled') {
        setAmbientes(Array.isArray(ambientesResult.value) ? ambientesResult.value : []);
        console.log('✅ Ambientes carregados:', ambientesResult.value);
      } else {
        console.error('❌ Erro ao carregar ambientes:', ambientesResult.reason);
        setAmbientes([]);
      }
      
      if (sensoresResult.status === 'fulfilled') {
        setSensores(Array.isArray(sensoresResult.value) ? sensoresResult.value : []);
        console.log('✅ Sensores carregados:', sensoresResult.value);
      } else {
        console.error('❌ Erro ao carregar sensores:', sensoresResult.reason);
        setSensores([]);
      }
      
      if (leiturasResult.status === 'fulfilled') {
        setLeituras(Array.isArray(leiturasResult.value) ? leiturasResult.value : []);
        console.log('✅ Leituras carregadas:', leiturasResult.value);
      } else {
        console.error('❌ Erro ao carregar leituras:', leiturasResult.reason);
        setLeituras([]);
      }
      
      if (alertasResult.status === 'fulfilled') {
        setAlertas(Array.isArray(alertasResult.value) ? alertasResult.value : []);
        console.log('✅ Alertas carregados:', alertasResult.value);
      } else {
        console.error('❌ Erro ao carregar alertas:', alertasResult.reason);
        setAlertas([]);
      }
      
    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
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
    
    // Sensores ativos
    const sensoresAtivos = sensores.filter(s => s.status === 'ativo');
    
    const hoje = new Date();
    const leiturasHoje = leituras.filter(l => {
      const data = new Date(l.data_hora || l.timestamp || l.createdAt);
      return data.toDateString() === hoje.toDateString();
    });

    // Debug: mostrar tipos de sensores disponíveis
    console.log('🔍 Sensores disponíveis:', sensores.map(s => ({ id: s.id, tipo: s.tipo, nome: s.nome })));
    console.log('🔍 Leituras disponíveis (primeiras 5):', leituras.slice(0, 5).map(l => ({ 
      id_sensor: l.id_sensor || l.sensor_id || l.sensorId, 
      valor: l.valor, 
      unidade: l.unidade,
      tipo: l.tipo,
      tipo_leitura: l.tipo_leitura
    })));

    // Última leitura de temperatura - verifica tipo do sensor OU unidade da leitura OU tipo_leitura
    const leiturasTemp = leituras.filter(l => {
      const sensorId = l.id_sensor || l.sensor_id || l.sensorId;
      const sensor = sensores.find(s => s.id === sensorId);
      const tipoSensor = sensor?.tipo?.toLowerCase() || '';
      const unidadeLeitura = l.unidade?.toLowerCase() || '';
      const tipoLeitura = (l.tipo || l.tipo_leitura || '')?.toLowerCase() || '';
      
      return tipoSensor.includes('temperatura') || 
             tipoSensor.includes('temp') ||
             unidadeLeitura.includes('°c') || 
             unidadeLeitura.includes('celsius') ||
             tipoLeitura.includes('temperatura') ||
             tipoLeitura.includes('temp');
    });
    const ultimaTemp = leiturasTemp.length > 0 
      ? leiturasTemp.sort((a, b) => new Date(b.data_hora || b.timestamp || b.createdAt) - new Date(a.data_hora || a.timestamp || a.createdAt))[0]
      : null;

    // Última leitura de umidade - verifica tipo do sensor OU unidade da leitura OU tipo_leitura
    const leiturasUmid = leituras.filter(l => {
      const sensorId = l.id_sensor || l.sensor_id || l.sensorId;
      const sensor = sensores.find(s => s.id === sensorId);
      const tipoSensor = sensor?.tipo?.toLowerCase() || '';
      const unidadeLeitura = l.unidade?.toLowerCase() || '';
      const tipoLeitura = (l.tipo || l.tipo_leitura || '')?.toLowerCase() || '';
      
      return tipoSensor.includes('umidade') || 
             tipoSensor.includes('humidity') ||
             unidadeLeitura.includes('%') || 
             unidadeLeitura.includes('percent') ||
             tipoLeitura.includes('umidade') ||
             tipoLeitura.includes('humidity');
    });
    const ultimaUmid = leiturasUmid.length > 0 
      ? leiturasUmid.sort((a, b) => new Date(b.data_hora || b.timestamp || b.createdAt) - new Date(a.data_hora || a.timestamp || a.createdAt))[0]
      : null;
    
    console.log('🌡️ Leituras de temperatura encontradas:', leiturasTemp.length, ultimaTemp);
    console.log('💧 Leituras de umidade encontradas:', leiturasUmid.length, ultimaUmid);
    
    return {
      totalAmbientes: ambientes.length,
      totalSensores: sensores.length,
      sensoresAtivos: sensoresAtivos.length,
      alertasAtivos: alertasAtivos.length,
      alertasCriticos: alertasCriticos.length,
      leiturasHoje: leiturasHoje.length,
      totalLeituras: leituras.length,
      ultimaTemperatura: ultimaTemp?.valor,
      ultimaUmidade: ultimaUmid?.valor
    };
  };

  // Pegar leituras recentes para gráfico
  const getLeiturasRecentes = (tipoSensor) => {
    const sensoresDoTipo = sensores.filter(s => 
      s.tipo?.toLowerCase().includes(tipoSensor.toLowerCase())
    );
    
    if (sensoresDoTipo.length === 0) return [];
    
    const sensorIds = sensoresDoTipo.map(s => s.id);
    
    return leituras
      .filter(l => {
        const sensorId = l.id_sensor || l.sensor_id || l.sensorId;
        return sensorIds.includes(sensorId);
      })
      .sort((a, b) => {
        const dataA = new Date(a.data_hora || a.timestamp || a.createdAt);
        const dataB = new Date(b.data_hora || b.timestamp || b.createdAt);
        return dataB - dataA;
      })
      .slice(0, 24)
      .map(l => ({
        ...l,
        valor: parseFloat(l.valor),
        data: l.data_hora || l.timestamp || l.createdAt
      }));
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
        // Tenta carregar perfil, mas não falha se não conseguir
        try {
          const profile = await getProfile();
          setUserProfile(profile);
          if (profile) {
            const tipoUsuario = profile.tipo_Usuario || profile.tipo_usuario;
            setIsUserAdmin(tipoUsuario === 'admin');
          }
        } catch (profileErr) {
          console.warn('Perfil não disponível, usando dados do localStorage:', profileErr.message);
        }
        
        // Sempre carrega os dados do dashboard
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
            title="Sensores"
            value={stats.sensoresAtivos || stats.totalSensores}
            icon="📡"
            color="success"
            subtitle={`${stats.totalSensores} cadastrado(s)`}
          />
          <StatsCard 
            title="Temperatura"
            value={stats.ultimaTemperatura !== undefined ? `${stats.ultimaTemperatura}°C` : '--'}
            icon="🌡️"
            color={stats.ultimaTemperatura > 30 ? 'danger' : stats.ultimaTemperatura > 25 ? 'warning' : 'primary'}
            subtitle="Última leitura"
          />
          <StatsCard 
            title="Umidade"
            value={stats.ultimaUmidade !== undefined ? `${stats.ultimaUmidade}%` : '--'}
            icon="💧"
            color={stats.ultimaUmidade > 70 || stats.ultimaUmidade < 30 ? 'warning' : 'primary'}
            subtitle="Última leitura"
          />
          <StatsCard 
            title="Alertas"
            value={stats.alertasAtivos}
            icon="⚠️"
            color={stats.alertasCriticos > 0 ? 'danger' : stats.alertasAtivos > 0 ? 'warning' : 'success'}
            subtitle={stats.alertasCriticos > 0 ? `${stats.alertasCriticos} crítico(s)` : stats.alertasAtivos > 0 ? 'Em aberto' : 'Nenhum ativo'}
          />
        </div>

        {/* Cards secundários */}
        <div className="stats-grid" style={{ marginTop: '1rem' }}>
          <StatsCard 
            title="Ambientes"
            value={stats.totalAmbientes}
            icon="🏠"
            color="primary"
            subtitle="Monitorados"
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
