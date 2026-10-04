const loginForm = document.getElementById('secretaria-login-form');
const loginPanel = document.getElementById('secretaria-login-panel');
const dashboard = document.getElementById('secretaria-dashboard');
const schoolsBody = document.getElementById('secretaria-schools-body');
const reportsBody = document.getElementById('secretaria-reports-body');
const periodFilter = document.getElementById('filter-period');
const schoolFilter = document.getElementById('filter-school');
const statusFilter = document.getElementById('filter-status');
const detailsDialog = document.getElementById('report-details');
const detailContent = document.getElementById('report-detail-content');
const API_BASE_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  && window.location.port !== '3000'
  ? 'http://localhost:3000'
  : '';

let authToken = '';
let reports = [];

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data não informada' : date.toLocaleDateString('pt-BR');
}

function isOpen(report) {
  return ['Recebida', 'Em análise'].includes(report.status);
}

function getPeriodReports() {
  const period = periodFilter.value;
  if (period === 'all') return reports;

  const now = new Date();
  const start = period === 'year'
    ? new Date(now.getFullYear(), 0, 1)
    : new Date(now.getTime() - Number(period) * 24 * 60 * 60 * 1000);
  return reports.filter((report) => {
    const date = new Date(report.created_at);
    return !Number.isNaN(date.getTime()) && date >= start && date <= now;
  });
}

function renderDashboard() {
  const periodReports = getPeriodReports();
  const schools = [...new Set(periodReports.map((report) => report.school || 'Escola não informada'))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  document.getElementById('secretaria-stat-schools').textContent = schools.length;
  document.getElementById('secretaria-stat-reports').textContent = periodReports.length;
  document.getElementById('secretaria-stat-open').textContent = periodReports.filter(isOpen).length;

  schoolsBody.innerHTML = schools.map((school) => {
    const schoolReports = periodReports.filter((report) => (report.school || 'Escola não informada') === school);
    return `<tr><td>${escapeHtml(school)}</td><td>${schoolReports.length}</td><td>${schoolReports.filter(isOpen).length}</td><td>${schoolReports.filter((report) => report.status === 'Resolvida').length}</td></tr>`;
  }).join('') || '<tr><td colspan="4">Nenhum relato registrado.</td></tr>';

  const selectedSchool = schoolFilter.value;
  schoolFilter.innerHTML = '<option value="">Todas</option>' + schools.map((school) => `<option value="${escapeHtml(school)}">${escapeHtml(school)}</option>`).join('');
  schoolFilter.value = schools.includes(selectedSchool) ? selectedSchool : '';
  renderReports();
}

function renderReports() {
  const filtered = getPeriodReports().filter((report) => {
    const school = report.school || 'Escola não informada';
    return (!schoolFilter.value || school === schoolFilter.value)
      && (!statusFilter.value || report.status === statusFilter.value);
  });

  reportsBody.innerHTML = filtered.map((report) => `
    <tr>
      <td>${escapeHtml(report.code)}</td>
      <td>${escapeHtml(report.school || 'Escola não informada')}</td>
      <td>${escapeHtml(report.incident)}</td>
      <td><span class="status-pill-table ${getStatusClass(report.status)}">${escapeHtml(report.status)}</span></td>
      <td>${formatDate(report.created_at)}</td>
      <td><button class="details-button" type="button" data-report-id="${Number(report.id)}">Detalhes</button></td>
    </tr>
  `).join('') || '<tr><td colspan="6">Nenhum relato encontrado.</td></tr>';
}

function getStatusClass(status) {
  return {
    Recebida: 'status-recebida',
    'Em análise': 'status-em-analise',
    Resolvida: 'status-resolvida',
    Arquivada: 'status-arquivada',
  }[status] || 'status-recebida';
}

async function loadReports() {
  const response = await fetch(apiUrl('/api/secretaria/reports'), {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data)) {
    throw new Error(data?.message || 'Não foi possível carregar os relatos.');
  }
  reports = data;
  renderDashboard();
}

function showReportDetails(report) {
  const evidence = typeof report.evidence === 'string' && report.evidence.startsWith('/uploads/')
    ? `<p><strong>Anexo:</strong> <a href="${escapeHtml(report.evidence)}" target="_blank" rel="noopener">Abrir arquivo</a></p>`
    : '';
  detailContent.innerHTML = `
    <dl>
      <div><dt>Protocolo</dt><dd>${escapeHtml(report.code)}</dd></div>
      <div><dt>Escola</dt><dd>${escapeHtml(report.school || 'Escola não informada')}</dd></div>
      <div><dt>Categoria</dt><dd>${escapeHtml(report.incident)}</dd></div>
      <div><dt>Status</dt><dd>${escapeHtml(report.status)}</dd></div>
      <div><dt>Data do relato</dt><dd>${formatDate(report.created_at)}</dd></div>
    </dl>
    <section class="detail-description"><h3>Descrição</h3><p>${escapeHtml(report.description || 'Sem descrição informada.')}</p></section>
    ${evidence}
  `;
  detailsDialog.showModal();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const login = document.getElementById('secretaria-login').value.trim();
  const password = document.getElementById('secretaria-password').value;

  try {
    const response = await fetch(apiUrl('/api/secretaria/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.token) throw new Error(data?.message || 'Não foi possível iniciar a sessão.');
    authToken = data.token;
    await loadReports();
    loginPanel.classList.add('hidden');
    dashboard.classList.remove('hidden');
  } catch (error) {
    authToken = '';
    alert(error.message);
  }
});

reportsBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-report-id]');
  if (!button) return;
  const report = reports.find((item) => item.id === Number(button.dataset.reportId));
  if (report) showReportDetails(report);
});

periodFilter.addEventListener('change', renderDashboard);
schoolFilter.addEventListener('change', renderReports);
statusFilter.addEventListener('change', renderReports);
document.getElementById('secretaria-refresh').addEventListener('click', () => loadReports().catch((error) => alert(error.message)));
document.getElementById('close-details').addEventListener('click', () => detailsDialog.close());
detailsDialog.addEventListener('click', (event) => {
  if (event.target === detailsDialog) detailsDialog.close();
});

document.getElementById('secretaria-logout').addEventListener('click', async () => {
  try {
    await fetch(apiUrl('/api/secretaria/logout'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
  } finally {
    authToken = '';
    reports = [];
    dashboard.classList.add('hidden');
    loginPanel.classList.remove('hidden');
    loginForm.reset();
    periodFilter.value = 'all';
    schoolFilter.value = '';
    statusFilter.value = '';
  }
});