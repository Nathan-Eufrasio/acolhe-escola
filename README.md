# Acolhe Escola

Plataforma web responsiva para relatos anônimos e gestão de ocorrências escolares na rede pública.

* 🔒 Relatos anônimos de bullying e violência
* 🎫 Acompanhamento sigiloso por código único
* 📱 Interface responsiva para computador e celular
* 🗄️ Banco SQLite para persistência dos relatos
* 🛡️ Área administrativa protegida por sessão

## Proposta social

O objetivo deste projeto é oferecer aos estudantes um canal seguro e confidencial para relatar episódios de bullying. O sistema prioriza o anonimato e permite o acompanhamento das denúncias por meio de um código único.

## Arquivos

- `index.html` - Página pública para envio e consulta de relatos.
- `js/app.js` - Lógica de navegação entre telas, geração de código de acompanhamento, envio de denúncias e consulta de status.
- `admin.html` - Área administrativa para acompanhar e atualizar relatos reais.
- `js/admin.js` - Autenticação, carregamento do dashboard, atualização de status e exportação CSV.
- `css/admin.css` - Estilos responsivos da área administrativa.
- `server.js` - API Express, autenticação administrativa, SQLite e upload de evidências.
- `README.md` - Documentação resumida do projeto.

## Estrutura das telas

1. **Home**
   - Cabeçalho com título e mensagem de acolhimento.
   - Card para enviar denúncia anônima.
   - Botão para acompanhar denúncia por código.

2. **Formulário de denúncia**
   - Select com escolas.
   - Select com tipos de ocorrência.
   - Campo de descrição obrigatório.
   - Upload de arquivo para evidências.
   - Botão de envio sigiloso.

3. **Tela de sucesso**
   - Confirmação de envio.
   - Código de acompanhamento gerado aleatoriamente.
   - Orientação para anotar e consultar o código.

4. **Consulta de status**
   - Campo para inserir código.
   - Exibição do status da denúncia.

## Como rodar localmente

1. Abra a pasta do projeto (`d:\programacao\acolhe-escola`) em um terminal.
2. Execute `npm install` para instalar as dependências.
3. Execute `npm start` para iniciar o servidor.
4. Abra `http://localhost:3000` em um navegador.

### Acesso administrativo

Abra `http://localhost:3000/admin.html`. Por padrão, o acesso local usa `admin` / `admin`.
Em qualquer ambiente publicado, defina credenciais próprias antes de iniciar o servidor:

```powershell
$env:ADMIN_LOGIN="gestor"
$env:ADMIN_PASSWORD="defina-uma-senha-forte"
npm start
```

Não publique credenciais reais no código ou no README.

## Backend e banco de dados

- O projeto possui um backend Node.js com Express.
- Os dados das denúncias são salvos em um banco SQLite em `data/reports.db`.
- Evidências anexadas são armazenadas em `uploads/`.

## Endpoints disponíveis

- `POST /api/reports` - Envia uma denúncia com `school`, `incident`, `description` e arquivo opcional `attachment`.
- `GET /api/reports/:code` - Consulta o status de uma denúncia pelo código.
- `POST /api/admin/login` - Autentica o administrador e retorna um token de sessão.
- `POST /api/admin/logout` - Encerra a sessão administrativa.
- `GET /api/admin/reports` - Lista os relatos reais do banco; exige token Bearer.
- `PATCH /api/admin/reports/:id/status` - Atualiza o status de um relato; exige token Bearer.

## Publicação

O projeto precisa de um host Node.js com armazenamento persistente para o arquivo SQLite e para a pasta `uploads/`. Configure `ADMIN_LOGIN` e `ADMIN_PASSWORD` como variáveis secretas no serviço escolhido, como Render ou Railway. Faça backup de `data/reports.db` e `uploads/` antes de trocar o ambiente de produção.
