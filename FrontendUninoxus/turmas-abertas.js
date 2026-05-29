// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8081';

const MATRICULA_ALUNO = 1; // futuramente via autenticação
const ID_CURSO = 1;        // substituir por perfilAluno.idCurso quando disponível

// ─── FETCHES ──────────────────────────────────────────────────────────────────
async function fetchPerfilAluno(matriculaAluno) {
    const r = await fetch(`${API_BASE}/alunos/${matriculaAluno}`);
    if (!r.ok) throw new Error('Erro ao buscar perfil.');
    return r.json();
}

// GET /turmas/{idCurso}  →  List<TurmaResponseDTO>
async function fetchTurmasAbertas(idCurso) {
    const r = await fetch(`${API_BASE}/turmas/${idCurso}`);
    if (!r.ok) throw new Error('Erro ao buscar turmas abertas.');
    return r.json();
}

// POST /matriculas  body: { matriculaAluno, idTurma }  →  MatriculaResponseDTO
async function postMatricula(idTurma) {
    const r = await fetch(`${API_BASE}/matriculas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matriculaAluno: MATRICULA_ALUNO, idTurma })
    });

    if (!r.ok) {
        let msg = 'Não foi possível realizar a matrícula.';
        try {
            const err = await r.json();
            msg = err.message ?? err.erro ?? err.detail ?? msg;
        } catch (_) {}
        throw new Error(msg);
    }

    return r.json();
}

// ─── RENDER HEADER ────────────────────────────────────────────────────────────
function renderHeader(data) {
    document.getElementById('aluno-nome').textContent = data.nomePessoa;
    document.getElementById('aluno-curso').textContent = `Curso: ${data.nomeCurso}`;
    document.getElementById('titulo-secao').textContent =
        `Turmas Abertas ${data.nomeCurso ?? ''}`;
}

// ─── RENDER TURMAS ────────────────────────────────────────────────────────────
function renderTurmas(turmas) {
    const grid = document.getElementById('turmasGrid');
    grid.innerHTML = '';

    if (!turmas || turmas.length === 0) {
        grid.innerHTML = `<p class="sem-turmas">Nenhuma turma disponível no momento.</p>`;
        return;
    }

    turmas.forEach((turma, index) => {
        grid.appendChild(criarCard(turma, index));
    });
}

// ─── CRIAR CARD ───────────────────────────────────────────────────────────────
function criarCard(turma, index) {
    const card = document.createElement('div');
    card.classList.add('turma-card');
    card.style.animationDelay = `${index * 0.07}s`;

    const semVagas = turma.vagas <= 0;
    const dias = formatarDias(turma.diasSemana);
    const nome = turma.nomeDisicplina ?? '—';

    card.innerHTML = `
        <div class="card-disciplina">DISCIPLINA · ${nome}</div>
        <p class="card-info">STATUS: <span>${turma.status ?? 'ABERTA'}</span></p>
        <p class="card-info">VAGAS: <span>${semVagas ? 'SEM VAGAS' : turma.vagas}</span></p>
        <p class="card-info">TURNO: <span>${turma.turno ?? '—'}</span></p>
        <p class="card-info">HORARIO INICIO: <span>${turma.horarioInicio}</span></p>
        <p class="card-info">HORARIO FINAL: <span>${turma.horarioFinal}</span></p>
        <p class="card-info">DIAS DA SEMANA: <span>${dias}</span></p>
        <button
            class="btn-matricular"
            id="btn-${index}"
            ${semVagas ? 'disabled' : ''}
            onclick="matricular(${turma.idTurma}, ${index})"  >${semVagas ? 'SEM VAGAS' : 'SOLICITAR MATRICULAR'}</button>
        <div class="feedback" id="feedback-${index}"></div>
    `;

    return card;
}

// ─── AÇÃO MATRICULAR ──────────────────────────────────────────────────────────
async function matricular(idTurma, index) {
    const btn      = document.getElementById(`btn-${index}`);
    const feedback = document.getElementById(`feedback-${index}`);

    btn.disabled    = true;
    btn.textContent = 'AGUARDE...';
    feedback.className = 'feedback';
    feedback.textContent = '';

    try {
        await postMatricula(idTurma);

        // ✅ Sucesso
        feedback.className   = 'feedback sucesso';
        feedback.textContent = '✓ Matrícula solicitada com sucesso!';
        btn.textContent      = 'MATRICULA SOLICITADA ✓';

    } catch (erro) {
        // ❌ Erro (sem vagas, já matriculado, etc.)
        feedback.className   = 'feedback erro';
        feedback.textContent = erro.message;

        const definitivo = /vagas|matriculado|encerrada/i.test(erro.message);
        if (definitivo) {
            btn.textContent = 'NÃO DISPONÍVEL';
        } else {
            btn.disabled    = false;
            btn.textContent = 'SOLICITAR MATRICULAR';
        }
    }
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function formatarDias(dias) {
    if (!dias || dias.length === 0) return '—';
    const map = {
        SEGUNDA:'SEG', TERCA:'TER', QUARTA:'QUA',
        QUINTA:'QUI', SEXTA:'SEX', SABADO:'SAB', DOMINGO:'DOM'
    };
    return dias.map(d => map[d] ?? d).join('/');
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
    const [perfil, turmas] = await Promise.allSettled([
        fetchPerfilAluno(MATRICULA_ALUNO),
        fetchTurmasAbertas(ID_CURSO)
    ]);

    if (perfil.status === 'fulfilled') {
        renderHeader(perfil.value);
    } else {
        console.warn('Falha no perfil:', perfil.reason);
        document.getElementById('aluno-nome').textContent = 'Erro ao carregar perfil';
        document.getElementById('aluno-curso').textContent = 'Verifique o AlunoController';
    }

    if (turmas.status === 'fulfilled') {
        renderTurmas(turmas.value);
    } else {
        console.warn('Falha nas turmas:', turmas.reason);
        document.getElementById('turmasGrid').innerHTML =
            `<p class="sem-turmas" style="color:#c62828;">
                Não foi possível carregar as turmas. Tente novamente mais tarde.
             </p>`;
    }
}

document.addEventListener('DOMContentLoaded', init);
