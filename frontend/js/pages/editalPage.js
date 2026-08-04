// Tela "Edital" (03/08/2026) — conteúdo programático e cobertura.
//
// Duas sub-abas, refletindo os dois momentos de uso:
//   Cobertura — leitura do dia a dia: o que do edital já foi estudado, o que
//     está crítico, o que nunca foi tocado. É a tela que responde "quanto do
//     edital eu cobri" e alimenta o cronograma depois.
//   Conteúdo — o trabalho de montagem: colar o edital em lote e ligar cada
//     tópico aos cadernos. Feito uma vez (e ajustado pontualmente depois).
//   Capacidade (04/08/2026) — "dá tempo?". Confronta o que falta cobrir com o
//     ritmo REAL do usuário (horas/semana e questões/hora medidas no histórico)
//     dentro de um horizonte escolhido. Mora aqui, e não numa tela própria,
//     porque sem o escopo do edital a pergunta não tem denominador: "faltam
//     quantas horas" só existe depois de "faltam quais assuntos".
//
// A ligação tópico↔caderno é o gargalo real da feature — 1120 cadernos no
// catálogo. Por isso o mapeamento não é digitação: o sistema sugere
// candidatos por similaridade de nome e o usuário confirma com um clique.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listExams, listDisciplines, listQuestionSets } from "../services/catalogService.js";
import {
  listTopics,
  listVinculos,
  listCobertura,
  createTopics,
  deleteTopic,
  vincularCaderno,
  desvincularCaderno,
  sugerirCadernos,
  updateTopic,
  splitTopic,
  sugerirDivisao,
  countTopicsByExam,
} from "../services/editalService.js";
import { listWeights } from "../services/weightService.js";
import {
  getRitmo,
  getProdutividade,
  calcularCapacidade,
  META_QUESTOES_PADRAO,
} from "../services/capacidadeService.js";
import { getState } from "../state.js";
import { formatPct } from "../utils/format.js";

const SITUACAO = {
  sem_caderno: { label: "Sem caderno vinculado", cor: "var(--color-text-muted)" },
  nao_estudado: { label: "Não estudado", cor: "#b45309" },
  preliminar: { label: "Poucos dados", cor: "var(--color-text-muted)" },
  critico: { label: "Crítico", cor: "var(--color-error)" },
  atencao: { label: "Atenção", cor: "#b45309" },
  consolidado: { label: "Consolidado", cor: "var(--color-success)" },
};

