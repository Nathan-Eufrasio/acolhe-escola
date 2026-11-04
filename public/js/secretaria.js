// JavaScript do painel da Secretaria (secretaria.html). Roda no navegador.
// Rotas usadas:
//   POST /api/auth/secretaria
//   GET  /api/secretaria/instituicoes
//   POST /api/secretaria/instituicoes
//   GET  /api/secretaria/administradores
//   POST /api/secretaria/administradores
//   PATCH /api/secretaria/administradores/:id
//   PATCH /api/secretaria/administradores/:id/senha
//   GET  /api/secretaria/relatos?idInstituicao=&status=&categoria=
//   GET  /api/secretaria/relatos/:id

// Elementos da pagina
const painelLogin = document.getElementById('secretaria-login-panel');
const formLogin = document.getElementById('secretaria-login-form');
const painel = document.getElementById('secretaria-dashboard');
const textoNome = document.getElementById('secretaria-nome');
const corpoEscolas = document.getElementById('secretaria-schools-body');
const formEscola = document.getElementById('form-escola');
const listaCidades = document.getElementById('lista-cidades');
const formAdmin = document.getElementById('form-admin');
const selectEscola = document.getElementById('admin-escola');
const corpoAdmins = document.getElementById('corpo-admins');
const corpoRelatos = document.getElementById('corpo-relatos');
const totalRelatos = document.getElementById('relatos-total');
const formFiltros = document.getElementById('filtros-relatos');
const filtroEscola = document.getElementById('filtro-escola');
const filtroStatus = document.getElementById('filtro-status');
const filtroCategoria = document.getElementById('filtro-categoria');
const dialogo = document.getElementById('dialogo-relato');

// Nome e cor de cada situacao na tela
const SITUACOES = {
  recorrencia_alta: { texto: 'Recorrência alta', classe: 'status-alta' },
  dentro_do_esperado: { texto: 'Dentro do esperado', classe: 'status-resolvida' },
};

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

// Mostra a data do banco (UTC) no formato brasileiro
function formatarData(dataIso) {
  return new Date(dataIso).toLocaleDateString('pt-BR');
}

