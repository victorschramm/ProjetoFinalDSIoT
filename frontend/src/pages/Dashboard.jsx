import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Header, Drawer, Footer, StatsCard, Loading } from '../components';
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

  // Temperatura e umidade mais recentes por ambiente
  const getLeiturasAmbientes = () => {
    return ambientes.map(ambiente => {
      const sensoresDoAmbiente = sensores.filter(s => s.id_ambiente === ambiente.id);
      const idsDoAmbiente = sensoresDoAmbiente.map(s => s.id);
      const leiturasDoAmbiente = leituras.filter(l => idsDoAmbiente.includes(l.id_sensor));

      const ultimaTemp = leiturasDoAmbiente
        .filter(l => (l.tipo_leitura || '').toLowerCase().includes('temperatura'))
        .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))[0];

      const ultimaUmid = leiturasDoAmbiente
        .filter(l => (l.tipo_leitura || '').toLowerCase().includes('umidade'))
        .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))[0];

      return {
        id: ambiente.id,
        nome: ambiente.nome,
        localizacao: ambiente.localizacao,
        temperatura: ultimaTemp?.valor,
        umidade: ultimaUmid?.valor,
        ultimaLeitura: ultimaTemp?.timestamp || ultimaTemp?.createdAt || null
      };
    });
  };

  const stats = calcularEstatisticas();
  const leiturasAmbientes = getLeiturasAmbientes();

  // Dados para o gráfico comparativo (só ambientes com pelo menos uma leitura)
  const ambientesComLeitura = leiturasAmbientes.filter(
    a => a.temperatura !== undefined || a.umidade !== undefined
  );

  const dadosComparativo = ambientesComLeitura.map(a => ({
    nome: a.nome.length > 12 ? a.nome.slice(0, 12) + '…' : a.nome,
    nomeCompleto: a.nome,
    temperatura: a.temperatura !== undefined ? parseFloat(Number(a.temperatura).toFixed(1)) : null,
    umidade: a.umidade !== undefined ? parseFloat(Number(a.umidade).toFixed(1)) : null
  }));

  // Destaques comparativos de temperatura
  const ambientesComTemp = leiturasAmbientes.filter(a => a.temperatura !== undefined);
  const maiorTemp = ambientesComTemp.length
    ? ambientesComTemp.reduce((a, b) => a.temperatura > b.temperatura ? a : b)
    : null;
  const menorTemp = ambientesComTemp.length
    ? ambientesComTemp.reduce((a, b) => a.temperatura < b.temperatura ? a : b)
    : null;
  const mediaTemp = ambientesComTemp.length
    ? (ambientesComTemp.reduce((s, a) => s + parseFloat(a.temperatura), 0) / ambientesComTemp.length).toFixed(1)
    : null;

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
            Aqui está um resumo do seu sistema de monitoramento do ambiente
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
          <StatsCard
            title="Alertas (Atenção)"
            value={stats.alertasEmAtencao}
            icon="⚠️"
            color={stats.alertasCriticos > 0 ? 'danger' : stats.alertasEmAtencao > 0 ? 'warning' : 'success'}
            subtitle={stats.alertasCriticos > 0 ? `${stats.alertasCriticos} crítico(s)` : `${stats.alertasAtivos} Ativos | ${stats.alertasPendentes} Pend./Abertos`}
          />
        </div>

        {/* Lista de temperatura e umidade por ambiente */}
        <div className="ambientes-leituras-section">
          <h2 className="ambientes-leituras-title">🌡️ Temperatura e Umidade por Ambiente</h2>
          {leiturasAmbientes.length === 0 ? (
            <div className="ambientes-leituras-vazio">
              <span>🏠</span>
              <p>Nenhum ambiente cadastrado</p>
            </div>
          ) : (
            <div className="ambientes-leituras-lista">
              {leiturasAmbientes.map(amb => (
                <div key={amb.id} className="ambiente-leitura-item">
                  <div className="ambiente-leitura-nome">
                    <span className="ambiente-leitura-icone">🏢</span>
                    <div>
                      <span className="ambiente-leitura-label">{amb.nome}</span>
                      {amb.localizacao && (
                        <span className="ambiente-leitura-local">{amb.localizacao}</span>
                      )}
                    </div>
                  </div>
                  <div className="ambiente-leitura-dados">
                    <div className="ambiente-leitura-valor temp">
                      <span className="ambiente-leitura-valor-icone">🌡️</span>
                      <span className="ambiente-leitura-numero">
                        {amb.temperatura !== undefined && amb.temperatura !== null
                          ? `${amb.temperatura}°C`
                          : '--'}
                      </span>
                      <span className="ambiente-leitura-tipo">Temperatura</span>
                    </div>
                    <div className="ambiente-leitura-divisor" />
                    <div className="ambiente-leitura-valor umid">
                      <span className="ambiente-leitura-valor-icone">💧</span>
                      <span className="ambiente-leitura-numero">
                        {amb.umidade !== undefined && amb.umidade !== null
                          ? `${amb.umidade}%`
                          : '--'}
                      </span>
                      <span className="ambiente-leitura-tipo">Umidade</span>
                    </div>
                  </div>
                  {amb.ultimaLeitura && (
                    <div className="ambiente-leitura-horario">
                      {formatarData(amb.ultimaLeitura)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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

          {/* Col 2 — Visão Geral Comparativa */}
          <div className="charts-section">
            <h2>Visão Geral</h2>

            {dadosComparativo.length === 0 ? (
              <div className="empty-charts">
                <span className="empty-icon">📊</span>
                <p>Nenhuma leitura disponível para comparar ambientes</p>
              </div>
            ) : (
              <>
                {/* Destaques */}
                <div className="comparativo-destaques">
                  <div className="comparativo-destaque maior">
                    <span className="comparativo-destaque-label">🔴 Maior Temp.</span>
                    <span className="comparativo-destaque-valor">{maiorTemp?.temperatura}°C</span>
                    <span className="comparativo-destaque-nome">{maiorTemp?.nome}</span>
                  </div>
                  <div className="comparativo-destaque media">
                    <span className="comparativo-destaque-label">🟡 Média</span>
                    <span className="comparativo-destaque-valor">{mediaTemp}°C</span>
                    <span className="comparativo-destaque-nome">{ambientesComTemp.length} ambiente(s)</span>
                  </div>
                  <div className="comparativo-destaque menor">
                    <span className="comparativo-destaque-label">🔵 Menor Temp.</span>
                    <span className="comparativo-destaque-valor">{menorTemp?.temperatura}°C</span>
                    <span className="comparativo-destaque-nome">{menorTemp?.nome}</span>
                  </div>
                </div>

                {/* Gráfico de barras comparativo */}
                <div className="comparativo-chart-wrapper">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={dadosComparativo}
                      margin={{ top: 8, right: 8, left: -10, bottom: 4 }}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis
                        dataKey="nome"
                        stroke="#9ca3af"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        contentStyle={{
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9',
                          fontSize: '12px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                        }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        itemStyle={{ color: '#f1f5f9' }}
                        formatter={(value, name) => [
                          `${value}${name === 'temperatura' ? '°C' : '%'}`,
                          name === 'temperatura' ? '🌡️ Temperatura' : '💧 Umidade'
                        ]}
                        labelFormatter={(label) => {
                          const item = dadosComparativo.find(d => d.nome === label);
                          return item?.nomeCompleto || label;
                        }}
                      />
                      <Legend
                        formatter={(value) => value === 'temperatura' ? '🌡️ Temperatura (°C)' : '💧 Umidade (%)'}
                        wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                      />
                      <Bar dataKey="temperatura" name="temperatura" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="umidade" name="umidade" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
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
