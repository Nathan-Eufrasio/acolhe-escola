// Arquivo principal: liga o servidor e conecta as rotas

// Carrega as configuracoes do arquivo .env
require('dotenv').config({ quiet: true });

// Sem a chave do login o servidor nao liga
if (!process.env.JWT_SECRET) {
  console.error('ERRO: falta JWT_SECRET no arquivo .env (veja o .env.example).');
  process.exit(1);
}

const express = require('express');
const path = require('path');
const publicRoutes = require('./src/routes/publicRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORTA = process.env.PORT || 3000;

// Permite receber dados em JSON
app.use(express.json());

// Deixa so a pasta public visivel no navegador
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api', publicRoutes);
app.use('/api/auth', authRoutes);

// Rota que nao existe
app.use('/api', (req, res) => {
  res.status(404).json({ erro: 'Rota nao encontrada.' });
});

// Trata erros inesperados sem mostrar detalhes do servidor
app.use((erro, req, res, next) => {
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'Dados enviados em formato invalido.' });
  }
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

// Liga o servidor
app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
  console.log('Para desligar, aperte Ctrl + C');
});
