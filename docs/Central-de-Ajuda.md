# Central de Ajuda e Widget Global de Suporte — ManutAI

## Sumário

1. [Visão Geral](#visão-geral)
2. [Arquivos Criados](#arquivos-criados)
3. [Arquivos Modificados](#arquivos-modificados)
4. [Página de Ajuda (`/help`)](#página-de-ajuda-help)
5. [Widget Global de Ajuda](#widget-global-de-ajuda)
6. [Integração Global](#integração-global)
7. [Estilo (UI)](#estilo-ui)
8. [Fluxo Completo](#fluxo-completo)
9. [Como Testar](#como-testar)
10. [Decisões de Implementação](#decisões-de-implementação)

---

## Visão Geral

Foi implementado um **sistema de suporte ao usuário** no ManutAI, funcionando como um manual de operação interno do sistema. Ele é composto por duas partes complementares:

1. Uma página dedicada, **Central de Ajuda** (`/help`), com explicações sobre o sistema organizadas em formato de accordion.
2. Um **widget flutuante global** (`HelpWidget`), fixo no canto inferior esquerdo, presente em todas as rotas do sistema — incluindo as páginas públicas (login, registro, recuperação de senha).

Diferente do [ChatBot](Chatbot.md) (assistente de IA, canto inferior direito, exclusivo para usuários autenticados), o widget de ajuda é **propositalmente simples**: não possui lógica de IA, apenas links de navegação estáticos. Seu papel é dar acesso rápido ao manual do sistema a partir de qualquer tela.

| Característica | ChatBot (existente) | Widget de Ajuda (novo) |
|---|---|---|
| Posição | Canto inferior direito | Canto inferior esquerdo |
| Disponível em | Apenas rotas autenticadas | Todas as rotas, incluindo login |
| Lógica | IA com Function Calling (Groq) | Nenhuma — apenas navegação |
| Objetivo | Responder perguntas com dados reais | Apontar o caminho para o manual do sistema |

---

## Arquivos Criados

### Frontend

| Arquivo | Descrição |
|---|---|
| `frontend/src/pages/Help.jsx` | Página "Central de Ajuda", rota `/help`, com accordion de 5 seções |
| `frontend/src/styles/Help.css` | Estilo da página, no padrão dark/cyan já usado no projeto |
| `frontend/src/components/HelpWidget.jsx` | Botão flutuante + painel rápido, sem lógica de chatbot |
| `frontend/src/styles/HelpWidget.css` | Estilo do botão flutuante (canto inferior esquerdo, tema azul) |

---

## Arquivos Modificados

| Arquivo | Alteração |
|---|---|
| `frontend/src/pages/index.js` | Export de `Help` |
| `frontend/src/components/index.js` | Export de `HelpWidget` |
| `frontend/src/App.js` | Rota protegida `/help`; `<HelpWidget />` renderizado fora de `<Routes>`, em todas as rotas |
| `frontend/src/components/Drawer.jsx` | Novo item "Ajuda" no menu lateral, com ícone `HelpCircle` |

---

## Página de Ajuda (`/help`)

A página segue o mesmo layout das demais telas autenticadas (`Drawer` + `Header` + `Footer`), com o conteúdo organizado em um **accordion**: apenas uma seção fica expandida por vez, controlada por um único estado `secaoAberta`.

```javascript
const [secaoAberta, setSecaoAberta] = useState(0);

const toggleSecao = (index) => {
  setSecaoAberta((atual) => (atual === index ? -1 : index));
};
```

### Seções implementadas

| Seção | Conteúdo |
|---|---|
| Sobre o sistema | Introdução ao ManutAI e como fazer login |
| Como usar o dashboard | Navegação, cards de estatísticas, acesso rápido |
| Gerenciamento de sensores | Dispositivos ESP, Ambientes, Sensores, Leituras, Monitoramento |
| Alertas e notificações | Severidade, status dos alertas, histórico e gráficos |
| Manutenção preventiva | Manutenções pendentes, agendadas e Currículo da Máquina |

O conteúdo de cada seção fica em um array `SECOES`, no topo de `Help.jsx`:

```javascript
const SECOES = [
  { titulo: 'Sobre o sistema', icone: Info, conteudo: (<>...</>) },
  { titulo: 'Como usar o dashboard', icone: LayoutDashboard, conteudo: (<>...</>) },
  // ...
];
```

> O texto descreve o ManutAI especificamente, mas a estrutura (array de `{ titulo, icone, conteudo }` renderizado em accordion) é genérica — pode ser adaptada para o manual de qualquer outro sistema apenas editando esse array.

---

## Widget Global de Ajuda

O `HelpWidget.jsx` é deliberadamente leve: um botão circular fixo que alterna a exibição de um painel estático.

```javascript
// Widget global de ajuda
// Disponível em todas as telas para melhorar a experiência do usuário
//
// Pode ser expandido futuramente para chatbot real ou FAQ dinâmico
const HelpWidget = () => {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);

  const irPara = (rota) => {
    setAberto(false);
    navigate(rota);
  };
  // ...
};
```

O painel exibe:
- Texto fixo: "Precisa de ajuda?"
- Botão principal "Abrir Central de Ajuda" → navega para `/help`
- Links rápidos para Dashboard e Alertas

Não há chamadas a API nem estado persistido — ao fechar o painel e abrir novamente, ele volta ao estado inicial.

---

## Integração Global

O widget é renderizado em `App.js`, **fora** do bloco `<Routes>` e **sem nenhum guard de autenticação**, para garantir que apareça em literalmente todas as rotas, inclusive `/login`:

```javascript
<Routes>
  {/* ... todas as rotas ... */}
</Routes>

<ChatBotGuard />

{/* Widget global de ajuda — disponível em todas as rotas do sistema */}
<HelpWidget />
```

Isso contrasta com o `ChatBotGuard`, que checa `isAuthenticated()` e uma lista de rotas públicas antes de renderizar o ChatBot — o widget de ajuda não precisa dessa lógica porque não expõe nem depende de dados do usuário.

A rota `/help` em si é protegida por `PrivateRoute`, já que faz parte do dashboard autenticado:

```javascript
<Route path="/help" element={<PrivateRoute><Help /></PrivateRoute>} />
```

Por fim, o item "Ajuda" foi adicionado ao menu lateral (`Drawer.jsx`), como atalho alternativo ao widget:

```javascript
<li>
  <NavLink to="/help" onClick={onClose}>
    <HelpCircle size={16} className="icon-inline" /> Ajuda
  </NavLink>
</li>
```

---

## Estilo (UI)

| Elemento | Definição |
|---|---|
| Botão flutuante | Círculo 52px, gradiente azul (`#3b82f6` → `#2563eb`), canto inferior esquerdo |
| Posição | `position: fixed; bottom: 28px; left: 28px;` (espelhado em relação ao ChatBot) |
| Sombra | `box-shadow` leve em azul, intensificada no hover |
| Animação | `help-widget-aparecer` — fade + leve translação ao abrir o painel |
| Página `/help` | Cards em accordion no tema escuro padrão do projeto (`#1e293b` / `#334155`), destaque cyan (`#00cec9`) na seção aberta |

---

## Fluxo Completo

```
Usuário em qualquer rota (autenticada ou não)
        ↓
  Vê o botão flutuante "?" no canto inferior esquerdo
        ↓
  Clica no botão → painel "Precisa de ajuda?" é exibido
        ↓
  Clica em "Abrir Central de Ajuda"
        ↓
  navigate('/help') → PrivateRoute valida autenticação
        ↓
  Página Help.jsx renderiza o accordion com as 5 seções
        ↓
  Usuário expande a seção desejada para ler o manual
```

---

## Como Testar

- [ ] Acessar `/login` (sem estar autenticado) → botão flutuante de ajuda visível no canto inferior esquerdo
- [ ] Clicar no botão → painel "Precisa de ajuda?" abre com botão "Abrir Central de Ajuda" e links rápidos
- [ ] Clicar em "Abrir Central de Ajuda" estando deslogado → redirecionado para `/login` (rota `/help` é protegida)
- [ ] Fazer login → navegar entre `/dashboard`, `/sensores`, `/alertas` etc. → botão de ajuda permanece visível em todas
- [ ] Clicar no botão e em "Abrir Central de Ajuda" → redireciona corretamente para `/help`
- [ ] Na página `/help`, clicar em cada uma das 5 seções → conteúdo expande/recolhe corretamente
- [ ] Abrir o menu lateral (Drawer) → item "Ajuda" aparece e leva para `/help`
- [ ] Redimensionar para tela mobile (≤480px) → painel do widget ocupa a largura disponível sem cortar conteúdo

---

## Decisões de Implementação

| Decisão | Motivo |
|---------|--------|
| Widget sem autenticação, ao contrário do ChatBot | Requisito explícito: deve aparecer em **todas** as rotas, incluindo login/registro |
| Posicionado no canto inferior **esquerdo** | Evitar sobreposição com o ChatBot, que já ocupa o canto inferior direito |
| Sem lógica de IA ou chamadas a API | Requisito explícito de manter o pop-up leve e simples |
| Conteúdo em array `SECOES` dentro de `Help.jsx` | Facilita adaptar o manual para outro sistema apenas editando o array, sem tocar na estrutura do accordion |
| Apenas uma seção aberta por vez no accordion | Mantém a leitura organizada em telas menores, evitando scroll excessivo |
| Rota `/help` protegida por `PrivateRoute` | Mantém o padrão das demais páginas do dashboard; o conteúdo de ajuda é específico do uso autenticado do sistema |

---

*Documentação criada em: 2026-06-28*
