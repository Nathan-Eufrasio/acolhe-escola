// Model da Providencia (classe "Protocolo" do diagrama)

const db = require('../config/db');

class Providencia {

  // Registra uma acao da escola sobre um relato e devolve o id
  static async criar({ descricao, idRelato, idAdministrador }) {
    const [resultado] = await db.query(
      'INSERT INTO providencia (descricao, id_relato, id_administrador) VALUES (?, ?, ?)',
      [descricao, idRelato, idAdministrador]
    );
    return resultado.insertId;
  }
}

module.exports = Providencia;