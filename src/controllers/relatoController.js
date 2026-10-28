// Controller dos relatos (parte do aluno)

const Relato = require('../models/Relato');
const Instituicao = require('../models/Instituicao');
const gerarCodigo = require('../utils/gerarCodigo');

// Tamanho minimo e maximo da descricao
const MINIMO = 20;
const MAXIMO = 5000;

// POST /api/relatos - envia um relato e devolve o codigo
async function enviar(req, res) {
  const { categoria, descricao, idInstituicao } = req.body || {};

  // Validacao no servidor (nao confiar so na tela)
  if (!Relato.CATEGORIAS.includes(categoria)) {
    return res.status(400).json({ erro: 'Escolha uma categoria valida.' });
  }

  const texto = typeof descricao === 'string' ? descricao.trim() : '';
  if (texto.length < MINIMO) {
    return res.status(400).json({ erro: `Descreva o que aconteceu com pelo menos ${MINIMO} caracteres.` });
  }
  if (texto.length > MAXIMO) {
    return res.status(400).json({ erro: `A descricao pode ter no maximo ${MAXIMO} caracteres.` });
  }

  const id = Number(idInstituicao);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: 'Escolha a instituicao.' });
  }

  try {
    // Confere se a escola existe
    const instituicao = await Instituicao.buscarPorId(id);
    if (!instituicao) {
      return res.status(400).json({ erro: 'Instituicao nao encontrada.' });
    }

    // Se o codigo sorteado ja existir, tenta de novo (ate 5 vezes)
    for (let tentativa = 1; tentativa <= 5; tentativa++) {
      const codigo = gerarCodigo();
      try {
        await Relato.criar({ codigo, categoria, descricao: texto, idInstituicao: id });
        return res.status(201).json({ codigo });
      } catch (erro) {
        if (erro.code !== 'ER_DUP_ENTRY') throw erro;
      }
    }
    throw new Error('Nao foi possivel gerar um codigo unico.');

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Nao foi possivel enviar o relato. Tente novamente.' });
  }
}

// GET /api/relatos/:codigo - consulta o andamento pelo codigo
async function consultar(req, res) {
  const codigo = String(req.params.codigo).trim().toUpperCase();

  // So letras e numeros, de 6 a 12 caracteres
  if (!/^[A-Z0-9]{6,12}$/.test(codigo)) {
    return res.status(400).json({ erro: 'Codigo invalido.' });
  }

  try {
    const relato = await Relato.buscarPorCodigo(codigo);
    if (!relato) {
      return res.status(404).json({ erro: 'Nenhum relato encontrado com este codigo.' });
    }
    res.json(relato);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao consultar o relato.' });
  }
}

module.exports = { enviar, consultar };
