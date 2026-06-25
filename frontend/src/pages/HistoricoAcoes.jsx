// Interface reutilizável como log de auditoria para qualquer sistema
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ClipboardList } from 'lucide-react';
import { Header, Drawer, Footer } from '../components';
import {
  getAuditLogs,
  getUsuarios,
  isAdmin,
  isAuthenticated,
  logout as apiLogout,
  getUserEmail,
  getProfile
} from '../services/api';
import '../styles/HistoricoAcoes.css';

const ACOES_CRITICAS = [
  'FECHOU_ALERTA', 'EXCLUIU_ALERTA', 'EXCLUIU_USUARIO',
  'EXCLUIU_SENSOR', 'IGNOROU_ALERTA', 'ALTEROU_STATUS_SENSOR'
];

const ACOES_LABELS = {
  FECHOU_ALERTA: 'Fechou Alerta',
  IGNOROU_ALERTA: 'Ignorou Alerta',
  REABRIU_ALERTA: 'Reabriu Alerta',
  EXCLUIU_ALERTA: 'Excluiu Alerta',
  ALTEROU_STATUS_ALERTA: 'Alterou Status do Alerta',
  CRIOU_USUARIO: 'Criou Usuário',
  EDITOU_USUARIO: 'Editou Usuário',
  EXCLUIU_USUARIO: 'Excluiu Usuário',
  CRIOU_SENSOR: 'Criou Sensor',
  EDITOU_SENSOR: 'Editou Sensor',
  ALTEROU_STATUS_SENSOR: 'Alterou Status do Sensor',
  EXCLUIU_SENSOR: 'Excluiu Sensor'
};

const HistoricoAcoes = () => {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const [filtros, setFiltros] = useState({
    userId: '',
    acao: '',
    dataInicio: '',
    dataFim: ''
  });

  const [paginacao, setPaginacao] = useState({ page: 1, totalPages: 1, total: 0 });

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    navigate('/login');
  };

  const toggleDrawer = () => setDrawerOpen(v => !v);
  const closeDrawer = () => setDrawerOpen(false);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return; }
    if (!isAdmin()) { navigate('/dashboard'); return; }

    const loadProfile = async () => {
      try {
        const profileData = await getProfile();
        setUserEmail(profileData.email || getUserEmail());
        setIsUserAdmin(profileData.tipo_usuario === 'admin');
      } catch {
        setUserEmail(getUserEmail());
        setIsUserAdmin(isAdmin());
      }
    };
    loadProfile();

    const loadUsuarios = async () => {
      try {
        const data = await getUsuarios();
        setUsuarios(data);
      } catch {}
    };
    loadUsuarios();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, drawerOpen]);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await getAuditLogs({ ...filtros, page, limit: 50 });
      setLogs(data.logs);
      setPaginacao({ page: data.page, totalPages: data.totalPages, total: data.total });
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar histórico de ações');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const handleLimparFiltros = () => {
    setFiltros({ userId: '', acao: '', dataInicio: '', dataFim: '' });
  };

  const formatData = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const getNomeUsuario = (log) => {
    const encontrado = usuarios.find(u => u.id === log.userId);
    if (encontrado) return `${encontrado.name} (${encontrado.email})`;
    if (log.userId) return `ID ${log.userId}`;
    return 'Sistema';
  };

  const isCritica = (acao) => ACOES_CRITICAS.includes(acao);

  return (
    <div className="historico-acoes-page">
      <Drawer isOpen={drawerOpen} onClose={closeDrawer} onLogout={handleLogout} isAdmin={isUserAdmin} />

      <Header
        title="Histórico de Ações"
        userEmail={userEmail}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      <div className="historico-acoes-container">
        <div className="historico-acoes-toolbar">
          <h2><ClipboardList size={18} className="icon-inline" /> Histórico de Ações do Sistema</h2>
          <span className="historico-acoes-total">{paginacao.total} registros</span>
        </div>

        {/* Filtros */}
        <div className="historico-acoes-filtros">
          <div className="filtro-group">
            <label>Usuário</label>
            <select name="userId" value={filtros.userId} onChange={handleFiltroChange}>
              <option value="">Todos</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>Ação</label>
            <select name="acao" value={filtros.acao} onChange={handleFiltroChange}>
              <option value="">Todas</option>
              {Object.entries(ACOES_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>Data Início</label>
            <input
              type="date"
              name="dataInicio"
              value={filtros.dataInicio}
              onChange={handleFiltroChange}
            />
          </div>

          <div className="filtro-group">
            <label>Data Fim</label>
            <input
              type="date"
              name="dataFim"
              value={filtros.dataFim}
              onChange={handleFiltroChange}
            />
          </div>

          <button className="btn-limpar" onClick={handleLimparFiltros}>
            Limpar Filtros
          </button>
        </div>

        {/* Legenda */}
        <div className="historico-acoes-legenda">
          <span className="legenda-critica"><span className="status-dot" style={{ background: '#ef4444' }} /> Ação Crítica</span>
          <span className="legenda-comum"><span className="status-dot" style={{ background: '#3b82f6' }} /> Ação Comum</span>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner-local"></div>
            <p>Carregando histórico...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              {logs.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon"><ClipboardList size={32} className="icon-muted" /></span>
                  <p>Nenhuma ação registrada para os filtros aplicados.</p>
                </div>
              ) : (
                <table className="historico-acoes-table">
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Ação</th>
                      <th>Entidade</th>
                      <th>Descrição</th>
                      <th>Origem</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className={isCritica(log.acao) ? 'row-critica' : 'row-comum'}>
                        <td className="col-usuario">{getNomeUsuario(log)}</td>
                        <td>
                          <span className={`acao-badge ${isCritica(log.acao) ? 'acao-critica' : 'acao-comum'}`}>
                            {ACOES_LABELS[log.acao] || log.acao}
                          </span>
                        </td>
                        <td>
                          <span className="entidade-badge">{log.entidade}</span>
                          {log.entidadeId && <span className="entidade-id"> #{log.entidadeId}</span>}
                        </td>
                        <td className="col-descricao">{log.descricao || '-'}</td>
                        <td>
                          <span className="origem-badge">{log.origem || 'WEB'}</span>
                        </td>
                        <td className="col-data">{formatData(log.dataAcao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginação */}
            {paginacao.totalPages > 1 && (
              <div className="historico-acoes-paginacao">
                <button
                  className="btn-pagina"
                  disabled={paginacao.page <= 1}
                  onClick={() => fetchLogs(paginacao.page - 1)}
                >
                  ← Anterior
                </button>
                <span className="pagina-info">
                  Página {paginacao.page} de {paginacao.totalPages}
                </span>
                <button
                  className="btn-pagina"
                  disabled={paginacao.page >= paginacao.totalPages}
                  onClick={() => fetchLogs(paginacao.page + 1)}
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default HistoricoAcoes;
