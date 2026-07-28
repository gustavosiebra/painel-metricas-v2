// Tela "Simulados" (27/07/2026) — Modelos de Prova reutilizáveis + registro
// de tentativas (simulado × prova oficial). Racional discutido antes de
// construir: todo edital de objetiva vira "lista de blocos (questões, peso,
// mínimo habilitatório opcional)"; modelo fixo torna tentativas comparáveis
// entre si; granularidade por disciplina (opção A escolhida pelo usuário)
// habilita cruzar com a prática. Métricas: nota ponderada, habilitação
// simulada (por bloco e total, + nota de corte), pontos recuperáveis
// ponderados (max − nota por bloco: onde cada acerto adicional vale mais) e
// evolução por modelo (gráfico quando há 2+ tentativas do mesmo modelo).

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listDisciplines, listExamBoards } from "../services/catalogService.js";
import {
  listTemplates,
  listTemplateBlocks,
  listAttempts,
  listAttemptBlocks,
  createTemplate,
  setTemplateStatus,
  updateTemplateCutoff,
  createAttempt,
  deleteAttempt,
} from "../services/simuladoService.js";
import { getState } from "../state.js";
import { formatPct } from "../utils/format.js";

let chartEvolucaoInstance = null;

const ORIGEM_LABEL = { simulado: "Simulado", prova_oficial: "Prova oficial" };

