// JavaScript do painel da escola (admin.html). Roda no navegador.
// Rotas usadas:
//   POST /api/auth/admin
//   GET  /api/admin/resumo
//   GET  /api/admin/relatos
//   GET  /api/admin/relatos/:id
//   PATCH /api/admin/relatos/:id/status
//   POST /api/admin/relatos/:id/providencias

// Elementos da pagina
const painelLogin = document.getElementById('admin-login-panel');
const formLogin = document.getElementById('admin-login-form');
const painel = document.getElementById('admin-painel');
const faixaAlerta = document.getElementById('alerta-recorrencia');
const corpoRelatos = document.getElementById('corpo-relatos');
const telaRelato = document.getElementById('tela-relato');
const formRelato = document.getElementById('form-relato');
const campoProvidencia = document.getElementById('relato-providencia');
const listaProvidencias = document.getElementById('lista-providencias');

// Relato aberto na tela de gerenciar (id e status salvo no banco)
let relatoAberto = null;

// Nomes para mostrar na tela (o banco guarda o valor tecnico)
const NOMES_CATEGORIA = {
  apelidos_ou_humilhacao: 'Apelidos ou humilhação',
  agressao_fisica: 'Agressão física',
  cyberbullying: 'Cyberbullying',
  exclusao_do_grupo: 'Exclusão do grupo',
  discriminacao: 'Discriminação',
  outro: 'Outro',
};

const NOMES_STATUS = {
  novo: { texto: 'Novo', classe: 'status-recebida' },
  em_analise: { texto: 'Em análise', classe: 'status-em-analise' },
  concluido: { texto: 'Concluído', classe: 'status-resolvida' },
};

// Token guardado so enquanto a aba estiver aberta
const CHAVE_TOKEN = 'tokenAdmin';

