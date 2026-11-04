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

    // Liga ou desliga o acesso (devolve false se o id nao existir)
  static async alterarAtivo(id, ativo) {
    const [resultado] = await db.query(
      'UPDATE administrador SET ativo = ? WHERE id = ?',
      [ativo, id]
    );
    return resultado.affectedRows > 0;
  }

    // Troca a senha (devolve false se o id nao existir)
  static async alterarSenha(id, senhaHash) {
    const [resultado] = await db.query(
      'UPDATE administrador SET senha_hash = ? WHERE id = ?',
      [senhaHash, id]
    );
    return resultado.affectedRows > 0;
  }

    // Diz se o administrador existe e esta ativo
  static async estaAtivo(id) {
    const [linhas] = await db.query(
      'SELECT ativo FROM administrador WHERE id = ?',
      [id]
    );
    return Boolean(linhas[0] && linhas[0].ativo);
  }

    // Lista todos os administradores com o nome da escola (sem a senha)
  static async listarTodos() {
    const [linhas] = await db.query(
      `SELECT a.id, a.login, a.ativo, a.id_instituicao AS idInstituicao,
              i.nome AS instituicao
         FROM administrador a
         JOIN instituicao i ON i.id = a.id_instituicao
        ORDER BY i.nome, a.login`
    );
    return linhas.map((linha) => ({ ...linha, ativo: Boolean(linha.ativo) }));
  }

}

module.exports = Administrador;
