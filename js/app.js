const screens = document.querySelectorAll('.screen');
const reportForm = document.getElementById('report-form');
const consultForm = document.getElementById('consult-form');
const trackingCodeElement = document.getElementById('tracking-code');
const consultResult = document.getElementById('consult-result');
const consultCodeInput = document.getElementById('consult-code');
const API_BASE_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  && window.location.port !== '3000'
  ? 'http://localhost:3000'
  : '';

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function showScreen(screenId) {
  screens.forEach((screen) => screen.classList.add('hidden'));
  if (consultResult) {
    consultResult.classList.add('hidden');
  }

  const active = document.getElementById(screenId);
  if (active) {
    active.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function showError(message) {
  alert(message);
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const school = document.getElementById('school').value;
  const incident = document.getElementById('incident').value;
  const description = document.getElementById('description').value.trim();

  if (!school || !incident || description.length < 20) {
    showError('Por favor, preencha os campos obrigatórios corretamente.');
    return;
  }

  try {
    const formData = new FormData(reportForm);
    const response = await fetch(apiUrl('/api/reports'), {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      showError(data?.message || 'Não foi possível enviar a denúncia. Tente novamente.');
      return;
    }

    reportForm.reset();
    trackingCodeElement.textContent = data.code;
    showScreen('success-screen');
  } catch (error) {
    showError('Não foi possível conectar ao servidor. Verifique se o sistema está online e tente novamente.');
  }
}

async function handleConsultSubmit(event) {
  event.preventDefault();

  const code = consultCodeInput.value.trim().toUpperCase();
  if (!code) {
    consultResult.classList.remove('hidden');
    consultResult.innerHTML = '<p>Informe um código válido para consultar o status.</p>';
    return;
  }

  try {
    const response = await fetch(apiUrl(`/api/reports/${code}`));
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      consultResult.classList.remove('hidden');
      consultResult.innerHTML = `<p>${data?.message || 'Código não encontrado.'}</p>`;
      return;
    }

    if (!data) throw new Error('Resposta inválida do servidor.');
    renderConsultResult(data);
  } catch (error) {
    consultResult.classList.remove('hidden');
    consultResult.innerHTML = '<p>Não foi possível conectar ao servidor. Inicie o projeto com <strong>npm start</strong> e tente novamente.</p>';
  }
}

function renderConsultResult(report) {
  const statusMap = {
    Recebida: { label: 'Recebida', tone: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8' },
    'Em análise': { label: 'Em análise', tone: 'rgba(245, 158, 11, 0.14)', color: '#b45309' },
    Resolvida: { label: 'Resolvida', tone: 'rgba(16, 185, 129, 0.14)', color: '#047857' },
    Arquivada: { label: 'Arquivada', tone: 'rgba(107, 114, 128, 0.14)', color: '#374151' },
  };

  const statusInfo = statusMap[report.status] || {
    label: report.status || 'Status não informado',
    tone: 'rgba(15, 23, 42, 0.08)',
    color: '#0f172a',
  };

  consultResult.classList.remove('hidden');
  consultResult.innerHTML = `
    <p><strong>Código:</strong> ${report.code}</p>
    <p style="margin-top: 10px;"><strong>Escola:</strong> ${report.school || 'Não informada'}</p>
    <div style="margin-top: 14px; border-radius: 16px; padding: 12px 14px; background: ${statusInfo.tone}; color: ${statusInfo.color}; font-weight: 700;">${statusInfo.label}</div>
    <p style="margin-top: 12px;"><strong>Última atualização:</strong> ${new Date(report.created_at).toLocaleDateString('pt-BR')}</p>
  `;
}

function bindEvents() {
  document.getElementById('navigate-form').addEventListener('click', () => showScreen('form-screen'));
  document.getElementById('navigate-consult').addEventListener('click', () => showScreen('consult-screen'));
  document.getElementById('back-home-from-form').addEventListener('click', () => showScreen('home-screen'));
  document.getElementById('back-home-from-consult').addEventListener('click', () => showScreen('home-screen'));
  document.getElementById('back-home-from-success').addEventListener('click', () => showScreen('home-screen'));
  document.getElementById('consult-from-success').addEventListener('click', () => showScreen('consult-screen'));
  reportForm.addEventListener('submit', handleFormSubmit);
  consultForm.addEventListener('submit', handleConsultSubmit);
}

window.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  showScreen('home-screen');
});
