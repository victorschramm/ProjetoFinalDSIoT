import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Header, 
  Drawer, 
  Footer, 
  SensorChart, 
  DateTimeFilter,
  HistoryTable,
  Loading 
} from '../components';
import { 
  getAmbientes, 
  getSensores, 
  getLeituras,
  logout as apiLogout, 
  isAuthenticated, 
  getUserEmail,
  isAdmin as checkIsAdmin,
  getProfile
} from '../services/api';
import '../styles/Historico.css';

const Historico = () => {
  const navigate = useNavigate();
  
  // UI States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('graficos'); // 'graficos' ou 'lista'
  
  // Data States
  const [ambientes, setAmbientes] = useState([]);
  const [sensores, setSensores] = useState([]);
  const [leituras, setLeituras] = useState([]);
  const [leiturasFiltradas, setLeiturasFiltradas] = useState([]);
  
  // Filter States
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [ambienteSelecionado, setAmbienteSelecionado] = useState('');
  const [sensorSelecionado, setSensorSelecionado] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Logout
  const handleLogout = useCallback(() => {
    apiLogout();
    navigate('/login');
  }, [navigate]);

  // Toggle drawer
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  // Carregar dados iniciais
  const carregarDados = useCallback(async () => {
    try {
      const [ambientesData, sensoresData, leiturasData] = await Promise.all([
        getAmbientes(),
        getSensores(),
        getLeituras()
      ]);
      
      setAmbientes(ambientesData);
      setSensores(sensoresData);
      setLeituras(leiturasData);
      setLeiturasFiltradas(leiturasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }, []);

  // Aplicar filtros
  const aplicarFiltros = useCallback(() => {
    let resultado = [...leituras];
    
    // Filtro por sensor
    if (sensorSelecionado) {
      resultado = resultado.filter(l => 
        (l.id_sensor || l.sensor_id || l.sensorId) === parseInt(sensorSelecionado)
      );
    }
    
    // Filtro por ambiente
    if (ambienteSelecionado && !sensorSelecionado) {
      const sensoresDoAmbiente = sensores
        .filter(s => (s.id_ambiente || s.ambiente_id || s.ambienteId) === parseInt(ambienteSelecionado))
        .map(s => s.id);
      
      resultado = resultado.filter(l => 
        sensoresDoAmbiente.includes(l.id_sensor || l.sensor_id || l.sensorId)
      );
    }
    
    // Filtro por data
    if (dataInicio) {
      const inicio = new Date(dataInicio);
      inicio.setHours(horaInicio ? parseInt(horaInicio.split(':')[0]) : 0);
      inicio.setMinutes(horaInicio ? parseInt(horaInicio.split(':')[1]) : 0);
      
      resultado = resultado.filter(l => {
        const dataLeitura = new Date(l.data_hora || l.createdAt);
        return dataLeitura >= inicio;
      });
    }
    
    if (dataFim) {
      const fim = new Date(dataFim);
      fim.setHours(horaFim ? parseInt(horaFim.split(':')[0]) : 23);
      fim.setMinutes(horaFim ? parseInt(horaFim.split(':')[1]) : 59);
      
      resultado = resultado.filter(l => {
        const dataLeitura = new Date(l.data_hora || l.createdAt);
        return dataLeitura <= fim;
      });
    }
    
    // Ordenar por data (mais recente primeiro)
    resultado.sort((a, b) => {
      const dataA = new Date(a.data_hora || a.createdAt);
      const dataB = new Date(b.data_hora || b.createdAt);
      return dataB - dataA;
    });
    
    setLeiturasFiltradas(resultado);
    setPage(1);
    toast.success(`${resultado.length} registros encontrados`);
  }, [leituras, sensores, sensorSelecionado, ambienteSelecionado, dataInicio, dataFim, horaInicio, horaFim]);

  // Limpar filtros
  const limparFiltros = () => {
    setLeiturasFiltradas(leituras);
    setPage(1);
    toast.info('Filtros limpos');
  };

  // Agrupar leituras por sensor para gráficos
  const agruparPorSensor = () => {
    const grupos = {};
    
    leiturasFiltradas.forEach(leitura => {
      const sensorId = leitura.id_sensor || leitura.sensor_id || leitura.sensorId;
      if (!grupos[sensorId]) {
        grupos[sensorId] = [];
      }
      grupos[sensorId].push(leitura);
    });
    
    return grupos;
  };

  // Carregar mais itens (paginação)
  const carregarMais = () => {
    setPage(prev => prev + 1);
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

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const leiturasAgrupadas = agruparPorSensor();
  const leiturasPaginadas = leiturasFiltradas.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = leiturasPaginadas.length < leiturasFiltradas.length;

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="historico-page">
      <Drawer 
        isOpen={drawerOpen} 
        onClose={closeDrawer} 
        onLogout={handleLogout}
        isAdmin={isUserAdmin}
      />

      <Header 
        title="Histórico de Leituras"
        userEmail={userEmail}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      <div className="container">
        {/* Filtros */}
        <DateTimeFilter
          dataInicio={dataInicio}
          setDataInicio={setDataInicio}
          dataFim={dataFim}
          setDataFim={setDataFim}
          horaInicio={horaInicio}
          setHoraInicio={setHoraInicio}
          horaFim={horaFim}
          setHoraFim={setHoraFim}
          ambienteSelecionado={ambienteSelecionado}
          setAmbienteSelecionado={setAmbienteSelecionado}
          sensorSelecionado={sensorSelecionado}
          setSensorSelecionado={setSensorSelecionado}
          ambientes={ambientes}
          sensores={sensores}
          onFilter={aplicarFiltros}
          onClear={limparFiltros}
        />

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'graficos' ? 'active' : ''}`}
              onClick={() => setActiveTab('graficos')}
            >
              📊 Gráficos
            </button>
            <button 
              className={`tab ${activeTab === 'lista' ? 'active' : ''}`}
              onClick={() => setActiveTab('lista')}
            >
              📋 Lista
            </button>
          </div>
          <span className="result-count">
            {leiturasFiltradas.length} registro(s)
          </span>
        </div>

        {/* Conteúdo */}
        <div className="content-area">
          {activeTab === 'graficos' ? (
            <div className="charts-container">
              {Object.keys(leiturasAgrupadas).length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  <h3>Nenhum dado para exibir</h3>
                  <p>Ajuste os filtros para visualizar os gráficos</p>
                </div>
              ) : (
                Object.entries(leiturasAgrupadas).map(([sensorId, leiturasDoSensor]) => {
                  const sensor = sensores.find(s => s.id === parseInt(sensorId));
                  const ambiente = sensor 
                    ? ambientes.find(a => a.id === (sensor.id_ambiente || sensor.ambiente_id || sensor.ambienteId))
                    : null;
                  
                  return (
                    <div key={sensorId} className="chart-wrapper">
                      <div className="chart-header">
                        <h3>{sensor?.nome || `Sensor ${sensorId}`}</h3>
                        <span className="chart-subtitle">
                          {ambiente?.nome} • {sensor?.tipo}
                        </span>
                      </div>
                      <SensorChart
                        data={leiturasDoSensor.slice(0, 100)} // Limita para performance
                        tipo={sensor?.tipo}
                        chartType="area"
                        height={250}
                      />
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <HistoryTable
              leituras={leiturasPaginadas}
              sensores={sensores}
              ambientes={ambientes}
              loading={false}
              onLoadMore={carregarMais}
              hasMore={hasMore}
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Historico;
