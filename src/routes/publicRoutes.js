// Rotas publicas (usadas pelo aluno, sem login)

const express = require('express');
const instituicaoController = require('../controllers/instituicaoController');
const relatoController = require('../controllers/relatoController');

const router = express.Router();

// Cidades e escolas
router.get('/cidades', instituicaoController.listarCidades);
router.get('/instituicoes', instituicaoController.listarPorCidade);

// Enviar e consultar relato
router.post('/relatos', relatoController.enviar);
router.get('/relatos/:codigo', relatoController.consultar);

module.exports = router;
