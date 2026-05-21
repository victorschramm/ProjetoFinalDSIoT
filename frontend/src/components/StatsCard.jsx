import React from 'react';
import '../styles/StatsCard.css';

/**
 * Card de estatísticas para o dashboard
 * @param {string} title - Título do card
 * @param {string|number} value - Valor principal
 * @param {string} icon - Emoji ou ícone
 * @param {string} trend - 'up', 'down' ou 'stable'
 * @param {string} trendValue - Valor da tendência (ex: "+5%")
 * @param {string} color - Cor do card (primary, success, warning, danger)
 */
const StatsCard = ({ 
  title, 
  value, 
  icon = '📊', 
  trend, 
  trendValue,
  color = 'primary',
  subtitle
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  const getTrendClass = () => {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      default: return 'trend-stable';
    }
  };

  return (
    <div className={`stats-card color-${color}`}>
      <div className="stats-icon">{icon}</div>
      <div className="stats-content">
        <span className="stats-title">{title}</span>
        <span className="stats-value">{value}</span>
        {subtitle && <span className="stats-subtitle">{subtitle}</span>}
      </div>
      {trend && trendValue && (
        <div className={`stats-trend ${getTrendClass()}`}>
          <span className="trend-icon">{getTrendIcon()}</span>
          <span className="trend-value">{trendValue}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
