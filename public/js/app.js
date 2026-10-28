// JavaScript da tela do aluno (index.html)
// Usa as rotas: /api/cidades, /api/instituicoes, /api/relatos

// Elementos da pagina
const telas = document.querySelectorAll('.screen');
const formRelato = document.getElementById('report-form');
const selectCidade = document.getElementById('cidade');
const selectInstituicao = document.getElementById('instituicao');
const selectCategoria = document.getElementById('categoria');
const campoDescricao = document.getElementById('description');
const elementoCodigo = document.getElementById('tracking-code');
const formConsulta = document.getElementById('consult-form');
const campoCodigo = document.getElementById('consult-code');
const resultadoConsulta = document.getElementById('consult-result');

// Nomes para mostrar na tela
const NOMES_CATEGORIA = {
  apelidos_ou_humilhacao: 'Apelidos ou humilhação',
  agressao_fisica: 'Agressão física',
  cyberbullying: 'Cyberbullying',
  exclusao_do_grupo: 'Exclusão do grupo',
  discriminacao: 'Discriminação',
  outro: 'Outro',
};

const NOMES_STATUS = {
  novo: { texto: 'Recebido', fundo: 'rgba(59, 130, 246, 0.12)', cor: '#1d4ed8' },
  em_analise: { texto: 'Em análise', fundo: 'rgba(245, 158, 11, 0.14)', cor: '#b45309' },
  concluido: { texto: 'Concluído', fundo: 'rgba(16, 185, 129, 0.14)', cor: '#047857' },
};

// ---------- Funcoes de apoio ----------

