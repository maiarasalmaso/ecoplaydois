# React + Vite

[![Netlify Status](https://api.netlify.com/api/v1/badges/29676dec-da2d-461b-8292-9e498dca4e3f/deploy-status)](https://app.netlify.com/projects/ecoplay/deploys)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Banco de dados

- Guia de configuração no Supabase: [banco-de-dados-supabase.md](docs/banco-de-dados-supabase.md)

## Deploy

- Netlify: [deploy-netlify.md](docs/deploy-netlify.md)

## EcoPlatformer: obstáculos voadores e mobis

### Controles

- E: interagir com mobi próximo (segurar/soltar ou abrir/fechar)
- C: trocar cor do mobi próximo
- V: trocar material do mobi próximo
- F2: abrir/fechar painel de parâmetros (editor)

### Obstáculos voadores

- Spawn aleatório à frente do jogador, com limite simultâneo configurável.
- Padrões de movimento: senoide, zigue-zague e órbita (varia por obstáculo).
- Colisão: ao tocar no jogador, aplica dano via sistema padrão de “hurt” (consome escudo antes de tirar vida).

### Mobis (objetos interativos)

- Mobis vêm do campo `mobis` em cada nível (`LEVELS`), com tipos como `crate`, `bin`, `cabinet` e `barrel`.
- Física simples: gravidade, colisão com plataformas, atrito e restituição configuráveis.
- Interação: mobis `openable` alternam estado aberto/fechado; mobis `portable` podem ser segurados/soltos.

### Parâmetros via editor

- Obstáculos voadores: ativar/desativar, spawn/min, máximo simultâneo, velocidades e tamanho, e visualização de colisores.
- Mobis: ativar/desativar, gravidade, atrito, quiques e permitir segurar.
