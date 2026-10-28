// Confere o token antes de entrar nas rotas protegidas
// O token chega no cabecalho: Authorization: Bearer <token>

const jwt = require('jsonwebtoken');

// exigirLogin('admin') ou exigirLogin('secretaria') limita o tipo de usuario
// exigirLogin() aceita qualquer usuario logado
function exigirLogin(tipoPermitido) {
  return function (req, res, next) {
    const cabecalho = req.headers.authorization || '';
    const [esquema, token] = cabecalho.split(' ');

    // Sem token
    if (esquema !== 'Bearer' || !token) {
      return res.status(401).json({ erro: 'Faca login para continuar.' });
    }

    try {
      // Confere a assinatura e a validade do token
      const dados = jwt.verify(token, process.env.JWT_SECRET);

      // Tipo de usuario errado para esta rota
      if (tipoPermitido && dados.tipo !== tipoPermitido) {
        return res.status(403).json({ erro: 'Voce nao tem permissao para acessar esta area.' });
      }

      // Guarda quem esta logado e segue para a rota
      req.usuario = dados;
      next();
    } catch (erro) {
      // Token falso ou vencido
      return res.status(401).json({ erro: 'Sessao expirada ou invalida. Faca login de novo.' });
    }
  };
}

module.exports = { exigirLogin };