// Mostra uma tela e esconde as outras
function mostrarTela(idTela) {
  telas.forEach((tela) => tela.classList.add('hidden'));
  resultadoConsulta.classList.add('hidden');
  document.getElementById(idTela).classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Protege contra XSS (codigo malicioso no texto)
function escaparHtml(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Mostra a data no horario local
function formatarData(dataIso) {
  return new Date(dataIso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

// Faz o pedido ao servidor e devolve a resposta em JSON
async function pedirAoServidor(endereco, opcoes = {}) {
  const resposta = await fetch(endereco, opcoes);
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error(dados?.erro || 'Algo deu errado. Tente novamente.');
  }
  return dados;
}

// Preenche as opcoes de um select
function preencherSelect(select, textoInicial, opcoes) {
  select.innerHTML = '';
  select.add(new Option(textoInicial, ''));
  opcoes.forEach(({ texto, valor }) => select.add(new Option(texto, valor)));
}

// ---------- Cidades e instituicoes ----------

async function carregarCidades() {
  try {
    const cidades = await pedirAoServidor('/api/cidades');
    preencherSelect(
      selectCidade,
      cidades.length ? 'Selecione a cidade' : 'Nenhuma cidade cadastrada',
      cidades.map((cidade) => ({ texto: cidade, valor: cidade }))
    );
  } catch (erro) {
    preencherSelect(selectCidade, 'Erro ao carregar. Recarregue a página.', []);
  }
}

// Carrega as escolas quando o aluno escolhe a cidade
async function carregarInstituicoes() {
  const cidade = selectCidade.value;
  selectInstituicao.disabled = true;

  if (!cidade) {
    preencherSelect(selectInstituicao, 'Escolha a cidade primeiro', []);
    return;
  }

  preencherSelect(selectInstituicao, 'Carregando...', []);
  try {
    const lista = await pedirAoServidor(`/api/instituicoes?cidade=${encodeURIComponent(cidade)}`);
    preencherSelect(
      selectInstituicao,
      'Selecione a instituição',
      lista.map((inst) => ({ texto: inst.nome, valor: inst.id }))
    );
    selectInstituicao.disabled = false;
  } catch (erro) {
    preencherSelect(selectInstituicao, 'Erro ao carregar', []);
  }
}

// ---------- Enviar relato ----------

async function enviarRelato(evento) {
  evento.preventDefault(); // nao recarrega a pagina

  const botao = formRelato.querySelector('button[type="submit"]');

  // Dados no formato que o servidor espera
  const relato = {
    idInstituicao: Number(selectInstituicao.value),
    categoria: selectCategoria.value,
    descricao: campoDescricao.value.trim(),
  };

  if (!relato.idInstituicao || !relato.categoria || relato.descricao.length < 20) {
    alert('Preencha todos os campos. A descrição precisa de pelo menos 20 caracteres.');
    return;
  }

  botao.disabled = true; // evita enviar duas vezes
  try {
    const resposta = await pedirAoServidor('/api/relatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(relato),
    });

    formRelato.reset();
    preencherSelect(selectInstituicao, 'Escolha a cidade primeiro', []);
    selectInstituicao.disabled = true;
    elementoCodigo.textContent = resposta.codigo;
    mostrarTela('success-screen');
  } catch (erro) {
    alert(erro.message);
  } finally {
    botao.disabled = false;
  }
}

// ---------- Consultar relato ----------

async function consultarRelato(evento) {
  evento.preventDefault();

  const codigo = campoCodigo.value.trim().toUpperCase();
  if (!codigo) return;

  resultadoConsulta.classList.remove('hidden');
  resultadoConsulta.innerHTML = '<p>Consultando...</p>';

  try {
    const relato = await pedirAoServidor(`/api/relatos/${encodeURIComponent(codigo)}`);
    mostrarResultado(relato);
  } catch (erro) {
    resultadoConsulta.innerHTML = `<p>${escaparHtml(erro.message)}</p>`;
  }
}

function mostrarResultado(relato) {
  const status = NOMES_STATUS[relato.status] || { texto: relato.status, fundo: '#eee', cor: '#333' };

  // Lista de providencias da escola
  const providencias = relato.providencias.length
    ? relato.providencias
        .map((p) => `<li><strong>${formatarData(p.data_registro)}:</strong> ${escaparHtml(p.descricao)}</li>`)
        .join('')
    : '<li>Nenhuma providência registrada ainda.</li>';

  // Os dados do servidor passam pelo escaparHtml
  resultadoConsulta.innerHTML = `
    <p><strong>Código:</strong> ${escaparHtml(relato.codigo)}</p>
    <p style="margin-top: 10px;"><strong>Instituição:</strong> ${escaparHtml(relato.instituicao)}</p>
    <p style="margin-top: 10px;"><strong>Categoria:</strong> ${escaparHtml(NOMES_CATEGORIA[relato.categoria] || relato.categoria)}</p>
    <p style="margin-top: 10px;"><strong>Enviado em:</strong> ${formatarData(relato.dataEnvio)}</p>
    <div style="margin-top: 14px; border-radius: 16px; padding: 12px 14px; background: ${status.fundo}; color: ${status.cor}; font-weight: 700;">
      ${escaparHtml(status.texto)}
    </div>
    <p style="margin-top: 14px;"><strong>Providências:</strong></p>
    <ul style="margin: 6px 0 0 18px;">${providencias}</ul>
  `;
}

// ---------- Botoes ----------

function ligarEventos() {
  document.getElementById('navigate-form').addEventListener('click', () => mostrarTela('form-screen'));
  document.getElementById('navigate-consult').addEventListener('click', () => mostrarTela('consult-screen'));
  document.getElementById('back-home-from-form').addEventListener('click', () => mostrarTela('home-screen'));
  document.getElementById('back-home-from-consult').addEventListener('click', () => mostrarTela('home-screen'));
  document.getElementById('back-home-from-success').addEventListener('click', () => mostrarTela('home-screen'));
  document.getElementById('consult-from-success').addEventListener('click', () => {
    campoCodigo.value = elementoCodigo.textContent; // ja preenche o codigo
    mostrarTela('consult-screen');
  });

  selectCidade.addEventListener('change', carregarInstituicoes);
  formRelato.addEventListener('submit', enviarRelato);
  formConsulta.addEventListener('submit', consultarRelato);
}

// Quando a pagina carregar
window.addEventListener('DOMContentLoaded', () => {
  ligarEventos();
  mostrarTela('home-screen');
  carregarCidades();
});
