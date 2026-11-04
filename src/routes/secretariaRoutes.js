// Rotas da Secretaria (todas precisam do login da Secretaria)

const express = require('express');
const secretariaController = require('../controllers/secretariaController');
const { exigirLogin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas abaixo passam pelo segurança antes
router.use(exigirLogin('secretaria'));

// Instituicoes
router.post('/instituicoes', secretariaController.cadastrarInstituicao);
router.get('/instituicoes', secretariaController.listarInstituicoes); 
// Administradores
router.post('/administradores', secretariaController.cadastrarAdministrador);
router.get('/administradores', secretariaController.listarAdministradores);
router.patch('/administradores/:id', secretariaController.alterarAcessoAdministrador);
router.patch('/administradores/:id/senha', secretariaController.redefinirSenhaAdministrador);
// Relatos de todas as escolas (so leitura: nao tem rota para mudar nada)
router.get('/relatos', secretariaController.listarRelatos);
router.get('/relatos/:id', secretariaController.abrirRelato);

module.exports = router;