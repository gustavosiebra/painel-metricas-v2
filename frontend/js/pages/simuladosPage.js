// Tela "Simulados" (27/07/2026; v2 no mesmo dia, feedback do usuário) —
// Modelos de Prova reutilizáveis + tentativas (simulado × prova oficial).
//
// v2, decidido com o usuário testando a v1:
// - Bloco = linha de disciplina do edital, agrupada por MÓDULO (select
//   pré-cadastrado: Conhecimentos Gerais / Conhecimentos Específicos /
//   Outro…) — era texto livre por linha, virou seleção.
// - Disciplina é obrigatória no bloco e ganhou "+ Cadastrar nova disciplina"
//   (mesmo padrão sob demanda de Nova Sessão); o nome do bloco É o nome da
//   disciplina — campo de nome próprio foi removido.
// - Habilitação virou construtor de CRITÉRIOS acumuláveis (todos AND), após
//   pesquisa em editais reais: TCE-SP exige 12 questões nas Gerais E 36 nas
//   Específicas (mínimo absoluto por módulo); FGV usa % por módulo e/ou
//   "zerar qualquer disciplina elimina" (cada_bloco); Cebraspe usa pontos
//   líquidos; e há combinados (50% por módulo E 60% no total). Cada critério:
//   escopo (total | módulo | cada bloco) × unidade (questões | % | pontos) ×
//   valor. Nota de corte continua à parte: é CLASSIFICATÓRIA (emerge do
//   resultado), não regra fixa de edital — campo "corte estimado" editável.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listDisciplines, listExamBoards, createDiscipline } from "../services/catalogService.js";
import {
  listTemplates,
  listTemplateBlocks,
  listTemplateRules,
  listAttempts,
  listAttemptBlocks,
  createTemplate,
  setTemplateStatus,
  updateTemplate,
  createAttempt,
  deleteAttempt,
} from "../services/simuladoService.js";
import { getState } from "../state.js";
import { formatPct } from "../utils/format.js";

let chartEvolucaoInstance = null;

const ORIGEM_LABEL = { simulado: "Simulado", prova_oficial: "Prova oficial" };
const MODULOS_PADRAO = ["Conhecimentos Gerais", "Conhecimentos Específicos"];

