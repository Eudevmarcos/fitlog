# FitLog 💪

App para registrar cargas, séries e repetições na academia.

---

## Como publicar no Vercel (sem terminal)

### Passo 1 — Criar conta no GitHub
1. Acesse **github.com** e crie uma conta gratuita (se já tiver, pule)

### Passo 2 — Criar repositório e subir os arquivos
1. No GitHub, clique em **"New repository"**
2. Nome: `fitlog` → clique em **"Create repository"**
3. Clique em **"uploading an existing file"**
4. Arraste **todos os arquivos e pastas** deste projeto
5. Clique em **"Commit changes"**

### Passo 3 — Publicar no Vercel
1. Acesse **vercel.com** e crie conta gratuita (entre com o GitHub)
2. Clique em **"Add New Project"**
3. Selecione o repositório `fitlog`
4. Clique em **"Deploy"** — pronto!

O Vercel vai te dar um link tipo: `https://fitlog-abc123.vercel.app`

---

## Como publicar no Vercel (com terminal)

```bash
# 1. Instalar dependências
npm install

# 2. Testar localmente
npm run dev

# 3. Instalar Vercel CLI e publicar
npm install -g vercel
vercel
```

---

## Estrutura do projeto

```
fitlog/
├── index.html          # Entrada HTML
├── package.json        # Dependências
├── vite.config.js      # Configuração do bundler
└── src/
    ├── main.jsx        # Ponto de entrada React
    └── App.jsx         # App completo
```

## Tecnologias

- **React 18** — Interface
- **Vite** — Build rápido
- **localStorage** — Dados salvos no dispositivo
- **CSS puro** — Sem bibliotecas de UI

## Adicionar à tela inicial no iPhone

1. Abra o link no **Safari**
2. Toque no ícone de **compartilhar** (caixa com seta)
3. Toque em **"Adicionar à Tela de Início"**
4. Confirme — aparece como app nativo!