// Troca caracteres especiais antes de colocar texto no HTML (protege contra XSS)
function escaparHtml(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Mostra a data do banco (UTC) no formato brasileiro
function formatarData(dataIso) {
  return new Date(dataIso).toLocaleDateString('pt-BR');
}

// Mostra a data e a hora no formato brasileiro
function formatarDataHora(dataIso) {
  return new Date(dataIso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// Mostra o erro, a nao ser que a sessao ja tenha sido encerrada (ai o aviso ja apareceu)
function avisarErro(erro) {
  if (sessionStorage.getItem(CHAVE_TOKEN)) alert(erro.message);
}

// Faz um pedido ao backend levando o token
async function pedirAoServidor(endereco, opcoes = {}) {
  const token = sessionStorage.getItem(CHAVE_TOKEN);
  const cabecalhos = { 'Content-Type': 'application/json' };
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  const resposta = await fetch(endereco, { ...opcoes, headers: cabecalhos });
  const dados = await resposta.json().catch(() => null);

  // Token vencido (401) ou acesso desativado (403): volta para o login
  if ((resposta.status === 401 || resposta.status === 403) && token) {
    sair();
    alert(dados?.erro || 'Faca login de novo.');
  }
  if (!resposta.ok) {
    throw new Error(dados?.erro || 'Algo deu errado. Tente novamente.');
  }
  return dados;
}

// ---------- Login e saida ----------

async function entrar(evento) {
  evento.preventDefault();
  const botao = formLogin.querySelector('button[type="submit"]');
  const email = document.getElementById('admin-email').value.trim();
  const senha = document.getElementById('admin-senha').value;

  botao.disabled = true;
  try {
    const resposta = await pedirAoServidor('/api/auth/admin', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    sessionStorage.setItem(CHAVE_TOKEN, resposta.token);
    formLogin.reset();
    await abrirPainel();
  } catch (erro) {
    alert(erro.message);
  } finally {
    botao.disabled = false;
  }
}

// Mostra o painel e carrega os dados
async function abrirPainel() {
  painelLogin.classList.add('hidden');
  telaRelato.classList.add('hidden');
  painel.classList.remove('hidden');
  await carregarPainel();
}

// Apaga o token e volta para o login
function sair() {
  sessionStorage.removeItem(CHAVE_TOKEN);
  painel.classList.add('hidden');
  telaRelato.classList.add('hidden');
  painelLogin.classList.remove('hidden');
}

// ---------- Resumo e lista de relatos ----------

async function carregarPainel() {
  corpoRelatos.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
  try {
    const resumo = await pedirAoServidor('/api/admin/resumo');
    mostrarResumo(resumo);

    const relatos = await pedirAoServidor('/api/admin/relatos');
    mostrarRelatos(relatos);
  } catch (erro) {
    corpoRelatos.innerHTML = `<tr><td colspan="5">${escaparHtml(erro.message)}</td></tr>`;
  }
}

function mostrarResumo(resumo) {
  // Cabecalho com o nome e a cidade da escola
  document.getElementById('escola-nome').textContent = resumo.instituicao.nome;
  document.getElementById('escola-cidade').textContent = resumo.instituicao.cidade;

  // Cartoes
  document.getElementById('stat-total').textContent = resumo.total;
  document.getElementById('stat-recentes').textContent = resumo.recentes;
  document.getElementById('stat-novos').textContent = resumo.novos;
  document.getElementById('stat-analise').textContent = resumo.emAnalise;

  // Faixa de alerta: aparece so com recorrencia alta
  faixaAlerta.classList.toggle('hidden', resumo.situacao !== 'recorrencia_alta');
}

function mostrarRelatos(relatos) {
  if (!relatos.length) {
    corpoRelatos.innerHTML = '<tr><td colspan="5">Nenhum relato recebido ainda.</td></tr>';
    return;
  }

  // Uma linha para cada relato
  corpoRelatos.innerHTML = relatos.map((relato) => {
    const status = NOMES_STATUS[relato.status] || { texto: relato.status, classe: '' };
    const categoria = NOMES_CATEGORIA[relato.categoria] || relato.categoria;
    return `
      <tr>
        <td>${formatarData(relato.dataEnvio)}</td>
        <td class="texto-curto" title="${escaparHtml(relato.descricao)}">${escaparHtml(relato.descricao)}</td>
        <td>${escaparHtml(categoria)}</td>
        <td><span class="status-pill-table ${status.classe}">${escaparHtml(status.texto)}</span></td>
        <td>
          <button type="button" class="details-button botao-editar" data-id="${Number(relato.id)}" aria-label="Gerenciar relato">⚙️</button>
        </td>
      </tr>`;
  }).join('');
}

// ---------- Gerenciar um relato (engrenagem) ----------

// Clique em qualquer engrenagem da tabela
async function clicarEngrenagem(evento) {
  const botao = evento.target.closest('button[data-id]');
  if (!botao) return;
  await abrirRelato(botao.dataset.id);
}

async function abrirRelato(id) {
  try {
    const relato = await pedirAoServidor(`/api/admin/relatos/${id}`);
    mostrarRelato(relato);
    painel.classList.add('hidden');
    telaRelato.classList.remove('hidden');
    window.scrollTo({ top: 0 });
  } catch (erro) {
    avisarErro(erro);
  }
}

function mostrarRelato(relato) {
  relatoAberto = { id: relato.id, status: relato.status };

  // Dados do relato (textContent nao interpreta HTML)
  document.getElementById('relato-codigo').textContent = relato.codigo;
  document.getElementById('relato-data').textContent = formatarDataHora(relato.dataEnvio);
  document.getElementById('relato-categoria').textContent =
    NOMES_CATEGORIA[relato.categoria] || relato.categoria;
  document.getElementById('relato-descricao').textContent = relato.descricao;

  // Marca o botao do status atual e limpa o campo
  formRelato.elements.status.value = relato.status;
  campoProvidencia.value = '';

  // Historico de providencias
  if (!relato.providencias.length) {
    listaProvidencias.innerHTML = '<li>Nenhuma providência registrada ainda.</li>';
    return;
  }
  listaProvidencias.innerHTML = relato.providencias.map((p) => `
      <li>
        ${escaparHtml(p.descricao)}<br />
        <small>${formatarDataHora(p.dataRegistro)} · ${escaparHtml(p.autor)}</small>
      </li>`).join('');
}

// Botao "Salvar alteracoes": grava a providencia (se tiver) e o status (se mudou)
async function salvarRelato(evento) {
  evento.preventDefault();
  const botao = formRelato.querySelector('button[type="submit"]');
  const status = formRelato.elements.status.value;
  const texto = campoProvidencia.value.trim();
  const mudouStatus = status !== relatoAberto.status;

  if (!texto && !mudouStatus) {
    alert('Nada para salvar: mude o status ou escreva uma providência.');
    return;
  }

  botao.disabled = true;
  try {
    if (texto) {
      await pedirAoServidor(`/api/admin/relatos/${relatoAberto.id}/providencias`, {
        method: 'POST',
        body: JSON.stringify({ descricao: texto }),
      });
    }
    if (mudouStatus) {
      await pedirAoServidor(`/api/admin/relatos/${relatoAberto.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    }
    alert('Alterações salvas.');
    await abrirRelato(relatoAberto.id); // recarrega com os dados novos
  } catch (erro) {
    avisarErro(erro);
  } finally {
    botao.disabled = false;
  }
}

// Botao "Voltar": volta para a lista e atualiza os numeros
async function voltarParaLista() {
  telaRelato.classList.add('hidden');
  painel.classList.remove('hidden');
  await carregarPainel();
}

// ---------- Ligando os botoes ----------

formLogin.addEventListener('submit', entrar);
document.getElementById('admin-sair').addEventListener('click', sair);
document.getElementById('admin-atualizar').addEventListener('click', carregarPainel);
corpoRelatos.addEventListener('click', clicarEngrenagem);
formRelato.addEventListener('submit', salvarRelato);
document.getElementById('relato-voltar').addEventListener('click', voltarParaLista);

// "Esqueci minha senha": mostra ou esconde o aviso
document.getElementById('esqueci-senha').addEventListener('click', (evento) => {
  const aviso = document.getElementById('ajuda-senha');
  const aberto = aviso.classList.toggle('hidden') === false;
  evento.currentTarget.setAttribute('aria-expanded', String(aberto));
});

// Se ja tem token (ex.: apertou F5), abre o painel direto
if (sessionStorage.getItem(CHAVE_TOKEN)) {
  abrirPainel();
}