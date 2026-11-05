// Conexao com o banco MySQL

const mysql = require('mysql2/promise');

// Pool: conjunto de conexoes reaproveitadas
const configuracao = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',   // aceita acentos
  connectionLimit: 10,
  timezone: 'Z',        // datas em UTC
};

if (process.env.DB_SSL === 'true') {
  configuracao.ssl = { rejectUnauthorized: true };
}

const pool = mysql.createPool(configuracao);

// Cada conexao nova usa o horario UTC
pool.on('connection', (conexao) => {
  conexao.query("SET time_zone = '+00:00'");
});

module.exports = pool;
