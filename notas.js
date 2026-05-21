// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8081';
const MATRICULA_ALUNO = 2; // futuramente via autenticação

// ─── FETCHES ──────────────────────────────────────────────────────────────────
async function fetchPerfilAluno(matriculaAluno) {
  const r = await fetch(`${API_BASE}/alunos/${matriculaAluno}`);
  if (!r.ok) throw new Error('Erro ao buscar perfil.');
  return r.json();
}

async function fetchNotas(matriculaAluno) {
  const r = await fetch(`${API_BASE}/matriculas/${matriculaAluno}/notasmatricula`);
  if (!r.ok) throw new Error('Erro ao buscar notas.');
  return r.json();
}

// ─── RENDER HEADER ────────────────────────────────────────────────────────────
function renderHeader(perfil) {
  document.getElementById('aluno-nome').textContent = perfil.nomePessoa;
  document.getElementById('aluno-curso').textContent = `Curso: ${perfil.nomeCurso}`;
}

// ─── RENDER NOTAS ─────────────────────────────────────────────────────────────
function renderNotas(notas) {
  const grid = document.getElementById('notasGrid');
  grid.innerHTML = '';

  if (!notas || notas.length === 0) {
    grid.innerHTML = `<p class="state-grid">Nenhuma nota encontrada.</p>`;
    return;
  }

  notas.forEach((n, i) => {
    const card = document.createElement('div');
    card.classList.add('nota-card');
    card.style.animationDelay = `${i * 0.07}s`;

    card.innerHTML = `
      <div class="nota-card-header">
        DISCIPLINA · ${n.nomeDisciplina ?? '—'}
      </div>
      <div class="nota-card-body">
        ${linhaNote('Unidade 1', n.av1)}
        ${linhaNote('Unidade 2', n.av2)}
        ${linhaNote('Unidade 3', n.av3)}
        ${linhaNote('Reposição', n.reposicao)}
        ${linhaNote('Final',     n.finalNota)}
        <span class="situacao-badge situacao-${n.situacao ?? 'MATRICULADO'}">
          SITUAÇÃO: ${n.situacao ?? '—'}
        </span>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ─── HELPER ───────────────────────────────────────────────────────────────────
function linhaNote(label, valor) {
  const vazio = valor === null || valor === undefined;
  return `
    <div class="nota-linha">
      <span class="label">${label}:</span>
      <span class="valor ${vazio ? 'vazio' : ''}">${vazio ? '—' : valor}</span>
    </div>
  `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  const [perfil, notas] = await Promise.allSettled([
    fetchPerfilAluno(MATRICULA_ALUNO),
    fetchNotas(MATRICULA_ALUNO)
  ]);

  if (perfil.status === 'fulfilled') {
    renderHeader(perfil.value);
  } else {
    console.warn('Falha no perfil:', perfil.reason);
    document.getElementById('aluno-nome').textContent = 'Erro ao carregar perfil';
  }

  if (notas.status === 'fulfilled') {
    renderNotas(notas.value);
  } else {
    console.warn('Falha nas notas:', notas.reason);
    document.getElementById('notasGrid').innerHTML =
      `<p class="state-grid" style="color:#c62828;">
        Não foi possível carregar as notas. Tente novamente mais tarde.
       </p>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
