// Tela "Configurações" (Fase 7, renomeada 05/07/2026 — antes "Parâmetros") —
// limiares/faixas configuráveis (NEG-005) e matriz de risco pessoal (Situação
// × Peso → ação recomendada, NEG-007/Calibração). Rota continua /parametros
// por estabilidade (só o texto exibido mudou). Os textos de recommended_action
// são escritos pelo próprio usuário — não são inventados aqui (ver Doc. Único,
// pendência de risk_rules vazia na Fase 5).

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { getState } from "../state.js";
import { getAllParams, setParam, listRiskRules, upsertRiskRule, deleteRiskRule } from "../services/parameterService.js";

const LEARNING_LEVELS = ["novo", "critico", "aprendendo", "consolidando", "dominado"];
const WEIGHTS = ["baixo", "alto"];
const RISK_LEVELS = ["muito_baixo", "baixo", "medio", "alto", "muito_alto"];

export async function renderParametersPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/parametros")}
        <main class="app-content">
          <h2 class="form-title">Configurações</h2>
          <div id="alert-box"></div>
          <div id="thresholds-section"><p>Carregando…</p></div>
          <div id="risk-rules-section"><p>Carregando matriz de risco…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const { user } = getState();
  const alertBox = container.querySelector("#alert-box");
  const thresholdsSection = container.querySelector("#thresholds-section");
  const riskSection = container.querySelector("#risk-rules-section");

  let params;
  try {
    params = await getAllParams(user.id);
  } catch (err) {
    thresholdsSection.innerHTML = `<div class="alert alert--error">Erro ao carregar parâmetros: ${escapeHtml(err.message)}</div>`;
    return;
  }

  renderThresholdsForm(params);
  await renderRiskRulesSection();

  function renderThresholdsForm(p) {
    thresholdsSection.innerHTML = `
      <div class="card" style="max-width:640px; margin-bottom:16px;">
        <h3 style="margin-top:0;">Limiares e Janelas</h3>
        <form id="thresholds-form">
          <div class="form-field">
            <label for="th_consolidado">Wilson — Consolidado a partir de (%)</label>
            <input type="number" id="th_consolidado" min="0" max="100" step="0.1" value="${p.wilson_thresholds.consolidado}" />
          </div>
          <div class="form-field">
            <label for="th_atencao">Wilson — Atenção a partir de (%)</label>
            <input type="number" id="th_atencao" min="0" max="100" step="0.1" value="${p.wilson_thresholds.atencao}" />
          </div>
          <div class="form-field">
            <label for="th_min_n_diag">N mínimo — Diagnóstico (questões)</label>
            <input type="number" id="th_min_n_diag" min="1" step="1" value="${p.diagnostico_min_n}" />
          </div>
          <div class="form-field">
            <label for="th_min_n_estab">N mínimo — Estabilidade (sessões)</label>
            <input type="number" id="th_min_n_estab" min="1" step="1" value="${p.estabilidade_min_n}" />
          </div>
          <div class="form-field">
            <label for="th_janela_curta">Janela de Tendência — curta (questões)</label>
            <input type="number" id="th_janela_curta" min="1" step="1" value="${p.janela_tendencia.curta}" />
          </div>
          <div class="form-field">
            <label for="th_janela_longa">Janela de Tendência — longa (questões)</label>
            <input type="number" id="th_janela_longa" min="1" step="1" value="${p.janela_tendencia.longa}" />
          </div>
          <div class="form-field">
            <label for="th_produtividade_janela">Produtividade recente — janela (dias)</label>
            <input type="number" id="th_produtividade_janela" min="1" step="1" value="${p.produtividade_janela_dias}" />
          </div>
          <div class="form-field">
            <label for="th_tendencia_min_questoes">Tendência Semanal — mínimo de questões por semana</label>
            <input type="number" id="th_tendencia_min_questoes" min="1" step="1" value="${p.tendencia_semanal_min_questoes}" />
          </div>
          <div class="form-field">
            <label for="th_meta_horas">Meta semanal — horas de estudo</label>
            <input type="number" id="th_meta_horas" min="0" step="0.5" value="${p.meta_semanal_horas}" />
          </div>
          <div class="form-field">
            <label for="th_meta_questoes">Meta semanal — questões resolvidas</label>
            <input type="number" id="th_meta_questoes" min="0" step="1" value="${p.meta_semanal_questoes}" />
          </div>
          <div class="form-field">
            <label class="form-field-heading">Faixas de Retenção (dias desde o último toque no caderno)</label>
            <div id="retencao-buckets"></div>
            <button type="button" id="add-bucket" class="btn-link">+ adicionar faixa</button>
          </div>
          <button type="submit" class="btn">Salvar parâmetros</button>
        </form>
      </div>
    `;

    renderBuckets(p.retencao_buckets);
    thresholdsSection.querySelector("#add-bucket").addEventListener("click", () => {
      const rows = thresholdsSection.querySelector("#retencao-buckets");
      rows.insertAdjacentHTML("beforeend", bucketRowHtml({ max: "", label: "" }));
      wireBucketRemoval();
    });
    wireBucketRemoval();

    thresholdsSection.querySelector("#thresholds-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      alertBox.innerHTML = "";
      try {
        const buckets = Array.from(thresholdsSection.querySelectorAll(".bucket-row")).map((row) => {
          const maxVal = row.querySelector(".bucket-max").value;
          return { max: maxVal === "" ? null : Number(maxVal), label: row.querySelector(".bucket-label").value };
        });

        await Promise.all([
          setParam({
            userId: user.id,
            key: "wilson_thresholds",
            value: {
              consolidado: Number(thresholdsSection.querySelector("#th_consolidado").value),
              atencao: Number(thresholdsSection.querySelector("#th_atencao").value),
            },
          }),
          setParam({ userId: user.id, key: "diagnostico_min_n", value: Number(thresholdsSection.querySelector("#th_min_n_diag").value) }),
          setParam({ userId: user.id, key: "estabilidade_min_n", value: Number(thresholdsSection.querySelector("#th_min_n_estab").value) }),
          setParam({ userId: user.id, key: "produtividade_janela_dias", value: Number(thresholdsSection.querySelector("#th_produtividade_janela").value) }),
          setParam({ userId: user.id, key: "tendencia_semanal_min_questoes", value: Number(thresholdsSection.querySelector("#th_tendencia_min_questoes").value) }),
          setParam({ userId: user.id, key: "meta_semanal_horas", value: Number(thresholdsSection.querySelector("#th_meta_horas").value) }),
          setParam({ userId: user.id, key: "meta_semanal_questoes", value: Number(thresholdsSection.querySelector("#th_meta_questoes").value) }),
          setParam({
            userId: user.id,
            key: "janela_tendencia",
            value: {
              curta: Number(thresholdsSection.querySelector("#th_janela_curta").value),
              longa: Number(thresholdsSection.querySelector("#th_janela_longa").value),
            },
          }),
          setParam({ userId: user.id, key: "retencao_buckets", value: buckets }),
        ]);
        alertBox.innerHTML = `<div class="alert alert--success">Parâmetros salvos.</div>`;
      } catch (err) {
        alertBox.innerHTML = `<div class="alert alert--error">Erro ao salvar: ${escapeHtml(err.message)}</div>`;
      }
    });
  }

  function renderBuckets(buckets) {
    const rowsBox = thresholdsSection.querySelector("#retencao-buckets");
    rowsBox.innerHTML = buckets.map((b) => bucketRowHtml(b)).join("");
  }

  function bucketRowHtml(b) {
    return `
      <div class="bucket-row" style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
        <input type="number" class="bucket-max" name="bucket_max" aria-label="Até quantos dias" placeholder="Até quantos dias (vazio = sem teto)" min="0" step="1" value="${b.max ?? ""}" style="flex:1;" />
        <input type="text" class="bucket-label" name="bucket_label" aria-label="Rótulo da faixa" placeholder="Rótulo" value="${escapeHtml(b.label || "")}" style="flex:1;" />
        <button type="button" class="btn-link remove-bucket">Remover</button>
      </div>
    `;
  }

  function wireBucketRemoval() {
    thresholdsSection.querySelectorAll(".remove-bucket").forEach((btn) => {
      btn.onclick = () => btn.closest(".bucket-row").remove();
    });
  }

  async function renderRiskRulesSection() {
    let rules;
    try {
      rules = await listRiskRules();
    } catch (err) {
      riskSection.innerHTML = `<div class="alert alert--error">Erro ao carregar matriz de risco: ${escapeHtml(err.message)}</div>`;
      return;
    }

    riskSection.innerHTML = `
      <div class="card" style="max-width:720px; margin-bottom:16px;">
        <h3 style="margin-top:0;">Matriz de Risco (Situação × Peso)</h3>
        <p style="color:var(--color-text-muted);">Alimenta a Calibração de Confiança. Texto de ação recomendada é seu — escreva como preferir.</p>
        <form id="risk-rule-form" style="margin-bottom:16px;">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <select id="rr_learning_level" aria-label="Situação">${LEARNING_LEVELS.map((l) => `<option value="${l}">${l}</option>`).join("")}</select>
            <select id="rr_weight" aria-label="Peso">${WEIGHTS.map((w) => `<option value="${w}">${w}</option>`).join("")}</select>
            <select id="rr_risk" aria-label="Risco">${RISK_LEVELS.map((r) => `<option value="${r}">${r}</option>`).join("")}</select>
          </div>
          <div class="form-field" style="margin-top:8px;">
            <input type="text" id="rr_action" aria-label="Ação recomendada" placeholder="Ação recomendada" style="width:100%; padding:8px; border:1px solid var(--color-border); border-radius:var(--radius);" />
          </div>
          <button type="submit" class="btn" style="width:auto; padding:8px 16px;">Salvar regra</button>
        </form>
        <div style="overflow-x:auto;">
          <table class="data-table">
            <tr><th>Situação</th><th>Peso</th><th>Risco</th><th>Ação recomendada</th><th></th></tr>
            ${rules
              .map(
                (r) => `
              <tr>
                <td>${escapeHtml(r.learning_level)}</td>
                <td>${escapeHtml(r.weight)}</td>
                <td>${escapeHtml(r.risk)}</td>
                <td>${escapeHtml(r.recommended_action)}</td>
                <td><button class="btn-link" data-id="${r.id}" data-action="remove-rule">Remover</button></td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>
      </div>
    `;

    riskSection.querySelector("#risk-rule-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      alertBox.innerHTML = "";
      try {
        await upsertRiskRule({
          userId: user.id,
          learningLevel: riskSection.querySelector("#rr_learning_level").value,
          weight: riskSection.querySelector("#rr_weight").value,
          risk: riskSection.querySelector("#rr_risk").value,
          recommendedAction: riskSection.querySelector("#rr_action").value,
        });
        alertBox.innerHTML = `<div class="alert alert--success">Regra salva.</div>`;
        await renderRiskRulesSection();
      } catch (err) {
        alertBox.innerHTML = `<div class="alert alert--error">Erro ao salvar regra: ${escapeHtml(err.message)}</div>`;
      }
    });

    riskSection.querySelectorAll('[data-action="remove-rule"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await deleteRiskRule(btn.dataset.id);
          await renderRiskRulesSection();
        } catch (err) {
          alertBox.innerHTML = `<div class="alert alert--error">Erro ao remover: ${escapeHtml(err.message)}</div>`;
        }
      });
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
