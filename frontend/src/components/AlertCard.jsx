import React from 'react';
import { CheckCircle2, Ban, Bell, Clock, Home, Radio } from 'lucide-react';
import '../styles/AlertCard.css';

/**
 * Card de alerta individual
 * @param {Object} alerta - Dados do alerta
 * @param {Object} sensor - Sensor relacionado
 * @param {Object} ambiente - Ambiente relacionado
 * @param {Function} onResolver - Callback para resolver alerta
 */
const AlertCard = ({ alerta, sensor, ambiente, onResolver }) => {
  const getSeveridadeConfig = () => {
    switch (alerta.severidade?.toLowerCase()) {
      case 'alto':
        return {
          color: '#ef4444',
          label: 'Alta',
          class: 'severidade-alta'
        };
      case 'medio':
        return {
          color: '#f59e0b',
          label: 'Média',
          class: 'severidade-media'
        };
      case 'baixo':
        return {
          color: '#10b981',
          label: 'Baixa',
          class: 'severidade-baixa'
        };
      default:
        return {
          color: '#9ca3af',
          label: 'Indefinida',
          class: 'severidade-indefinida'
        };
    }
  };

  const getStatusConfig = () => {
    switch (alerta.status?.toLowerCase()) {
      case 'resolvido': return { icon: CheckCircle2, label: 'Resolvido', class: 'status-resolvido' };
      case 'ignorado':  return { icon: Ban, label: 'Ignorado',  class: 'status-ignorado'  };
      case 'ativo':     return { icon: Bell, label: 'Ativo',     class: 'status-ativo'     };
      case 'pendente':
      default:          return { icon: Clock, label: 'Pendente',  class: 'status-pendente'  };
    }
  };

  const formatarData = (dataString) => {
    if (!dataString) return '--';
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const severidade = getSeveridadeConfig();
  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const isResolvido = alerta.status?.toLowerCase() === 'resolvido';

  return (
    <div className={`alert-card ${severidade.class} ${statusConfig.class}`}>
      <div className="alert-header">
        <div className="alert-badges">
          <span className={`badge-severidade ${severidade.class}`}>
            <span className="status-dot" style={{ background: severidade.color }} /> {severidade.label}
          </span>
          <span className={`badge-status ${statusConfig.class}`}>
            <StatusIcon size={14} className="icon-inline" /> {statusConfig.label}
          </span>
        </div>
        <span className="alert-date">
          {formatarData(alerta.data_hora || alerta.createdAt)}
        </span>
      </div>

      <div className="alert-body">
        <h4 className="alert-type">
          {alerta.tipo || 'Alerta do Sistema'}
        </h4>
        <p className="alert-message">
          {alerta.mensagem || 'Sem descrição disponível'}
        </p>
      </div>

      <div className="alert-footer">
        <div className="alert-location">
          {ambiente && (
            <span className="location-item">
              <Home size={14} className="icon-inline icon-muted" /> {ambiente.nome}
            </span>
          )}
          {sensor && (
            <span className="location-item">
              <Radio size={14} className="icon-inline icon-muted" /> {sensor.nome} ({sensor.tipo})
            </span>
          )}
        </div>

        {!isResolvido && onResolver && (
          <button
            className="btn-resolver"
            onClick={() => onResolver(alerta.id)}
          >
            <CheckCircle2 size={14} className="icon-inline" /> Resolver
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
