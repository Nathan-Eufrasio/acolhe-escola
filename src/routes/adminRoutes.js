// Rotas do painel da escola (todas precisam do login de administrador)

const express = require('express');
const adminController = require('../controllers/adminController');
const { exigirLogin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas abaixo passam pelo seguranca antes
router.use(exigirLogin('admin'));

// Painel da escola
router.get('/resumo', adminController.resumo);
router.get('/relatos', adminController.listarRelatos);
// Um relato da escola (tela da engrenagem)
router.get('/relatos/:id', adminController.abrirRelato);
router.patch('/relatos/:id/status', adminController.alterarStatus);
router.post('/relatos/:id/providencias', adminController.registrarProvidencia);


module.exports = router;