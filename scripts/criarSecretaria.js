// Cria a primeira conta da Secretaria pelo terminal
// Uso: node scripts/criarSecretaria.js "Nome" email@exemplo.com senha

require('dotenv').config({ quiet: true });

const bcrypt = require('bcryptjs');
const db = require('../src/config/db');
const Secretaria = require('../src/models/Secretaria');

async function principal() {
  // Pega o nome, e-mail e senha digitados no terminal
  const [nome, email, senha] = process.argv.slice(2);

  if (!nome || !email || !senha) {
    console.log('Uso: node scripts/criarSecretaria.js "Nome" email senha');
    return;
  }
  if (senha.length < 8) {
    console.log('A senha precisa ter pelo menos 8 caracteres.');
    return;
  }

  // Transforma a senha em hash
  const senhaHash = await bcrypt.hash(senha, 10);

  const id = await Secretaria.criar({
    nome,
    email: email.trim().toLowerCase(),
    senhaHash,
  });

  console.log(`Conta da Secretaria criada (id ${id}). Login: ${email.trim().toLowerCase()}`);
}

principal()
  .catch((erro) => {
    if (erro.code === 'ER_DUP_ENTRY') {
      console.log('Ja existe uma conta com este e-mail.');
    } else {
      console.error('Erro:', erro.message);
    }
    process.exitCode = 1;
  })
  .finally(() => db.end()); // fecha a conexao com o banco
