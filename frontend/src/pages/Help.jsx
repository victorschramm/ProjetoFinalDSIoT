import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Info, LayoutDashboard, Radio, AlertTriangle, Wrench, ChevronDown
} from 'lucide-react';
import { Header, Drawer, Footer } from '../components';
import { logout as apiLogout, isAdmin as checkIsAdmin, getUserEmail } from '../services/api';
import '../styles/Help.css';

// Conteúdo da Central de Ajuda.
// O texto abaixo descreve o sistema ManutAI, mas a estrutura (título +
// seções em formato de accordion) pode ser adaptada para qualquer sistema:
// basta editar o array SECOES.
const SECOES = [
  {
    titulo: 'Sobre o sistema',
    icone: Info,
    conteudo: (
      <>
        <p>
          O <strong>ManutAI</strong> é um sistema de monitoramento de ambientes via sensores
          IoT, voltado para acompanhamento de temperatura, umidade e manutenção preventiva
          de equipamentos.
        </p>
        <p><strong>Como fazer login:</strong> acesse a tela inicial e informe seu e-mail e
          senha cadastrados. Caso tenha esquecido a senha, use o link "Esqueci minha senha"
          na própria tela de login para receber instruções de redefinição.</p>
        <p>Após o login, você é direcionado ao <strong>Dashboard</strong>, painel principal
          do sistema.</p>
      </>
    )
  },
  {
    titulo: 'Como usar o dashboard',
    icone: LayoutDashboard,
    conteudo: (
      <>
        <p>O Dashboard reúne um resumo geral do sistema:</p>
        <ul>
          <li>Cards com totais de sensores, ambientes, leituras do dia e alertas em atenção.</li>
          <li>Temperatura e umidade mais recentes de cada ambiente monitorado.</li>
          <li>Acesso rápido às principais telas: Monitoramento, Histórico, Alertas, Ambientes
            e Manutenção Preventiva.</li>
          <li>Gráfico comparativo de temperatura/umidade entre ambientes.</li>
        </ul>
        <p>Use o ícone de menu (☰) no canto superior para abrir o menu lateral e navegar entre
          as telas do sistema.</p>
      </>
    )
  },
  {
    titulo: 'Gerenciamento de sensores',
    icone: Radio,
    conteudo: (
      <>
        <p>As telas de configuração permitem organizar a estrutura de monitoramento:</p>
        <ul>
          <li><strong>Dispositivos ESP:</strong> cadastro dos dispositivos físicos (ESP32/ESP8266)
            responsáveis por enviar as leituras.</li>
          <li><strong>Ambientes:</strong> cadastro dos locais monitorados (salas, galpões, etc.).</li>
          <li><strong>Sensores:</strong> cadastro dos sensores vinculados a cada ambiente e
            dispositivo, com seu tipo (temperatura, umidade, etc.) e status (ativo/inativo).</li>
          <li><strong>Leituras:</strong> consulta das medições enviadas pelos sensores.</li>
          <li><strong>Monitoramento (Tempo Real):</strong> acompanhamento das leituras mais
            recentes, atualizado automaticamente em intervalos configuráveis.</li>
        </ul>
      </>
    )
  },
  {
    titulo: 'Alertas e notificações',
    icone: AlertTriangle,
    conteudo: (
      <>
        <p>O sistema gera alertas automaticamente quando uma leitura sai dos limites
          configurados para o ambiente ou sensor.</p>
        <ul>
          <li><strong>Severidade:</strong> os alertas são classificados em níveis (baixo, médio,
            alto/crítico), indicados por cores no sistema.</li>
          <li><strong>Status:</strong> um alerta pode estar ativo, pendente, resolvido ou
            ignorado, e esse status pode ser atualizado na tela de Alertas.</li>
          <li><strong>Histórico e Gráficos:</strong> permite visualizar a evolução das leituras
            ao longo do tempo para investigar a causa de um alerta.</li>
        </ul>
        <p>Sempre verifique os alertas em atenção no Dashboard ou na tela de Alertas para agir
          rapidamente sobre possíveis problemas.</p>
      </>
    )
  },
  {
    titulo: 'Manutenção preventiva',
    icone: Wrench,
    conteudo: (
      <>
        <p>A tela de <strong>Manutenção Preventiva</strong> ajuda a planejar e acompanhar
          manutenções dos equipamentos monitorados, evitando falhas inesperadas.</p>
        <ul>
          <li>Permite registrar manutenções pendentes, agendadas e concluídas.</li>
          <li>O <strong>Currículo da Máquina</strong> (Histórico do Ativo) reúne o histórico
            completo de eventos e manutenções de cada equipamento.</li>
          <li>Manutenções pendentes também aparecem destacadas no Dashboard, no card de
            "Acesso Rápido".</li>
        </ul>
      </>
    )
  }
];

const Help = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [secaoAberta, setSecaoAberta] = useState(0);

  const handleLogout = useCallback(() => {
    apiLogout();
    navigate('/login');
  }, [navigate]);

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);
  const closeDrawer = () => setDrawerOpen(false);

  const toggleSecao = (index) => {
    setSecaoAberta((atual) => (atual === index ? -1 : index));
  };

  return (
    <div className="dashboard-page">
      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onLogout={handleLogout}
        isAdmin={checkIsAdmin()}
      />

      <Header
        title="Ajuda"
        userEmail={getUserEmail()}
        onMenuToggle={toggleDrawer}
        onLogout={handleLogout}
      />

      <div className="container">
        <div className="help-header">
          <h1>Central de Ajuda</h1>
          <p>Manual de operação do sistema — tire suas dúvidas sobre como utilizar cada tela.</p>
        </div>

        <div className="help-accordion">
          {SECOES.map((secao, index) => {
            const Icone = secao.icone;
            const aberta = secaoAberta === index;
            return (
              <div key={secao.titulo} className={`help-card ${aberta ? 'help-card--aberta' : ''}`}>
                <button className="help-card__cabecalho" onClick={() => toggleSecao(index)}>
                  <span className="help-card__titulo">
                    <Icone size={18} className="icon-inline" /> {secao.titulo}
                  </span>
                  <ChevronDown size={18} className="help-card__seta" />
                </button>
                {aberta && (
                  <div className="help-card__conteudo">
                    {secao.conteudo}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Help;
