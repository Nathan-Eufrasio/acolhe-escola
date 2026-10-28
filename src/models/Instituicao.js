// Model da Instituicao (unico lugar com SQL de instituicao)

const db = require('../config/db');

class Instituicao {

  // Cadastra uma instituicao e devolve o id
  static async criar({ nome, email, cidade }) {
    // Os "?" protegem contra SQL Injection
    const [resultado] = await db.query(
      'INSERT INTO instituicao (nome, email, cidade) VALUES (?, ?, ?)',
      [nome, email, cidade]
    );

    return resultado.insertId;
  }

  // Lista todas as instituicoes
  static async listarTodas() {
    const [linhas] = await db.query(
      'SELECT id, nome, email, cidade FROM instituicao ORDER BY cidade, nome'
    );
    return linhas;
  }

  // Lista as cidades, sem repetir
  static async listarCidades() {
    const [linhas] = await db.query(
      'SELECT DISTINCT cidade FROM instituicao ORDER BY cidade'
    );
    return linhas.map((linha) => linha.cidade);
  }

  // Lista as escolas de uma cidade (sem o e-mail)
  static async listarPorCidade(cidade) {
    const [linhas] = await db.query(
      'SELECT id, nome FROM instituicao WHERE cidade = ? ORDER BY nome',
      [cidade]
    );
    return linhas;
  }

  // Busca pelo id (null se nao existir)
  static async buscarPorId(id) {
    const [linhas] = await db.query(
      'SELECT id, nome, email, cidade FROM instituicao WHERE id = ?',
      [id]
    );
    return linhas[0] || null;
  }
}

module.exports = Instituicao;