export async function renderSimuladosPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/simulados")}
        <main class="app-content">
          <h2 class="form-title">Simulados</h2>
          <p style="color:var(--color-text-muted); margin-top:-8px;">
            Cadastre o modelo da prova uma vez (blocos, pesos, mínimos) e registre cada tentativa em segundos. Tentativas do mesmo modelo são comparáveis; "prova oficial" separa realidade de treino.
          </p>
          <div class="subtabs">
            <button type="button" class="subtab-btn subtab-btn--active" data-subtab="tentativas">Tentativas</button>
            <button type="button" class="subtab-btn" data-subtab="modelos">Modelos</button>
          </div>
          <div id="subtab-tentativas"><p>Carregando…</p></div>
          <div id="subtab-modelos" style="display:none;"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const { user } = getState();
  const tabTentativas = container.querySelector("#subtab-tentativas");
  const tabModelos = container.querySelector("#subtab-modelos");

  container.querySelectorAll("[data-subtab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const alvo = btn.dataset.subtab;
      container.querySelectorAll("[data-subtab]").forEach((b) => b.classList.toggle("subtab-btn--active", b === btn));
      tabTentativas.style.display = alvo === "tentativas" ? "block" : "none";
      tabModelos.style.display = alvo === "modelos" ? "block" : "none";
    });
  });

  let disciplines = [];
  let boards = [];
  let templates = [];
  let templateBlocks = [];
  let attempts = [];
  let attemptBlocks = [];

  async function carregarDados() {
    [disciplines, boards, templates, templateBlocks, attempts, attemptBlocks] = await Promise.all([
      listDisciplines(),
      listExamBoards(),
      listTemplates(),
      listTemplateBlocks(),
      listAttempts(),
      listAttemptBlocks(),
    ]);
  }

  try {
    await carregarDados();
  } catch (err) {
    tabTentativas.innerHTML = `<div class="alert alert--error">Erro ao carregar: ${escapeHtml(err.message)}</div>`;
    return;
  }

  const disciplinesById = () => Object.fromEntries(disciplines.map((d) => [d.id, d.name]));
  const blocksDoModelo = (templateId) =>
    templateBlocks.filter((b) => b.template_id === templateId).sort((a, b) => a.position - b.position);
  const resultadosDaTentativa = (attemptId) => attemptBlocks.filter((r) => r.attempt_id === attemptId);

  // ---- Cálculo central: nota/max/% por bloco e total de uma tentativa ----
  // bruto: nota = acertos × peso. líquido (Cebraspe): (acertos − erros) × peso
  // (pode ficar negativa; branco é neutro). Recuperável = max − nota: quanto
  // o bloco ainda pode render, já ponderado — o ranking disso responde "onde
  // cada acerto adicional compra mais pontos DESTA prova".
  function calcularTentativa(template, blocos, resultados) {
    const porBloco = blocos.map((b) => {
      const r = resultados.find((x) => x.block_id === b.id) || { correct: 0, wrong: 0 };
      const nota = template.scoring_mode === "liquido" ? (r.correct - r.wrong) * Number(b.weight) : r.correct * Number(b.weight);
      const max = b.questions * Number(b.weight);
      const pct = max > 0 ? (nota / max) * 100 : 0;
      const minOk = b.min_pct == null ? null : pct >= Number(b.min_pct);
      return { bloco: b, correct: r.correct, wrong: r.wrong, nota, max, pct, minOk, recuperavel: max - nota };
    });
    const nota = porBloco.reduce((acc, x) => acc + x.nota, 0);
    const max = porBloco.reduce((acc, x) => acc + x.max, 0);
    const pct = max > 0 ? (nota / max) * 100 : 0;
    const minTotalOk = template.min_total_pct == null ? null : pct >= Number(template.min_total_pct);
    const blocosReprovados = porBloco.filter((x) => x.minOk === false);
    const cutoffOk = template.cutoff_score == null ? null : nota >= Number(template.cutoff_score);
    const habilitado = minTotalOk !== false && blocosReprovados.length === 0;
    return { porBloco, nota, max, pct, minTotalOk, blocosReprovados, cutoffOk, habilitado };
  }

  renderTentativas();
  renderModelos();

  // ======================= ABA TENTATIVAS =======================
  function renderTentativas() {
    const ativos = templates.filter((t) => t.status === "ativo");
    const formHtml = ativos.length === 0
      ? `<div class="card" style="margin-bottom:16px;"><p style="color:var(--color-text-muted);">Nenhum modelo cadastrado ainda — crie um na aba Modelos primeiro.</p></div>`
      : `
        <div class="card" style="margin-bottom:16px; max-width:680px;">
          <h3 style="margin-top:0;">Registrar tentativa</h3>
          <div id="att-alert"></div>
          <form id="att-form">
            <div class="form-field">
              <label for="att-template">Modelo</label>
              <select id="att-template" required>
                <option value="" disabled selected>— Selecione —</option>
                ${ativos.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="att-origem">Origem</label>
              <select id="att-origem">
                <option value="simulado" selected>Simulado (treino)</option>
                <option value="prova_oficial">Prova oficial (realidade)</option>
              </select>
            </div>
            <div class="form-field">
              <label for="att-data">Data</label>
              <input type="date" id="att-data" required value="${todayISO()}" />
            </div>
            <div class="form-field">
              <label for="att-tempo">Tempo total (minutos)</label>
              <input type="number" id="att-tempo" min="0" step="1" required />
            </div>
            <div id="att-blocos"></div>
            <p id="att-resumo" style="display:none; font-weight:600;"></p>
            <div class="form-field">
              <label for="att-notas">Observações (opcional)</label>
              <input type="text" id="att-notas" />
            </div>
            <button type="submit" class="btn" style="width:auto; padding:8px 20px;">Salvar tentativa</button>
          </form>
        </div>
      `;

    tabTentativas.innerHTML = `
      ${formHtml}
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Histórico</h3>
        <div style="display:flex; gap:12px; align-items:end; flex-wrap:wrap; margin-bottom:8px;">
          <div class="form-field" style="margin-bottom:0; min-width:220px;">
            <label for="att-f-template">Modelo</label>
            <select id="att-f-template">
              <option value="">Todos</option>
              ${templates.map((t) => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-field" style="margin-bottom:0;">
            <label for="att-f-origem">Origem</label>
            <select id="att-f-origem">
              <option value="">Todas</option>
              <option value="simulado">Simulados</option>
              <option value="prova_oficial">Provas oficiais</option>
            </select>
          </div>
        </div>
        <div id="att-evolucao" style="display:none;">
          <div class="chart-wrap"><canvas id="att-evolucao-chart"></canvas></div>
        </div>
        <div id="att-list"></div>
      </div>
    `;

    const attAlert = tabTentativas.querySelector("#att-alert");
    const templateSelect = tabTentativas.querySelector("#att-template");
    const blocosBox = tabTentativas.querySelector("#att-blocos");
    const resumoBox = tabTentativas.querySelector("#att-resumo");

    if (templateSelect) {
      templateSelect.addEventListener("change", () => montarGradeBlocos(templateSelect.value));
    }

    function montarGradeBlocos(templateId) {
      const template = templates.find((t) => t.id === templateId);
      const blocos = blocksDoModelo(templateId);
      const liquido = template?.scoring_mode === "liquido";
      blocosBox.innerHTML = `
        <p style="font-weight:600; margin:12px 0 4px;">Acertos por bloco${liquido ? " (correção líquida: informe também os erros; branco é neutro)" : ""}</p>
        ${blocos
          .map(
            (b) => `
          <div style="display:flex; gap:8px; align-items:end; flex-wrap:wrap; margin-bottom:6px;" data-att-bloco="${b.id}">
            <span style="flex:1; min-width:200px;">${escapeHtml(b.name)} <span style="color:var(--color-text-muted); font-size:12px;">(${b.questions}q × peso ${b.weight})</span></span>
            <div class="form-field" style="margin-bottom:0; width:90px;">
              <label for="att-c-${b.id}">Acertos</label>
              <input type="number" id="att-c-${b.id}" data-att-correct="${b.id}" min="0" max="${b.questions}" step="1" required value="0" />
            </div>
            ${liquido ? `
            <div class="form-field" style="margin-bottom:0; width:90px;">
              <label for="att-w-${b.id}">Erros</label>
              <input type="number" id="att-w-${b.id}" data-att-wrong="${b.id}" min="0" max="${b.questions}" step="1" required value="0" />
            </div>` : ""}
          </div>
        `
          )
          .join("")}
      `;
      blocosBox.querySelectorAll("input").forEach((inp) => inp.addEventListener("input", atualizarResumo));
      atualizarResumo();

      function atualizarResumo() {
        const resultados = blocos.map((b) => ({
          block_id: b.id,
          correct: Number(blocosBox.querySelector(`[data-att-correct="${b.id}"]`)?.value || 0),
          wrong: Number(blocosBox.querySelector(`[data-att-wrong="${b.id}"]`)?.value || 0),
        }));
        const calc = calcularTentativa(template, blocos, resultados);
        resumoBox.style.display = "block";
        resumoBox.innerHTML = `Nota: ${fmtNota(calc.nota)} / ${fmtNota(calc.max)} (${formatPct(calc.pct)})${template.cutoff_score != null ? ` · corte ${fmtNota(template.cutoff_score)}: ${calc.cutoffOk ? "acima ✓" : "abaixo ✗"}` : ""}${calc.blocosReprovados.length ? ` · <span style="color:var(--color-error);">abaixo do mínimo em: ${calc.blocosReprovados.map((x) => escapeHtml(x.bloco.name)).join(", ")}</span>` : ""}`;
      }
    }

    const attForm = tabTentativas.querySelector("#att-form");
    if (attForm) {
      attForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        attAlert.innerHTML = "";
        const templateId = templateSelect.value;
        const template = templates.find((t) => t.id === templateId);
        const blocos = blocksDoModelo(templateId);
        if (!template || blocos.length === 0) {
          attAlert.innerHTML = `<div class="alert alert--error">Escolha um modelo.</div>`;
          return;
        }
        const results = [];
        for (const b of blocos) {
          const correct = Number(blocosBox.querySelector(`[data-att-correct="${b.id}"]`).value || 0);
          const wrong = Number(blocosBox.querySelector(`[data-att-wrong="${b.id}"]`)?.value || 0);
          if (correct + wrong > b.questions) {
            attAlert.innerHTML = `<div class="alert alert--error">"${escapeHtml(b.name)}": acertos + erros (${correct + wrong}) passa das ${b.questions} questões do bloco.</div>`;
            return;
          }
          results.push({ blockId: b.id, correct, wrong });
        }
        const calc = calcularTentativa(template, blocos, results.map((r) => ({ block_id: r.blockId, correct: r.correct, wrong: r.wrong })));
        const totalQuestoes = blocos.reduce((acc, b) => acc + b.questions, 0);
        const totalAcertos = results.reduce((acc, r) => acc + r.correct, 0);
        try {
          await createAttempt({
            userId: user.id,
            templateId,
            occurredAt: new Date(`${tabTentativas.querySelector("#att-data").value}T12:00:00`).toISOString(),
            origem: tabTentativas.querySelector("#att-origem").value,
            durationMinutes: Number(tabTentativas.querySelector("#att-tempo").value || 0),
            notes: tabTentativas.querySelector("#att-notas").value.trim(),
            results,
            totals: { questions: totalQuestoes, correct: totalAcertos, scorePct: Math.round(calc.pct * 100) / 100 },
          });
          await carregarDados();
          renderTentativas();
        } catch (err) {
          attAlert.innerHTML = `<div class="alert alert--error">Erro ao salvar: ${escapeHtml(err.message)}</div>`;
        }
      });
    }

    const filtro = { templateId: "", origem: "" };
    tabTentativas.querySelector("#att-f-template").addEventListener("change", (e) => {
      filtro.templateId = e.target.value;
      renderListaTentativas();
    });
    tabTentativas.querySelector("#att-f-origem").addEventListener("change", (e) => {
      filtro.origem = e.target.value;
      renderListaTentativas();
    });

    renderListaTentativas();

    function renderListaTentativas() {
      const listBox = tabTentativas.querySelector("#att-list");
      const visiveis = attempts.filter((a) => {
        if (filtro.templateId && a.template_id !== filtro.templateId) return false;
        if (filtro.origem && a.origem !== filtro.origem) return false;
        return true;
      });

      renderEvolucao(filtro.templateId, visiveis);

      if (visiveis.length === 0) {
        listBox.innerHTML = `<p style="color:var(--color-text-muted);">Nenhuma tentativa registrada ainda.</p>`;
        return;
      }

      const rows = visiveis
        .map((a) => {
          const template = templates.find((t) => t.id === a.template_id);
          const blocos = blocksDoModelo(a.template_id);
          const calc = calcularTentativa(template, blocos, resultadosDaTentativa(a.id));
          const habilitadoTxt =
            template.min_total_pct == null && !blocos.some((b) => b.min_pct != null)
              ? "—"
              : calc.habilitado
                ? '<span style="color:var(--color-success);">Habilitado</span>'
                : '<span style="color:var(--color-error);">Eliminado</span>';
          return `
            <tr data-att-row="${a.id}" style="cursor:pointer;">
              <td>${new Date(a.occurred_at).toLocaleDateString("pt-BR")}</td>
              <td>${escapeHtml(template?.name || "—")}</td>
              <td>${ORIGEM_LABEL[a.origem] || a.origem}</td>
              <td>${fmtNota(calc.nota)}/${fmtNota(calc.max)}</td>
              <td>${formatPct(calc.pct)}</td>
              <td>${habilitadoTxt}</td>
              <td><button class="btn-link" style="color:var(--color-error);" data-att-delete="${a.id}">Apagar</button></td>
            </tr>
            <tr data-att-detail="${a.id}" style="display:none;">
              <td colspan="7" style="background:var(--color-bg-subtle, #f5f5f5);">
                ${detalheTentativa(template, calc)}
              </td>
            </tr>
          `;
        })
        .join("");

      listBox.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="data-table">
            <tr><th>Data</th><th>Modelo</th><th>Origem</th><th>Nota</th><th>%</th><th>Habilitação</th><th></th></tr>
            ${rows}
          </table>
        </div>
        <p style="font-size:12px; color:var(--color-text-muted); margin:8px 0 0;">Clique numa linha pra ver o detalhe por bloco e os pontos recuperáveis.</p>
      `;

      listBox.querySelectorAll("[data-att-row]").forEach((tr) => {
        tr.addEventListener("click", (e) => {
          if (e.target.closest("button")) return;
          const det = listBox.querySelector(`[data-att-detail="${tr.dataset.attRow}"]`);
          if (det) det.style.display = det.style.display === "none" ? "" : "none";
        });
      });

      listBox.querySelectorAll("[data-att-delete]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!window.confirm("Apagar esta tentativa? (A sessão de estudo vinculada NÃO é apagada — as horas foram estudadas de verdade.)")) return;
          btn.disabled = true;
          try {
            await deleteAttempt(btn.dataset.attDelete);
            await carregarDados();
            renderTentativas();
          } catch (err) {
            window.alert("Erro ao apagar: " + (err.message || "desconhecido"));
            btn.disabled = false;
          }
        });
      });
    }

    // Detalhe por bloco, ordenado por pontos recuperáveis (desc) — a ordem JÁ
    // é a resposta de "onde investir": bloco com mais pontos ponderados em
    // jogo primeiro.
    function detalheTentativa(template, calc) {
      const ordenado = [...calc.porBloco].sort((a, b) => b.recuperavel - a.recuperavel);
      const dById = disciplinesById();
      return `
        <div style="overflow-x:auto;">
          <table class="data-table" style="margin:8px 0;">
            <tr><th>Bloco</th><th>Acertos</th><th>Nota</th><th>%</th><th>Mínimo</th><th>Pontos recuperáveis</th></tr>
            ${ordenado
              .map(
                (x) => `
              <tr>
                <td>${escapeHtml(x.bloco.name)}${x.bloco.discipline_id ? ` <span style="color:var(--color-text-muted); font-size:11px;">(${escapeHtml(dById[x.bloco.discipline_id] || "")})</span>` : ""}</td>
                <td>${x.correct}/${x.bloco.questions}${template.scoring_mode === "liquido" ? ` (${x.wrong} err.)` : ""}</td>
                <td>${fmtNota(x.nota)}/${fmtNota(x.max)}</td>
                <td>${formatPct(x.pct)}</td>
                <td>${x.minOk == null ? "—" : x.minOk ? "✓" : `<span style="color:var(--color-error);">✗ (mín. ${formatPct(x.bloco.min_pct)})</span>`}</td>
                <td><strong>${fmtNota(x.recuperavel)}</strong></td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>
      `;
    }

    // Evolução: só com um modelo filtrado e 2+ tentativas (comparar
    // tentativas de modelos diferentes seria comparar provas diferentes).
    function renderEvolucao(templateId, visiveis) {
      const box = tabTentativas.querySelector("#att-evolucao");
      if (chartEvolucaoInstance) {
        chartEvolucaoInstance.destroy();
        chartEvolucaoInstance = null;
      }
      if (!templateId || visiveis.length < 2 || typeof Chart === "undefined") {
        box.style.display = "none";
        return;
      }
      box.style.display = "block";
      const template = templates.find((t) => t.id === templateId);
      const serie = [...visiveis].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));
      const dados = serie.map((a) => {
        const calc = calcularTentativa(template, blocksDoModelo(a.template_id), resultadosDaTentativa(a.id));
        return { data: new Date(a.occurred_at).toLocaleDateString("pt-BR"), pct: Math.round(calc.pct * 10) / 10, origem: a.origem };
      });
      chartEvolucaoInstance = new Chart(tabTentativas.querySelector("#att-evolucao-chart"), {
        type: "line",
        data: {
          labels: dados.map((d) => d.data),
          datasets: [
            {
              label: "% ponderado",
              data: dados.map((d) => d.pct),
              borderColor: "#1f3864",
              backgroundColor: "rgba(31, 56, 100, 0.15)",
              fill: true,
              tension: 0.2,
              // Prova oficial destacada em laranja no meio da série de treino.
              pointBackgroundColor: dados.map((d) => (d.origem === "prova_oficial" ? "#e65100" : "#1f3864")),
              pointRadius: dados.map((d) => (d.origem === "prova_oficial" ? 6 : 4)),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { min: 0, max: 100, ticks: { callback: (v) => formatPct(v) } } },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `${formatPct(ctx.parsed.y)} (${ORIGEM_LABEL[dados[ctx.dataIndex].origem]})` } },
          },
        },
      });
    }
  }

  // ======================= ABA MODELOS =======================
  function renderModelos() {
    tabModelos.innerHTML = `
      <div class="card" style="margin-bottom:16px; max-width:760px;">
        <h3 style="margin-top:0;">Novo modelo de prova</h3>
        <div id="tpl-alert"></div>
        <form id="tpl-form">
          <div class="form-field">
            <label for="tpl-nome">Nome do modelo</label>
            <input type="text" id="tpl-nome" required placeholder='Ex.: "TCE-SC FGV — Eng. Civil" ou "Simulado Dojô Nível 5"' />
          </div>
          <div class="form-field">
            <label for="tpl-banca">Banca (opcional)</label>
            <select id="tpl-banca">
              <option value="" selected>— Não informar —</option>
              ${boards.map((b) => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-field">
            <label for="tpl-modo">Correção</label>
            <select id="tpl-modo">
              <option value="bruto" selected>Bruta (nota = acertos × peso)</option>
              <option value="liquido">Líquida / Cebraspe (nota = (acertos − erros) × peso; branco neutro)</option>
            </select>
          </div>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <div class="form-field" style="flex:1; min-width:180px;">
              <label for="tpl-min-total">Mínimo % total (opcional)</label>
              <input type="number" id="tpl-min-total" min="0" max="100" step="0.1" placeholder="Ex.: 50" />
            </div>
            <div class="form-field" style="flex:1; min-width:180px;">
              <label for="tpl-corte">Nota de corte (opcional)</label>
              <input type="number" id="tpl-corte" min="0" step="0.01" placeholder="Editável depois" />
            </div>
          </div>
          <p style="font-weight:600; margin:12px 0 4px;">Blocos <span style="color:var(--color-text-muted); font-weight:normal; font-size:12px;">(um por disciplina do edital — vincular à disciplina do catálogo habilita o cruzamento com sua prática)</span></p>
          <div id="tpl-blocos"></div>
          <button type="button" id="tpl-add-bloco" class="btn-link">+ Adicionar bloco</button>
          <div class="form-field" style="margin-top:12px;">
            <label for="tpl-notas">Observações (opcional)</label>
            <input type="text" id="tpl-notas" />
          </div>
          <button type="submit" class="btn" style="width:auto; padding:8px 20px;">Salvar modelo</button>
        </form>
      </div>
      <div class="card">
        <h3 style="margin-top:0;">Modelos cadastrados (${templates.length})</h3>
        <div id="tpl-list"></div>
      </div>
    `;

    const tplAlert = tabModelos.querySelector("#tpl-alert");
    const blocosBox = tabModelos.querySelector("#tpl-blocos");

    function addBlocoRow() {
      const row = document.createElement("div");
      row.setAttribute("data-tpl-bloco-row", "");
      row.style.cssText = "display:flex; gap:8px; align-items:end; flex-wrap:wrap; margin-bottom:6px;";
      row.innerHTML = `
        <div class="form-field" style="flex:2; min-width:180px; margin-bottom:0;">
          <label>Nome do bloco</label>
          <input type="text" data-b-nome required placeholder="Ex.: Língua Portuguesa" />
        </div>
        <div class="form-field" style="flex:2; min-width:160px; margin-bottom:0;">
          <label>Disciplina (opcional)</label>
          <select data-b-disciplina>
            <option value="" selected>—</option>
            ${disciplines.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field" style="width:80px; margin-bottom:0;">
          <label>Questões</label>
          <input type="number" data-b-questoes required min="1" step="1" />
        </div>
        <div class="form-field" style="width:80px; margin-bottom:0;">
          <label>Peso</label>
          <input type="number" data-b-peso required min="0.01" step="0.01" value="1" />
        </div>
        <div class="form-field" style="width:90px; margin-bottom:0;">
          <label>Mín. % <span style="font-size:10px;">(opc.)</span></label>
          <input type="number" data-b-min min="0" max="100" step="0.1" />
        </div>
        <button type="button" class="btn-link" data-b-remover style="color:var(--color-error); margin-bottom:8px;">remover</button>
      `;
      row.querySelector("[data-b-remover]").addEventListener("click", () => row.remove());
      blocosBox.appendChild(row);
    }

    tabModelos.querySelector("#tpl-add-bloco").addEventListener("click", addBlocoRow);
    addBlocoRow();

    tabModelos.querySelector("#tpl-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      tplAlert.innerHTML = "";
      const rows = [...blocosBox.querySelectorAll("[data-tpl-bloco-row]")];
      if (rows.length === 0) {
        tplAlert.innerHTML = `<div class="alert alert--error">Adicione pelo menos um bloco.</div>`;
        return;
      }
      const blocks = rows.map((r) => ({
        name: r.querySelector("[data-b-nome]").value.trim(),
        disciplineId: r.querySelector("[data-b-disciplina]").value || null,
        questions: Number(r.querySelector("[data-b-questoes]").value),
        weight: Number(r.querySelector("[data-b-peso]").value),
        minPct: r.querySelector("[data-b-min]").value === "" ? null : Number(r.querySelector("[data-b-min]").value),
      }));
      const minTotalRaw = tabModelos.querySelector("#tpl-min-total").value;
      const corteRaw = tabModelos.querySelector("#tpl-corte").value;
      try {
        await createTemplate({
          userId: user.id,
          name: tabModelos.querySelector("#tpl-nome").value.trim(),
          boardId: tabModelos.querySelector("#tpl-banca").value || null,
          scoringMode: tabModelos.querySelector("#tpl-modo").value,
          minTotalPct: minTotalRaw === "" ? null : Number(minTotalRaw),
          cutoffScore: corteRaw === "" ? null : Number(corteRaw),
          notes: tabModelos.querySelector("#tpl-notas").value.trim(),
          blocks,
        });
        await carregarDados();
        renderModelos();
        renderTentativas();
      } catch (err) {
        tplAlert.innerHTML = `<div class="alert alert--error">Erro ao salvar modelo: ${escapeHtml(err.message)}</div>`;
      }
    });

    renderListaModelos();

    function renderListaModelos() {
      const listBox = tabModelos.querySelector("#tpl-list");
      if (templates.length === 0) {
        listBox.innerHTML = `<p style="color:var(--color-text-muted);">Nenhum modelo ainda.</p>`;
        return;
      }
      const rows = templates
        .map((t) => {
          const blocos = blocksDoModelo(t.id);
          const totalQ = blocos.reduce((acc, b) => acc + b.questions, 0);
          const totalPts = blocos.reduce((acc, b) => acc + b.questions * Number(b.weight), 0);
          const nTentativas = attempts.filter((a) => a.template_id === t.id).length;
          return `
            <tr data-tpl-row="${t.id}" style="cursor:pointer;${t.status === "inativo" ? " opacity:0.6;" : ""}">
              <td>${escapeHtml(t.name)}</td>
              <td>${blocos.length} bloco(s) · ${totalQ}q · ${fmtNota(totalPts)} pts</td>
              <td>${t.scoring_mode === "liquido" ? "Líquida" : "Bruta"}</td>
              <td>${nTentativas}</td>
              <td>
                <div class="row-actions">
                  <button class="btn-link" data-tpl-corte="${t.id}">Corte/Mínimo</button>
                  <span class="row-actions__sep">|</span>
                  <button class="btn-link" data-tpl-toggle="${t.id}" data-next="${t.status === "ativo" ? "inativo" : "ativo"}">${t.status === "ativo" ? "Arquivar" : "Reativar"}</button>
                </div>
              </td>
            </tr>
            <tr data-tpl-detail="${t.id}" style="display:none;">
              <td colspan="5" style="background:var(--color-bg-subtle, #f5f5f5);">
                <p style="margin:4px 0; font-size:12px; color:var(--color-text-muted);">${t.min_total_pct != null ? `Mínimo total: ${formatPct(t.min_total_pct)} · ` : ""}${t.cutoff_score != null ? `Nota de corte: ${fmtNota(t.cutoff_score)} · ` : ""}${escapeHtml(t.notes || "")}</p>
                <div style="overflow-x:auto;">
                  <table class="data-table" style="margin:8px 0;">
                    <tr><th>Bloco</th><th>Questões</th><th>Peso</th><th>Mín. %</th></tr>
                    ${blocos.map((b) => `<tr><td>${escapeHtml(b.name)}</td><td>${b.questions}</td><td>${b.weight}</td><td>${b.min_pct == null ? "—" : formatPct(b.min_pct)}</td></tr>`).join("")}
                  </table>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");

      listBox.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="data-table">
            <tr><th>Nome</th><th>Estrutura</th><th>Correção</th><th>Tentativas</th><th>Ações</th></tr>
            ${rows}
          </table>
        </div>
      `;

      listBox.querySelectorAll("[data-tpl-row]").forEach((tr) => {
        tr.addEventListener("click", (e) => {
          if (e.target.closest("button")) return;
          const det = listBox.querySelector(`[data-tpl-detail="${tr.dataset.tplRow}"]`);
          if (det) det.style.display = det.style.display === "none" ? "" : "none";
        });
      });

      listBox.querySelectorAll("[data-tpl-toggle]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            await setTemplateStatus(btn.dataset.tplToggle, btn.dataset.next);
            await carregarDados();
            renderModelos();
            renderTentativas();
          } catch (err) {
            window.alert("Erro: " + (err.message || "desconhecido"));
            btn.disabled = false;
          }
        });
      });

      // Corte/mínimo editáveis depois (quando o edital/resultado real sair).
      listBox.querySelectorAll("[data-tpl-corte]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const t = templates.find((x) => x.id === btn.dataset.tplCorte);
          const minRaw = window.prompt("Mínimo % total pra habilitação (vazio = sem mínimo):", t.min_total_pct ?? "");
          if (minRaw === null) return;
          const corteRaw = window.prompt("Nota de corte (vazio = sem corte):", t.cutoff_score ?? "");
          if (corteRaw === null) return;
          try {
            await updateTemplateCutoff(t.id, {
              minTotalPct: minRaw.trim() === "" ? null : Number(minRaw),
              cutoffScore: corteRaw.trim() === "" ? null : Number(corteRaw),
            });
            await carregarDados();
            renderModelos();
            renderTentativas();
          } catch (err) {
            window.alert("Erro: " + (err.message || "desconhecido"));
          }
        });
      });
    }
  }
}

function fmtNota(n) {
  const v = Math.round(Number(n) * 100) / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
