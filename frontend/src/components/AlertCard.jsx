import React from 'react';
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
          icon: '🔴', 
          label: 'Alta', 
          class: 'severidade-alta' 
        };
      case 'medio':
        return { 
          icon: '🟡', 
          label: 'Média', 
          class: 'severidade-media' 
        };
      case 'baixo':
        return { 
          icon: '🟢', 
          label: 'Baixa', 
          class: 'severidade-baixa' 
        };
      default:
        return { 
          icon: '⚪', 
          label: 'Indefinida', 
          class: 'severidade-indefinida' 
        };
    }
  };

  const getStatusConfig = () => {
    const status = alerta.status?.toLowerCase();
    if (status === 'resolvido' || status === 'fechado') {
      return { icon: '✅', label: 'Resolvido', class: 'status-resolvido' };
    }
    return { icon: '⚠️', label: 'Aberto', class: 'status-aberto' };
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
  const isResolvido = alerta.status?.toLowerCase() === 'resolvido' || 
                      alerta.status?.toLowerCase() === 'fechado';

  return (
    <div className={`alert-card ${severidade.class} ${statusConfig.class}`}>
      <div className="alert-header">
        <div className="alert-badges">
          <span className={`badge-severidade ${severidade.class}`}>
            {severidade.icon} {severidade.label}
          </span>
          <span className={`badge-status ${statusConfig.class}`}>
            {statusConfig.icon} {statusConfig.label}
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
              🏠 {ambiente.nome}
            </span>
          )}
          {sensor && (
            <span className="location-item">
              📡 {sensor.nome} ({sensor.tipo})
            </span>
          )}
        </div>

        {!isResolvido && onResolver && (
          <button 
            className="btn-resolver"
            onClick={() => onResolver(alerta.id)}
          >
            ✓ Resolver
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
