// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8081';
const MATRICULA_ALUNO = 1;

// ─── FETCHES ──────────────────────────────────────────────────────────────────
async function fetchAluno(id) {
  const r = await fetch(`${API_BASE}/alunos/${id}`);
  if (!r.ok) throw new Error('Erro ao buscar perfil do aluno.');
  return r.json();
}

async function fetchTurmas(id) {
  const r = await fetch(`${API_BASE}/turmas/${id}/turmasmatricula`);
  if (!r.ok) throw new Error('Erro ao buscar turmas.');
  return r.json();
}

async function fetchProvas(id) {
  const r = await fetch(`${API_BASE}/avaliacoes/${id}/provas`);
  if (!r.ok) throw new Error('Erro ao buscar provas.');
  return r.json();
}

// ─── RENDER HEADER ────────────────────────────────────────────────────────────
function renderHeader(data) {
  document.getElementById('aluno-nome').textContent = data.nomePessoa;
  document.getElementById('aluno-curso').textContent = `Curso: ${data.nomeCurso}`;
  document.getElementById('aluno-cr').textContent = `CR: ${data.rendimentoAcademico?.toFixed(3) ?? '—'}`;
}

// ─── RENDER TURMAS ────────────────────────────────────────────────────────────
function renderTurmas(turmas) {
  const tbody = document.getElementById('turmas-tbody');
  tbody.innerHTML = '';

  if (!turmas || turmas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="state-msg">Nenhuma turma matriculada.</td></tr>`;
    return;
  }

  turmas.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.nomeDisciplina ?? '—'}</td>
      <td>${t.local ?? '—'}</td>
      <td>${t.horarioInicio} - ${t.horarioFinal}</td>
      <td><span class="dias-tag">${formatarDias(t.diasSemana)}</span></td>
      <td>
        <button class="btn-acao btn-cancelar" onclick="cancelarMatricula(${t.idMatricula}, this)">
          Cancelar Matrícula
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── RENDER PROVAS ────────────────────────────────────────────────────────────
function renderProvas(provas) {
  const tbody = document.getElementById('provas-tbody');
  tbody.innerHTML = '';

  if (!provas || provas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="state-msg">Nenhuma prova cadastrada.</td></tr>`;
    return;
  }

  provas.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatarData(p.data)}</td>
      <td>${p.nomeDisciplina ?? '—'}</td>
      <td>${p.descricaoAvaliacao ?? '—'}</td>
      <td><span class="prova-tag">${formatarTipoAvaliacao(p.tipoAvaliacao)}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── CANCELAR MATRÍCULA ───────────────────────────────────────────────────────
async function cancelarMatricula(idMatricula, btn) {
  if (!confirm('Deseja cancelar esta matrícula?')) return;

  btn.disabled = true;
  btn.textContent = 'Cancelando...';

  try {
    const r = await fetch(`${API_BASE}/matriculas/${idMatricula}/cancelar`, { method: 'POST' });
    if (!r.ok) {
  let msg = 'Não foi possível cancelar a matrícula.';
  try {
    const err = await r.json();
    msg = err.message ?? err ?? msg;
  } catch (_) {}
  throw new Error(msg);
}

    btn.textContent = 'Cancelada ✓';
    btn.classList.remove('btn-cancelar');
    btn.classList.add('btn-cancelada');
  } catch (e) {
    alert(e.message);
    btn.disabled = false;
    btn.textContent = 'Cancelar Matrícula';
  }
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function formatarDias(dias) {
  if (!dias || dias.length === 0) return '—';
  const map = { SEGUNDA:'SEG', TERCA:'TER', QUARTA:'QUA', QUINTA:'QUI', SEXTA:'SEX', SABADO:'SAB', DOMINGO:'DOM' };
  return dias.map(d => map[d] ?? d).join('/');
}

function formatarData(dataStr) {
  if (!dataStr) return '—';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarTipoAvaliacao(tipo) {
  const labels = { AV1:'1ª PROVA', AV2:'2ª PROVA', AV3:'3ª PROVA', REPOSICAO:'REPOSIÇÃO', FINAL:'FINAL' };
  return labels[tipo] ?? tipo;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  const [aluno, turmas, provas] = await Promise.allSettled([
    fetchAluno(MATRICULA_ALUNO),
    fetchTurmas(MATRICULA_ALUNO),
    fetchProvas(MATRICULA_ALUNO)
  ]);

  if (aluno.status === 'fulfilled') renderHeader(aluno.value);
  else { console.warn(aluno.reason); document.getElementById('aluno-nome').textContent = 'Erro ao carregar perfil'; }

  if (turmas.status === 'fulfilled') renderTurmas(turmas.value);
  else { console.warn(turmas.reason); document.getElementById('turmas-tbody').innerHTML = `<tr><td colspan="5" class="state-msg error-msg">Erro ao carregar turmas.</td></tr>`; }

  if (provas.status === 'fulfilled') renderProvas(provas.value);
  else { console.warn(provas.reason); document.getElementById('provas-tbody').innerHTML = `<tr><td colspan="4" class="state-msg error-msg">Erro ao carregar provas.</td></tr>`; }
}

document.addEventListener('DOMContentLoaded', init);
