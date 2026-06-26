import React from 'react';
import { BarChart3, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import '../styles/StatsCard.css';

/**
 * Card de estatísticas para o dashboard
 * @param {string} title - Título do card
 * @param {string|number} value - Valor principal
 * @param {React.ComponentType} icon - Componente de ícone (lucide-react)
 * @param {string} trend - 'up', 'down' ou 'stable'
 * @param {string} trendValue - Valor da tendência (ex: "+5%")
 * @param {string} color - Cor do card (primary, success, warning, danger)
 */
const StatsCard = ({
  title,
  value,
  icon: Icon = BarChart3,
  trend,
  trendValue,
  color = 'primary',
  subtitle
}) => {
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : ArrowRight;

  const getTrendClass = () => {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      default: return 'trend-stable';
    }
  };

  return (
    <div className={`stats-card color-${color}`}>
      <div className="stats-icon"><Icon size={28} className="icon-inline" /></div>
      <div className="stats-content">
        <span className="stats-title">{title}</span>
        <span className="stats-value">{value}</span>
        {subtitle && <span className="stats-subtitle">{subtitle}</span>}
      </div>
      {trend && trendValue && (
        <div className={`stats-trend ${getTrendClass()}`}>
          <span className="trend-icon"><TrendIcon size={14} className="icon-inline" /></span>
          <span className="trend-value">{trendValue}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
