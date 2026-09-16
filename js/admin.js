const loginForm = document.getElementById('admin-login-form');
const loginPanel = document.getElementById('login-panel');
const adminDashboard = document.getElementById('admin-dashboard');
const logoutButton = document.getElementById('logout-button');
const reportsTableBody = document.getElementById('reports-table-body');
const allReportsTableBody = document.getElementById('all-reports-table-body');
const institutionsList = document.getElementById('institutions-list');
const alertsList = document.getElementById('alerts-list');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const toolPills = document.querySelectorAll('.tool-pill');
const actionCards = document.querySelectorAll('.action-card');
const exportButton = document.querySelector('.ghost-btn');
const refreshButton = document.querySelector('[data-refresh-reports]');

let authToken = '';
let reports = [];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[character]));
}

function getStatusClass(status) {
  return {
    Recebida: 'status-recebida',
    'Em análise': 'status-em-analise',
    Resolvida: 'status-resolvida',
    Arquivada: 'status-arquivada',
  }[status] || 'status-recebida';
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function statusSelect(report) {
  const statuses = ['Recebida', 'Em análise', 'Resolvida', 'Arquivada'];
  return `<select class="status-select ${getStatusClass(report.status)}" data-report-id="${report.id}">
    ${statuses.map((status) => `<option value="${status}" ${status === report.status ? 'selected' : ''}>${status}</option>`).join('')}
  </select>`;
}

function renderReports() {
  const rows = reports.map((report) => `
    <tr>
      <td>${escapeHtml(report.school)}</td>
      <td>${escapeHtml(report.incident)}</td>
      <td>${formatDate(report.created_at)}</td>
      <td><span class="status-pill-table ${getStatusClass(report.status)}">${escapeHtml(report.status)}</span></td>
    </tr>
  `).join('');
  reportsTableBody.innerHTML = rows || '<tr><td colspan="4">Nenhum relato registrado.</td></tr>';

  allReportsTableBody.innerHTML = reports.map((report) => `
    <tr>
      <td>${escapeHtml(report.code)}</td>
      <td>${escapeHtml(report.school)}</td>
      <td>${escapeHtml(report.incident)}</td>
      <td>${statusSelect(report)}</td>
      <td>${formatDate(report.created_at)}</td>
    </tr>
  `).join('') || '<tr><td colspan="5">Nenhum relato registrado.</td></tr>';

  document.getElementById('stat-total').textContent = reports.length;
  document.getElementById('stat-pending').textContent = reports.filter((report) => ['Recebida', 'Em análise'].includes(report.status)).length;
  document.getElementById('stat-resolved').textContent = reports.filter((report) => report.status === 'Resolvida').length;
  document.getElementById('stat-alerts').textContent = reports.filter((report) => ['Recebida', 'Em análise'].includes(report.status)).length;
  renderInstitutions();
  renderAlerts();
  bindStatusControls();
}

function renderInstitutions() {
  const institutions = [...new Set(reports.map((report) => report.school))];
  institutionsList.innerHTML = institutions.map((school) => `
    <div class="mini-card">
      <span>${escapeHtml(school)}</span>
      <strong>${reports.filter((report) => report.school === school).length} relato(s)</strong>
    </div>
  `).join('') || '<p class="empty-state">Nenhuma instituição possui relatos registrados.</p>';
}

function renderAlerts() {
  const incidents = reports.reduce((counts, report) => {
    if (['Recebida', 'Em análise'].includes(report.status)) {
      counts[report.incident] = (counts[report.incident] || 0) + 1;
    }
    return counts;
  }, {});

  alertsList.innerHTML = Object.entries(incidents).map(([incident, count]) => `
    <div class="mini-card warning">
      <span>${escapeHtml(incident)}</span>
      <strong>${count} pendente(s)</strong>
    </div>
  `).join('') || '<p class="empty-state">Nenhum alerta ativo no momento.</p>';
}

async function loadReports() {
  const response = await fetch('/api/admin/reports', {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!response.ok) {
    throw new Error('Não foi possível carregar os relatos.');
  }

  reports = await response.json();
  renderReports();
}

async function updateReportStatus(reportId, status) {
  const response = await fetch(`/api/admin/reports/${reportId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Não foi possível atualizar o status.');
  }

  await loadReports();
  showToast('Status atualizado com sucesso.');
}

function bindStatusControls() {
  document.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('change', async () => {
      try {
        await updateReportStatus(select.dataset.reportId, select.value);
      } catch (error) {
        alert(error.message);
        await loadReports();
      }
    });
  });
}

function exportReports() {
  const header = ['Código', 'Escola', 'Incidente', 'Status', 'Data'];
  const lines = reports.map((report) => [report.code, report.school, report.incident, report.status, formatDate(report.created_at)]);
  const csv = [header, ...lines].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `relatos-acolhe-escola-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function openDashboard() {
  loginPanel.classList.add('hidden');
  adminDashboard.classList.remove('hidden');
}

function setActiveSection(target) {
  navItems.forEach((item) => item.classList.toggle('active', item.dataset.target === target));
  contentSections.forEach((section) => section.classList.toggle('hidden', section.dataset.section !== target));
}

function closeDashboard() {
  if (authToken) {
    fetch('/api/admin/logout', { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } }).catch(() => {});
  }
  authToken = '';
  adminDashboard.classList.add('hidden');
  loginPanel.classList.remove('hidden');
  loginForm.reset();
  setActiveSection('overview');
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

toolPills.forEach((pill) => {
  const target = pill.textContent.trim().toLowerCase();
  pill.addEventListener('click', () => setActiveSection(target.includes('relatos') ? 'reports' : target.includes('instituições') ? 'institutions' : 'alerts'));
});

actionCards.forEach((card) => {
  const label = card.textContent.trim().toLowerCase();
  card.addEventListener('click', () => {
    if (label.includes('gerar relatório')) return exportReports();
    setActiveSection(label.includes('alertas') ? 'alerts' : 'reports');
  });
});

navItems.forEach((item) => item.addEventListener('click', () => setActiveSection(item.dataset.target)));
exportButton.addEventListener('click', exportReports);
refreshButton.addEventListener('click', () => loadReports().catch((error) => alert(error.message)));
logoutButton.addEventListener('click', closeDashboard);

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const login = document.getElementById('admin-login').value.trim().toLowerCase();
  const password = document.getElementById('admin-password').value;

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Credenciais inválidas.');
    authToken = data.token;
    await loadReports();
    openDashboard();
  } catch (error) {
    alert(error.message);
  }
});

setActiveSection('overview');
