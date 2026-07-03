// Tela "Peso" — convertida para painel só-leitura (decisão do usuário,
// 2026-07-03): a edição de peso por disciplina × concurso passou a viver
// exclusivamente no atalho inline em Nova Sessão, para não duplicar o mesmo
// formulário em duas telas. Esta tela lista o que já foi definido, cruzado
// com Wilson/classificação (v_prioridade, Fase 5/6) — sem formulário próprio.
// Remover continua disponível aqui como única ação (não é edição de valor).

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listWeightSummary } from "../services/weightService.js";

export async function renderWeightPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/pesos")}
        <main class="app-content">
          <h2 class="form-title">Peso por Disciplina × Concurso</h2>
          <p style="color:var(--color-text-muted); max-width:640px;">
            Painel de consulta. Para definir ou alterar um peso, use o atalho inline em
            <strong>Nova Sessão</strong> — evita ter o mesmo formulário duplicado em duas telas.
            Aqui o peso já aparece cruzado com o Diagnóstico Wilson e a classificação de Prioridade
            por disciplina (NEG-007).
          </p>
          <div id="alert-box"></div>
          <div id="weights-table"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const alertBox = container.querySelector("#alert-box");
  const tableBox = container.querySelector("#weights-table");

  await refreshTable();

  async function refreshTable() {
    let rows = [];
    try {
      rows = await listWeightSummary();
    } catch (err) {
      tableBox.innerHTML = `<div class="alert alert--error">Erro ao carregar pesos: ${escapeHtml(err.message)}</div>`;
      return;
    }

    if (rows.length === 0) {
      tableBox.innerHTML = `
        <div class="card">
          <p style="color:var(--color-text-muted);">
            Nenhum peso definido ainda. Defina pelo atalho inline em Nova Sessão.
          </p>
        </div>
      `;
      return;
    }

    const trs = rows
      .map((r) => {
        const wilsonText = r.wilson_pct != null ? `${Number(r.wilson_pct).toFixed(1)}%` : "—";
        return `
          <tr>
            <td>${escapeHtml(r.concurso_nome || "—")}</td>
            <td>${escapeHtml(r.disciplina_nome || "—")}</td>
            <td>${escapeHtml(r.weight || "—")}</td>
            <td>${r.target_accuracy != null ? Number(r.target_accuracy).toFixed(2) + "%" : "—"}</td>
            <td>${r.expected_questions ?? "—"}</td>
            <td>${wilsonText}</td>
            <td>${escapeHtml(r.classificacao || "—")}</td>
            <td><button class="btn-link" data-exam="${r.exam_id}" data-discipline="${r.discipline_id}" data-action="remove">Remover</button></td>
          </tr>
        `;
      })
      .join("");

    tableBox.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0;">Pesos definidos (${rows.length})</h3>
        <table class="data-table">
          <tr>
            <th>Concurso</th><th>Disciplina</th><th>Peso</th><th>Meta %</th>
            <th>Questões esp.</th><th>Wilson</th><th>Classificação</th><th></th>
          </tr>
          ${trs}
        </table>
      </div>
    `;

    tableBox.querySelectorAll('[data-action="remove"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          // v_prioridade não expõe o id de exam_disciplines diretamente; a
          // remoção usa exam_id+discipline_id via RPC-like delete no service.
          await deleteWeightByPair(btn.dataset.exam, btn.dataset.discipline);
          await refreshTable();
        } catch (err) {
          alertBox.innerHTML = `<div class="alert alert--error">Erro ao remover: ${escapeHtml(err.message)}</div>`;
        }
      });
    });
  }

  async function deleteWeightByPair(examId, disciplineId) {
    const { supabase } = await import("../supabaseClient.js");
    const { error } = await supabase
      .from("exam_disciplines")
      .delete()
      .eq("exam_id", examId)
      .eq("discipline_id", disciplineId);
    if (error) throw error;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
