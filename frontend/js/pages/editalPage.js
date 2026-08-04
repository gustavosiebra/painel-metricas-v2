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
import { listExams, listDisciplines, listQuestionSets, createDiscipline } from "../services/catalogService.js";
import {
  listTopics,
  listVinculos,
  listCobertura,
  createTopics,
  deleteTopic,
  vincularCaderno,
  vincularCadernos,
  desvincularCaderno,
  sugerirCadernos,
  updateTopic,
  splitTopic,
  sugerirDivisao,
  countTopicsByExam,
  parsearEditalCompleto,
  casarDisciplina,
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
        <h3 style="margin-top:0;">Colar o edital inteiro</h3>
        <p style="color:var(--color-text-muted); margin-top:0; font-size:13px;">
          Cole o Anexo I completo (todas as disciplinas de uma vez). O sistema identifica os cabeçalhos de disciplina, separa os tópicos e mostra tudo agrupado para você conferir. Ele erra <strong>para mais</strong> de propósito — é comum aparecerem blocos a mais, e você junta ao anterior com um clique. Errar para menos seria pior: a disciplina sumiria sem aviso.
        </p>
        <div id="edital-alert"></div>
        <div class="form-field">
          <label for="edital-texto">Conteúdo programático completo</label>
          <textarea id="edital-texto" rows="8" style="width:100%; box-sizing:border-box; padding:8px 12px; border:1px solid var(--color-border); border-radius:var(--radius); font-size:14px; font-family:inherit;" placeholder="Língua Portuguesa: Leitura e interpretação de diversos tipos de textos..."></textarea>
        </div>
        <div class="form-actions"><button type="button" class="btn" id="edital-analisar">Analisar edital</button></div>
        <div id="edital-blocos"></div>
      </div>
      <div class="card card--form" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Adicionar tópicos de uma disciplina</h3>
        <p style="color:var(--color-text-muted); margin-top:0; font-size:13px;">Cole o conteúdo programático — idealmente <strong>uma linha por tópico</strong>. Se vier tudo num parágrafo só (o que acontece ao copiar de PDF ou de texto formatado), o sistema separa sozinho e mostra o resultado para você conferir <strong>antes</strong> de salvar.</p>
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
          <div class="form-actions"><button type="submit" class="btn">Conferir e adicionar</button></div>
        </form>
        <div id="topico-preview"></div>
      </div>
      <div class="card">
        <h3 style="margin-top:0;">Tópicos cadastrados (${topicos.length})</h3>
        <p style="color:var(--color-text-muted); margin-top:0; font-size:13px;">Clique num tópico para vincular cadernos. As sugestões vêm por semelhança de nome, dentro da disciplina do tópico.</p>
        <div id="topicos-lista"></div>
      </div>
    `;

    wireEditalCompleto();

    const alert = tabConteudo.querySelector("#topico-alert");
    const previewBox = tabConteudo.querySelector("#topico-preview");

    tabConteudo.querySelector("#topico-form").addEventListener("submit", (e) => {
      e.preventDefault();
      alert.innerHTML = "";
      previewBox.innerHTML = "";
      const disciplineId = tabConteudo.querySelector("#topico-disciplina").value;
      if (!disciplineId) {
        alert.innerHTML = `<div class="alert alert--error">Escolha a disciplina.</div>`;
        return;
      }
      const bruto = tabConteudo.querySelector("#topico-texto").value;
      const { nomes, colados } = parsearTopicos(bruto);
      if (nomes.length === 0) {
        alert.innerHTML = `<div class="alert alert--error">Cole pelo menos um tópico.</div>`;
        return;
      }
      mostrarPreview({ previewBox, alert, nomes, colados, disciplineId });
    });

    renderListaTopicos();
  }

  // ---------- Colar edital inteiro ----------
  // blocos: [{ titulo, topicos:[], disciplineId, novaNome, ignorar }]
  let blocosEdital = [];

  function wireEditalCompleto() {
    const alertBox = tabConteudo.querySelector("#edital-alert");
    tabConteudo.querySelector("#edital-analisar").addEventListener("click", () => {
      alertBox.innerHTML = "";
      const texto = tabConteudo.querySelector("#edital-texto").value;
      if (texto.trim().length < 50) {
        alertBox.innerHTML = `<div class="alert alert--error">Cole o conteúdo programático primeiro.</div>`;
        return;
      }
      blocosEdital = parsearEditalCompleto(texto).map((b) => {
        const casou = casarDisciplina(b.titulo, disciplines);
        return {
          titulo: b.titulo || "(sem título)",
          topicos: b.topicos,
          disciplineId: casou ? casou.id : "",
          novaNome: casou ? "" : b.titulo,
          ignorar: false,
        };
      });
      renderBlocosEdital();
    });
  }

  function renderBlocosEdital() {
    const box = tabConteudo.querySelector("#edital-blocos");
    if (blocosEdital.length === 0) {
      box.innerHTML = "";
      return;
    }
    const totalTopicos = blocosEdital.filter((b) => !b.ignorar).reduce((a, b) => a + b.topicos.length, 0);
    const semDestino = blocosEdital.filter((b) => !b.ignorar && !b.disciplineId && !b.novaNome.trim()).length;

    box.innerHTML = `
      <div style="margin-top:14px; border-top:1px solid var(--color-border); padding-top:14px;">
        <p style="margin:0 0 10px;"><strong>${blocosEdital.filter((b) => !b.ignorar).length} bloco(s)</strong> e <strong>${totalTopicos} tópico(s)</strong> serão criados.</p>
        ${blocosEdital.map((b, i) => blocoHtml(b, i)).join("")}
        ${semDestino > 0 ? `<div class="alert" style="background:#fff4e5; color:#b45309; border:1px solid #ffe0b2;">${semDestino} bloco(s) sem disciplina definida. Escolha uma existente, digite o nome de uma nova, ou marque para ignorar.</div>` : ""}
        <div class="form-actions">
          <button type="button" class="btn" id="edital-salvar" ${semDestino > 0 ? "disabled" : ""}>Salvar ${totalTopicos} tópico(s)</button>
          <button type="button" class="btn-link" id="edital-descartar">Descartar análise</button>
        </div>
      </div>
    `;

    box.querySelectorAll("[data-bloco-disc]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const b = blocosEdital[Number(sel.dataset.blocoDisc)];
        b.disciplineId = sel.value;
        if (sel.value) b.novaNome = "";
        renderBlocosEdital();
      });
    });
    box.querySelectorAll("[data-bloco-nova]").forEach((inp) => {
      inp.addEventListener("input", () => {
        blocosEdital[Number(inp.dataset.blocoNova)].novaNome = inp.value;
      });
    });
    box.querySelectorAll("[data-bloco-topicos]").forEach((ta) => {
      ta.addEventListener("input", () => {
        blocosEdital[Number(ta.dataset.blocoTopicos)].topicos = ta.value.split("\n").map((l) => l.trim()).filter((l) => l.length > 2);
      });
    });
    box.querySelectorAll("[data-bloco-juntar]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.blocoJuntar);
        // Falso positivo do parser: o "cabeçalho" era só uma frase do meio do
        // texto. Devolve o título à lista de tópicos do bloco anterior, pra
        // nada do edital se perder na correção.
        const anterior = blocosEdital[i - 1];
        const atual = blocosEdital[i];
        anterior.topicos = [...anterior.topicos, atual.titulo, ...atual.topicos];
        blocosEdital.splice(i, 1);
        renderBlocosEdital();
      });
    });
    box.querySelectorAll("[data-bloco-ignorar]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const b = blocosEdital[Number(btn.dataset.blocoIgnorar)];
        b.ignorar = !b.ignorar;
        renderBlocosEdital();
      });
    });
    box.querySelector("#edital-descartar").addEventListener("click", () => {
      blocosEdital = [];
      renderBlocosEdital();
    });
    const btnSalvar = box.querySelector("#edital-salvar");
    if (btnSalvar) btnSalvar.addEventListener("click", () => salvarBlocosEdital(btnSalvar));
  }

  function blocoHtml(b, i) {
    return `
      <div style="border:1px solid var(--color-border); border-radius:var(--radius); padding:10px; margin-bottom:10px; ${b.ignorar ? "opacity:0.45;" : ""}">
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:8px;">
          <strong style="font-size:14px;">${escapeHtml(b.titulo)}</strong>
          <span style="font-size:12px; color:var(--color-text-muted);">${b.topicos.length} tópico(s)</span>
          ${i > 0 ? `<button type="button" class="btn-link" style="font-size:12px;" data-bloco-juntar="${i}">juntar ao anterior</button>` : ""}
          <button type="button" class="btn-link" style="font-size:12px; color:var(--color-error);" data-bloco-ignorar="${i}">${b.ignorar ? "voltar a incluir" : "ignorar"}</button>
        </div>
        ${b.ignorar ? "" : `
        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
          <div class="form-field" style="flex:1; min-width:220px; margin:0;">
            <label style="font-size:12px;">Disciplina existente</label>
            <select data-bloco-disc="${i}">
              <option value="">— criar nova —</option>
              ${disciplines.map((d) => `<option value="${d.id}" ${b.disciplineId === d.id ? "selected" : ""}>${escapeHtml(d.name)}</option>`).join("")}
            </select>
          </div>
          ${!b.disciplineId ? `
          <div class="form-field" style="flex:1; min-width:220px; margin:0;">
            <label style="font-size:12px;">Nome da nova disciplina</label>
            <input type="text" data-bloco-nova="${i}" value="${escapeHtml(b.novaNome)}" />
          </div>` : ""}
        </div>
        <textarea data-bloco-topicos="${i}" rows="${Math.min(10, Math.max(3, b.topicos.length))}" style="width:100%; box-sizing:border-box; padding:8px; border:1px solid var(--color-border); border-radius:var(--radius); font-size:12px; font-family:inherit;">${escapeHtml(b.topicos.join("\n"))}</textarea>`}
      </div>
    `;
  }

  async function salvarBlocosEdital(btn) {
    const alertBox = tabConteudo.querySelector("#edital-alert");
    btn.disabled = true;
    btn.textContent = "Salvando…";
    try {
      for (const b of blocosEdital) {
        if (b.ignorar || b.topicos.length === 0) continue;
        let disciplineId = b.disciplineId;
        if (!disciplineId) {
          const nova = await createDiscipline({ name: b.novaNome.trim(), userId: user.id });
          disciplineId = nova.id;
          disciplines.push(nova);
          disciplinasById.set(nova.id, nova.name);
        }
        await createTopics({
          userId: user.id,
          examId,
          linhas: b.topicos.map((name) => ({ name, disciplineId })),
        });
      }
      blocosEdital = [];
      tabConteudo.querySelector("#edital-texto").value = "";
      await carregar();
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert--error">Erro ao salvar: ${escapeHtml(err.message || String(err))}</div>`;
      btn.disabled = false;
      btn.textContent = "Tentar de novo";
    }
  }

  // Separa o texto colado em nomes de tópico.
  //
  // Por que não basta split("\n") (04/08/2026): o usuário copiou uma lista de
  // 9 assuntos de um documento formatado e o navegador entregou tudo numa
  // linha só — 346 caracteres viraram 1 tópico. Markdown e PDF juntam linhas
  // consecutivas num parágrafo, então a quebra de linha simplesmente não
  // sobrevive ao copiar/colar. Confiar nela era uma armadilha silenciosa: o
  // formulário "funcionava", só criava a coisa errada.
  //
  // Regra: linha muito longa quase certamente é um parágrafo colado, não um
  // assunto — aí aplicamos a mesma separação por pontuação usada no "dividir".
  const LIMITE_LINHA = 200;

  function parsearTopicos(bruto) {
    const nomes = [];
    let colados = 0;
    for (const linha of (bruto || "").split("\n")) {
      const limpa = limparNumeracao(linha);
      if (limpa.length <= 2) continue;
      if (limpa.length > LIMITE_LINHA) {
        const partes = sugerirDivisao(limpa);
        if (partes.length > 1) {
          colados += 1;
          for (const parte of partes) {
            const p = limparNumeracao(parte);
            if (p.length > 2) nomes.push(p);
          }
          continue;
        }
      }
      nomes.push(limpa);
    }
    return { nomes, colados };
  }

  // Remove numeração de edital ("1.", "2.3 ", "- ") pra o nome ficar limpo e a
  // sugestão por similaridade não ser poluída pelos dígitos.
  function limparNumeracao(linha) {
    return (linha || "")
      .trim()
      .replace(/^[\d.]+\s*[-–)]?\s*/, "")
      .replace(/^[-–•]\s*/, "")
      .trim();
  }

  // Conferência antes de gravar. O passo existe porque o modo de falha anterior
  // era invisível: salvava sem erro e só muito depois se descobria que o edital
  // inteiro tinha virado um tópico gigante.
  function mostrarPreview({ previewBox, alert, nomes, colados, disciplineId }) {
    previewBox.innerHTML = `
      <div style="background:var(--color-bg-subtle, #f5f5f5); padding:12px; border-radius:var(--radius); margin-top:12px;">
        <p style="margin:0 0 8px;"><strong>${nomes.length} tópico(s)</strong> serão criados. Confira antes de salvar.</p>
        ${colados > 0 ? `<div class="alert" style="background:#e3f2fd; color:#1565c0; border:1px solid #bbdefb; font-size:13px;">${colados} bloco(s) vieram grudados num parágrafo só e foram separados automaticamente. Isso é normal ao copiar de PDF ou de texto formatado — revise a lista abaixo e ajuste o que ficou torto.</div>` : ""}
        <div class="form-field">
          <textarea id="topico-preview-texto" rows="12" style="width:100%; box-sizing:border-box; padding:8px; border:1px solid var(--color-border); border-radius:var(--radius); font-size:13px; font-family:inherit;">${escapeHtml(nomes.join("\n"))}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn" id="topico-confirmar">Salvar ${nomes.length} tópico(s)</button>
          <button type="button" class="btn-link" id="topico-cancelar">Cancelar</button>
        </div>
      </div>
    `;

    previewBox.querySelector("#topico-cancelar").addEventListener("click", () => {
      previewBox.innerHTML = "";
    });

    previewBox.querySelector("#topico-confirmar").addEventListener("click", async (ev) => {
      ev.target.disabled = true;
      const finais = previewBox
        .querySelector("#topico-preview-texto")
        .value.split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 2)
        .map((name) => ({ name, disciplineId }));
      if (finais.length === 0) {
        alert.innerHTML = `<div class="alert alert--error">Nada para salvar.</div>`;
        ev.target.disabled = false;
        return;
      }
      try {
        await createTopics({ userId: user.id, examId, linhas: finais });
        tabConteudo.querySelector("#topico-texto").value = "";
        previewBox.innerHTML = "";
        await carregar();
      } catch (err) {
        alert.innerHTML = `<div class="alert alert--error">Erro ao salvar: ${escapeHtml(err.message)}</div>`;
        ev.target.disabled = false;
      }
    });
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

  // Seleção por caixa em vez de clique item a item (04/08/2026, pedido do
  // usuário). O modo anterior — um botão "vincular" por sugestão — recarregava
  // a página inteira a cada vínculo, então mapear um tópico com 20 cadernos
  // custava 20 recargas. Com caixas, a escolha é toda feita antes e vai numa
  // gravação só.
  function renderSugestoes(topicId) {
    const t = topicos.find((x) => x.id === topicId);
    const box = tabConteudo.querySelector(`[data-sugestoes="${topicId}"]`);
    const jaVinculados = new Set(vinculos.filter((v) => v.topicId === topicId).map((v) => v.questionSetId));
    const ativos = cadernos.filter((c) => c.status !== "inativo" && !jaVinculados.has(c.id));
    const sugestoes = sugerirCadernos({ name: t.name, disciplineId: t.discipline_id }, ativos, { limite: 30 });

    box.innerHTML = `
      <p style="margin:4px 0; font-size:12px; color:var(--color-text-muted);">
        Sugestões por semelhança de nome — marque as que servem e vincule todas de uma vez.
        Itens marcados em laranja estão catalogados em <strong>outra disciplina</strong>; aparecem porque o nome bate, e às vezes o assunto cai mesmo em duas (SICRO, BDI, normas da ABNT).
      </p>
      ${sugestoes.length === 0
        ? '<p style="font-size:13px; color:var(--color-text-muted);">Nenhuma sugestão automática. Use a busca abaixo.</p>'
        : `
        <div style="margin-bottom:6px;">
          <button type="button" class="btn-link" style="font-size:12px;" data-marcar-todas="${topicId}">marcar todas</button>
          <button type="button" class="btn-link" style="font-size:12px;" data-desmarcar-todas="${topicId}">desmarcar</button>
        </div>
        <div class="checkbox-list" style="max-height:260px; overflow-y:auto; border:1px solid var(--color-border); border-radius:var(--radius); padding:8px;">
          ${sugestoes.map((sg) => itemCheck(sg.caderno, sg.score, sg.foraDaDisciplina)).join("")}
        </div>`}
      <div class="form-field" style="margin-top:10px; max-width:460px; margin-bottom:6px;">
        <label style="font-size:12px;">Buscar caderno manualmente</label>
        <input type="text" data-busca-caderno="${topicId}" placeholder="Digite parte do nome..." />
      </div>
      <div data-busca-resultado="${topicId}" style="max-width:460px;"></div>
      <div class="form-actions">
        <button type="button" class="btn" data-vincular-lote="${topicId}" disabled>Vincular selecionados</button>
      </div>
    `;

    const btnLote = box.querySelector(`[data-vincular-lote="${topicId}"]`);

    // Conta as marcadas nas DUAS listas (sugestões e busca): elas compartilham
    // a mesma seleção, senão o usuário perderia o que marcou ao pesquisar.
    function atualizarContador() {
      const n = box.querySelectorAll("input[data-check-caderno]:checked").length;
      btnLote.disabled = n === 0;
      btnLote.textContent = n === 0 ? "Vincular selecionados" : `Vincular ${n} caderno(s)`;
    }
    box.addEventListener("change", (e) => {
      if (e.target.matches("input[data-check-caderno]")) atualizarContador();
    });

    const marcarTodas = box.querySelector(`[data-marcar-todas="${topicId}"]`);
    if (marcarTodas) {
      marcarTodas.addEventListener("click", () => {
        box.querySelectorAll("input[data-check-caderno]").forEach((c) => (c.checked = true));
        atualizarContador();
      });
      box.querySelector(`[data-desmarcar-todas="${topicId}"]`).addEventListener("click", () => {
        box.querySelectorAll("input[data-check-caderno]").forEach((c) => (c.checked = false));
        atualizarContador();
      });
    }

    btnLote.addEventListener("click", async () => {
      const ids = [...box.querySelectorAll("input[data-check-caderno]:checked")].map((c) => c.dataset.checkCaderno);
      if (ids.length === 0) return;
      btnLote.disabled = true;
      btnLote.textContent = "Vinculando…";
      try {
        await vincularCadernos({ userId: user.id, topicId, questionSetIds: ids });
        await carregar();
        // Reabre o painel do tópico em que se estava trabalhando: o mapeamento
        // é feito em série e perder o contexto a cada gravação seria péssimo.
        const painel = tabConteudo.querySelector(`[data-topico-painel="${topicId}"]`);
        if (painel) {
          painel.style.display = "block";
          renderSugestoes(topicId);
        }
      } catch (err) {
        window.alert("Erro ao vincular: " + (err.message || "desconhecido"));
        btnLote.disabled = false;
        atualizarContador();
      }
    });

    const busca = box.querySelector(`[data-busca-caderno="${topicId}"]`);
    busca.addEventListener("input", () => {
      const termo = normalizar(busca.value.trim());
      const res = box.querySelector(`[data-busca-resultado="${topicId}"]`);
      if (termo.length < 3) {
        res.innerHTML = "";
        atualizarContador();
        return;
      }
      const achados = ativos.filter((c) => normalizar(c.name).includes(termo)).slice(0, 20);
      res.innerHTML = achados.length === 0
        ? '<p style="font-size:12px; color:var(--color-text-muted);">Nada encontrado.</p>'
        : `<div class="checkbox-list" style="max-height:200px; overflow-y:auto; border:1px solid var(--color-border); border-radius:var(--radius); padding:8px;">
             ${achados.map((c) => itemCheck(c, null)).join("")}
           </div>`;
      atualizarContador();
    });
  }

  // width:auto explícito no input (04/08/2026, bug reportado com print): o
  // bloco de resultados vive dentro de um .form-field, e a regra global
  // `.form-field input { width: 100% }` estica o checkbox pra linha inteira,
  // empurrando o nome do caderno pra fora da área visível — a tela ficava com
  // uma caixa solta e barra de rolagem horizontal, sem texto nenhum. A classe
  // .checkbox-list já resolve (foi criada pro mesmo problema no Multibancas),
  // mas o style inline aqui garante o comportamento mesmo se este HTML for
  // reaproveitado fora dela.
  function itemCheck(caderno, score, foraDaDisciplina) {
    return `
      <label style="display:flex; gap:8px; align-items:flex-start; margin-bottom:5px; cursor:pointer; font-size:13px; font-weight:normal;">
        <input type="checkbox" data-check-caderno="${caderno.id}" style="width:auto; flex:none; margin:3px 0 0; padding:0;" />
        <span style="min-width:0; overflow-wrap:anywhere;">${escapeHtml(caderno.name)}${score != null ? ` <span style="color:var(--color-text-muted); font-size:11px;">${Math.round(score * 100)}%</span>` : ""}${foraDaDisciplina ? ` <span style="color:#b45309; font-size:11px;">· ${escapeHtml(disciplinasById.get(caderno.discipline_id) || "outra disciplina")}</span>` : ""}</span>
      </label>`;
  }

  function normalizar(txt) {
    return (txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // ==================== CAPACIDADE ====================
  function renderCapacidade() {
    if (cap.horasPorSemana == null) cap.horasPorSemana = ritmo?.horasPorSemana ?? 0;
    if (cap.questoesPorHora == null) cap.questoesPorHora = produtividade?.questoesPorHora ?? 0;

    const disciplinasEscopo = pesos
      .filter((p) => p.exam_id === examId)
      .map((p) => ({ id: p.discipline_id, nome: p.disciplines?.name || "\u2014", peso: p.weight }));

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
          <tr><td>Horas para levar todo tópico mapeado à massa crítica</td><td class="cel-centro"><strong>${r.horasCobertura ?? "\u2014"} h</strong></td></tr>
          <tr style="border-top:2px solid var(--color-border);">
            <td><strong>Saldo</strong></td>
            <td class="cel-centro" style="color:${r.saldo >= 0 ? "var(--color-success)" : "var(--color-error)"}; font-weight:700;">${r.saldo == null ? "\u2014" : (r.saldo >= 0 ? "+" : "") + r.saldo + " h"}</td>
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
                <td class="cel-centro">${l.horasCobertura ?? "\u2014"}</td>
                <td class="cel-centro">${r.horasCobertura > 0 ? formatPct((l.horasCobertura / r.horasCobertura) * 100) : "\u2014"}</td>
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

}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
