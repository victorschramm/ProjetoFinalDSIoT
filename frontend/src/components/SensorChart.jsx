import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import '../styles/SensorChart.css';

/**
 * Gráfico de leituras do sensor
 * @param {Array} data - Dados das leituras
 * @param {string} tipo - Tipo de sensor (temperatura, umidade, etc)
 * @param {string} title - Título do gráfico
 * @param {string} chartType - Tipo de gráfico ('line' ou 'area')
 */
const SensorChart = ({ 
  data = [], 
  tipo = 'temperatura', 
  title,
  chartType = 'area',
  height = 300
}) => {
  // Processa dados para o gráfico
  const processedData = data.map(item => ({
    ...item,
    valor: parseFloat(item.valor),
    hora: new Date(item.data_hora || item.createdAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    data: new Date(item.data_hora || item.createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  }));

  // Configurações baseadas no tipo de sensor
  const getConfig = () => {
    const tipoLower = tipo?.toLowerCase() || '';
    
    if (tipoLower.includes('temperatura')) {
      return {
        color: '#ef4444',
        gradientStart: '#ef444480',
        gradientEnd: '#ef444410',
        unidade: '°C',
        label: 'Temperatura'
      };
    }
    
    if (tipoLower.includes('umidade')) {
      return {
        color: '#3b82f6',
        gradientStart: '#3b82f680',
        gradientEnd: '#3b82f610',
        unidade: '%',
        label: 'Umidade'
      };
    }
    
    if (tipoLower.includes('co2') || tipoLower.includes('gas')) {
      return {
        color: '#8b5cf6',
        gradientStart: '#8b5cf680',
        gradientEnd: '#8b5cf610',
        unidade: 'ppm',
        label: 'CO₂'
      };
    }
    
    if (tipoLower.includes('pressao')) {
      return {
        color: '#06b6d4',
        gradientStart: '#06b6d480',
        gradientEnd: '#06b6d410',
        unidade: 'hPa',
        label: 'Pressão'
      };
    }
    
    return {
      color: '#10b981',
      gradientStart: '#10b98180',
      gradientEnd: '#10b98110',
      unidade: '',
      label: 'Valor'
    };
  };

  const config = getConfig();

  // Calcula estatísticas
  const calcularEstatisticas = () => {
    if (processedData.length === 0) {
      return { max: '--', min: '--', avg: '--', ultimo: '--' };
    }
    
    const valores = processedData.map(d => d.valor);
    const max = Math.max(...valores).toFixed(1);
    const min = Math.min(...valores).toFixed(1);
    const avg = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1);
    const ultimo = valores[valores.length - 1]?.toFixed(1) || '--';
    
    return { max, min, avg, ultimo };
  };

  const stats = calcularEstatisticas();

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">
            {payload[0].value.toFixed(1)} {config.unidade}
          </p>
        </div>
      );
    }
    return null;
  };

  if (processedData.length === 0) {
    return (
      <div className="sensor-chart empty">
        <h4>{title || config.label}</h4>
        <div className="no-data">
          <span className="icon">📊</span>
          <p>Sem dados para exibir</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sensor-chart">
      {title && <h4 className="chart-title">{title}</h4>}
      
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">Máximo</span>
          <span className="stat-value max">{stats.max} {config.unidade}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Mínimo</span>
          <span className="stat-value min">{stats.min} {config.unidade}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Média</span>
          <span className="stat-value avg">{stats.avg} {config.unidade}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Atual</span>
          <span className="stat-value current">{stats.ultimo} {config.unidade}</span>
        </div>
      </div>
      
      <div className="chart-container" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={processedData}>
              <defs>
                <linearGradient id={`gradient-${tipo}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={config.color} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="hora" 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}${config.unidade}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="valor"
                stroke={config.color}
                strokeWidth={2}
                fill={`url(#gradient-${tipo})`}
                dot={false}
                activeDot={{ r: 6, fill: config.color }}
              />
            </AreaChart>
          ) : (
            <LineChart data={processedData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="hora" 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}${config.unidade}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="valor"
                name={config.label}
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SensorChart;
