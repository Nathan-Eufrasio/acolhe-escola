// Gera o codigo que o aluno usa para acompanhar o relato. Ex.: K7MX3QPA

const crypto = require('crypto');

// Sem letras parecidas (0 e O, 1 e I, L)
const CARACTERES = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// 8 caracteres: quase impossivel de adivinhar
const TAMANHO = 8;

function gerarCodigo() {
  let codigo = '';
  for (let i = 0; i < TAMANHO; i++) {
    // Sorteio seguro (melhor que Math.random)
    const posicao = crypto.randomInt(CARACTERES.length);
    codigo += CARACTERES[posicao];
  }
  return codigo;
}

module.exports = gerarCodigo;
