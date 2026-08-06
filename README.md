# Acolhe Escola

Um protótipo de Web App responsivo para um Sistema Municipal de Apoio Escolar e Denúncias Anônimas.

## Proposta social

O objetivo deste projeto é oferecer aos estudantes um canal seguro e confidencial para relatar episódios de bullying e buscar apoio psicológico. O sistema prioriza o anonimato e permite o acompanhamento das denúncias por meio de um código único.

## Arquivos

- `index.html` - Página principal com todas as telas do app e integração com Tailwind CSS via CDN.
- `js/app.js` - Lógica de navegação entre telas, geração de código de acompanhamento, envio de denúncias e consulta de status.
- `README.md` - Documentação resumida do projeto.

## Estrutura das telas

1. **Home**
   - Cabeçalho com título e mensagem de acolhimento.
   - Card para enviar denúncia anônima.
   - Card para agendar apoio psicológico.
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
   - Exibição simulada do status da denúncia.

5. **Agendamento de apoio psicológico**
   - Escolha de horário disponível.
   - Confirmação de agendamento confidencial.

## Como rodar

1. Abra a pasta do projeto (`d:\programacao\acolhe-escola`) em um terminal.
2. Execute `npm install` para instalar as dependências.
3. Execute `npm start` para iniciar o servidor.
4. Abra `http://localhost:3000` em um navegador.

## Backend e banco de dados

- O projeto agora possui um backend Node.js com Express.
- Os dados das denúncias são salvos em um banco SQLite em `data/reports.db`.
- Evidências anexadas são armazenadas em `uploads/`.

## Endpoints disponíveis

- `POST /api/reports` - Envia uma denúncia com `school`, `incident`, `description` e arquivo opcional `attachment`.
- `GET /api/reports/:code` - Consulta o status de uma denúncia pelo código.
- `POST /api/supports` - Agenda um horário de apoio psicológico com o campo `time`.
- `GET /api/supports` - Retorna os últimos agendamentos.

> Observação: este backend está pronto para ser publicado em um serviço Node.js, como Render, Railway ou outro host de sua preferência.
