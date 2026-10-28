// Rotas de login

const express = require('express');
const authController = require('../controllers/authController');
const { exigirLogin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Login (POST para a senha nao aparecer na URL)
router.post('/secretaria', authController.loginSecretaria);
router.post('/admin', authController.loginAdmin);

// Mostra quem esta logado (precisa de token)
router.get('/eu', exigirLogin(), authController.quemSouEu);

module.exports = router;
