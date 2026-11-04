// Model do Relato

const db = require('../config/db');

class Relato {

  // Categorias aceitas (iguais ao ENUM do banco)
  static CATEGORIAS = [
    'apelidos_ou_humilhacao',
    'agressao_fisica',
    'cyberbullying',
    'exclusao_do_grupo',
    'discriminacao',
    'outro',
  ];

    // Status aceitos. Precisam ser iguais aos do ENUM no bd.sql
  static STATUS = ['novo', 'em_analise', 'concluido'];

  // Grava um relato novo (status e data o banco preenche)
  static async criar({ codigo, categoria, descricao, idInstituicao, anexo = null }) {
    const [resultado] = await db.query(
      `INSERT INTO relato (codigo_protocolo, categoria, descricao, id_instituicao, anexo)
       VALUES (?, ?, ?, ?, ?)`,
      [codigo, categoria, descricao, idInstituicao, anexo]
    );
    return resultado.insertId;
  }

  // Busca o relato pelo codigo (para o aluno, sem a descricao)
  static async buscarPorCodigo(codigo) {
    // JOIN para pegar o nome da escola
    const [linhas] = await db.query(
      `SELECT r.id, r.codigo_protocolo, r.categoria, r.status, r.data_envio,
              i.nome AS instituicao
         FROM relato r
         JOIN instituicao i ON i.id = r.id_instituicao
        WHERE r.codigo_protocolo = ?`,
      [codigo]
    );



    const relato = linhas[0];
    if (!relato) return null;

    // Providencias que a escola ja registrou
    const [providencias] = await db.query(
      `SELECT descricao, data_registro
         FROM providencia
        WHERE id_relato = ?
        ORDER BY data_registro`,
      [relato.id]
    );

    // Resposta para o aluno (sem o id interno)
    return {
      codigo: relato.codigo_protocolo,
      categoria: relato.categoria,
      status: relato.status,
      dataEnvio: relato.data_envio,
      instituicao: relato.instituicao,
      providencias,
    };
  }

    // Lista os relatos de uma escola, do mais novo para o mais antigo
  static async listarPorInstituicao(idInstituicao) {
    const [linhas] = await db.query(
      `SELECT id, codigo_protocolo AS codigo, categoria, descricao, status,
              data_envio AS dataEnvio
         FROM relato
        WHERE id_instituicao = ?
        ORDER BY data_envio DESC, id DESC`,
      [idInstituicao]
    );
    return linhas;
  }

  // Conta os relatos de uma escola (cartoes do painel)
  static async resumoDaInstituicao(idInstituicao, dias) {
    const [linhas] = await db.query(
      `SELECT COUNT(*) AS total,
              COUNT(CASE WHEN data_envio >= NOW() - INTERVAL ? DAY THEN 1 END) AS recentes,
              COUNT(CASE WHEN status = 'novo' THEN 1 END) AS novos,
              COUNT(CASE WHEN status = 'em_analise' THEN 1 END) AS emAnalise
         FROM relato
        WHERE id_instituicao = ?`,
      [dias, idInstituicao]
    );
    return linhas[0];
  }

    // Busca um relato pelo id, so se for da escola informada (null se nao achar)
  static async buscarDaInstituicao(id, idInstituicao) {
    const [linhas] = await db.query(
      `SELECT id, codigo_protocolo AS codigo, categoria, descricao, status,
              data_envio AS dataEnvio
         FROM relato
        WHERE id = ? AND id_instituicao = ?`,
      [id, idInstituicao]
    );

    const relato = linhas[0];
    if (!relato) return null;

    const providencias = await Relato.listarProvidencias(id);
    return { ...relato, providencias };
  }

  // Providencias de um relato, com o e-mail de quem registrou
  static async listarProvidencias(idRelato) {
    const [providencias] = await db.query(
      `SELECT p.id, p.descricao, p.data_registro AS dataRegistro, a.login AS autor
         FROM providencia p
         JOIN administrador a ON a.id = p.id_administrador
        WHERE p.id_relato = ?
        ORDER BY p.data_registro, p.id`,
      [idRelato]
    );
    return providencias;
  }

  // Lista os relatos de todas as escolas, com filtros opcionais (Secretaria)
  static async listarTodos({ idInstituicao, status, categoria } = {}) {
    // Monta o WHERE so com os filtros que vieram. O valor sempre vai pelo "?"
    const condicoes = [];
    const valores = [];
    if (idInstituicao) {
      condicoes.push('r.id_instituicao = ?');
      valores.push(idInstituicao);
    }
    if (status) {
      condicoes.push('r.status = ?');
      valores.push(status);
    }
    if (categoria) {
      condicoes.push('r.categoria = ?');
      valores.push(categoria);
    }
    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    const [linhas] = await db.query(
      `SELECT r.id, r.codigo_protocolo AS codigo, r.categoria, r.descricao, r.status,
              r.data_envio AS dataEnvio, i.id AS idInstituicao,
              i.nome AS instituicao, i.cidade
         FROM relato r
         JOIN instituicao i ON i.id = r.id_instituicao
         ${where}
        ORDER BY r.data_envio DESC, r.id DESC`,
      valores
    );
    return linhas;
  }

  // Busca um relato de qualquer escola, com a escola e as providencias (Secretaria)
  static async buscarPorId(id) {
    const [linhas] = await db.query(
      `SELECT r.id, r.codigo_protocolo AS codigo, r.categoria, r.descricao, r.status,
              r.data_envio AS dataEnvio, i.nome AS instituicao, i.cidade
         FROM relato r
         JOIN instituicao i ON i.id = r.id_instituicao
        WHERE r.id = ?`,
      [id]
    );

    const relato = linhas[0];
    if (!relato) return null;

    const providencias = await Relato.listarProvidencias(id);
    return { ...relato, providencias };
  }

  // Muda o status, so se o relato for da escola informada
  static async alterarStatus(id, idInstituicao, status) {
    const [resultado] = await db.query(
      'UPDATE relato SET status = ? WHERE id = ? AND id_instituicao = ?',
      [status, id, idInstituicao]
    );
    return resultado.affectedRows > 0;
  }

}

module.exports = Relato;
