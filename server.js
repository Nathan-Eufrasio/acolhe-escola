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
const db = require('./src/config/db');
const publicRoutes = require('./src/routes/publicRoutes');
const authRoutes = require('./src/routes/authRoutes');
const secretariaRoutes = require('./src/routes/secretariaRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORTA = process.env.PORT || 3000;

// Permite receber dados em JSON
app.use(express.json());

// O Render so considera o servico pronto quando o banco e o esquema existem
app.get('/health', async (req, res) => {
  try {
    const [linhas] = await db.query(
      `SELECT COUNT(*) AS total
         FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name IN ('instituicao', 'administrador', 'secretaria_educacao', 'relato', 'providencia')`
    );

    if (Number(linhas[0].total) !== 5) {
      return res.status(503).json({ status: 'unavailable' });
    }

    res.json({ status: 'ok' });
  } catch (erro) {
    console.error('Verificacao de saude do banco falhou:', erro);
    res.status(503).json({ status: 'unavailable' });
  }
});

// Deixa so a pasta public visivel no navegador
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/secretaria', secretariaRoutes);
app.use('/api/admin', adminRoutes);

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
