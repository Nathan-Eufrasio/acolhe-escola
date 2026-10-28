# Acolhe Escola

Sistema de relatos anonimos de bullying escolar.

- **Front-end:** HTML, CSS e JavaScript (pasta `public/`)
- **Backend:** Node.js + Express, em arquitetura MVC (pasta `src/`)
- **Banco:** MySQL 8.4 rodando no Docker (script em `database/bd.sql`)

## Pre-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (no Windows, com WSL2)
- [Node.js](https://nodejs.org/) versao LTS

## Como rodar

```
copy .env.example .env      (no Linux/Mac: cp .env.example .env)
docker compose up -d        (liga o MySQL e o phpMyAdmin)
npm install                 (baixa as bibliotecas, so na primeira vez)
npm start                   (liga o backend)
```

- Sistema: http://localhost:3000
- phpMyAdmin: http://localhost:8080 (usuario `acolhe`, senha do `DB_PASSWORD` no `.env`)

Na primeira vez, o MySQL roda o `database/bd.sql` sozinho e cria as tabelas.
Para recriar o banco do zero (APAGA os dados): `docker compose down -v` e depois `docker compose up -d`.

## Estrutura (MVC)

```
public/          VIEW: telas (index.html, admin.html, secretaria.html, css, js, assets)
src/config/      conexao com o MySQL (db.js)
src/models/      MODEL: unica camada que escreve SQL (um arquivo por classe do diagrama)
src/controllers/ CONTROLLER: recebe o pedido, valida, chama o model, responde
src/routes/      liga cada URL a uma funcao do controller
src/utils/       funcoes de apoio (gerarCodigo.js)
database/bd.sql  script do banco
server.js        ponto de partida: liga tudo
```

## Rotas prontas

| Metodo | Rota | O que faz |
|---|---|---|
| GET | `/api/cidades` | Lista as cidades com instituicoes cadastradas |
| GET | `/api/instituicoes?cidade=Palmas` | Lista as instituicoes de uma cidade |
| POST | `/api/relatos` | Envia um relato. Corpo: `{ categoria, descricao, idInstituicao }`. Responde `{ codigo }` |
| GET | `/api/relatos/:codigo` | Consulta um relato (sem a descricao) com status e providencias |

## Problemas comuns no Windows

- **`npm` bloqueado no PowerShell** ("execucao de scripts foi desabilitada"): rode uma vez
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- **`ECONNREFUSED`** ao conectar no banco: Docker Desktop fechado, ou `DB_HOST` diferente de `127.0.0.1` no `.env`.
- **Tabelas nao aparecem**: o `bd.sql` nao estava em `database/` no primeiro `up`. Rode `docker compose down -v` e `docker compose up -d`.
