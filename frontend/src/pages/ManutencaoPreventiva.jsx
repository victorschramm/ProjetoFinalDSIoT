// Interface reutilizável para manutenção preventiva de qualquer tipo de ativo
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Wrench, Radio, AlertTriangle, CheckCircle2, X, Pencil, ClipboardList, Lightbulb, Plus, Activity, FlagTriangleRight } from 'lucide-react';
import { Header, Drawer, Footer, Loading } from '../components';
import { getMaintenance, createMaintenance, updateMaintenance, resetMaintenance, getMTBF } from '../services/maintenance';
import { getSensores } from '../services/sensores';
import { getAlertas } from '../services/alertas';
import { registrarFalhaManual } from '../services/assetHistory';
import { logout as apiLogout, isAuthenticated, getUserEmail, isAdmin as checkIsAdmin } from '../services/api';
import '../styles/ManutencaoPreventiva.css';
import { formatarMtbf } from '../utils/format';

const ManutencaoPreventiva = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sensores, setSensores] = useState([]);

  // Estado de formulários abertos por sensorId
  const [configurando, setConfigurando] = useState({});
  const [editando, setEditando] = useState({});
  const [registrandoFalha, setRegistrandoFalha] = useState({});
  const [salvando, setSalvando] = useState({});

  const handleLogout = useCallback(() => {
    apiLogout();
    navigate('/login');
  }, [navigate]);

  const carregarDados = useCallback(async () => {
    // Busca sensores, registros de manutenção, alertas e MTBF em paralelo.
    // Sensores vêm de /sensores (endpoint consolidado), garantindo que a lista
    // apareça mesmo que /maintenance ainda não esteja disponível.
    const [sensoresRes, manutencaoRes, alertasRes, mtbfRes] = await Promise.allSettled([
      getSensores(),
      getMaintenance(),
      getAlertas(),
      getMTBF()
    ]);

    const listaSensores = sensoresRes.status === 'fulfilled' ? (sensoresRes.value || []) : [];
    const registros     = manutencaoRes.status === 'fulfilled' ? (manutencaoRes.value || []) : [];
    const alertas       = alertasRes.status === 'fulfilled'    ? (alertasRes.value || [])    : [];
    const mtbfPorSensor  = mtbfRes.status === 'fulfilled'       ? (mtbfRes.value || {})       : {};

    if (sensoresRes.status === 'rejected') {
      toast.error('Erro ao carregar sensores');
    }

    // Conta alertas por sensor para gerar sugestões
    const alertasPorSensor = {};
    alertas.forEach(a => {
      const id = a.id_sensor;
      if (id !== undefined) alertasPorSensor[id] = (alertasPorSensor[id] || 0) + 1;
    });

    // Mescla sensores com seus dados de manutenção (se configurados) e MTBF
    const merged = listaSensores.map(sensor => {
      const registro = registros.find(r => r.deviceId === sensor.id);
      const mtbf = mtbfPorSensor[String(sensor.id)] || {};
      return {
        sensorId:    sensor.id,
        sensorNome:  sensor.nome,
        sensorTipo:  sensor.tipo || '--',
        configurado: !!registro,
        alertasCount: alertasPorSensor[sensor.id] || 0,
        falhas: mtbf.falhas || 0,
        horasObservadas: mtbf.horasObservadas ?? 0,
        mtbfHoras: mtbf.mtbfHoras ?? null,
        ...(registro || {})
      };
    });

    setSensores(merged);
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return; }
    setUserEmail(getUserEmail() || '');
    setIsUserAdmin(checkIsAdmin());
    carregarDados().finally(() => setLoading(false));
  }, [navigate, carregarDados]);

  // ---------- Configurar sensor ----------

  const abrirConfigurar = (sensorId) => {
    setConfigurando(prev => ({ ...prev, [sensorId]: { limiteHoras: '', descricao: '' } }));
  };

  const cancelarConfigurar = (sensorId) => {
    setConfigurando(prev => { const n = { ...prev }; delete n[sensorId]; return n; });
  };

  const salvarConfigurar = async (sensor) => {
    const dados = configurando[sensor.sensorId];
    const limite = parseFloat(dados.limiteHoras);
    if (!dados.descricao.trim())       { toast.error('Informe o tipo de manutenção'); return; }
    if (isNaN(limite) || limite <= 0)  { toast.error('Informe um limite de horas válido'); return; }

    setSalvando(prev => ({ ...prev, [sensor.sensorId]: true }));
    try {
      await createMaintenance({ deviceId: sensor.sensorId, limiteHoras: limite, descricao: dados.descricao.trim() });
      toast.success(`Manutenção configurada para "${sensor.sensorNome}"`);
      cancelarConfigurar(sensor.sensorId);
      await carregarDados();
    } catch (err) {
      toast.error(err.message || 'Erro ao configurar');
    } finally {
      setSalvando(prev => ({ ...prev, [sensor.sensorId]: false }));
    }
  };

  // ---------- Editar configuração ----------

  const abrirEditar = (sensor) => {
    setEditando(prev => ({
      ...prev,
      [sensor.sensorId]: { limiteHoras: sensor.limiteHoras, descricao: sensor.descricao }
    }));
  };

  const cancelarEditar = (sensorId) => {
    setEditando(prev => { const n = { ...prev }; delete n[sensorId]; return n; });
  };

  const salvarEditar = async (sensor) => {
    const dados = editando[sensor.sensorId];
    const limite = parseFloat(dados.limiteHoras);
    if (!dados.descricao.trim())      { toast.error('Informe o tipo de manutenção'); return; }
    if (isNaN(limite) || limite <= 0) { toast.error('Informe um limite de horas válido'); return; }

    setSalvando(prev => ({ ...prev, [`edit_${sensor.sensorId}`]: true }));
    try {
      await updateMaintenance(sensor.sensorId, { limiteHoras: limite, descricao: dados.descricao.trim() });
      toast.success('Configuração atualizada');
      cancelarEditar(sensor.sensorId);
      await carregarDados();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSalvando(prev => ({ ...prev, [`edit_${sensor.sensorId}`]: false }));
    }
  };

  // ---------- Registrar falha manual ----------
  // Para falhas que o usuário identifica fora dos critérios automáticos
  // (ex: leitura incorreta, problema mecânico) — entra no histórico do ativo
  // e passa a contar no cálculo de MTBF junto com as quedas automáticas.

  const abrirRegistrarFalha = (sensorId) => {
    setRegistrandoFalha(prev => ({ ...prev, [sensorId]: { descricao: '' } }));
  };

  const cancelarRegistrarFalha = (sensorId) => {
    setRegistrandoFalha(prev => { const n = { ...prev }; delete n[sensorId]; return n; });
  };

  const salvarFalha = async (sensor) => {
    const dados = registrandoFalha[sensor.sensorId];
    if (!dados.descricao.trim()) { toast.error('Descreva a falha identificada'); return; }

    setSalvando(prev => ({ ...prev, [`falha_${sensor.sensorId}`]: true }));
    try {
      await registrarFalhaManual(sensor.sensorId, { descricao: dados.descricao.trim() });
      toast.success(`Falha registrada para "${sensor.sensorNome}"`);
      cancelarRegistrarFalha(sensor.sensorId);
      await carregarDados();
    } catch (err) {
      toast.error(err.message || 'Erro ao registrar falha');
    } finally {
      setSalvando(prev => ({ ...prev, [`falha_${sensor.sensorId}`]: false }));
    }
  };

  // ---------- Realizar manutenção ----------

  const realizarManutencao = async (sensor) => {
    if (!window.confirm(`Confirmar manutenção realizada em "${sensor.sensorNome}"?\nO contador será zerado.`)) return;
    setSalvando(prev => ({ ...prev, [`reset_${sensor.sensorId}`]: true }));
    try {
      await resetMaintenance(sensor.sensorId);
      toast.success(`Manutenção registrada! Contador de "${sensor.sensorNome}" zerado.`);
      await carregarDados();
    } catch (err) {
      toast.error(err.message || 'Erro ao resetar contador');
    } finally {
      setSalvando(prev => ({ ...prev, [`reset_${sensor.sensorId}`]: false }));
    }
  };

  // ---------- Helpers ----------

  const calcularPct = (horas, limite) => Math.min(((horas || 0) / (limite || 1)) * 100, 100);

  const getBarClass = (pct, status) => {
    if (status === 'MANUTENCAO_PENDENTE') return 'pendente';
    if (pct >= 80) return 'warning';
    return 'ok';
  };

  // Nível de sugestão com base na quantidade de alertas
  const getSugestao = (alertasCount) => {
    if (alertasCount >= 10) return { label: 'Alta prioridade', color: '#ef4444', sub: `${alertasCount} alertas`, cls: 'alta' };
    if (alertasCount >= 5)  return { label: 'Sugerido',        color: '#f59e0b', sub: `${alertasCount} alertas`, cls: 'media' };
    if (alertasCount >= 1)  return { label: 'Atenção',         color: '#3b82f6', sub: `${alertasCount} alerta(s)`, cls: 'baixa' };
    return null;
  };

  if (loading) return <Loading />;

  const configurados    = sensores.filter(s => s.configurado);
  const naoConfigurados = sensores.filter(s => !s.configurado);
  const pendentes       = configurados.filter(s => s.status === 'MANUTENCAO_PENDENTE').length;

  // Ordena não-configurados: maior nº de alertas primeiro
  const naoConfOrdenados = [...naoConfigurados].sort((a, b) => b.alertasCount - a.alertasCount);

  return (
    <div className="manutencao-page">
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} isAdmin={isUserAdmin} />
      <Header
        title="Manutenção Preventiva"
        userEmail={userEmail}
        onMenuToggle={() => setDrawerOpen(!drawerOpen)}
        onLogout={handleLogout}
      />

      <div className="container">
        <div className="manutencao-header">
          <h1><Wrench size={22} className="icon-inline" /> Manutenção Preventiva</h1>
          <p>
            Configure quais sensores precisam de manutenção, defina o limite de horas e o tipo de intervenção.
            {pendentes > 0 && (
              <span className="header-alerta"> {pendentes} sensor(es) com manutenção pendente.</span>
            )}
          </p>
        </div>

        {sensores.length === 0 ? (
          <div className="manutencao-vazio">
            <span><Radio size={28} className="icon-muted" /></span>
            <p>Nenhum sensor cadastrado no sistema.</p>
          </div>
        ) : (
          <>
            {/* ── Sensores monitorados ── */}
            {configurados.length > 0 && (
              <section className="manutencao-secao">
                <h2 className="manutencao-secao-titulo">Sensores monitorados ({configurados.length})</h2>
                <div className="manutencao-grid">
                  {configurados.map(sensor => {
                    const pct = calcularPct(sensor.horasOperadas, sensor.limiteHoras);
                    const isPendente = sensor.status === 'MANUTENCAO_PENDENTE';
                    const estaEditando = !!editando[sensor.sensorId];
                    const dadosEdit = editando[sensor.sensorId] || {};
                    const estaRegistrandoFalha = !!registrandoFalha[sensor.sensorId];
                    const dadosFalha = registrandoFalha[sensor.sensorId] || {};

                    return (
                      <div key={sensor.sensorId} className={`manutencao-card ${isPendente ? 'status-pendente' : 'status-ok'}`}>
                        <div className="card-header">
                          <div className="card-info">
                            <div className="card-nome">{sensor.sensorNome}</div>
                            <div className="card-tipo">{sensor.sensorTipo} · ID {sensor.sensorId}</div>
                          </div>
                          <span className={`status-badge ${isPendente ? 'pendente' : 'ok'}`}>
                            {isPendente ? (
                              <><AlertTriangle size={14} className="icon-inline" /> PENDENTE</>
                            ) : (
                              <><CheckCircle2 size={14} className="icon-inline" /> OK</>
                            )}
                          </span>
                        </div>

                        <div className="horas-section">
                          <div className="horas-info">
                            <span>Horas operadas</span>
                            <span className="horas-valor">
                              {(sensor.horasOperadas || 0).toFixed(1)}h / {sensor.limiteHoras}h
                            </span>
                          </div>
                          <div className="horas-progressbar">
                            <div
                              className={`horas-progressbar-fill ${getBarClass(pct, sensor.status)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="mtbf-info">
                          <span className="mtbf-label"><Activity size={14} className="icon-inline icon-muted" /> MTBF</span>
                          <span className="mtbf-valor">
                            {sensor.mtbfHoras != null ? formatarMtbf(sensor.mtbfHoras) : 'Sem falhas registradas'}
                          </span>
                          {sensor.falhas > 0 && (
                            <span className="mtbf-sub">{sensor.falhas} falha(s) em {Math.round(sensor.horasObservadas / 24)}d</span>
                          )}
                        </div>

                        <div className="card-descricao"><ClipboardList size={14} className="icon-inline icon-muted" /> {sensor.descricao}</div>

                        {estaRegistrandoFalha && (
                          <div className="card-edit-form">
                            <h4>Registrar falha</h4>
                            <div className="form-row">
                              <label>O que aconteceu?</label>
                              <textarea
                                rows={3}
                                value={dadosFalha.descricao}
                                onChange={e => setRegistrandoFalha(prev => ({
                                  ...prev, [sensor.sensorId]: { ...dadosFalha, descricao: e.target.value }
                                }))}
                                placeholder="Ex: Leitura de temperatura incoerente, sem queda de conexão"
                                autoFocus
                              />
                            </div>
                            <div className="form-actions">
                              <button
                                className="btn-salvar"
                                onClick={() => salvarFalha(sensor)}
                                disabled={salvando[`falha_${sensor.sensorId}`]}
                              >
                                {salvando[`falha_${sensor.sensorId}`] ? 'Registrando…' : 'Registrar'}
                              </button>
                              <button className="btn-cancelar" onClick={() => cancelarRegistrarFalha(sensor.sensorId)}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {estaEditando && (
                          <div className="card-edit-form">
                            <h4>Editar configuração</h4>
                            <div className="form-row">
                              <label>Limite de horas</label>
                              <input
                                type="number" min="0.5" step="0.5"
                                value={dadosEdit.limiteHoras}
                                onChange={e => setEditando(prev => ({
                                  ...prev, [sensor.sensorId]: { ...dadosEdit, limiteHoras: e.target.value }
                                }))}
                                placeholder="Ex: 50"
                              />
                            </div>
                            <div className="form-row">
                              <label>Tipo de manutenção</label>
                              <input
                                type="text"
                                value={dadosEdit.descricao}
                                onChange={e => setEditando(prev => ({
                                  ...prev, [sensor.sensorId]: { ...dadosEdit, descricao: e.target.value }
                                }))}
                                placeholder="Ex: Limpeza de filtro"
                              />
                            </div>
                            <div className="form-actions">
                              <button
                                className="btn-salvar"
                                onClick={() => salvarEditar(sensor)}
                                disabled={salvando[`edit_${sensor.sensorId}`]}
                              >
                                {salvando[`edit_${sensor.sensorId}`] ? 'Salvando…' : 'Salvar'}
                              </button>
                              <button className="btn-cancelar" onClick={() => cancelarEditar(sensor.sensorId)}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="card-footer">
                          <button
                            className="btn-editar"
                            onClick={() => estaEditando ? cancelarEditar(sensor.sensorId) : abrirEditar(sensor)}
                          >
                            {estaEditando ? (
                              <><X size={14} className="icon-inline" /> Fechar</>
                            ) : (
                              <><Pencil size={14} className="icon-inline" /> Editar</>
                            )}
                          </button>
                          <button
                            className="btn-falha"
                            onClick={() => estaRegistrandoFalha ? cancelarRegistrarFalha(sensor.sensorId) : abrirRegistrarFalha(sensor.sensorId)}
                          >
                            {estaRegistrandoFalha ? (
                              <><X size={14} className="icon-inline" /> Fechar</>
                            ) : (
                              <><FlagTriangleRight size={14} className="icon-inline" /> Registrar Falha</>
                            )}
                          </button>
                          <button
                            className="btn-manutencao"
                            onClick={() => realizarManutencao(sensor)}
                            disabled={salvando[`reset_${sensor.sensorId}`]}
                          >
                            {salvando[`reset_${sensor.sensorId}`] ? 'Aguarde…' : <><Wrench size={14} className="icon-inline" /> Realizar Manutenção</>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Sensores sem configuração ── */}
            {naoConfOrdenados.length > 0 && (
              <section className="manutencao-secao">
                <h2 className="manutencao-secao-titulo">
                  Sensores sem manutenção configurada ({naoConfOrdenados.length})
                </h2>

                {naoConfOrdenados.some(s => s.alertasCount >= 5) && (
                  <div className="sugestao-banner">
                    <Lightbulb size={16} className="icon-inline" /> O sistema identificou sensores com histórico de alertas frequentes.
                    Considere configurar manutenção preventiva para eles.
                  </div>
                )}

                <div className="manutencao-grid">
                  {naoConfOrdenados.map(sensor => {
                    const estaConfigurando = !!configurando[sensor.sensorId];
                    const dadosConfig = configurando[sensor.sensorId] || {};
                    const sugestao = getSugestao(sensor.alertasCount);
                    const estaRegistrandoFalha = !!registrandoFalha[sensor.sensorId];
                    const dadosFalha = registrandoFalha[sensor.sensorId] || {};

                    return (
                      <div key={sensor.sensorId} className="manutencao-card status-inativo">
                        <div className="card-header">
                          <div className="card-info">
                            <div className="card-nome">{sensor.sensorNome}</div>
                            <div className="card-tipo">{sensor.sensorTipo} · ID {sensor.sensorId}</div>
                          </div>
                          <span className="status-badge inativo">Não configurado</span>
                        </div>

                        {/* Badge de sugestão baseada em alertas */}
                        {sugestao && (
                          <div className={`sugestao-badge sugestao-${sugestao.cls}`}>
                            <span><span className="status-dot" style={{ background: sugestao.color }} /> {sugestao.label}</span>
                            <span className="sugestao-sub">{sugestao.sub} registrados</span>
                          </div>
                        )}

                        <div className="mtbf-info">
                          <span className="mtbf-label"><Activity size={14} className="icon-inline icon-muted" /> MTBF</span>
                          <span className="mtbf-valor">
                            {sensor.mtbfHoras != null ? formatarMtbf(sensor.mtbfHoras) : 'Sem falhas registradas'}
                          </span>
                          {sensor.falhas > 0 && (
                            <span className="mtbf-sub">{sensor.falhas} falha(s) em {Math.round(sensor.horasObservadas / 24)}d</span>
                          )}
                        </div>

                        <div className="card-descricao" style={{ color: '#64748b' }}>
                          Nenhuma regra de manutenção definida.
                        </div>

                        {estaRegistrandoFalha && (
                          <div className="card-edit-form">
                            <h4>Registrar falha</h4>
                            <div className="form-row">
                              <label>O que aconteceu?</label>
                              <textarea
                                rows={3}
                                value={dadosFalha.descricao}
                                onChange={e => setRegistrandoFalha(prev => ({
                                  ...prev, [sensor.sensorId]: { ...dadosFalha, descricao: e.target.value }
                                }))}
                                placeholder="Ex: Leitura de temperatura incoerente, sem queda de conexão"
                                autoFocus
                              />
                            </div>
                            <div className="form-actions">
                              <button
                                className="btn-salvar"
                                onClick={() => salvarFalha(sensor)}
                                disabled={salvando[`falha_${sensor.sensorId}`]}
                              >
                                {salvando[`falha_${sensor.sensorId}`] ? 'Registrando…' : 'Registrar'}
                              </button>
                              <button className="btn-cancelar" onClick={() => cancelarRegistrarFalha(sensor.sensorId)}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {estaConfigurando ? (
                          <div className="card-edit-form">
                            <h4>Configurar manutenção preventiva</h4>
                            <div className="form-row">
                              <label>Após quantas horas de uso emitir alerta?</label>
                              <input
                                type="number" min="0.5" step="0.5"
                                value={dadosConfig.limiteHoras}
                                onChange={e => setConfigurando(prev => ({
                                  ...prev, [sensor.sensorId]: { ...dadosConfig, limiteHoras: e.target.value }
                                }))}
                                placeholder="Ex: 30"
                                autoFocus
                              />
                            </div>
                            <div className="form-row">
                              <label>Tipo de manutenção necessária</label>
                              <input
                                type="text"
                                value={dadosConfig.descricao}
                                onChange={e => setConfigurando(prev => ({
                                  ...prev, [sensor.sensorId]: { ...dadosConfig, descricao: e.target.value }
                                }))}
                                placeholder="Ex: Limpeza de filtro"
                              />
                            </div>
                            <div className="form-actions">
                              <button
                                className="btn-salvar"
                                onClick={() => salvarConfigurar(sensor)}
                                disabled={salvando[sensor.sensorId]}
                              >
                                {salvando[sensor.sensorId] ? 'Configurando…' : 'Confirmar'}
                              </button>
                              <button className="btn-cancelar" onClick={() => cancelarConfigurar(sensor.sensorId)}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          !estaRegistrandoFalha && (
                            <div className="card-footer">
                              <button className="btn-configurar" onClick={() => abrirConfigurar(sensor.sensorId)}>
                                <Plus size={14} className="icon-inline" /> Configurar Manutenção
                              </button>
                              <button className="btn-falha" onClick={() => abrirRegistrarFalha(sensor.sensorId)}>
                                <FlagTriangleRight size={14} className="icon-inline" /> Registrar Falha
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ManutencaoPreventiva;
