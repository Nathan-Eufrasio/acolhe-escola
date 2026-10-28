// Model do Administrador (equipe da escola)

const db = require('../config/db');

class Administrador {

  // Cadastra um administrador ligado a uma escola
  static async criar({ login, senhaHash, idInstituicao }) {
    const [resultado] = await db.query(
      'INSERT INTO administrador (login, senha_hash, id_instituicao) VALUES (?, ?, ?)',
      [login, senhaHash, idInstituicao]
    );
    return resultado.insertId;
  }

  // Busca pelo login, junto com o nome da escola (JOIN)
  static async buscarPorLogin(login) {
    const [linhas] = await db.query(
      `SELECT a.id, a.login, a.senha_hash, a.ativo, a.id_instituicao,
              i.nome AS instituicao
         FROM administrador a
         JOIN instituicao i ON i.id = a.id_instituicao
        WHERE a.login = ?`,
      [login]
    );
    return linhas[0] || null;
  }
}

module.exports = Administrador;
