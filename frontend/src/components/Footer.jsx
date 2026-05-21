import React from 'react';

const Footer = ({ isLoginPage = false }) => {
  return (
    <footer className={`app-footer ${isLoginPage ? 'login-footer' : ''}`}>
      <p>© 2026 Sistema de Monitoramento Ambiental IoT</p>
      
    </footer>
  );
};

export default Footer;
