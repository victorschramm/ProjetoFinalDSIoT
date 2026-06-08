import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Login, ForgotPassword, ResetPassword, Dashboard, Register, Usuarios, Ambientes, Sensores, Leituras, Alertas, Monitoramento, Historico, Dispositivos, HistoricoAtivo, HistoricoAcoes, ManutencaoPreventiva } from './pages';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ChatBot from './components/ChatBot';
import { isAuthenticated } from './services/api';
import './styles/global.css';

// ChatBot disponível apenas para usuários autenticados
// Evita exposição antes do login e melhora a experiência do usuário
// useLocation garante re-avaliação a cada troca de rota (login e logout)
function ChatBotGuard() {
  useLocation();
  return isAuthenticated() ? <ChatBot /> : null;
}

function App() {
  return (
    <Router>
      {/* Toast Container Global */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Routes>
        {/* Rota principal - redireciona para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Páginas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Rotas protegidas (requerem autenticação) */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/monitoramento" element={<PrivateRoute><Monitoramento /></PrivateRoute>} />
        <Route path="/historico" element={<PrivateRoute><Historico /></PrivateRoute>} />
        <Route path="/ambientes" element={<PrivateRoute><Ambientes /></PrivateRoute>} />
        <Route path="/sensores" element={<PrivateRoute><Sensores /></PrivateRoute>} />
        <Route path="/dispositivos" element={<PrivateRoute><Dispositivos /></PrivateRoute>} />
        <Route path="/leituras" element={<PrivateRoute><Leituras /></PrivateRoute>} />
        <Route path="/alertas" element={<PrivateRoute><Alertas /></PrivateRoute>} />
        <Route path="/historico-ativo" element={<PrivateRoute><HistoricoAtivo /></PrivateRoute>} />
        <Route path="/manutencao-preventiva" element={<PrivateRoute><ManutencaoPreventiva /></PrivateRoute>} />
        
        {/* Rotas de administração (requerem admin) */}
        <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
        <Route path="/historico-acoes" element={<AdminRoute><HistoricoAcoes /></AdminRoute>} />
        
        {/* Rota 404 - redireciona para login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <ChatBotGuard />
    </Router>
  );
}

export default App;
