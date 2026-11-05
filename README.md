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

## Publicar uma demonstracao gratuita

Esta configuracao usa o Render para o app e o TiDB Cloud Starter como banco compativel com MySQL. Os [planos gratuitos do Render](https://render.com/docs/free) podem dormir, ter limites de uso e sofrer interrupcoes; o Render tambem nao preserva arquivos locais. Use somente dados ficticios, nunca relatos reais de estudantes.

1. Crie um cluster **MySQL-compatible** no [TiDB Cloud](https://tidbcloud.com/). O plano Starter tem cotas gratuitas mensais e pode bloquear novas conexoes ao atingir os limites; confira as [cotas atuais](https://docs.pingcap.com/tidbcloud/select-cluster-tier/).
2. No SQL Editor do TiDB, execute o conteudo de `database/bd.sql` para criar o banco e as tabelas.
3. Envie este repositorio ao GitHub e, no [Render](https://dashboard.render.com/), escolha **New > Blueprint** e conecte o repositorio. O Render le `render.yaml` e prepara o servico gratuito.
4. Nos detalhes da conexao do TiDB, obtenha o host, usuario e senha. Configure `DB_HOST`, `DB_USER` e `DB_PASSWORD` nas variaveis de ambiente do servico Render. O Blueprint define `DB_PORT=4000`, `DB_NAME=AcolheEscola` e `DB_SSL=true`.
5. Gere uma chave exclusiva para `JWT_SECRET` localmente com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e cadastre o resultado no Render. Nunca coloque essa chave, senha do banco ou credenciais no GitHub.
6. Depois do deploy, crie a conta inicial da Secretaria executando `node scripts/criarSecretaria.js "Nome" email senha` em uma copia local do projeto configurada para apontar ao banco remoto, com `DB_SSL=true` no `.env`. Nao compartilhe os dados de conexao nem use uma senha real de outros servicos.

O endereco publico aparece no painel do Render quando o deploy terminar. Se o servico ficar inativo, o primeiro acesso pode demorar enquanto ele inicia. Para uso real, migre para hospedagem com persistencia, backups e controles de acesso apropriados antes de inserir qualquer dado pessoal.

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
