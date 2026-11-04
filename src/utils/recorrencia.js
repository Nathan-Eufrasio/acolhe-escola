// Regra do prototipo: 5 ou mais relatos em 30 dias = recorrencia alta

const DIAS = 30;
const LIMITE = 5;

// Diz a situacao da escola pela quantidade de relatos recentes
function situacao(recentes) {
  return recentes >= LIMITE ? 'recorrencia_alta' : 'dentro_do_esperado';
}

module.exports = { DIAS, LIMITE, situacao };