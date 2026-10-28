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
}

module.exports = Relato;