// Mostra a data e a hora no formato brasileiro
function formatarDataHora(dataIso) {
  return new Date(dataIso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// Token guardado so enquanto a aba estiver aberta
const CHAVE_TOKEN = 'tokenSecretaria';
const CHAVE_NOME = 'nomeSecretaria';

// Troca caracteres especiais antes de colocar texto no HTML (protege contra XSS)
function escaparHtml(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Faz um pedido ao backend levando o token
async function pedirAoServidor(endereco, opcoes = {}) {
  const token = sessionStorage.getItem(CHAVE_TOKEN);
  const cabecalhos = { 'Content-Type': 'application/json' };
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  const resposta = await fetch(endereco, { ...opcoes, headers: cabecalhos });
  const dados = await resposta.json().catch(() => null);

  // Token vencido ou invalido: volta para o login
  if (resposta.status === 401 && token) {
    sair();
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
  const email = document.getElementById('secretaria-email').value.trim();
  const senha = document.getElementById('secretaria-senha').value;

  botao.disabled = true;
  try {
    const resposta = await pedirAoServidor('/api/auth/secretaria', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    sessionStorage.setItem(CHAVE_TOKEN, resposta.token);
    sessionStorage.setItem(CHAVE_NOME, resposta.nome);
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
  textoNome.textContent = sessionStorage.getItem(CHAVE_NOME) || 'Secretaria de Educação';
  painelLogin.classList.add('hidden');
  painel.classList.remove('hidden');
  await carregarIndicadores();
  await carregarRelatos();
  await carregarAdministradores();
}

// Apaga o token e volta para o login
function sair() {
  sessionStorage.removeItem(CHAVE_TOKEN);
  sessionStorage.removeItem(CHAVE_NOME);
  painel.classList.add('hidden');
  painelLogin.classList.remove('hidden');
}

// ---------- Indicadores por escola ----------

async function carregarIndicadores() {
  corpoEscolas.innerHTML = '<tr><td colspan="6">Carregando...</td></tr>';
  try {
    const escolas = await pedirAoServidor('/api/secretaria/instituicoes');
    mostrarIndicadores(escolas);
  } catch (erro) {
    corpoEscolas.innerHTML = `<tr><td colspan="6">${escaparHtml(erro.message)}</td></tr>`;
  }
}

function mostrarIndicadores(escolas) {
  // Soma um campo de todas as escolas (ex.: todos os relatos em aberto)
  const somar = (campo) => escolas.reduce((total, escola) => total + Number(escola[campo]), 0);

  // Cartoes do topo
  document.getElementById('stat-escolas').textContent = escolas.length;
  document.getElementById('stat-recentes').textContent = somar('recentes');
  document.getElementById('stat-abertos').textContent = somar('emAberto');
  document.getElementById('stat-alerta').textContent =
    escolas.filter((escola) => escola.situacao === 'recorrencia_alta').length;

  // Sugestoes de cidade no formulario (sem repetir)
  const cidades = [...new Set(escolas.map((escola) => escola.cidade))];
  listaCidades.innerHTML = cidades
    .map((cidade) => `<option value="${escaparHtml(cidade)}"></option>`)
    .join('');

  // Escolas no formulario de administrador (mantem a que estava escolhida)
  const escolhida = selectEscola.value;
  selectEscola.innerHTML = '';
  selectEscola.add(new Option('Selecione a escola', ''));
  escolas.forEach((escola) => {
    selectEscola.add(new Option(`${escola.nome} (${escola.cidade})`, escola.id));
  });
  selectEscola.value = escolhida;

  // Escolas no filtro dos relatos (mantem a que estava escolhida)
  const filtroEscolhido = filtroEscola.value;
  filtroEscola.innerHTML = '';
  filtroEscola.add(new Option('Todas', ''));
  escolas.forEach((escola) => filtroEscola.add(new Option(escola.nome, escola.id)));
  filtroEscola.value = filtroEscolhido;

  if (!escolas.length) {
    corpoEscolas.innerHTML = '<tr><td colspan="6">Nenhuma escola cadastrada.</td></tr>';
    return;
  }

  // Uma linha da tabela para cada escola
  corpoEscolas.innerHTML = escolas.map((escola) => {
    const situacao = SITUACOES[escola.situacao] || { texto: escola.situacao, classe: '' };
    return `
      <tr>
        <td>${escaparHtml(escola.nome)}</td>
        <td>${escaparHtml(escola.cidade)}</td>
        <td>${Number(escola.total)}</td>
        <td>${Number(escola.recentes)}</td>
        <td>${Number(escola.emAberto)}</td>
        <td><span class="status-pill-table ${situacao.classe}">${escaparHtml(situacao.texto)}</span></td>
      </tr>`;
  }).join('');
}

// ---------- Cadastro de escola ----------

async function cadastrarEscola(evento) {
  evento.preventDefault();
  const botao = formEscola.querySelector('button[type="submit"]');
  const escola = {
    nome: document.getElementById('escola-nome').value.trim(),
    email: document.getElementById('escola-email').value.trim(),
    cidade: document.getElementById('escola-cidade').value.trim(),
  };

  botao.disabled = true;
  try {
    const nova = await pedirAoServidor('/api/secretaria/instituicoes', {
      method: 'POST',
      body: JSON.stringify(escola),
    });
    formEscola.reset();
    alert(`Escola "${nova.nome}" cadastrada.`);
    await carregarIndicadores();
  } catch (erro) {
    alert(erro.message);
  } finally {
    botao.disabled = false;
  }
}

// ---------- Acesso das equipes ----------

async function carregarAdministradores() {
  corpoAdmins.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
  try {
    const admins = await pedirAoServidor('/api/secretaria/administradores');
    mostrarAdministradores(admins);
  } catch (erro) {
    corpoAdmins.innerHTML = `<tr><td colspan="4">${escaparHtml(erro.message)}</td></tr>`;
  }
}

function mostrarAdministradores(admins) {
  if (!admins.length) {
    corpoAdmins.innerHTML = '<tr><td colspan="4">Nenhum acesso criado ainda.</td></tr>';
    return;
  }

  // O botao guarda o id e o valor NOVO do ativo (o contrario do atual)
  corpoAdmins.innerHTML = admins.map((admin) => `
      <tr>
        <td>${escaparHtml(admin.login)}</td>
        <td>${escaparHtml(admin.instituicao)}</td>
        <td>
          <span class="status-pill-table ${admin.ativo ? 'status-resolvida' : 'status-arquivada'}">
            ${admin.ativo ? 'Ativo' : 'Desativado'}
          </span>
        </td>
        <td class="acoes-admin">
          <button type="button" class="details-button" data-acao="senha" data-id="${Number(admin.id)}" data-login="${escaparHtml(admin.login)}">
            Redefinir senha
          </button>
          <button type="button" class="details-button" data-acao="ativo" data-id="${Number(admin.id)}" data-ativo="${!admin.ativo}">
            ${admin.ativo ? 'Desativar' : 'Reativar'}
          </button>
        </td>
      </tr>`).join('');
}

async function cadastrarAdministrador(evento) {
  evento.preventDefault();
  const botao = formAdmin.querySelector('button[type="submit"]');
  const admin = {
    email: document.getElementById('admin-email').value.trim(),
    senha: document.getElementById('admin-senha').value,
    idInstituicao: Number(selectEscola.value),
  };

  botao.disabled = true;
  try {
    const novo = await pedirAoServidor('/api/secretaria/administradores', {
      method: 'POST',
      body: JSON.stringify(admin),
    });
    formAdmin.reset();
    alert(`Acesso criado para ${novo.login} (${novo.instituicao}).`);
    await carregarAdministradores();
  } catch (erro) {
    alert(erro.message);
  } finally {
    botao.disabled = false;
  }
}

// Pede a senha nova e manda para o servidor
async function redefinirSenha(botao) {
  const senha = prompt(`Digite a nova senha para ${botao.dataset.login} (de 8 a 72 caracteres).\nDepois, passe essa senha para a pessoa.`);
  if (senha === null) return; // clicou em Cancelar

  if (senha.length < 8 || senha.length > 72) {
    alert('A senha precisa ter de 8 a 72 caracteres.');
    return;
  }

  botao.disabled = true;
  try {
    await pedirAoServidor(`/api/secretaria/administradores/${botao.dataset.id}/senha`, {
      method: 'PATCH',
      body: JSON.stringify({ senha }),
    });
    alert(`Senha de ${botao.dataset.login} redefinida.`);
  } catch (erro) {
    alert(erro.message);
  } finally {
    botao.disabled = false;
  }
}

// Um clique em qualquer botao da tabela de acessos
async function alterarAcesso(evento) {
  const botao = evento.target.closest('button[data-id]');
  if (!botao) return; // clicou fora de um botao

  // Botao "Redefinir senha"
  if (botao.dataset.acao === 'senha') {
    return redefinirSenha(botao);
  }

  const ativo = botao.dataset.ativo === 'true';
  if (!ativo && !confirm('Desativar este acesso? A pessoa perde o acesso ao painel na hora.')) {
    return;
  }

  botao.disabled = true;
  try {
    await pedirAoServidor(`/api/secretaria/administradores/${botao.dataset.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo }),
    });
    await carregarAdministradores();
  } catch (erro) {
    alert(erro.message);
    botao.disabled = false;
  }
}

// ---------- Relatos da rede (so leitura) ----------

// Coloca as opcoes de status e categoria nos filtros
function prepararFiltros() {
  Object.entries(NOMES_STATUS).forEach(([valor, info]) => {
    filtroStatus.add(new Option(info.texto, valor));
  });
  Object.entries(NOMES_CATEGORIA).forEach(([valor, texto]) => {
    filtroCategoria.add(new Option(texto, valor));
  });
}

async function carregarRelatos() {
  corpoRelatos.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';

  // Monta o "?idInstituicao=2&status=novo" so com os filtros escolhidos
  const filtros = new URLSearchParams();
  if (filtroEscola.value) filtros.set('idInstituicao', filtroEscola.value);
  if (filtroStatus.value) filtros.set('status', filtroStatus.value);
  if (filtroCategoria.value) filtros.set('categoria', filtroCategoria.value);

  try {
    const relatos = await pedirAoServidor(`/api/secretaria/relatos?${filtros}`);
    mostrarRelatos(relatos);
  } catch (erro) {
    corpoRelatos.innerHTML = `<tr><td colspan="7">${escaparHtml(erro.message)}</td></tr>`;
  }
}

function mostrarRelatos(relatos) {
  totalRelatos.textContent = `${relatos.length} relato(s)`;

  if (!relatos.length) {
    corpoRelatos.innerHTML = '<tr><td colspan="7">Nenhum relato encontrado.</td></tr>';
    return;
  }

  // Uma linha para cada relato, com o botao "Ver"
  corpoRelatos.innerHTML = relatos.map((relato) => {
    const status = NOMES_STATUS[relato.status] || { texto: relato.status, classe: '' };
    const categoria = NOMES_CATEGORIA[relato.categoria] || relato.categoria;
    return `
      <tr>
        <td>${formatarData(relato.dataEnvio)}</td>
        <td>${escaparHtml(relato.instituicao)}</td>
        <td>${escaparHtml(relato.cidade)}</td>
        <td class="texto-curto" title="${escaparHtml(relato.descricao)}">${escaparHtml(relato.descricao)}</td>
        <td>${escaparHtml(categoria)}</td>
        <td><span class="status-pill-table ${status.classe}">${escaparHtml(status.texto)}</span></td>
        <td><button type="button" class="details-button" data-id="${Number(relato.id)}">Ver</button></td>
      </tr>`;
  }).join('');
}

// Um clique no botao "Ver" de qualquer linha
async function abrirRelato(evento) {
  const botao = evento.target.closest('button[data-id]');
  if (!botao) return;

  botao.disabled = true;
  try {
    const relato = await pedirAoServidor(`/api/secretaria/relatos/${botao.dataset.id}`);
    mostrarDetalhes(relato);
    dialogo.showModal(); // abre a janela por cima da pagina
  } catch (erro) {
    alert(erro.message);
  } finally {
    botao.disabled = false;
  }
}

// Preenche a janela de detalhes (textContent nao interpreta HTML)
function mostrarDetalhes(relato) {
  document.getElementById('det-codigo').textContent = relato.codigo;
  document.getElementById('det-data').textContent = formatarDataHora(relato.dataEnvio);
  document.getElementById('det-escola').textContent = relato.instituicao;
  document.getElementById('det-cidade').textContent = relato.cidade;
  document.getElementById('det-categoria').textContent =
    NOMES_CATEGORIA[relato.categoria] || relato.categoria;
  document.getElementById('det-status').textContent =
    (NOMES_STATUS[relato.status] || { texto: relato.status }).texto;
  document.getElementById('det-descricao').textContent = relato.descricao;

  const lista = document.getElementById('det-providencias');
  if (!relato.providencias.length) {
    lista.innerHTML = '<li>Nenhuma providência registrada ainda.</li>';
    return;
  }
  lista.innerHTML = relato.providencias.map((p) => `
      <li>
        ${escaparHtml(p.descricao)}<br />
        <small>${formatarDataHora(p.dataRegistro)} · ${escaparHtml(p.autor)}</small>
      </li>`).join('');
}

// Botao "Atualizar": recarrega os numeros e os relatos
async function atualizarTudo() {
  await carregarIndicadores();
  await carregarRelatos();
}

// ---------- Ligando os botoes ----------

prepararFiltros();
formLogin.addEventListener('submit', entrar);
document.getElementById('secretaria-logout').addEventListener('click', sair);
document.getElementById('secretaria-refresh').addEventListener('click', atualizarTudo);
formFiltros.addEventListener('change', carregarRelatos); // mudou um filtro: busca de novo
formFiltros.addEventListener('submit', (evento) => evento.preventDefault());
corpoRelatos.addEventListener('click', abrirRelato);
document.getElementById('dialogo-fechar').addEventListener('click', () => dialogo.close());
formEscola.addEventListener('submit', cadastrarEscola);
formAdmin.addEventListener('submit', cadastrarAdministrador);
corpoAdmins.addEventListener('click', alterarAcesso);

// Se ja tem token (ex.: apertou F5), abre o painel direto
if (sessionStorage.getItem(CHAVE_TOKEN)) {
  abrirPainel();
}