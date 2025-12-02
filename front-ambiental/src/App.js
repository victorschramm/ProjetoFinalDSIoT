import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Login, Dashboard, Register, NiveisAcesso, Usuarios, Ambientes, Sensores, Leituras, Alertas, Monitoramento, Historico } from './pages';
import './styles/global.css';

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
        
        {/* Página de Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Página de Cadastro */}
        <Route path="/register" element={<Register />} />
        
        {/* Dashboard (protegida) */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Monitoramento em Tempo Real */}
        <Route path="/monitoramento" element={<Monitoramento />} />
        
        {/* Histórico e Gráficos */}
        <Route path="/historico" element={<Historico />} />
        
        {/* Níveis de Acesso (apenas admin) */}
        <Route path="/niveis-acesso" element={<NiveisAcesso />} />
        
        {/* Gerenciamento de Usuários (apenas admin) */}
        <Route path="/usuarios" element={<Usuarios />} />
        
        {/* Ambientes */}
        <Route path="/ambientes" element={<Ambientes />} />
        
        {/* Sensores */}
        <Route path="/sensores" element={<Sensores />} />
        
        {/* Leituras */}
        <Route path="/leituras" element={<Leituras />} />
        
        {/* Alertas */}
        <Route path="/alertas" element={<Alertas />} />
        
        {/* Rota 404 - redireciona para login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
