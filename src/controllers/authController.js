// Controller do login da Secretaria e do Administrador

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Secretaria = require('../models/Secretaria');
const Administrador = require('../models/Administrador');

// O token vale por 8 horas
const DURACAO_TOKEN = '8h';

// Hash falso: o login demora o mesmo tempo mesmo se o e-mail nao existir
const HASH_FALSO = bcrypt.hashSync('senha-falsa-so-para-gastar-tempo', 10);

// Confere se veio e-mail e senha
function lerCredenciais(corpo) {
  const { email, senha } = corpo || {};

  if (typeof email !== 'string' || typeof senha !== 'string') return null;
  if (!email.trim() || !senha) return null;

  return { email: email.trim().toLowerCase(), senha };
}

// Cria o token assinado com a chave do .env
function gerarToken(dados) {
  return jwt.sign(dados, process.env.JWT_SECRET, { expiresIn: DURACAO_TOKEN });
}

// POST /api/auth/secretaria
async function loginSecretaria(req, res) {
  const credenciais = lerCredenciais(req.body);
  if (!credenciais) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  try {
    const conta = await Secretaria.buscarPorEmail(credenciais.email);

    // Compara a senha digitada com o hash do banco
    const senhaConfere = await bcrypt.compare(
      credenciais.senha,
      conta ? conta.senha_hash : HASH_FALSO
    );

    // Mesma mensagem para e-mail ou senha errados
    if (!conta || !senhaConfere) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const token = gerarToken({ tipo: 'secretaria', id: conta.id });

    res.json({ token, nome: conta.nome });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao fazer login. Tente novamente.' });
  }
}

// POST /api/auth/admin
async function loginAdmin(req, res) {
  const credenciais = lerCredenciais(req.body);
  if (!credenciais) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  try {
    const conta = await Administrador.buscarPorLogin(credenciais.email);

    const senhaConfere = await bcrypt.compare(
      credenciais.senha,
      conta ? conta.senha_hash : HASH_FALSO
    );

    if (!conta || !senhaConfere) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    // Administrador desativado nao entra
    if (!conta.ativo) {
      return res.status(403).json({ erro: 'Acesso desativado. Procure a Secretaria de Educacao.' });
    }

    // O token guarda tambem a escola do administrador
    const token = gerarToken({
      tipo: 'admin',
      id: conta.id,
      idInstituicao: conta.id_instituicao,
    });

    res.json({ token, login: conta.login, instituicao: conta.instituicao });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao fazer login. Tente novamente.' });
  }
}

// GET /api/auth/eu - devolve os dados de quem esta logado
function quemSouEu(req, res) {
  res.json(req.usuario);
}

module.exports = { loginSecretaria, loginAdmin, quemSouEu };
