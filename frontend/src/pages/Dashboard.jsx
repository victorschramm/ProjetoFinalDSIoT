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
    const totalAlertasAtivos = alertas.filter(a => a.status === 'ativo').length;
    const totalAlertasPendentes = alertas.filter(a => a.status === 'pendente').length;
    const totalAlertasResolvidos = alertas.filter(a => a.status === 'resolvido').length;
    const totalAlertasIgnorados = alertas.filter(a => a.status === 'ignorado').length;

    const alertasEmAtencao = alertas.filter(a =>
      a.status === 'ativo' || a.status === 'pendente'
    );
    
    const alertasCriticos = alertasEmAtencao.filter(a => 
      (a.nivel_severidade || a.severidade) === 'alto' || (a.nivel_severidade || a.severidade) === 'critico'
    );
    
    // Sensores ativos
    const sensoresAtivos = sensores.filter(s => s.status === 'ativo');
    
    const hoje = new Date();
    const leiturasHoje = leituras.filter(l => {
      const data = new Date(l.data_hora || l.timestamp || l.createdAt);
      return data.toDateString() === hoje.toDateString();
    });

    const extrairData = (leitura) => {
      if (!leitura) return null;
      // Tenta extrair data de múltiplos campos possíveis
      const dataExtraida = leitura.data_hora || 
             leitura.createdAt || 
             leitura.timestamp || 
             leitura.created_at ||
             leitura.updatedAt ||
             leitura.data ||
             leitura.time ||
             leitura.data_registro || 
             leitura.dataHora ||
             leitura.horario || null;
      return dataExtraida;
    };

    // Debug: mostrar tipos de sensores disponíveis
    console.log('🔍 Sensores disponíveis:', sensores.map(s => ({ id: s.id, tipo: s.tipo, nome: s.nome })));
    console.log('🔍 Leituras disponíveis (primeiras 5):', leituras.slice(0, 5).map(l => ({ 
      id_sensor: l.id_sensor || l.sensor_id || l.sensorId, 
      valor: l.valor, 
      unidade: l.unidade,
      tipo: l.tipo,
      tipo_leitura: l.tipo_leitura
    })));

    // Última leitura de temperatura — usa tipo_leitura para não pegar umidade do mesmo sensor
    const leiturasTemp = leituras.filter(l => {
      const tipoLeitura = (l.tipo_leitura || l.tipo || '').toLowerCase();
      return tipoLeitura.includes('temperatura') || tipoLeitura.includes('temp');
    });
    const ultimaTemp = leiturasTemp.length > 0 
      ? leiturasTemp.sort((a, b) => new Date(extrairData(b) || Date.now()) - new Date(extrairData(a) || Date.now()))[0]
      : null;

    // Última leitura de umidade — usa tipo_leitura diretamente
    const leiturasUmid = leituras.filter(l => {
      const tipoLeitura = (l.tipo_leitura || l.tipo || '').toLowerCase();
      return tipoLeitura.includes('umidade') || tipoLeitura.includes('humidity');
    });
    const ultimaUmid = leiturasUmid.length > 0 
      ? leiturasUmid.sort((a, b) => new Date(extrairData(b) || Date.now()) - new Date(extrairData(a) || Date.now()))[0]
      : null;

    console.log('🌡️ Leituras de temperatura encontradas:', leiturasTemp.length);
    if (ultimaTemp) {
      const dataTemp = extrairData(ultimaTemp);
      console.log('  → Última temp:', ultimaTemp.valor, '°C | Data:', dataTemp);
      console.log('  → Objeto:', ultimaTemp);
    }
    
    console.log('💧 Leituras de umidade encontradas:', leiturasUmid.length);
    if (ultimaUmid) {
      const dataUmid = extrairData(ultimaUmid);
      console.log('  → Última umid:', ultimaUmid.valor, '% | Data:', dataUmid);
      console.log('  → Objeto:', ultimaUmid);
    }

    return {
      totalAmbientes: ambientes.length,
      totalSensores: sensores.length,
      sensoresAtivos: sensoresAtivos.length,
      alertasAtivos: totalAlertasAtivos,
      alertasPendentes: totalAlertasPendentes,
      alertasResolvidos: totalAlertasResolvidos,
      alertasIgnorados: totalAlertasIgnorados,
      alertasEmAtencao: alertasEmAtencao.length,
      alertasCriticos: alertasCriticos.length,
      leiturasHoje: leiturasHoje.length,
      totalLeituras: leituras.length,
      ultimaTemperatura: ultimaTemp?.valor,
      ultimaDataTemp: extrairData(ultimaTemp),
      ultimaUmidade: ultimaUmid?.valor,
      ultimaDataUmid: extrairData(ultimaUmid)
    };
  };

  // Pegar leituras recentes para gráfico filtrando por tipo_leitura
  const getLeiturasRecentes = (tipoLeitura) => {
    return leituras
      .filter(l => {
        const tipo = (l.tipo_leitura || l.tipo || '').toLowerCase();
        return tipo.includes(tipoLeitura.toLowerCase());
      })
      .sort((a, b) => {
        const dataA = new Date(a.timestamp || a.data_hora || a.createdAt);
        const dataB = new Date(b.timestamp || b.data_hora || b.createdAt);
        return dataB - dataA;
      })
      .slice(0, 24)
      .map(l => ({
        ...l,
        valor: parseFloat(l.valor),
        data: l.timestamp || l.data_hora || l.createdAt
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

  const formatarData = (dataString) => {
    if (!dataString) return 'Última leitura';
    const data = new Date(dataString);
    if(isNaN(data.getTime())) return 'Última leitura';
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <h1 className="brand-title">MANUT.AI</h1>
          <h2>
            Olá, {userProfile?.name || 'Usuário'}! 👋
          </h2>
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
            color={
              stats.ultimaTemperatura < 15 || stats.ultimaTemperatura > 35 ? 'danger' : 
              stats.ultimaTemperatura < 18 || stats.ultimaTemperatura > 30 ? 'warning' : 'primary'
            }
            subtitle={stats.ultimaDataTemp ? formatarData(stats.ultimaDataTemp) : 'Última leitura'}
          />
          <StatsCard 
            title="Umidade"
            value={stats.ultimaUmidade !== undefined ? `${stats.ultimaUmidade}%` : '--'}
            icon="💧"
            color={
              stats.ultimaUmidade < 20 || stats.ultimaUmidade > 80 ? 'danger' : 
              stats.ultimaUmidade < 30 || stats.ultimaUmidade > 70 ? 'warning' : 'primary'
            }
            subtitle={stats.ultimaDataUmid ? formatarData(stats.ultimaDataUmid) : 'Última leitura'}
          />
          <StatsCard 
            title="Alertas (Atenção)"
            value={stats.alertasEmAtencao}
            icon="⚠️"
            color={stats.alertasCriticos > 0 ? 'danger' : stats.alertasEmAtencao > 0 ? 'warning' : 'success'}
            subtitle={stats.alertasCriticos > 0 ? `${stats.alertasCriticos} crítico(s)` : `${stats.alertasAtivos} Ativos | ${stats.alertasPendentes} Pend./Abertos`}
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

        {/* Grade inferior — Acesso Rápido | Visão Geral | Alertas */}
        <div className="dashboard-bottom-grid">

          {/* Col 1 — Acesso Rápido */}
          <div className="quick-actions">
            <h2>Acesso Rápido</h2>
            <div className="actions-grid">
              <button className="action-card" onClick={() => navigate('/monitoramento')}>
                <span className="action-icon">📊</span>
                <span className="action-title">Monitoramento</span>
                <span className="action-desc">Tempo real</span>
              </button>
              <button className="action-card" onClick={() => navigate('/historico')}>
                <span className="action-icon">📈</span>
                <span className="action-title">Histórico</span>
                <span className="action-desc">Gráficos e dados</span>
              </button>
              <button className="action-card" onClick={() => navigate('/alertas')}>
                <span className="action-icon">🔔</span>
                <span className="action-title">Alertas</span>
                <span className="action-desc">{stats.alertasEmAtencao} em atenção</span>
              </button>
              <button className="action-card" onClick={() => navigate('/ambientes')}>
                <span className="action-icon">🏢</span>
                <span className="action-title">Ambientes</span>
                <span className="action-desc">Gerenciar</span>
              </button>
            </div>
          </div>

          {/* Col 2 — Visão Geral */}
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
                  <button className="btn-primary" onClick={() => navigate('/leituras')}>
                    Registrar Leituras
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Col 3 — Alertas em Atenção */}
          <div className="alerts-column">
            {stats.alertasEmAtencao > 0 && (
              <div className="alerts-section">
                <div className="section-header">
                  <h2>⚠️ Alertas em Atenção</h2>
                  <button className="btn-link" onClick={() => navigate('/alertas')}>
                    Ver todos →
                  </button>
                </div>
                <div className="alerts-list">
                  {alertas
                    .filter(a => a.status === 'ativo' || a.status === 'pendente')
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
                            {new Date(alerta.timestamp || alerta.data_hora || alerta.createdAt).toLocaleString('pt-BR', {
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

        </div>{/* fim dashboard-bottom-grid */}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Dashboard;
