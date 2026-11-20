// Envio de e-mail com o nodemailer (usado pelos avisos automaticos)

const nodemailer = require('nodemailer');

// Sem SMTP_HOST no .env, o e-mail so aparece no terminal (modo de teste)
const configurado = Boolean(process.env.SMTP_HOST);

// "Carteiro" que entrega os e-mails pelo servidor SMTP (ex.: Gmail)
const carteiro = configurado
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,   // porta 465 usa TLS direto
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

// Envia um e-mail; se der erro, so registra (o relato nao pode falhar por causa do e-mail)
async function enviarEmail({ para, assunto, texto }) {
  if (!configurado) {
    console.log(`[e-mail de teste] Para: ${para}\nAssunto: ${assunto}\n${texto}\n`);
    return;
  }

  try {
    await carteiro.sendMail({
      from: process.env.EMAIL_REMETENTE || process.env.SMTP_USER,
      to: para,
      subject: assunto,
      text: texto,
    });
  } catch (erro) {
    console.error('Falha ao enviar e-mail:', erro.message);
  }
}

module.exports = { enviarEmail };
