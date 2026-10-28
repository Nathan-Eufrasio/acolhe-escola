// Model da Secretaria de Educacao

const db = require('../config/db');

class Secretaria {

  // Cadastra uma conta (a senha ja chega em hash)
  static async criar({ nome, email, senhaHash }) {
    const [resultado] = await db.query(
      'INSERT INTO secretaria_educacao (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );
    return resultado.insertId;
  }

  // Busca pelo e-mail, usado no login (o hash nunca vai para a tela)
  static async buscarPorEmail(email) {
    const [linhas] = await db.query(
      'SELECT id, nome, email, senha_hash FROM secretaria_educacao WHERE email = ?',
      [email]
    );
    return linhas[0] || null;
  }
}

module.exports = Secretaria;
