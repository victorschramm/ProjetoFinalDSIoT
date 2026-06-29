# Histórico — Primeira Implementação de Login (Legado)

## Visão Geral

Antes do frontend React atual, o sistema teve uma primeira versão funcional de login servida como **HTML/CSS/JS estático direto pelo backend** (`backend/public/`), com autenticação JWT. Esse documento existe só para registro histórico — consolida o que antes eram dois arquivos (`ARQUIVOS_CRIADOS.txt` e `INDICE.md`) na raiz do `backend/`, ambos desatualizados e cheios de referências a arquivos que não existem mais.

**Esse fluxo foi totalmente substituído** pelo frontend React (`frontend/`), publicado separadamente na Vercel. O backend hoje é uma API pura — não serve mais nenhum arquivo estático (ver [Central-de-Ajuda.md](Central-de-Ajuda.md) e [CI-CD.md](CI-CD.md) para a arquitetura atual).

## O que existia (não existe mais)

- `backend/public/login.html` e `dashboard.html` — páginas estáticas de login/dashboard
- `backend/public/css/login.css`, `backend/public/js/login.js`, `js/api-helper.js`, `js/dashboard.js`
- Documentos de apoio (`LOGIN_DOCUMENTATION.md`, `API_HELPER_EXAMPLES.md`, `IMPLEMENTATION_CHECKLIST.md`, `GETTING_STARTED.md`, `RESUMO_FINAL.md`, `auth_tests.http`) — nenhum desses arquivos está mais no repositório
- `app.use(express.static(...))` em `server.js`, removido pelo script `cleanup-frontend.js` (também já removido) quando o frontend foi separado para a Vercel

## O que permanece

A lógica de autenticação JWT criada nessa época (hash de senha, geração/validação de token, middleware de auth) é a mesma usada hoje em `backend/src/controllers/authController.js` e `backend/src/middleware/authMiddleware.js` — só a camada visual (HTML estático → React) foi substituída.

---

*Consolidado em: 2026-06-28, a partir de `ARQUIVOS_CRIADOS.txt` e `INDICE.md` (originais de 2025-11-25).*
