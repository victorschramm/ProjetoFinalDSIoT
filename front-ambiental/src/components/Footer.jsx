import React from 'react';

const Footer = ({ isLoginPage = false }) => {
  return (
    <footer className={`app-footer ${isLoginPage ? 'login-footer' : ''}`}>
      <p>© 2025 Sistema de Monitoramento Ambiental IoT</p>
      <p>Desenvolvido com ❤️ para o Projeto Final DSIoT</p>
    </footer>
  );
};

export default Footer;
