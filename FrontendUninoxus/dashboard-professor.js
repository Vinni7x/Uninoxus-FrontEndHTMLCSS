// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8081';
const MATRICULA_PROFESSOR = 1;

// ─── FETCHES ──────────────────────────────────────────────────────────────────
async function fetchProfessor(id) {
  const r = await fetch(`${API_BASE}/professores/${id}`);
  if (!r.ok) throw new Error('Erro ao buscar perfil do professor.');
  return r.json();
}

async function fetchTurmas(id) {
  const r = await fetch(`${API_BASE}/turmas/${id}/turmasministradas`);
  if (!r.ok) throw new Error('Erro ao buscar turmas.');
  return r.json();
}

async function fetchProvas(id) {
  const r = await fetch(`${API_BASE}/avaliacoes/${id}/provasProfessor`);
  if (!r.ok) throw new Error('Erro ao buscar provas.');
  return r.json();
}

// ─── RENDER HEADER ────────────────────────────────────────────────────────────
function renderHeader(data) {
  document.getElementById('professor-nome').textContent = data.nomePessoa;
  document.getElementById('professor-curso').textContent = `Curso: ${data.nomeCurso}`;
}

// ─── RENDER TURMAS ────────────────────────────────────────────────────────────
function renderTurmas(turmas) {
  const tbody = document.getElementById('turmas-tbody');
  tbody.innerHTML = '';

  if (!turmas || turmas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="state-msg">Nenhuma turma encontrada.</td></tr>`;
    return;
  }

  turmas.forEach(t => {
    const consolidada = t.statusTurma === 'CONSOLIDADA';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.nomeDisciplina ?? '—'}</td>
      <td>${t.local ?? '—'}</td>
      <td>${t.horarioInicio} - ${t.horarioFinal}</td>
      <td><span class="dias-tag">${formatarDias(t.diasSemana)}</span></td>
      <td>
        <button
          class="btn-acao ${consolidada ? 'btn-cancelada' : 'btn-consolidar'}"
          ${consolidada ? 'disabled' : `onclick="consolidarTurma(${t.idTurma}, this)"`}>
          ${consolidada ? 'Consolidada ✓' : 'Consolidar Turma'}
        </button>
      </td>
      <td>
        <button
          class="btn-acao btn-registrar"
          onclick="window.location.href='registrar-prova.html?idTurma=${t.idTurma}'">
          Registrar Provas
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
    tbody.innerHTML = `<tr><td colspan="5" class="state-msg">Nenhuma prova cadastrada.</td></tr>`;
    return;
  }

  provas.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatarData(p.data)}</td>
      <td>${p.nomeDisciplina ?? '—'}</td>
      <td>${p.descricaoAvaliacao ?? '—'}</td>
      <td><span class="prova-tag">${formatarTipoAvaliacao(p.tipoAvaliacao)}</span></td>
      <td class="acoes-col">
        <button class="btn-acao btn-finalizar">
          Finalizar Prova
        </button>
        <button class="btn-acao btn-lancar-nota">
          Lançar Notas
        </button>
      </td>
    `;
    
    // ✅ Adicionar listener ao botão de finalizar prova
    tr.querySelector('.btn-finalizar').addEventListener('click', () => {
      finalizarProva(p.idAvaliacao);
    });
    
    // Adicionar event listener ao botão de lançar notas
    tr.querySelector('.btn-lancar-nota').addEventListener('click', () => {
      window.location.href = `lancar-notas.html?idAvaliacao=${p.idAvaliacao}&idTurma=${p.idTurma}`;
    });
    
    tbody.appendChild(tr);
  });  
}

// ─── CONSOLIDAR TURMA ─────────────────────────────────────────────────────────
async function consolidarTurma(idTurma, btn) {
  if (!confirm('Deseja consolidar esta turma? Esta ação não pode ser desfeita.')) return;

  btn.disabled = true;
  btn.textContent = 'Consolidando...';

  try {
    const r = await fetch(`${API_BASE}/turmas/${idTurma}/consolidar`, { method: 'PUT' });
    if (!r.ok) {
      let msg = 'Não foi possível consolidar a turma.';
      try { const err = await r.json(); msg = err.message ?? msg; } catch (_) {}
      throw new Error(msg);
    }

    btn.textContent = 'Consolidada ✓';
    btn.classList.remove('btn-consolidar');
    btn.classList.add('btn-cancelada');
  } catch (e) {
    alert(e.message);
    btn.disabled = false;
    btn.textContent = 'Consolidar Turma';
  }
}

// ─── FINALIZAR PROVA ──────────────────────────────────────────────────────────
async function finalizarProva(idAvaliacao) {
  if (!confirm('Deseja finalizar esta prova? Esta ação não pode ser desfeita.')) return;

  try {
    const r = await fetch(`${API_BASE}/avaliacoes/${idAvaliacao}/finalizar`, { 
      method: 'PATCH' 
    });
    
    if (!r.ok) throw new Error('Erro ao finalizar prova.');

    alert('Prova finalizada com sucesso!');
    location.reload();
  } catch (e) {
    alert(e.message);
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
  const [professor, turmas, provas] = await Promise.allSettled([
    fetchProfessor(MATRICULA_PROFESSOR),
    fetchTurmas(MATRICULA_PROFESSOR),
    fetchProvas(MATRICULA_PROFESSOR)
  ]);

  if (professor.status === 'fulfilled') renderHeader(professor.value);
  else { console.warn(professor.reason); document.getElementById('professor-nome').textContent = 'Erro ao carregar perfil'; }

  if (turmas.status === 'fulfilled') renderTurmas(turmas.value);
  else { console.warn(turmas.reason); document.getElementById('turmas-tbody').innerHTML = `<tr><td colspan="6" class="state-msg error-msg">Erro ao carregar turmas.</td></tr>`; }

  if (provas.status === 'fulfilled') renderProvas(provas.value);
  else { console.warn(provas.reason); document.getElementById('provas-tbody').innerHTML = `<tr><td colspan="5" class="state-msg error-msg">Erro ao carregar provas.</td></tr>`; }
}

document.addEventListener('DOMContentLoaded', init);