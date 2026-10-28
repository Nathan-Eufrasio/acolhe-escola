// Controller das instituicoes

const Instituicao = require('../models/Instituicao');

// GET /api/cidades - lista as cidades
async function listarCidades(req, res) {
  try {
    const cidades = await Instituicao.listarCidades();
    res.json(cidades);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar as cidades.' });
  }
}

// GET /api/instituicoes?cidade=Palmas - lista as escolas da cidade
async function listarPorCidade(req, res) {
  const cidade = req.query.cidade;

  // A cidade e obrigatoria
  if (!cidade) {
    return res.status(400).json({
      erro: 'Informe a cidade. Exemplo: /api/instituicoes?cidade=Palmas',
    });
  }

  try {
    const instituicoes = await Instituicao.listarPorCidade(cidade);
    res.json(instituicoes);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar as instituicoes.' });
  }
}

module.exports = { listarCidades, listarPorCidade };
