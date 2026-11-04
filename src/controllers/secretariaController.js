// Controller do painel da Secretaria

const Instituicao = require('../models/Instituicao');
const Relato = require('../models/Relato');
const bcrypt = require('bcryptjs');
const Administrador = require('../models/Administrador');
const recorrencia = require('../utils/recorrencia');

// Molde simples de e-mail: algo@algo.algo
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MINIMO = 8;
const SENHA_MAXIMO = 72;

// Le um campo de texto e tira os espacos das pontas
function lerTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// POST /api/secretaria/instituicoes - cadastra uma escola
async function cadastrarInstituicao(req, res) {
  const { nome, email, cidade } = req.body || {};
  const dados = {
    nome: lerTexto(nome),
    email: lerTexto(email).toLowerCase(),
    cidade: lerTexto(cidade),
  };

  // Confere os campos
  if (!dados.nome || dados.nome.length > 255) {
    return res.status(400).json({ erro: 'Informe o nome da instituicao (ate 255 caracteres).' });
  }
  if (!FORMATO_EMAIL.test(dados.email) || dados.email.length > 255) {
    return res.status(400).json({ erro: 'Informe um e-mail valido.' });
  }
  if (!dados.cidade || dados.cidade.length > 150) {
    return res.status(400).json({ erro: 'Informe a cidade (ate 150 caracteres).' });
  }

  try {
    const id = await Instituicao.criar(dados);
    res.status(201).json({ id, ...dados });
  } catch (erro) {
    // E-mail repetido (o banco tem UNIQUE no e-mail)
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Ja existe uma instituicao com este e-mail.' });
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar a instituicao.' });
  }
}

// POST /api/secretaria/administradores - cria o login de alguem da escola
async function cadastrarAdministrador(req, res) {
  const { email, senha, idInstituicao } = req.body || {};
  const login = lerTexto(email).toLowerCase();
  const id = Number(idInstituicao);

  // Confere os campos
  if (!FORMATO_EMAIL.test(login) || login.length > 255) {
    return res.status(400).json({ erro: 'Informe um e-mail valido.' });
  }
  if (typeof senha !== 'string' || senha.length < SENHA_MINIMO || senha.length > SENHA_MAXIMO) {
    return res.status(400).json({ erro: `A senha precisa ter de ${SENHA_MINIMO} a ${SENHA_MAXIMO} caracteres.` });
  }
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'Escolha a instituicao.' });
  }

  try {
    // A escola existe?
    const instituicao = await Instituicao.buscarPorId(id);
    if (!instituicao) {
      return res.status(400).json({ erro: 'Instituicao nao encontrada.' });
    }

    // Guarda so o hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    const novoId = await Administrador.criar({ login, senhaHash, idInstituicao: id });

    // Responde sem a senha
    res.status(201).json({ id: novoId, login, idInstituicao: id, instituicao: instituicao.nome });
  } catch (erro) {
    // E-mail repetido (o banco tem UNIQUE no login)
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Ja existe um administrador com este e-mail.' });
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar o administrador.' });
  }
}

// PATCH /api/secretaria/administradores/:id - liga ou desliga o acesso
async function alterarAcessoAdministrador(req, res) {
  const id = Number(req.params.id);
  const { ativo } = req.body || {};

  // Confere os dados
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'Administrador invalido.' });
  }
  if (typeof ativo !== 'boolean') {
    return res.status(400).json({ erro: 'Informe "ativo": true ou false.' });
  }

  try {
    const encontrou = await Administrador.alterarAtivo(id, ativo);
    if (!encontrou) {
      return res.status(404).json({ erro: 'Administrador nao encontrado.' });
    }
    res.json({ id, ativo });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao alterar o acesso do administrador.' });
  }
}

// PATCH /api/secretaria/administradores/:id/senha - define uma senha nova
async function redefinirSenhaAdministrador(req, res) {
  const id = Number(req.params.id);
  const { senha } = req.body || {};

  // Confere os dados
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'Administrador invalido.' });
  }
  if (typeof senha !== 'string' || senha.length < SENHA_MINIMO || senha.length > SENHA_MAXIMO) {
    return res.status(400).json({ erro: `A senha precisa ter de ${SENHA_MINIMO} a ${SENHA_MAXIMO} caracteres.` });
  }

  try {
    // Guarda so o hash da senha nova
    const senhaHash = await bcrypt.hash(senha, 10);
    const encontrou = await Administrador.alterarSenha(id, senhaHash);
    if (!encontrou) {
      return res.status(404).json({ erro: 'Administrador nao encontrado.' });
    }
    res.json({ id, mensagem: 'Senha redefinida.' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao redefinir a senha.' });
  }
}

// GET /api/secretaria/relatos - relatos de todas as escolas (so leitura)
// Filtros opcionais: ?idInstituicao=2&status=novo&categoria=cyberbullying
async function listarRelatos(req, res) {
  const { idInstituicao, status, categoria } = req.query;
  const filtros = {};

  // Cada filtro e opcional, mas se vier precisa ser valido
  if (idInstituicao) {
    const id = Number(idInstituicao);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: 'Escola invalida.' });
    }
    filtros.idInstituicao = id;
  }
  if (status) {
    if (!Relato.STATUS.includes(status)) {
      return res.status(400).json({ erro: 'Status invalido.' });
    }
    filtros.status = status;
  }
  if (categoria) {
    if (!Relato.CATEGORIAS.includes(categoria)) {
      return res.status(400).json({ erro: 'Categoria invalida.' });
    }
    filtros.categoria = categoria;
  }

  try {
    const relatos = await Relato.listarTodos(filtros);
    res.json(relatos);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar os relatos.' });
  }
}

// GET /api/secretaria/relatos/:id - abre um relato de qualquer escola
async function abrirRelato(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'Relato invalido.' });
  }

  try {
    const relato = await Relato.buscarPorId(id);
    if (!relato) {
      return res.status(404).json({ erro: 'Relato nao encontrado.' });
    }
    res.json(relato);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao abrir o relato.' });
  }
}

// GET /api/secretaria/instituicoes - escolas com os indicadores
async function listarInstituicoes(req, res) {
  try {
    const instituicoes = await Instituicao.listarComIndicadores(recorrencia.DIAS);

    // Coloca a situacao em cada escola
    const resposta = instituicoes.map((inst) => ({
      ...inst,
      situacao: recorrencia.situacao(inst.recentes),
    }));

    res.json(resposta);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar as instituicoes.' });
  }
}

// GET /api/secretaria/administradores - lista quem tem acesso a cada escola
async function listarAdministradores(req, res) {
  try {
    const administradores = await Administrador.listarTodos();
    res.json(administradores);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar os administradores.' });
  }
}

module.exports = {
  cadastrarInstituicao,
  listarInstituicoes,
  cadastrarAdministrador,
  listarAdministradores,
  alterarAcessoAdministrador,
  redefinirSenhaAdministrador,
  listarRelatos,
  abrirRelato,
};