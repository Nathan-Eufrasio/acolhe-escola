// Controller do painel da escola (administrador)
// A escola sempre vem do token (req.usuario), nunca do pedido

const Relato = require('../models/Relato');
const Providencia = require('../models/Providencia');
const Instituicao = require('../models/Instituicao');
const recorrencia = require('../utils/recorrencia');

// Tamanho do texto da providencia
const PROVIDENCIA_MINIMO = 5;
const PROVIDENCIA_MAXIMO = 2000;

// Le o id do relato que vem no endereco (null se for invalido)
function lerIdRelato(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/admin/resumo - numeros da escola de quem esta logado
async function resumo(req, res) {
  const idInstituicao = req.usuario.idInstituicao;

  try {
    const instituicao = await Instituicao.buscarPorId(idInstituicao);
    const numeros = await Relato.resumoDaInstituicao(idInstituicao, recorrencia.DIAS);

    res.json({
      instituicao: { nome: instituicao.nome, cidade: instituicao.cidade },
      ...numeros,
      situacao: recorrencia.situacao(numeros.recentes),
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar o resumo da escola.' });
  }
}

// GET /api/admin/relatos - relatos da escola de quem esta logado
async function listarRelatos(req, res) {
  try {
    const relatos = await Relato.listarPorInstituicao(req.usuario.idInstituicao);
    res.json(relatos);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar os relatos.' });
  }
}

// GET /api/admin/relatos/:id - abre um relato da escola, com as providencias
async function abrirRelato(req, res) {
  const id = lerIdRelato(req);
  if (!id) {
    return res.status(400).json({ erro: 'Relato invalido.' });
  }

  try {
    const relato = await Relato.buscarDaInstituicao(id, req.usuario.idInstituicao);
    if (!relato) {
      return res.status(404).json({ erro: 'Relato nao encontrado.' });
    }
    res.json(relato);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao abrir o relato.' });
  }
}

// PATCH /api/admin/relatos/:id/status - muda o status do relato
async function alterarStatus(req, res) {
  const id = lerIdRelato(req);
  const { status } = req.body || {};

  if (!id) {
    return res.status(400).json({ erro: 'Relato invalido.' });
  }
  if (!Relato.STATUS.includes(status)) {
    return res.status(400).json({ erro: 'Escolha um status valido.' });
  }

  try {
    const alterou = await Relato.alterarStatus(id, req.usuario.idInstituicao, status);
    if (!alterou) {
      return res.status(404).json({ erro: 'Relato nao encontrado.' });
    }
    res.json({ id, status });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao alterar o status.' });
  }
}

// POST /api/admin/relatos/:id/providencias - registra o que a escola fez
async function registrarProvidencia(req, res) {
  const id = lerIdRelato(req);
  const { descricao } = req.body || {};
  const texto = typeof descricao === 'string' ? descricao.trim() : '';

  if (!id) {
    return res.status(400).json({ erro: 'Relato invalido.' });
  }
  if (texto.length < PROVIDENCIA_MINIMO || texto.length > PROVIDENCIA_MAXIMO) {
    return res.status(400).json({
      erro: `Descreva a providencia com ${PROVIDENCIA_MINIMO} a ${PROVIDENCIA_MAXIMO} caracteres.`,
    });
  }

  try {
    // O relato e desta escola?
    const relato = await Relato.buscarDaInstituicao(id, req.usuario.idInstituicao);
    if (!relato) {
      return res.status(404).json({ erro: 'Relato nao encontrado.' });
    }

    // Quem registrou vem do token
    const novoId = await Providencia.criar({
      descricao: texto,
      idRelato: id,
      idAdministrador: req.usuario.id,
    });
    res.status(201).json({ id: novoId, descricao: texto });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao registrar a providencia.' });
  }
}

module.exports = { resumo, listarRelatos, abrirRelato, alterarStatus, registrarProvidencia };