const screens = document.querySelectorAll('.screen');
const reportForm = document.getElementById('report-form');
const consultForm = document.getElementById('consult-form');
const trackingCodeElement = document.getElementById('tracking-code');
const consultResult = document.getElementById('consult-result');
const consultCodeInput = document.getElementById('consult-code');
const supportTimeGrid = document.getElementById('support-time-grid');
const selectedTimeLabel = document.getElementById('selected-time-label');
const confirmSupportButton = document.getElementById('confirm-support');
const confirmedSupportTime = document.getElementById('confirmed-support-time');

let selectedSupportTime = '';

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

  const formData = new FormData(reportForm);
  const response = await fetch('/api/reports', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    showError(error?.message || 'Erro ao enviar denúncia.');
    return;
  }

  const data = await response.json();
  reportForm.reset();
  trackingCodeElement.textContent = data.code;
  showScreen('success-screen');
}

async function handleConsultSubmit(event) {
  event.preventDefault();

  const code = consultCodeInput.value.trim().toUpperCase();
  if (!code) {
    consultResult.classList.remove('hidden');
    consultResult.textContent = 'Informe um código válido para consultar o status.';
    return;
  }

  const response = await fetch(`/api/reports/${code}`);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    consultResult.classList.remove('hidden');
    consultResult.innerHTML = `<p class="text-sm text-slate-500">${error?.message || 'Código não encontrado.'}</p>`;
    return;
  }

  const report = await response.json();
  consultResult.classList.remove('hidden');
  consultResult.innerHTML = `
    <p class="text-sm text-slate-500">Código encontrado:</p>
    <p class="mt-2 text-lg font-semibold text-slate-900">${report.code}</p>
    <p class="mt-4 text-sm text-slate-600">Status atual:</p>
    <p class="mt-2 rounded-3xl bg-white p-4 text-base font-semibold text-slate-900">${report.status}</p>
    <p class="mt-3 text-xs text-slate-500">Última atualização: ${new Date(report.created_at).toLocaleDateString('pt-BR')}</p>
  `;
}

function selectSupportTime(event) {
  const button = event.target.closest('.support-time-btn');
  if (!button) return;

  selectedSupportTime = button.dataset.time;
  selectedTimeLabel.textContent = `Horário selecionado: ${selectedSupportTime}`;

  document.querySelectorAll('.support-time-btn').forEach((item) => {
    item.classList.remove('border-blue-500', 'bg-blue-50', 'text-blue-800');
    item.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-700');
  });

  button.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-700');
  button.classList.add('border-blue-500', 'bg-blue-50', 'text-blue-800');
}

async function handleSupportConfirm() {
  if (!selectedSupportTime) {
    showError('Selecione um horário antes de confirmar.');
    return;
  }

  const response = await fetch('/api/supports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ time: selectedSupportTime }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    showError(error?.message || 'Erro ao agendar apoio psicológico.');
    return;
  }

  const schedule = await response.json();
  confirmedSupportTime.textContent = schedule.time;
  showScreen('support-success-screen');
}

function bindEvents() {
  document.getElementById('navigate-form').addEventListener('click', () => showScreen('form-screen'));
  document.getElementById('navigate-support').addEventListener('click', () => showScreen('support-screen'));
  document.getElementById('navigate-consult').addEventListener('click', () => showScreen('consult-screen'));
  document.getElementById('back-home-from-form').addEventListener('click', () => showScreen('home-screen'));
  document.getElementById('back-home-from-support').addEventListener('click', () => {
    selectedSupportTime = '';
    document.querySelectorAll('.support-time-btn').forEach((item) => {
      item.classList.remove('border-blue-500', 'bg-blue-50', 'text-blue-800');
      item.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-700');
    });
    selectedTimeLabel.textContent = 'Nenhum horário selecionado';
    showScreen('home-screen');
  });
  document.getElementById('back-home-from-success').addEventListener('click', () => showScreen('home-screen'));
  document.getElementById('back-home-from-support-success').addEventListener('click', () => showScreen('home-screen'));
  document.getElementById('consult-from-success').addEventListener('click', () => showScreen('consult-screen'));
  document.getElementById('consult-from-support-success').addEventListener('click', () => showScreen('consult-screen'));
  supportTimeGrid.addEventListener('click', selectSupportTime);
  confirmSupportButton.addEventListener('click', handleSupportConfirm);
  reportForm.addEventListener('submit', handleFormSubmit);
  consultForm.addEventListener('submit', handleConsultSubmit);
}

window.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  showScreen('home-screen');
});
