// Avisos automaticos por e-mail (RF03 e RF07)
// Nenhum aviso leva a descricao do relato nem dados de quem relatou

const Relato = require('../models/Relato');
const Secretaria = require('../models/Secretaria');
const { DIAS, LIMITE } = require('./recorrencia');
const { enviarEmail } = require('./email');

// Endereco do site, para o link do e-mail
const SITE = process.env.APP_URL || 'http://localhost:3000';

// Avisa a escola do relato novo e, se ela chegou no limite, avisa a Secretaria
async function avisarNovoRelato(instituicao, categoria) {
  try {
    // 1) Aviso para a escola (RF03)
    await enviarEmail({
      para: instituicao.email,
      assunto: 'Acolhe Escola: novo relato recebido',
      texto:
        `Ola, equipe escolar (${instituicao.nome}).\n\n` +
        `Um novo relato anonimo foi registrado para a sua instituicao.\n` +
        `Categoria: ${categoria.replace(/_/g, ' ')}\n\n` +
        `Para ler e acompanhar, entre no painel da escola: ${SITE}/admin.html\n\n` +
        `Este e-mail nao traz o conteudo do relato nem dados de quem relatou.`,
    });

    // 2) Alerta para a Secretaria (RF07): so quando a escola chega exatamente no limite,
    //    para nao mandar um e-mail a cada relato novo
    const resumo = await Relato.resumoDaInstituicao(instituicao.id, DIAS);
    if (Number(resumo.recentes) !== LIMITE) return;

    const emails = await Secretaria.listarEmails();
    if (emails.length === 0) return;

    await enviarEmail({
      para: emails.join(', '),
      assunto: `Acolhe Escola: recorrencia alta em ${instituicao.nome}`,
      texto:
        `A instituicao ${instituicao.nome} (${instituicao.cidade}) recebeu ` +
        `${LIMITE} relatos nos ultimos ${DIAS} dias.\n\n` +
        `Recomenda-se verificar as providencias adotadas pela escola.\n` +
        `Painel da Secretaria: ${SITE}/secretaria.html`,
    });
  } catch (erro) {
    console.error('Falha nos avisos por e-mail:', erro.message);
  }
}

module.exports = { avisarNovoRelato };
