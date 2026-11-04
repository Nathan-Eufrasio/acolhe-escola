// Confere o token antes de entrar nas rotas protegidas
// O token chega no cabecalho: Authorization: Bearer <token>

const jwt = require('jsonwebtoken');
const Administrador = require('../models/Administrador');

// exigirLogin('admin') ou exigirLogin('secretaria') limita o tipo de usuario
// exigirLogin() aceita qualquer usuario logado
function exigirLogin(tipoPermitido) {
  return async function (req, res, next) {
    const cabecalho = req.headers.authorization || '';
    const [esquema, token] = cabecalho.split(' ');

    // Sem token
    if (esquema !== 'Bearer' || !token) {
      return res.status(401).json({ erro: 'Faca login para continuar.' });
    }

    // Confere a assinatura e a validade do token
    let dados;
    try {
      dados = jwt.verify(token, process.env.JWT_SECRET);
    } catch (erro) {
      return res.status(401).json({ erro: 'Sessao expirada ou invalida. Faca login de novo.' });
    }

    // Tipo de usuario errado para esta rota
    if (tipoPermitido && dados.tipo !== tipoPermitido) {
      return res.status(403).json({ erro: 'Voce nao tem permissao para acessar esta area.' });
    }

    // Admin desativado perde o acesso na hora, mesmo com token valido
    if (dados.tipo === 'admin') {
      try {
        const ativo = await Administrador.estaAtivo(dados.id);
        if (!ativo) {
          return res.status(403).json({ erro: 'Acesso desativado. Procure a Secretaria de Educacao.' });
        }
      } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao conferir o login.' });
      }
    }

    // Guarda quem esta logado e segue para a rota
    req.usuario = dados;
    next();
  };
}

module.exports = { exigirLogin };