export async function renderSimuladosPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/simulados")}
        <main class="app-content">
          <h2 class="form-title">Simulados</h2>
          <p style="color:var(--color-text-muted); margin-top:-8px;">
            Cadastre o modelo da prova uma vez (módulos, disciplinas, pesos, critérios de habilitação) e registre cada tentativa em segundos. Tentativas do mesmo modelo são comparáveis; "prova oficial" separa realidade de treino.
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
  let templateRules = [];
  let attempts = [];
  let attemptBlocks = [];

  async function carregarDados() {
    [disciplines, boards, templates, templateBlocks, templateRules, attempts, attemptBlocks] = await Promise.all([
      listDisciplines(),
      listExamBoards(),
      listTemplates(),
      listTemplateBlocks(),
      listTemplateRules(),
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

  const blocksDoModelo = (templateId) =>
    templateBlocks.filter((b) => b.template_id === templateId).sort((a, b) => a.position - b.position);
  const regrasDoModelo = (templateId) => templateRules.filter((r) => r.template_id === templateId);
  const resultadosDaTentativa = (attemptId) => attemptBlocks.filter((r) => r.attempt_id === attemptId);

  function descreverRegra(r) {
    const alvo = r.scope === "total" ? "Total" : r.scope === "cada_bloco" ? "Cada bloco" : r.module_name || "?";
    const un = r.kind === "questoes" ? "questões" : r.kind === "pct" ? "%" : "pontos";
    return `${alvo} ≥ ${fmtNota(r.value)} ${un}`;
  }

  function fmtMedida(valor, kind) {
    if (valor == null) return "—";
    if (kind === "pct") return formatPct(valor);
    if (kind === "questoes") return `${Math.round(valor)} questões`;
    return `${fmtNota(valor)} pts`;
  }

  // ---- Cálculo central: nota por bloco + avaliação de critérios ----
  // bruto: nota = acertos × peso. líquido (Cebraspe): (acertos − erros) ×
  // peso (pode ficar negativa; branco é neutro). Recuperável = max − nota.
  // Critérios: TODOS precisam passar (AND); regra de módulo que não bate com
  // nenhum bloco fica "não aplicável" (ok=null) e é sinalizada, sem eliminar.
  // Legado v1 (min_pct por bloco / min_total_pct do modelo) continua sendo
  // avaliado se existir em modelos antigos.
  function calcularTentativa(template, blocos, regras, resultados) {
    const porBloco = blocos.map((b) => {
      const r = resultados.find((x) => x.block_id === b.id) || { correct: 0, wrong: 0 };
      const nota = template.scoring_mode === "liquido" ? (r.correct - r.wrong) * Number(b.weight) : r.correct * Number(b.weight);
      const max = b.questions * Number(b.weight);
      const pct = max > 0 ? (nota / max) * 100 : 0;
      return { bloco: b, correct: r.correct, wrong: r.wrong, nota, max, pct, recuperavel: max - nota };
    });
    const nota = porBloco.reduce((acc, x) => acc + x.nota, 0);
    const max = porBloco.reduce((acc, x) => acc + x.max, 0);
    const correct = porBloco.reduce((acc, x) => acc + x.correct, 0);
    const pct = max > 0 ? (nota / max) * 100 : 0;

    const porModulo = {};
    porBloco.forEach((x) => {
      const m = x.bloco.module || "(sem módulo)";
      if (!porModulo[m]) porModulo[m] = { correct: 0, nota: 0, max: 0 };
      porModulo[m].correct += x.correct;
      porModulo[m].nota += x.nota;
      porModulo[m].max += x.max;
    });

    const medir = (agg, kind) =>
      kind === "questoes" ? agg.correct : kind === "pontos" ? agg.nota : agg.max > 0 ? (agg.nota / agg.max) * 100 : 0;

    const avaliacoes = regras.map((r) => {
      let ok = null;
      let medida = null;
      if (r.scope === "total") {
        medida = medir({ correct, nota, max }, r.kind);
        ok = medida >= Number(r.value);
      } else if (r.scope === "modulo") {
        const agg = porModulo[r.module_name];
        if (agg) {
          medida = medir(agg, r.kind);
          ok = medida >= Number(r.value);
        }
      } else {
        const medidas = porBloco.map((x) => medir({ correct: x.correct, nota: x.nota, max: x.max }, r.kind));
        medida = medidas.length ? Math.min(...medidas) : 0;
        ok = medidas.every((m) => m >= Number(r.value));
      }
      return { regra: r, ok, medida };
    });

    // Legado v1 (modelos criados antes dos critérios).
    const legadoFalhas = [];
    porBloco.forEach((x) => {
      if (x.bloco.min_pct != null && x.pct < Number(x.bloco.min_pct)) legadoFalhas.push(`${x.bloco.name} < ${formatPct(x.bloco.min_pct)}`);
    });
    if (template.min_total_pct != null && pct < Number(template.min_total_pct)) legadoFalhas.push(`Total < ${formatPct(template.min_total_pct)}`);

    const temCriterios = regras.length > 0 || legadoFalhas.length > 0 || porBloco.some((x) => x.bloco.min_pct != null) || template.min_total_pct != null;
    const habilitado = avaliacoes.every((a) => a.ok !== false) && legadoFalhas.length === 0;
    const cutoffOk = template.cutoff_score == null ? null : nota >= Number(template.cutoff_score);

    return { porBloco, porModulo, nota, max, correct, pct, avaliacoes, legadoFalhas, temCriterios, habilitado, cutoffOk };
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
            <div id="att-resumo" style="display:none;"></div>
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
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:var(--spacing-2); margin-bottom:8px;">
          <div class="form-field" style="margin-bottom:0;">
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
      const regras = regrasDoModelo(templateId);
      const liquido = template?.scoring_mode === "liquido";
      // Agrupado visualmente por módulo — mesma ordem do cadastro.
      const modulosOrdem = [];
      blocos.forEach((b) => {
        const m = b.module || "(sem módulo)";
        if (!modulosOrdem.includes(m)) modulosOrdem.push(m);
      });
      blocosBox.innerHTML = `
        <p style="font-weight:600; margin:12px 0 4px;">Acertos por bloco${liquido ? " (correção líquida: informe também os erros; branco é neutro)" : ""}</p>
        ${modulosOrdem
          .map(
            (m) => `
          <p style="margin:10px 0 2px; font-size:12px; text-transform:uppercase; color:var(--color-text-muted);">${escapeHtml(m)}</p>
          ${blocos
            .filter((b) => (b.module || "(sem módulo)") === m)
            .map(
              (b) => `
            <div class="form-grid-row form-grid-row--tentativa" data-att-bloco="${b.id}">
              <span class="form-grid-row__label">${escapeHtml(b.name)} <span style="color:var(--color-text-muted); font-size:12px;">(${b.questions}q × peso ${b.weight})</span></span>
              <div class="form-field">
                <label for="att-c-${b.id}">Acertos</label>
                <input type="number" id="att-c-${b.id}" data-att-correct="${b.id}" min="0" max="${b.questions}" step="1" required value="0" />
              </div>
              ${liquido ? `
              <div class="form-field">
                <label for="att-w-${b.id}">Erros</label>
                <input type="number" id="att-w-${b.id}" data-att-wrong="${b.id}" min="0" max="${b.questions}" step="1" required value="0" />
              </div>` : ""}
            </div>
          `
            )
            .join("")}
        `
          )
          .join("")}
      `;
      blocosBox.querySelectorAll("input").forEach((inp) => inp.addEventListener("input", atualizarResumo));
      const tempoInput = tabTentativas.querySelector("#att-tempo");
      if (tempoInput) tempoInput.oninput = atualizarResumo;
      atualizarResumo();

      function atualizarResumo() {
        const resultados = blocos.map((b) => ({
          block_id: b.id,
          correct: Number(blocosBox.querySelector(`[data-att-correct="${b.id}"]`)?.value || 0),
          wrong: Number(blocosBox.querySelector(`[data-att-wrong="${b.id}"]`)?.value || 0),
        }));
        const calc = calcularTentativa(template, blocos, regras, resultados);
        // Ritmo (27/07/2026): duração oficial da prova no modelo permite
        // comparar min/questão usados vs orçamento — estourar tempo no
        // simulado significa faltar prova no final do dia real.
        const duracaoProva = template.duration_minutes ? Number(template.duration_minutes) : null;
        const tempoUsado = Number(tabTentativas.querySelector("#att-tempo")?.value || 0);
        const totalQ = blocos.reduce((acc, b) => acc + b.questions, 0);
        const ritmoHtml = duracaoProva && totalQ > 0
          ? `<p style="margin:0 0 4px; font-size:13px;">Ritmo: ${tempoUsado > 0 ? `${fmtNota(tempoUsado / totalQ)} min/questão` : "—"} · orçamento da prova: ${fmtNota(duracaoProva / totalQ)} min/questão (${duracaoProva} min)${tempoUsado > 0 ? (tempoUsado <= duracaoProva ? ' · <span style="color:var(--color-success);">dentro do tempo ✓</span>' : ' · <span style="color:var(--color-error);">estourou o tempo ✗</span>') : ""}</p>`
          : "";
        resumoBox.style.display = "block";
        resumoBox.innerHTML = `
          <p style="font-weight:600; margin:8px 0 4px;">Nota: ${fmtNota(calc.nota)} / ${fmtNota(calc.max)} (${formatPct(calc.pct)})${template.cutoff_score != null ? ` · corte estimado ${fmtNota(template.cutoff_score)}: ${calc.cutoffOk ? '<span style="color:var(--color-success);">acima ✓</span>' : '<span style="color:var(--color-error);">abaixo ✗</span>'}` : ""}</p>
          ${ritmoHtml}
          ${calc.avaliacoes.length ? `<p style="margin:0 0 8px; font-size:13px;">${calc.avaliacoes.map((a) => `${a.ok === false ? "✗" : a.ok === true ? "✓" : "?"} ${escapeHtml(descreverRegra(a.regra))} <span style="color:var(--color-text-muted);">(${fmtMedida(a.medida, a.regra.kind)})</span>`).join(" · ")}</p>` : ""}
          ${calc.temCriterios ? `<p style="margin:0 0 8px; font-weight:600; color:${calc.habilitado ? "var(--color-success)" : "var(--color-error)"};">${calc.habilitado ? "Habilitado nos critérios do edital" : "ELIMINADO pelos critérios do edital"}</p>` : ""}
        `;
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
        const calc = calcularTentativa(template, blocos, regrasDoModelo(templateId), results.map((r) => ({ block_id: r.blockId, correct: r.correct, wrong: r.wrong })));
        const totalQuestoes = blocos.reduce((acc, b) => acc + b.questions, 0);
        try {
          await createAttempt({
            userId: user.id,
            templateId,
            occurredAt: new Date(`${tabTentativas.querySelector("#att-data").value}T12:00:00`).toISOString(),
            origem: tabTentativas.querySelector("#att-origem").value,
            durationMinutes: Number(tabTentativas.querySelector("#att-tempo").value || 0),
            notes: tabTentativas.querySelector("#att-notas").value.trim(),
            results,
            totals: { questions: totalQuestoes, correct: calc.correct, scorePct: Math.round(calc.pct * 100) / 100 },
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
          const calc = calcularTentativa(template, blocos, regrasDoModelo(a.template_id), resultadosDaTentativa(a.id));
          const habilitadoTxt = !calc.temCriterios
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
                ${detalheTentativa(template, calc, a)}
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
        <p style="font-size:12px; color:var(--color-text-muted); margin:8px 0 0;">Clique numa linha pra ver o detalhe por bloco, os critérios e os pontos recuperáveis.</p>
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

    // Detalhe: critérios avaliados + blocos ordenados por pontos recuperáveis
    // (desc) — a ordem JÁ é a resposta de "onde investir".
    function detalheTentativa(template, calc, tentativa) {
      const ordenado = [...calc.porBloco].sort((a, b) => b.recuperavel - a.recuperavel);
      const totalQ = calc.porBloco.reduce((acc, x) => acc + x.bloco.questions, 0);
      const ritmoHtml = template.duration_minutes && tentativa?.duration_minutes && totalQ > 0
        ? `<p style="margin:8px 0 4px;"><strong>Tempo:</strong> ${fmtNota(tentativa.duration_minutes)} min de ${template.duration_minutes} min permitidos (${fmtNota(Number(tentativa.duration_minutes) / totalQ)} vs orçamento ${fmtNota(Number(template.duration_minutes) / totalQ)} min/questão)${Number(tentativa.duration_minutes) <= Number(template.duration_minutes) ? ' · <span style="color:var(--color-success);">dentro do tempo ✓</span>' : ' · <span style="color:var(--color-error);">estourou o tempo ✗</span>'}</p>`
        : "";
      const criteriosHtml = calc.avaliacoes.length
        ? `<p style="margin:8px 0 4px;"><strong>Critérios:</strong> ${calc.avaliacoes.map((a) => `${a.ok === false ? '<span style="color:var(--color-error);">✗</span>' : a.ok === true ? '<span style="color:var(--color-success);">✓</span>' : "?"} ${escapeHtml(descreverRegra(a.regra))} <span style="color:var(--color-text-muted);">(obteve ${fmtMedida(a.medida, a.regra.kind)})</span>`).join(" · ")}</p>`
        : "";
      const legadoHtml = calc.legadoFalhas.length
        ? `<p style="margin:4px 0; color:var(--color-error);">Abaixo do mínimo: ${calc.legadoFalhas.map(escapeHtml).join("; ")}</p>`
        : "";
      return `
        ${ritmoHtml}
        ${criteriosHtml}
        ${legadoHtml}
        <div style="overflow-x:auto;">
          <table class="data-table" style="margin:8px 0;">
            <tr><th>Módulo</th><th>Bloco</th><th>Acertos</th><th>Nota</th><th>%</th><th>Pontos recuperáveis</th></tr>
            ${ordenado
              .map(
                (x) => `
              <tr>
                <td style="font-size:12px; color:var(--color-text-muted);">${escapeHtml(x.bloco.module || "—")}</td>
                <td>${escapeHtml(x.bloco.name)}</td>
                <td>${x.correct}/${x.bloco.questions}${template.scoring_mode === "liquido" ? ` (${x.wrong} err.)` : ""}</td>
                <td>${fmtNota(x.nota)}/${fmtNota(x.max)}</td>
                <td>${formatPct(x.pct)}</td>
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
        const calc = calcularTentativa(template, blocksDoModelo(a.template_id), regrasDoModelo(a.template_id), resultadosDaTentativa(a.id));
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
  // editing = null (novo) ou o template sendo editado. O MESMO formulário
  // serve os dois modos (27/07/2026, feedback do usuário: editar por prompt
  // encadeado era gambiarra — agora abre o modelo inteiro preenchido).
  function renderModelos(editing = null) {
    const blocosDoEdit = editing ? blocksDoModelo(editing.id) : [];
    const regrasDoEdit = editing ? regrasDoModelo(editing.id) : [];
    // Bloco com resultado já registrado não pode ser removido: o delete
    // cascatearia em exam_attempt_blocks e corromperia tentativas antigas.
    const blocosTravados = new Set(attemptBlocks.map((r) => r.block_id));
    const temTentativas = editing ? attempts.some((a) => a.template_id === editing.id) : false;

    tabModelos.innerHTML = `
      <div class="card" style="margin-bottom:16px; max-width:820px;">
        <h3 style="margin-top:0;">${editing ? `Editar modelo: ${escapeHtml(editing.name)}` : "Novo modelo de prova"}</h3>
        ${temTentativas ? `<div class="alert" style="background:#fff4e5; color:#b45309; border:1px solid #ffe0b2;">Este modelo já tem tentativas registradas. Mudar questões ou pesos altera a nota das tentativas antigas — a comparação entre elas deixa de ser exata. Blocos já usados não podem ser removidos.</div>` : ""}
        <div id="tpl-alert"></div>
        <form id="tpl-form">
          <div class="form-field">
            <label for="tpl-nome">Nome do modelo</label>
            <input type="text" id="tpl-nome" required placeholder='Ex.: "TCE-SC FGV — Eng. Civil" ou "Simulado Dojô Nível 5"' value="${editing ? escapeHtml(editing.name) : ""}" />
          </div>
          <div class="form-field">
            <label for="tpl-banca">Banca (opcional)</label>
            <select id="tpl-banca">
              <option value="">— Não informar —</option>
              ${boards.map((b) => `<option value="${b.id}" ${editing?.board_id === b.id ? "selected" : ""}>${escapeHtml(b.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-field">
            <label for="tpl-modo">Correção</label>
            <select id="tpl-modo">
              <option value="bruto" ${editing?.scoring_mode !== "liquido" ? "selected" : ""}>Bruta (nota = acertos × peso)</option>
              <option value="liquido" ${editing?.scoring_mode === "liquido" ? "selected" : ""}>Líquida / Cebraspe (nota = (acertos − erros) × peso; branco neutro)</option>
            </select>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:var(--spacing-2);">
            <div class="form-field">
              <label for="tpl-duracao">Duração da prova (min, opcional)</label>
              <input type="number" id="tpl-duracao" min="1" step="1" placeholder="Ex.: 240" value="${editing?.duration_minutes ?? ""}" />
            </div>
            <div class="form-field">
              <label for="tpl-corte">Corte estimado (opcional)</label>
              <input type="number" id="tpl-corte" min="0" step="0.01" placeholder="Editável depois" value="${editing?.cutoff_score ?? ""}" />
            </div>
          </div>
          <p style="font-weight:600; margin:12px 0 4px;">Blocos <span style="color:var(--color-text-muted); font-weight:normal; font-size:12px;">(uma linha por disciplina do edital, agrupada por módulo)</span></p>
          <div id="tpl-blocos"></div>
          <button type="button" id="tpl-add-bloco" class="btn-link">+ Adicionar bloco</button>
          <p style="font-weight:600; margin:16px 0 4px;">Critérios de habilitação <span style="color:var(--color-text-muted); font-weight:normal; font-size:12px;">(todos precisam ser atingidos; ex.: TCE-SP = Gerais ≥ 12 questões E Específicas ≥ 36 questões)</span></p>
          <div id="tpl-criterios"></div>
          <button type="button" id="tpl-add-criterio" class="btn-link">+ Adicionar critério</button>
          <div class="form-field" style="margin-top:12px;">
            <label for="tpl-notas">Observações (opcional)</label>
            <input type="text" id="tpl-notas" value="${editing ? escapeHtml(editing.notes || "") : ""}" />
          </div>
          <button type="submit" class="btn" style="width:auto; padding:8px 20px;">${editing ? "Salvar alterações" : "Salvar modelo"}</button>
          ${editing ? `<button type="button" id="tpl-cancelar" class="btn-link" style="margin-left:12px;">Cancelar</button>` : ""}
        </form>
      </div>
      <div class="card">
        <h3 style="margin-top:0;">Modelos cadastrados (${templates.length})</h3>
        <div id="tpl-list"></div>
      </div>
    `;

    const tplAlert = tabModelos.querySelector("#tpl-alert");
    const blocosBox = tabModelos.querySelector("#tpl-blocos");
    const criteriosBox = tabModelos.querySelector("#tpl-criterios");

    if (editing) {
      tabModelos.querySelector("#tpl-cancelar").addEventListener("click", () => renderModelos(null));
    }

    function addBlocoRow(bloco) {
      const travado = bloco ? blocosTravados.has(bloco.id) : false;
      const moduloConhecido = !bloco || MODULOS_PADRAO.includes(bloco.module);
      const row = document.createElement("div");
      row.setAttribute("data-tpl-bloco-row", "");
      if (bloco) row.setAttribute("data-b-id", bloco.id);
      row.className = "form-grid-row form-grid-row--blocos";
      row.innerHTML = `
        <div class="form-field">
          <label>Módulo</label>
          <select data-b-modulo>
            ${MODULOS_PADRAO.map((m) => `<option value="${escapeHtml(m)}" ${bloco ? (bloco.module === m ? "selected" : "") : m === MODULOS_PADRAO[0] ? "selected" : ""}>${escapeHtml(m)}</option>`).join("")}
            <option value="__outro__" ${bloco && !moduloConhecido ? "selected" : ""}>Outro…</option>
          </select>
          <input type="text" data-b-modulo-outro placeholder="Nome do módulo" style="${bloco && !moduloConhecido ? "" : "display:none;"} margin-top:6px;" value="${bloco && !moduloConhecido ? escapeHtml(bloco.module || "") : ""}" />
        </div>
        <div class="form-field">
          <label>Disciplina</label>
          <select data-b-disciplina required>
            <option value="" disabled ${bloco ? "" : "selected"}>— Selecione —</option>
            ${disciplines.map((d) => `<option value="${d.id}" ${bloco?.discipline_id === d.id ? "selected" : ""}>${escapeHtml(d.name)}</option>`).join("")}
            <option value="__new__">+ Cadastrar nova disciplina…</option>
          </select>
          <input type="text" data-b-disciplina-nova placeholder="Nome da nova disciplina" style="display:none; margin-top:6px;" />
        </div>
        <div class="form-field">
          <label>Questões</label>
          <input type="number" data-b-questoes required min="1" step="1" value="${bloco?.questions ?? ""}" />
        </div>
        <div class="form-field">
          <label>Peso</label>
          <input type="number" data-b-peso required min="0.01" step="0.01" value="${bloco?.weight ?? 1}" />
        </div>
        ${travado
          ? `<span class="form-grid-row__action" style="color:var(--color-text-muted);" title="Bloco com resultados registrados — remover apagaria dados de tentativas antigas.">em uso</span>`
          : `<button type="button" class="btn-link form-grid-row__action" data-b-remover style="color:var(--color-error);">remover</button>`}
      `;
      const moduloSelect = row.querySelector("[data-b-modulo]");
      const moduloOutro = row.querySelector("[data-b-modulo-outro]");
      moduloSelect.addEventListener("change", () => {
        moduloOutro.style.display = moduloSelect.value === "__outro__" ? "block" : "none";
      });
      const discSelect = row.querySelector("[data-b-disciplina]");
      const discNova = row.querySelector("[data-b-disciplina-nova]");
      discSelect.addEventListener("change", () => {
        discNova.style.display = discSelect.value === "__new__" ? "block" : "none";
      });
      const btnRemover = row.querySelector("[data-b-remover]");
      if (btnRemover) btnRemover.addEventListener("click", () => row.remove());
      blocosBox.appendChild(row);
    }

    function addCriterioRow(regra) {
      const escopoAtual = !regra
        ? "total"
        : regra.scope === "total"
          ? "total"
          : regra.scope === "cada_bloco"
            ? "cada_bloco"
            : MODULOS_PADRAO.includes(regra.module_name)
              ? `modulo:${regra.module_name}`
              : "modulo:__outro__";
      const row = document.createElement("div");
      row.setAttribute("data-tpl-criterio-row", "");
      row.className = "form-grid-row form-grid-row--criterios";
      row.innerHTML = `
        <div class="form-field">
          <label>Escopo</label>
          <select data-c-escopo>
            <option value="total" ${escopoAtual === "total" ? "selected" : ""}>Total da prova</option>
            ${MODULOS_PADRAO.map((m) => `<option value="modulo:${escapeHtml(m)}" ${escopoAtual === `modulo:${m}` ? "selected" : ""}>Módulo: ${escapeHtml(m)}</option>`).join("")}
            <option value="modulo:__outro__" ${escopoAtual === "modulo:__outro__" ? "selected" : ""}>Módulo: outro…</option>
            <option value="cada_bloco" ${escopoAtual === "cada_bloco" ? "selected" : ""}>Cada bloco (ex.: não zerar nenhum)</option>
          </select>
          <input type="text" data-c-modulo-outro placeholder="Nome do módulo" style="${escopoAtual === "modulo:__outro__" ? "" : "display:none;"} margin-top:6px;" value="${escopoAtual === "modulo:__outro__" ? escapeHtml(regra?.module_name || "") : ""}" />
        </div>
        <div class="form-field">
          <label>Unidade</label>
          <select data-c-unidade>
            <option value="questoes" ${!regra || regra.kind === "questoes" ? "selected" : ""}>Nº de questões</option>
            <option value="pct" ${regra?.kind === "pct" ? "selected" : ""}>% de acerto</option>
            <option value="pontos" ${regra?.kind === "pontos" ? "selected" : ""}>Pontos</option>
          </select>
        </div>
        <div class="form-field">
          <label>Mínimo</label>
          <input type="number" data-c-valor required min="0" step="0.01" value="${regra?.value ?? ""}" />
        </div>
        <button type="button" class="btn-link form-grid-row__action" data-c-remover style="color:var(--color-error);">remover</button>
      `;
      const escopoSelect = row.querySelector("[data-c-escopo]");
      const moduloOutro = row.querySelector("[data-c-modulo-outro]");
      escopoSelect.addEventListener("change", () => {
        moduloOutro.style.display = escopoSelect.value === "modulo:__outro__" ? "block" : "none";
      });
      row.querySelector("[data-c-remover]").addEventListener("click", () => row.remove());
      criteriosBox.appendChild(row);
    }

    tabModelos.querySelector("#tpl-add-bloco").addEventListener("click", () => addBlocoRow(null));
    tabModelos.querySelector("#tpl-add-criterio").addEventListener("click", () => addCriterioRow(null));
    if (editing) {
      blocosDoEdit.forEach((b) => addBlocoRow(b));
      regrasDoEdit.forEach((r) => addCriterioRow(r));
    } else {
      addBlocoRow(null);
    }

    tabModelos.querySelector("#tpl-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      tplAlert.innerHTML = "";
      const blocoRows = [...blocosBox.querySelectorAll("[data-tpl-bloco-row]")];
      if (blocoRows.length === 0) {
        tplAlert.innerHTML = `<div class="alert alert--error">Adicione pelo menos um bloco.</div>`;
        return;
      }

      try {
        // Disciplinas novas: cria primeiro (com cache por nome normalizado —
        // duas linhas com a mesma disciplina nova viram UMA criação; a trava
        // de unicidade do banco pega o resto/corridas).
        const novasCriadas = {};
        const blocks = [];
        for (const row of blocoRows) {
          const moduloSel = row.querySelector("[data-b-modulo]").value;
          const modulo = moduloSel === "__outro__" ? row.querySelector("[data-b-modulo-outro]").value.trim() : moduloSel;
          if (!modulo) {
            tplAlert.innerHTML = `<div class="alert alert--error">Informe o nome do módulo em "Outro…".</div>`;
            return;
          }
          let disciplineId = row.querySelector("[data-b-disciplina]").value;
          let disciplineName;
          if (disciplineId === "__new__") {
            const nome = row.querySelector("[data-b-disciplina-nova]").value.trim();
            if (!nome) {
              tplAlert.innerHTML = `<div class="alert alert--error">Informe o nome da nova disciplina.</div>`;
              return;
            }
            const chave = normalizeForCompare(nome);
            if (novasCriadas[chave]) {
              disciplineId = novasCriadas[chave].id;
              disciplineName = novasCriadas[chave].name;
            } else {
              const jaExiste = disciplines.find((d) => normalizeForCompare(d.name) === chave);
              if (jaExiste) {
                disciplineId = jaExiste.id;
                disciplineName = jaExiste.name;
              } else {
                const criada = await createDiscipline({ name: nome, userId: user.id });
                disciplines.push(criada);
                novasCriadas[chave] = criada;
                disciplineId = criada.id;
                disciplineName = criada.name;
              }
            }
          } else {
            const d = disciplines.find((x) => x.id === disciplineId);
            disciplineName = d?.name || "";
          }
          blocks.push({
            id: row.dataset.bId || null,
            name: disciplineName,
            module: modulo,
            disciplineId,
            questions: Number(row.querySelector("[data-b-questoes]").value),
            weight: Number(row.querySelector("[data-b-peso]").value),
          });
        }

        const rules = [...criteriosBox.querySelectorAll("[data-tpl-criterio-row]")].map((row) => {
          const escopoRaw = row.querySelector("[data-c-escopo]").value;
          let scope, moduleName = null;
          if (escopoRaw === "total") scope = "total";
          else if (escopoRaw === "cada_bloco") scope = "cada_bloco";
          else {
            scope = "modulo";
            moduleName = escopoRaw === "modulo:__outro__" ? row.querySelector("[data-c-modulo-outro]").value.trim() : escopoRaw.slice("modulo:".length);
          }
          return { scope, moduleName, kind: row.querySelector("[data-c-unidade]").value, value: Number(row.querySelector("[data-c-valor]").value) };
        });
        for (const r of rules) {
          if (r.scope === "modulo" && !blocks.some((b) => b.module === r.moduleName)) {
            tplAlert.innerHTML = `<div class="alert alert--error">O critério aponta pro módulo "${escapeHtml(r.moduleName || "")}", mas nenhum bloco pertence a ele.</div>`;
            return;
          }
        }

        const corteRaw = tabModelos.querySelector("#tpl-corte").value;
        const duracaoRaw = tabModelos.querySelector("#tpl-duracao").value;
        const dados = {
          userId: user.id,
          name: tabModelos.querySelector("#tpl-nome").value.trim(),
          boardId: tabModelos.querySelector("#tpl-banca").value || null,
          scoringMode: tabModelos.querySelector("#tpl-modo").value,
          durationMinutes: duracaoRaw === "" ? null : Number(duracaoRaw),
          cutoffScore: corteRaw === "" ? null : Number(corteRaw),
          notes: tabModelos.querySelector("#tpl-notas").value.trim(),
          blocks,
          rules,
        };
        if (editing) await updateTemplate({ id: editing.id, ...dados });
        else await createTemplate(dados);
        await carregarDados();
        renderModelos(null);
        renderTentativas();
      } catch (err) {
        const msg = err?.code === "23505" ? "Já existe uma disciplina sua com esse nome — selecione-a na lista." : err.message;
        tplAlert.innerHTML = `<div class="alert alert--error">Erro ao salvar modelo: ${escapeHtml(msg)}</div>`;
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
          const regras = regrasDoModelo(t.id);
          const totalQ = blocos.reduce((acc, b) => acc + b.questions, 0);
          const totalPts = blocos.reduce((acc, b) => acc + b.questions * Number(b.weight), 0);
          const nTentativas = attempts.filter((a) => a.template_id === t.id).length;
          return `
            <tr data-tpl-row="${t.id}" style="cursor:pointer;${t.status === "inativo" ? " opacity:0.6;" : ""}">
              <td>${escapeHtml(t.name)}</td>
              <td>${blocos.length} bloco(s) · ${totalQ}q · ${fmtNota(totalPts)} pts${t.duration_minutes ? ` · ${t.duration_minutes} min` : ""}</td>
              <td>${t.scoring_mode === "liquido" ? "Líquida" : "Bruta"}</td>
              <td>${nTentativas}</td>
              <td>
                <div class="row-actions">
                  <button class="btn-link" data-tpl-edit="${t.id}">Editar</button>
                  <span class="row-actions__sep">|</span>
                  <button class="btn-link" data-tpl-toggle="${t.id}" data-next="${t.status === "ativo" ? "inativo" : "ativo"}">${t.status === "ativo" ? "Arquivar" : "Reativar"}</button>
                </div>
              </td>
            </tr>
            <tr data-tpl-detail="${t.id}" style="display:none;">
              <td colspan="5" style="background:var(--color-bg-subtle, #f5f5f5);">
                <p style="margin:4px 0; font-size:12px; color:var(--color-text-muted);">${t.duration_minutes ? `Duração: ${t.duration_minutes} min · ` : ""}${t.cutoff_score != null ? `Corte estimado: ${fmtNota(t.cutoff_score)} · ` : ""}${escapeHtml(t.notes || "")}</p>
                ${regras.length ? `<p style="margin:4px 0;"><strong>Habilitação:</strong> ${regras.map((r) => escapeHtml(descreverRegra(r))).join(" E ")}</p>` : ""}
                <div style="overflow-x:auto;">
                  <table class="data-table" style="margin:8px 0;">
                    <tr><th>Módulo</th><th>Disciplina</th><th>Questões</th><th>Peso</th></tr>
                    ${blocos.map((b) => `<tr><td style="font-size:12px; color:var(--color-text-muted);">${escapeHtml(b.module || "—")}</td><td>${escapeHtml(b.name)}</td><td>${b.questions}</td><td>${b.weight}</td></tr>`).join("")}
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

      listBox.querySelectorAll("[data-tpl-edit]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const t = templates.find((x) => x.id === btn.dataset.tplEdit);
          renderModelos(t);
          tabModelos.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });

      listBox.querySelectorAll("[data-tpl-toggle]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            await setTemplateStatus(btn.dataset.tplToggle, btn.dataset.next);
            await carregarDados();
            renderModelos(null);
            renderTentativas();
          } catch (err) {
            window.alert("Erro: " + (err.message || "desconhecido"));
            btn.disabled = false;
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

const DIACRITICOS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeForCompare(text) {
  return (text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICOS_REGEX, "");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
