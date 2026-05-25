// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8081';
const MATRICULA_PROFESSOR = 1;

const params   = new URLSearchParams(window.location.search);
const ID_TURMA = params.get('idTurma');

// ─── FETCHES ──────────────────────────────────────────────────────────────────
async function fetchProfessor(id) {
    const r = await fetch(`${API_BASE}/professores/${id}`);
    if (!r.ok) throw new Error('Erro ao buscar perfil do professor.');
    return r.json();
}

async function postAvaliacao(dto) {
    const r = await fetch(`${API_BASE}/avaliacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
    });

    if (!r.ok) {
        let msg = 'Erro ao registrar prova.';
        try {
            const err = await r.json();
            msg = err.message ?? err.erro ?? err.detail ?? msg;
        } catch (_) {}
        throw new Error(msg);
    }

    return r.json();
}

// ─── SALVAR ───────────────────────────────────────────────────────────────────
async function salvar() {
    const descricao = document.getElementById('descricao').value.trim();
    const data      = document.getElementById('data').value;
    const tipo      = document.getElementById('tipo').value;
    const feedback  = document.getElementById('feedback');
    const btn       = document.getElementById('btn-salvar');

    if (!descricao || !data || !tipo) {
        feedback.className   = 'feedback erro';
        feedback.textContent = 'Preencha todos os campos!';
        return;
    }

    if (!ID_TURMA) {
        feedback.className   = 'feedback erro';
        feedback.textContent = 'Turma não identificada. Volte e tente novamente.';
        return;
    }

    btn.disabled    = true;
    btn.textContent = 'SALVANDO...';
    feedback.className   = 'feedback';
    feedback.textContent = '';

    try {
        await postAvaliacao({
            descricaoAvaliacao: descricao,
            data,
            idTurma: Number(ID_TURMA),
            tipoAvaliacao: tipo
        });

        feedback.className   = 'feedback sucesso';
        feedback.textContent = '✓ Prova registrada com sucesso!';
        btn.textContent      = 'REGISTRAR PROVA';
        btn.disabled         = false;

        document.getElementById('descricao').value = '';
        document.getElementById('data').value      = '';
        document.getElementById('tipo').value      = '';

    } catch (erro) {
        feedback.className   = 'feedback erro';
        feedback.textContent = erro.message;
        btn.textContent      = 'REGISTRAR PROVA';
        btn.disabled         = false;
    }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
    if (!ID_TURMA) {
        document.getElementById('feedback').className   = 'feedback erro';
        document.getElementById('feedback').textContent = 'Turma não identificada na URL!';
        document.getElementById('btn-salvar').disabled  = true;
    }

    try {
        const professor = await fetchProfessor(MATRICULA_PROFESSOR);
        document.getElementById('professor-nome').textContent = professor.nomePessoa;
        document.getElementById('info-turma').textContent     = `Curso: ${professor.nomeCurso}`;
    } catch (e) {
        console.warn('Erro ao carregar professor:', e);
        document.getElementById('professor-nome').textContent = 'Erro ao carregar perfil';
    }
}

document.addEventListener('DOMContentLoaded', init);