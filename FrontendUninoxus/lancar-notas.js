// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8081';
const MATRICULA_PROFESSOR = 1;

const params       = new URLSearchParams(window.location.search);
const ID_AVALIACAO = params.get('idAvaliacao');
const ID_TURMA     = params.get('idTurma');

// ─── FETCHES ──────────────────────────────────────────────────────────────────
async function fetchProfessor(id) {
    const r = await fetch(`${API_BASE}/professores/${id}`);
    if (!r.ok) throw new Error('Erro ao buscar perfil do professor.');
    return r.json();
}

async function fetchAlunosTurma(idTurma) {
    const r = await fetch(`${API_BASE}/alunos/${idTurma}/alunosturma`);
    if (!r.ok) throw new Error('Erro ao buscar alunos da turma.');
    return r.json();
}

async function postNota(idMatricula, nota) {
    const r = await fetch(`${API_BASE}/notas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            idMatricula,
            idAvaliacao: Number(ID_AVALIACAO),
            nota
        })
    });

    if (!r.ok) {
        let msg = 'Erro ao lançar nota.';
        try {
            const err = await r.json();
            msg = err.message ?? err.erro ?? err.detail ?? msg;
        } catch (_) {}
        throw new Error(msg);
    }

    return r.json();
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function renderAlunos(alunos) {
    const tbody = document.getElementById('alunos-tbody');
    tbody.innerHTML = '';

    if (!alunos || alunos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="state-msg">Nenhum aluno matriculado.</td></tr>';
        return;
    }

    alunos.forEach(function(aluno, index) {
        const tr = document.createElement('tr');

        const tdMatricula = document.createElement('td');
        tdMatricula.textContent = aluno.idMatricula;

        const tdNome = document.createElement('td');
        tdNome.textContent = aluno.nomePessoa;

        const tdNota = document.createElement('td');
        const input = document.createElement('input');
        input.className   = 'input-nota';
        input.id          = 'nota-' + index;
        input.type        = 'number';
        input.min         = '0';
        input.max         = '10';
        input.step        = '0.1';
        input.placeholder = '0.0';
        tdNota.appendChild(input);

        const tdAcao = document.createElement('td');
        const btn = document.createElement('button');
        btn.className   = 'btn-lancar';
        btn.id          = 'btn-' + index;
        btn.textContent = 'LANÇAR';
        btn.onclick     = function() { lancarNota(aluno.idMatricula, index); };

        const feedback = document.createElement('span');
        feedback.className = 'feedback-inline';
        feedback.id        = 'feedback-' + index;

        tdAcao.appendChild(btn);
        tdAcao.appendChild(feedback);

        tr.appendChild(tdMatricula);
        tr.appendChild(tdNome);
        tr.appendChild(tdNota);
        tr.appendChild(tdAcao);

        tbody.appendChild(tr);
    });
}

// ─── AÇÃO LANÇAR NOTA ─────────────────────────────────────────────────────────
async function lancarNota(idMatricula, index) {
    const input    = document.getElementById('nota-' + index);
    const btn      = document.getElementById('btn-' + index);
    const feedback = document.getElementById('feedback-' + index);

    const nota = parseFloat(input.value);

    if (isNaN(nota) || nota < 0 || nota > 10) {
        feedback.className   = 'feedback-inline erro';
        feedback.textContent = 'Nota inválida!';
        return;
    }

    btn.disabled    = true;
    btn.textContent = '...';
    feedback.className   = 'feedback-inline';
    feedback.textContent = '';

    try {
        await postNota(idMatricula, nota);

        feedback.className   = 'feedback-inline sucesso';
        feedback.textContent = '✓ Lançada!';
        btn.textContent      = 'ATUALIZAR';
        btn.disabled         = false;

    } catch (erro) {
        feedback.className   = 'feedback-inline erro';
        feedback.textContent = erro.message;
        btn.textContent      = 'LANÇAR';
        btn.disabled         = false;
    }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
    if (!ID_AVALIACAO || !ID_TURMA) {
        document.getElementById('alunos-tbody').innerHTML =
            '<tr><td colspan="4" class="state-msg error-msg">Parâmetros inválidos na URL.</td></tr>';
        return;
    }

    const [professor, alunos] = await Promise.allSettled([
        fetchProfessor(MATRICULA_PROFESSOR),
        fetchAlunosTurma(ID_TURMA)
    ]);

    if (professor.status === 'fulfilled') {
        document.getElementById('prof-nome').textContent      = professor.value.nomePessoa;
        document.getElementById('info-avaliacao').textContent = 'Curso: ' + professor.value.nomeCurso;
    } else {
        console.warn('Erro ao carregar professor:', professor.reason);
        document.getElementById('prof-nome').textContent = 'Erro ao carregar perfil';
    }

    if (alunos.status === 'fulfilled') {
        renderAlunos(alunos.value);
    } else {
        console.warn('Erro:', alunos.reason);
        document.getElementById('alunos-tbody').innerHTML =
            '<tr><td colspan="4" class="state-msg error-msg">Não foi possível carregar os alunos.</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', init);