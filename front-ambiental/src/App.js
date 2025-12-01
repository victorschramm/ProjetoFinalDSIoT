import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login, Dashboard, Register, NiveisAcesso, Usuarios } from './pages';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota principal - redireciona para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Página de Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Página de Cadastro */}
        <Route path="/register" element={<Register />} />
        
        {/* Dashboard (protegida) */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Níveis de Acesso (apenas admin) */}
        <Route path="/niveis-acesso" element={<NiveisAcesso />} />
        
        {/* Gerenciamento de Usuários (apenas admin) */}
        <Route path="/usuarios" element={<Usuarios />} />
        
        {/* Rotas futuras */}
        <Route path="/ambientes" element={<Dashboard />} />
        <Route path="/sensores" element={<Dashboard />} />
        <Route path="/alertas" element={<Dashboard />} />
        
        {/* Rota 404 - redireciona para login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