export async function renderEditalPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/edital")}
        <main class="app-content">
          <h2 class="form-title">Edital</h2>
          <p style="color:var(--color-text-muted); margin-top:-8px;">
            Confronte o conteúdo programático com o que você já estudou. Cada tópico é ligado aos cadernos que o cobrem — um tópico pode ter vários cadernos, e é isso que permite medir cobertura sem bagunçar o catálogo.
          </p>
          <div class="form-field" style="max-width:320px;">
            <label for="edital-exam">Concurso</label>
            <select id="edital-exam"></select>
          </div>
          <div class="subtabs">
            <button type="button" class="subtab-btn subtab-btn--active" data-subtab="cobertura">Cobertura</button>
            <button type="button" class="subtab-btn" data-subtab="conteudo">Conteúdo</button>
            <button type="button" class="subtab-btn" data-subtab="capacidade">Capacidade</button>
          </div>
          <div id="tab-cobertura"><p>Carregando…</p></div>
          <div id="tab-conteudo" style="display:none;"><p>Carregando…</p></div>
          <div id="tab-capacidade" style="display:none;"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const { user } = getState();
  const tabCobertura = container.querySelector("#tab-cobertura");
  const tabConteudo = container.querySelector("#tab-conteudo");
  const tabCapacidade = container.querySelector("#tab-capacidade");
  const examSelect = container.querySelector("#edital-exam");

  container.querySelectorAll("[data-subtab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const alvo = btn.dataset.subtab;
      container.querySelectorAll("[data-subtab]").forEach((b) => b.classList.toggle("subtab-btn--active", b === btn));
      tabCobertura.style.display = alvo === "cobertura" ? "block" : "none";
      tabConteudo.style.display = alvo === "conteudo" ? "block" : "none";
      tabCapacidade.style.display = alvo === "capacidade" ? "block" : "none";
    });
  });

  let exams = [];
  let disciplines = [];
  let cadernos = [];
  let topicos = [];
  let vinculos = [];
  let cobertura = [];
  let examId = null;
  let pesos = [];
  let topicosPorExam = new Map();
  let ritmo = null;
  let produtividade = null;

  // Estado dos campos editáveis da aba Capacidade. Nasce do MEDIDO (ritmo e
  // produtividade vindos do histórico); o usuário pode sobrescrever pra simular
  // cenário, e a tela mostra o valor medido ao lado — assim fica sempre claro
  // quando ele está olhando dado e quando está olhando desejo.
  //
  // Declarado AQUI e não junto de renderCapacidade (04/08/2026, bug): `const`
  // fica em zona morta temporal até a linha executar, e carregar() roda antes
  // — renderCapacidade estourava ReferenceError e a aba ficava eternamente em
  // "Carregando…". Declaração de estado tem que vir antes da primeira carga.
  const cap = {
    horizonte: 26,
    horasPorSemana: null,
    questoesPorHora: null,
    metaQuestoes: META_QUESTOES_PADRAO,
  };

  try {
    [exams, disciplines, cadernos, pesos, topicosPorExam, ritmo, produtividade] = await Promise.all([
      listExams(),
      listDisciplines(),
      listQuestionSets(),
      listWeights(),
      countTopicsByExam(),
      getRitmo(),
      getProdutividade(),
    ]);
  } catch (err) {
    tabCobertura.innerHTML = `<div class="alert alert--error">Erro ao carregar: ${escapeHtml(err.message)}</div>`;
    return;
  }

  if (exams.length === 0) {
    tabCobertura.innerHTML = `<div class="card"><p style="color:var(--color-text-muted);">Cadastre um concurso em Planejamento antes de montar o edital.</p></div>`;
    tabConteudo.innerHTML = "";
    return;
  }

  // Rótulo com data e nº de tópicos: sem isso, dois concursos de nome parecido
  // (ou um com data já vencida) ficam indistinguíveis no select.
  const rotuloExam = (e) => {
    const n = topicosPorExam.get(e.id) || 0;
    const partes = [];
    if (e.exam_date) partes.push(new Date(e.exam_date + "T12:00:00").toLocaleDateString("pt-BR"));
    partes.push(n === 0 ? "sem tópicos" : `${n} tópico(s)`);
    return `${e.name} — ${partes.join(" · ")}`;
  };
  examSelect.innerHTML = exams.map((e) => `<option value="${e.id}">${escapeHtml(rotuloExam(e))}</option>`).join("");
  // Padrão = concurso que JÁ tem tópicos (o edital em que se está trabalhando).
  // Empate ou nenhum: cai no primeiro, como antes.
  const comMaisTopicos = [...exams].sort((a, b) => (topicosPorExam.get(b.id) || 0) - (topicosPorExam.get(a.id) || 0))[0];
  examId = comMaisTopicos.id;
  examSelect.value = examId;
  examSelect.addEventListener("change", async () => {
    examId = examSelect.value;
    await carregar();
  });

  const cadernosById = new Map(cadernos.map((c) => [c.id, c]));
  const disciplinasById = new Map(disciplines.map((d) => [d.id, d.name]));

  await carregar();

  async function carregar() {
    try {
      [topicos, vinculos, cobertura] = await Promise.all([listTopics(examId), listVinculos(examId), listCobertura(examId)]);
    } catch (err) {
      tabCobertura.innerHTML = `<div class="alert alert--error">Erro ao carregar: ${escapeHtml(err.message)}</div>`;
      return;
    }
    // Cada render isolado: um erro numa aba não pode deixar as outras (nem ela
    // mesma) presas em "Carregando…" para sempre. Tela em branco silenciosa é
    // o pior modo de falha possível — some sem deixar rastro pro usuário.
    renderSeguro(tabCobertura, renderCobertura);
    renderSeguro(tabConteudo, renderConteudo);
    renderSeguro(tabCapacidade, renderCapacidade);
  }

  function renderSeguro(alvo, fn) {
    try {
      fn();
    } catch (err) {
      console.error("[edital] falha ao renderizar", err);
      alvo.innerHTML = `<div class="alert alert--error">Erro ao montar esta aba: ${escapeHtml(err.message || String(err))}</div>`;
    }
  }

  // ==================== COBERTURA ====================
  function renderCobertura() {
    if (topicos.length === 0) {
      tabCobertura.innerHTML = `
        <div class="card">
          <p style="color:var(--color-text-muted);">Nenhum tópico cadastrado para este concurso. Vá em <strong>Conteúdo</strong> e cole o conteúdo programático — uma linha por tópico.</p>
        </div>
      `;
      return;
    }

    const total = cobertura.length;
    const estudados = cobertura.filter((c) => c.questoes > 0).length;
    const semCaderno = cobertura.filter((c) => c.situacao === "sem_caderno").length;
    const criticos = cobertura.filter((c) => c.situacao === "critico").length;
    const consolidados = cobertura.filter((c) => c.situacao === "consolidado").length;
    const pctCobertura = total > 0 ? (estudados / total) * 100 : 0;

    // Agrupado por disciplina: é assim que o cronograma vai alocar tempo, e
    // olhar 150 tópicos numa lista única não é acionável.
    const porDisciplina = new Map();
    for (const c of cobertura) {
      const k = c.disciplinaNome || "(sem disciplina)";
      const g = porDisciplina.get(k) || { itens: [], estudados: 0 };
      g.itens.push(c);
      if (c.questoes > 0) g.estudados += 1;
      porDisciplina.set(k, g);
    }

    tabCobertura.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Resumo</h3>
        <p style="margin:4px 0;">
          <strong>${estudados}</strong> de <strong>${total}</strong> tópicos com questões resolvidas (<strong>${formatPct(pctCobertura)}</strong> do edital).
          ${criticos > 0 ? ` · <span style="color:var(--color-error);">${criticos} crítico(s)</span>` : ""}
          ${consolidados > 0 ? ` · <span style="color:var(--color-success);">${consolidados} consolidado(s)</span>` : ""}
        </p>
        ${semCaderno > 0 ? `<p style="margin:4px 0; color:var(--color-text-muted); font-size:13px;">${semCaderno} tópico(s) ainda sem caderno vinculado — enquanto não tiverem, aparecem como não cobertos mesmo que você tenha estudado o assunto.</p>` : ""}
      </div>
      ${[...porDisciplina.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(
          ([disc, g]) => `
        <div class="card" style="margin-bottom:16px;">
          <h3 style="margin-top:0;">${escapeHtml(disc)} <span style="font-weight:normal; font-size:13px; color:var(--color-text-muted);">— ${g.estudados}/${g.itens.length} tópicos com questões</span></h3>
          <div style="overflow-x:auto;">
            <table class="data-table data-table--fixed" style="min-width:680px;">
              <tr><th>Tópico</th><th class="cel-centro" style="width:90px;">Cadernos</th><th class="cel-centro" style="width:90px;">Questões</th><th class="cel-centro" style="width:90px;">Wilson</th><th class="cel-centro" style="width:150px;">Situação</th></tr>
              ${g.itens
                .map((c) => {
                  const s = SITUACAO[c.situacao] || { label: c.situacao, cor: "var(--color-text-muted)" };
                  return `
                  <tr>
                    <td>${escapeHtml(c.topicoNome)}</td>
                    <td class="cel-centro">${c.cadernosVinculados}</td>
                    <td class="cel-centro">${c.questoes}</td>
                    <td class="cel-centro">${formatPct(c.wilson)}</td>
                    <td class="cel-centro" style="color:${s.cor}; font-weight:600;">${s.label}</td>
                  </tr>
                `;
                })
                .join("")}
            </table>
          </div>
        </div>
      `
        )
        .join("")}
    `;
  }

  // ==================== CONTEÚDO ====================
  function renderConteudo() {
    tabConteudo.innerHTML = `
      <div class="card card--form" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Adicionar tópicos em lote</h3>
        <p style="color:var(--color-text-muted); margin-top:0; font-size:13px;">Cole o conteúdo programático, <strong>uma linha por tópico</strong>. Escolha a disciplina à qual essas linhas pertencem e repita para cada disciplina do edital.</p>
        <div id="topico-alert"></div>
        <form id="topico-form">
          <div class="form-field">
            <label for="topico-disciplina">Disciplina</label>
            <select id="topico-disciplina" required>
              <option value="" disabled selected>— Selecione —</option>
              ${disciplines.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-field">
            <label for="topico-texto">Tópicos (um por linha)</label>
            <textarea id="topico-texto" rows="8" style="width:100%; box-sizing:border-box; padding:8px 12px; border:1px solid var(--color-border); border-radius:var(--radius); font-size:14px; font-family:inherit;" placeholder="Orçamento público: conceitos e princípios&#10;Ciclo orçamentário&#10;PPA, LDO e LOA"></textarea>
          </div>
          <div class="form-actions"><button type="submit" class="btn">Adicionar tópicos</button></div>
        </form>
      </div>
      <div class="card">
        <h3 style="margin-top:0;">Tópicos cadastrados (${topicos.length})</h3>
        <p style="color:var(--color-text-muted); margin-top:0; font-size:13px;">Clique num tópico para vincular cadernos. As sugestões vêm por semelhança de nome, dentro da disciplina do tópico.</p>
        <div id="topicos-lista"></div>
      </div>
    `;

    const alert = tabConteudo.querySelector("#topico-alert");
    tabConteudo.querySelector("#topico-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      alert.innerHTML = "";
      const disciplineId = tabConteudo.querySelector("#topico-disciplina").value;
      const linhas = tabConteudo
        .querySelector("#topico-texto")
        .value.split("\n")
        .map((l) => l.trim())
        // Remove numeração comum de edital ("1.", "2.3 ", "- ") pra o nome
        // ficar limpo e a sugestão por similaridade não ser poluída.
        .map((l) => l.replace(/^[\d.]+\s*[-–)]?\s*/, "").replace(/^[-–•]\s*/, "").trim())
        .filter((l) => l.length > 2)
        .map((name) => ({ name, disciplineId }));
      if (linhas.length === 0) {
        alert.innerHTML = `<div class="alert alert--error">Cole pelo menos um tópico.</div>`;
        return;
      }
      try {
        await createTopics({ userId: user.id, examId, linhas });
        tabConteudo.querySelector("#topico-texto").value = "";
        await carregar();
      } catch (err) {
        alert.innerHTML = `<div class="alert alert--error">Erro ao salvar: ${escapeHtml(err.message)}</div>`;
      }
    });

    renderListaTopicos();
  }

  function renderListaTopicos() {
    const box = tabConteudo.querySelector("#topicos-lista");
    if (topicos.length === 0) {
      box.innerHTML = `<p style="color:var(--color-text-muted);">Nenhum tópico ainda.</p>`;
      return;
    }
    const vincPorTopico = new Map();
    for (const v of vinculos) {
      const l = vincPorTopico.get(v.topicId) || [];
      l.push(v);
      vincPorTopico.set(v.topicId, l);
    }

    box.innerHTML = topicos
      .map((t) => {
        const vs = vincPorTopico.get(t.id) || [];
        return `
        <div style="border-bottom:1px solid var(--color-border); padding:10px 0;">
          <div style="display:flex; gap:10px; align-items:baseline; flex-wrap:wrap;">
            <strong style="cursor:pointer;" data-topico-toggle="${t.id}">${escapeHtml(t.name)}</strong>
            <span style="font-size:12px; color:var(--color-text-muted);">${escapeHtml(disciplinasById.get(t.discipline_id) || "—")} · ${vs.length} caderno(s)</span>
            <button class="btn-link" style="font-size:12px;" data-topico-edit="${t.id}">editar</button>
            <button class="btn-link" style="font-size:12px;" data-topico-split="${t.id}">dividir</button>
            <button class="btn-link" style="color:var(--color-error); font-size:12px;" data-topico-del="${t.id}">remover</button>
          </div>
          <div data-topico-edit-painel="${t.id}" style="display:none; margin-top:8px;"></div>
          <div data-topico-split-painel="${t.id}" style="display:none; margin-top:8px;"></div>
          <div data-topico-painel="${t.id}" style="display:none; margin-top:8px;">
            ${vs.length > 0 ? `
              <p style="margin:4px 0; font-size:12px; color:var(--color-text-muted);">Vinculados:</p>
              <ul style="margin:0 0 8px; padding-left:18px; font-size:13px;">
                ${vs.map((v) => `<li>${escapeHtml(cadernosById.get(v.questionSetId)?.name || "(caderno removido)")} <button class="btn-link" style="color:var(--color-error); font-size:11px;" data-desvincular="${v.id}">desvincular</button></li>`).join("")}
              </ul>` : ""}
            <div data-sugestoes="${t.id}"></div>
          </div>
        </div>
      `;
      })
      .join("");

    box.querySelectorAll("[data-topico-toggle]").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.topicoToggle;
        const painel = box.querySelector(`[data-topico-painel="${id}"]`);
        const abrindo = painel.style.display === "none";
        painel.style.display = abrindo ? "block" : "none";
        if (abrindo) renderSugestoes(id);
      });
    });

    box.querySelectorAll("[data-topico-edit]").forEach((btn) => {
      btn.addEventListener("click", () => abrirEdicao(btn.dataset.topicoEdit));
    });

    box.querySelectorAll("[data-topico-split]").forEach((btn) => {
      btn.addEventListener("click", () => abrirDivisao(btn.dataset.topicoSplit));
    });

    box.querySelectorAll("[data-topico-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!window.confirm("Remover este tópico e seus vínculos?")) return;
        try {
          await deleteTopic(btn.dataset.topicoDel);
          await carregar();
        } catch (err) {
          window.alert("Erro: " + (err.message || "desconhecido"));
        }
      });
    });

    box.querySelectorAll("[data-desvincular]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await desvincularCaderno(btn.dataset.desvincular);
          await carregar();
        } catch (err) {
          window.alert("Erro: " + (err.message || "desconhecido"));
        }
      });
    });
  }

  function abrirEdicao(topicId) {
    const t = topicos.find((x) => x.id === topicId);
    const painel = tabConteudo.querySelector(`[data-topico-edit-painel="${topicId}"]`);
    if (painel.style.display === "block") {
      painel.style.display = "none";
      return;
    }
    painel.style.display = "block";
    painel.innerHTML = `
      <div style="background:var(--color-bg-subtle, #f5f5f5); padding:10px; border-radius:var(--radius);">
        <div class="form-field">
          <label>Nome do tópico</label>
          <textarea data-edit-nome rows="3" style="width:100%; box-sizing:border-box; padding:8px; border:1px solid var(--color-border); border-radius:var(--radius); font-size:13px; font-family:inherit;">${escapeHtml(t.name)}</textarea>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <div class="form-field" style="flex:1; min-width:200px;">
            <label>Disciplina</label>
            <select data-edit-disciplina>
              ${disciplines.map((d) => `<option value="${d.id}" ${t.discipline_id === d.id ? "selected" : ""}>${escapeHtml(d.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-field" style="width:180px;">
            <label>Questões esperadas</label>
            <input type="number" data-edit-questoes min="0" step="1" value="${t.expected_questions ?? ""}" />
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn" data-edit-salvar="${topicId}">Salvar</button>
          <button type="button" class="btn-link" data-edit-cancelar="${topicId}">Cancelar</button>
        </div>
      </div>
    `;
    painel.querySelector(`[data-edit-cancelar="${topicId}"]`).addEventListener("click", () => {
      painel.style.display = "none";
    });
    painel.querySelector(`[data-edit-salvar="${topicId}"]`).addEventListener("click", async (e) => {
      e.target.disabled = true;
      const q = painel.querySelector("[data-edit-questoes]").value;
      try {
        await updateTopic(topicId, {
          name: painel.querySelector("[data-edit-nome]").value.trim(),
          disciplineId: painel.querySelector("[data-edit-disciplina]").value,
          expectedQuestions: q === "" ? null : Number(q),
        });
        await carregar();
      } catch (err) {
        window.alert("Erro ao salvar: " + (err.message || "desconhecido"));
        e.target.disabled = false;
      }
    });
  }

  function abrirDivisao(topicId) {
    const t = topicos.find((x) => x.id === topicId);
    const painel = tabConteudo.querySelector(`[data-topico-split-painel="${topicId}"]`);
    if (painel.style.display === "block") {
      painel.style.display = "none";
      return;
    }
    painel.style.display = "block";
    const partes = sugerirDivisao(t.name);
    const nVinculos = vinculos.filter((v) => v.topicId === topicId).length;
    painel.innerHTML = `
      <div style="background:var(--color-bg-subtle, #f5f5f5); padding:10px; border-radius:var(--radius);">
        <p style="margin:0 0 6px; font-size:13px;"><strong>Dividir em ${partes.length} tópicos.</strong> Revise e ajuste — uma linha por tópico.</p>
        ${nVinculos > 0 ? `<div class="alert" style="background:#fff4e5; color:#b45309; border:1px solid #ffe0b2; font-size:13px;">Este tópico tem ${nVinculos} caderno(s) vinculado(s). Ao dividir, os vínculos são descartados: cada parte precisa do próprio mapeamento, senão a cobertura ficaria falsa (todo caderno contando pra todo assunto).</div>` : ""}
        <div class="form-field">
          <textarea data-split-texto rows="10" style="width:100%; box-sizing:border-box; padding:8px; border:1px solid var(--color-border); border-radius:var(--radius); font-size:13px; font-family:inherit;">${escapeHtml(partes.join("\n"))}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn" data-split-confirmar="${topicId}">Dividir</button>
          <button type="button" class="btn-link" data-split-cancelar="${topicId}">Cancelar</button>
        </div>
      </div>
    `;
    painel.querySelector(`[data-split-cancelar="${topicId}"]`).addEventListener("click", () => {
      painel.style.display = "none";
    });
    painel.querySelector(`[data-split-confirmar="${topicId}"]`).addEventListener("click", async (e) => {
      const linhas = painel.querySelector("[data-split-texto]").value.split("\n").map((l) => l.trim()).filter((l) => l.length > 2);
      if (linhas.length < 2) {
        window.alert("Precisa de pelo menos 2 linhas pra dividir.");
        return;
      }
      if (!window.confirm(`Dividir em ${linhas.length} tópicos? O tópico original será removido.`)) return;
      e.target.disabled = true;
      try {
        await splitTopic({ userId: user.id, examId, topicId, partes: linhas, disciplineId: t.discipline_id });
        await carregar();
      } catch (err) {
        window.alert("Erro ao dividir: " + (err.message || "desconhecido"));
        e.target.disabled = false;
      }
    });
  }

  function renderSugestoes(topicId) {
    const t = topicos.find((x) => x.id === topicId);
    const box = tabConteudo.querySelector(`[data-sugestoes="${topicId}"]`);
    const jaVinculados = new Set(vinculos.filter((v) => v.topicId === topicId).map((v) => v.questionSetId));
    const ativos = cadernos.filter((c) => c.status !== "inativo" && !jaVinculados.has(c.id));
    const sugestoes = sugerirCadernos({ name: t.name, disciplineId: t.discipline_id }, ativos);

    box.innerHTML = `
      <p style="margin:4px 0; font-size:12px; color:var(--color-text-muted);">Sugestões (por semelhança de nome):</p>
      ${sugestoes.length === 0
        ? '<p style="font-size:13px; color:var(--color-text-muted);">Nenhuma sugestão automática. Use a busca abaixo.</p>'
        : sugestoes
            .map(
              (s) => `
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:4px;">
          <button class="btn-link" data-vincular="${s.caderno.id}" data-topico="${topicId}">+ vincular</button>
          <span style="font-size:13px;">${escapeHtml(s.caderno.name)}</span>
        </div>
      `
            )
            .join("")}
      <div class="form-field" style="margin-top:8px; max-width:420px;">
        <label>Buscar caderno manualmente</label>
        <input type="text" data-busca-caderno="${topicId}" placeholder="Digite parte do nome..." />
        <div data-busca-resultado="${topicId}" style="margin-top:6px;"></div>
      </div>
    `;

    box.querySelectorAll("[data-vincular]").forEach((btn) => wireVincular(btn));

    const busca = box.querySelector(`[data-busca-caderno="${topicId}"]`);
    busca.addEventListener("input", () => {
      const termo = busca.value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const res = box.querySelector(`[data-busca-resultado="${topicId}"]`);
      if (termo.length < 3) {
        res.innerHTML = "";
        return;
      }
      const achados = ativos
        .filter((c) => c.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(termo))
        .slice(0, 10);
      res.innerHTML = achados.length === 0
        ? '<p style="font-size:12px; color:var(--color-text-muted);">Nada encontrado.</p>'
        : achados
            .map(
              (c) => `
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:4px;">
          <button class="btn-link" data-vincular="${c.id}" data-topico="${topicId}">+ vincular</button>
          <span style="font-size:13px;">${escapeHtml(c.name)}</span>
        </div>`
            )
            .join("");
      res.querySelectorAll("[data-vincular]").forEach((btn) => wireVincular(btn));
    });
  }

  // ==================== CAPACIDADE ====================
  function renderCapacidade() {
    if (cap.horasPorSemana == null) cap.horasPorSemana = ritmo?.horasPorSemana ?? 0;
    if (cap.questoesPorHora == null) cap.questoesPorHora = produtividade?.questoesPorHora ?? 0;

    const disciplinasEscopo = pesos
      .filter((p) => p.exam_id === examId)
      .map((p) => ({ id: p.discipline_id, nome: p.disciplines?.name || "—", peso: p.weight }));

    const r = calcularCapacidade({
      cobertura,
      disciplinasEscopo,
      horizonteSemanas: cap.horizonte,
      horasPorSemana: cap.horasPorSemana,
      questoesPorHora: cap.questoesPorHora,
      metaQuestoes: cap.metaQuestoes,
    });

    if (cobertura.length === 0) {
      tabCapacidade.innerHTML = `
        <div class="card">
          <p style="color:var(--color-text-muted);">Sem tópicos cadastrados, não há como responder "dá tempo?" — a pergunta precisa de um denominador. Monte o conteúdo programático em <strong>Conteúdo</strong> primeiro.</p>
        </div>`;
      return;
    }

    const semanasFalta = r.horasCobertura != null && cap.horasPorSemana > 0
      ? Math.ceil(r.horasCobertura / cap.horasPorSemana)
      : null;

    tabCapacidade.innerHTML = `
      <div class="card card--form-stack" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Premissas</h3>
        <p style="color:var(--color-text-muted); margin-top:0; font-size:13px;">
          Os dois primeiros valores foram <strong>medidos no seu histórico</strong>, não arbitrados. Altere para simular cenários — o valor medido continua exibido ao lado.
        </p>
        <div class="form-grid-row">
          <div class="form-field">
            <label>Horizonte (semanas)</label>
            <input type="number" id="cap-horizonte" min="1" max="200" step="1" value="${cap.horizonte}" />
            <small style="color:var(--color-text-muted);">${(cap.horizonte / 4.345).toFixed(1)} meses</small>
          </div>
          <div class="form-field">
            <label>Horas por semana</label>
            <input type="number" id="cap-horas" min="0" step="0.5" value="${cap.horasPorSemana}" />
            <small style="color:var(--color-text-muted);">medido: ${ritmo?.horasPorSemana ?? 0} h — ${escapeHtml(ritmo?.fonte || "")}</small>
          </div>
          <div class="form-field">
            <label>Questões por hora</label>
            <input type="number" id="cap-qph" min="0" step="0.5" value="${cap.questoesPorHora}" />
            <small style="color:var(--color-text-muted);">medido: ${produtividade?.questoesPorHora ?? 0} q/h — ${escapeHtml(produtividade?.fonte || "")}</small>
          </div>
          <div class="form-field">
            <label>Questões por tópico (massa crítica)</label>
            <input type="number" id="cap-meta" min="5" step="5" value="${cap.metaQuestoes}" />
            <small style="color:var(--color-text-muted);">mesmo limiar do diagnóstico Wilson</small>
          </div>
        </div>
      </div>

      ${!r.confiavel ? `
      <div class="alert" style="background:#fff4e5; color:#b45309; border:1px solid #ffe0b2; margin-bottom:16px;">
        <strong>Este número é um piso, não uma estimativa.</strong>
        ${r.foraDaConta.length > 0 ? `<br>${r.foraDaConta.length} disciplina(s) do concurso não têm nenhum tópico cadastrado e ficaram inteiramente fora da conta: ${escapeHtml(r.foraDaConta.map((d) => d.nome).join(", "))}.` : ""}
        ${r.topicosSemCaderno > 0 ? `<br>${r.topicosSemCaderno} tópico(s) não têm caderno vinculado — o custo deles é desconhecido, não zero, então também ficaram de fora.` : ""}
        ${r.topicosBloco > 0 ? `<br><br><strong>Granularidade insuficiente:</strong> ${r.topicosBloco} tópico(s) têm ${r.limiarBloco}+ cadernos vinculados — são blocos de disciplina, não assuntos. A conta trata cada um como uma única unidade de ${cap.metaQuestoes} questões, o que subestima grosseiramente o esforço. Use <strong>dividir</strong> na aba Conteúdo antes de levar este número a sério.` : ""}
      </div>` : ""}

      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Orçamento</h3>
        <table class="data-table" style="max-width:640px;">
          <tr><td>Horas disponíveis no horizonte</td><td class="cel-centro"><strong>${r.horasDisponiveis} h</strong></td></tr>
          <tr><td>Horas para levar todo tópico mapeado à massa crítica</td><td class="cel-centro"><strong>${r.horasCobertura ?? "—"} h</strong></td></tr>
          <tr style="border-top:2px solid var(--color-border);">
            <td><strong>Saldo</strong></td>
            <td class="cel-centro" style="color:${r.saldo >= 0 ? "var(--color-success)" : "var(--color-error)"}; font-weight:700;">${r.saldo == null ? "—" : (r.saldo >= 0 ? "+" : "") + r.saldo + " h"}</td>
          </tr>
        </table>
        <p style="margin:10px 0 0; font-size:13px;">
          ${r.saldo == null
            ? ""
            : r.saldo >= 0
              ? `No seu ritmo, cobrir o escopo mapeado leva <strong>~${semanasFalta} semana(s)</strong> — sobra folga dentro do horizonte de ${cap.horizonte}.`
              : `No seu ritmo, cobrir o escopo mapeado leva <strong>~${semanasFalta} semana(s)</strong>, contra as ${cap.horizonte} do horizonte. <strong>Não fecha.</strong> Ou o escopo encolhe, ou o ritmo sobe, ou o horizonte estica — não há quarta saída.`}
        </p>
        ${r.horasReforco > 0 ? `
        <p style="margin:10px 0 0; font-size:13px; color:var(--color-text-muted); border-top:1px solid var(--color-border); padding-top:10px;">
          <strong>Fora do total acima:</strong> ${r.linhas.reduce((a, l) => a + l.reforco, 0)} tópico(s) já têm massa crítica mas estão abaixo de 80% no Wilson. Uma rodada extra de ${cap.metaQuestoes} questões em cada custaria ~${r.horasReforco} h. Esse número é uma <em>suposição declarada</em>, não uma medição: seu histórico ainda não tem nenhum caderno que chegou a consolidado, então não existe base pra estimar quanto custa consolidar de verdade.
        </p>` : ""}
      </div>

      <div class="card">
        <h3 style="margin-top:0;">Onde o tempo vai</h3>
        <div style="overflow-x:auto;">
          <table class="data-table data-table--fixed" style="min-width:660px;">
            <tr>
              <th>Disciplina</th>
              <th class="cel-centro" style="width:80px;">Tópicos</th>
              <th class="cel-centro" style="width:110px;">Questões a fazer</th>
              <th class="cel-centro" style="width:90px;">Horas</th>
              <th class="cel-centro" style="width:90px;">% do total</th>
              <th class="cel-centro" style="width:110px;">Sem caderno</th>
            </tr>
            ${r.linhas
              .map(
                (l) => `
              <tr>
                <td>${escapeHtml(l.disciplina)}</td>
                <td class="cel-centro">${l.topicos}</td>
                <td class="cel-centro">${l.qFaltantes}</td>
                <td class="cel-centro">${l.horasCobertura ?? "—"}</td>
                <td class="cel-centro">${r.horasCobertura > 0 ? formatPct((l.horasCobertura / r.horasCobertura) * 100) : "—"}</td>
                <td class="cel-centro" style="${l.semCaderno > 0 ? "color:#b45309; font-weight:600;" : "color:var(--color-text-muted);"}">${l.semCaderno}</td>
              </tr>`
              )
              .join("")}
          </table>
        </div>
        <p style="margin:10px 0 0; font-size:12px; color:var(--color-text-muted);">
          Massa crítica não é domínio. Chegar a ${cap.metaQuestoes} questões num tópico só garante que o Wilson deixa de dizer "poucos dados" — se o resultado vier baixo, o custo real é maior que o mostrado aqui.
        </p>
      </div>
    `;

    const recalcular = () => {
      cap.horizonte = Math.max(1, Number(tabCapacidade.querySelector("#cap-horizonte").value) || 1);
      cap.horasPorSemana = Math.max(0, Number(tabCapacidade.querySelector("#cap-horas").value) || 0);
      cap.questoesPorHora = Math.max(0, Number(tabCapacidade.querySelector("#cap-qph").value) || 0);
      cap.metaQuestoes = Math.max(5, Number(tabCapacidade.querySelector("#cap-meta").value) || 5);
      renderCapacidade();
    };
    ["#cap-horizonte", "#cap-horas", "#cap-qph", "#cap-meta"].forEach((sel) => {
      tabCapacidade.querySelector(sel).addEventListener("change", recalcular);
    });
  }

  function wireVincular(btn) {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await vincularCaderno({ userId: user.id, topicId: btn.dataset.topico, questionSetId: btn.dataset.vincular });
        await carregar();
        // Reabre o painel do tópico que estava sendo trabalhado, pra não
        // perder o contexto a cada vínculo (o mapeamento é feito em série).
        const painel = tabConteudo.querySelector(`[data-topico-painel="${btn.dataset.topico}"]`);
        if (painel) {
          painel.style.display = "block";
          renderSugestoes(btn.dataset.topico);
        }
      } catch (err) {
        window.alert("Erro ao vincular: " + (err.message || "desconhecido"));
        btn.disabled = false;
      }
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
