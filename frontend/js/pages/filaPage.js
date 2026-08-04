// Tela "Revisar" (03/08/2026) — Fila de Revisão Condicional.
//
// Objetivo declarado pelo usuário: "responder o que fazer agora com base nas
// métricas que já temos". O painel já dizia onde ele estava mal; faltava a
// ponte pra ação. Cada item traz o MOTIVO explícito (não só um score) e a
// AÇÃO sugerida, porque a intervenção correta depende da causa: reencontro
// ruim pede teoria, amostra pequena pede volume, erro aberto pede fechamento.
//
// Não é revisão espaçada por calendário (o que os apps de mercado fazem): a
// ordem vem do diagnóstico — Wilson, recorrência da banca, peso do edital,
// retenção e erros T1–T7 em aberto. Ver filaRevisaoService.js.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { getFilaRevisao, getFrentesAbertas } from "../services/filaRevisaoService.js";
import { getProdutividade, getRitmo, META_QUESTOES_PADRAO } from "../services/capacidadeService.js";
import { navigate } from "../router.js";
import { formatPct } from "../utils/format.js";

const MOTIVO_COR = {
  critico: "var(--color-error)",
  atencao: "#b45309",
  retencao: "var(--color-error)",
  erro: "#b45309",
  reincidencia: "var(--color-error)",
  recorrencia: "#1565c0",
  peso: "#1565c0",
  preliminar: "var(--color-text-muted)",
  tempo: "var(--color-text-muted)",
};

export async function renderFilaPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/revisar")}
        <main class="app-content">
          <h2 class="form-title">Revisar agora</h2>
          <p style="color:var(--color-text-muted); margin-top:-8px;">
            O que atacar hoje, em ordem. A prioridade vem do diagnóstico — lacuna (Wilson), recorrência da banca, peso no edital, retenção no reencontro e erros em aberto —, não de um calendário fixo de revisão.
          </p>
          <div id="fila-frentes"></div>
          <div id="fila-content"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const content = container.querySelector("#fila-content");
  let itens = [];
  try {
    itens = await getFilaRevisao();
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao montar a fila: ${escapeHtml(err.message)}</div>`;
    return;
  }

  // Frentes abertas — bloco informativo, nunca bloqueante (ver comentário em
  // getFrentesAbertas). Falha aqui não pode derrubar a fila, que é o conteúdo
  // principal da tela: por isso try/catch próprio e silencioso.
  try {
    const [fr, prod, rit] = await Promise.all([
      getFrentesAbertas({ metaQuestoes: META_QUESTOES_PADRAO }),
      getProdutividade(),
      getRitmo(),
    ]);
    renderFrentes(container.querySelector("#fila-frentes"), fr, prod, rit);
  } catch {
    /* bloco opcional; silêncio é melhor que um erro vermelho no topo da fila */
  }

  if (itens.length === 0) {
    content.innerHTML = `
      <div class="card">
        <p style="color:var(--color-text-muted);">Nada pendente por enquanto — nenhum caderno estudado está com lacuna, erro em aberto ou tempo demais sem revisão. Se quiser abrir frente nova, veja a aba Prioridade.</p>
      </div>
    `;
    return;
  }

  // Top 5 é o recorte de trabalho de um dia; o resto fica recolhido pra não
  // transformar a fila num dump de 40 itens que ninguém executa.
  const topo = itens.slice(0, 5);
  const resto = itens.slice(5);

  content.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin-top:0;">Prioridade de hoje</h3>
      ${topo.map((it, i) => cardItem(it, i + 1)).join("")}
    </div>
    ${resto.length > 0 ? `
    <div class="card">
      <h3 style="margin-top:0;">Fila completa (${itens.length})</h3>
      <div style="overflow-x:auto;">
        <table class="data-table data-table--fixed" style="min-width:680px;">
          <tr><th>Caderno</th><th style="width:16%;">Disciplina</th><th class="cel-centro" style="width:90px;">Wilson</th><th class="cel-centro" style="width:90px;">Questões</th><th class="cel-centro" style="width:110px;">Sem tocar</th></tr>
          ${resto
            .map(
              (it) => `
            <tr>
              <td>${escapeHtml(it.cadernoNome)}</td>
              <td style="font-size:12px; color:var(--color-text-muted);">${escapeHtml(it.disciplinaNome)}</td>
              <td class="cel-centro">${formatPct(it.wilson)}</td>
              <td class="cel-centro">${it.questoes}</td>
              <td class="cel-centro">${it.diasSemEstudar == null ? "—" : `${it.diasSemEstudar}d`}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </div>
    </div>` : ""}
  `;

  content.querySelectorAll("[data-fila-estudar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Leva pra Nova Sessão já com a disciplina/caderno escolhidos — tirar
      // atrito entre decidir e registrar é o que faz a fila ser usada.
      navigate("/sessoes/nova", {
        disciplineId: btn.dataset.filaDisciplina,
        questionSetId: btn.dataset.filaEstudar,
      });
    });
  });
}

function renderFrentes(box, fr, prod, rit) {
  if (!box || fr.abertas.length === 0) return;

  const qph = prod?.questoesPorHora || 0;
  const horas = qph > 0 ? Math.round((fr.questoesParaFechar / qph) * 10) / 10 : null;
  const semanas = horas != null && rit?.horasPorSemana > 0 ? (horas / rit.horasPorSemana).toFixed(1) : null;
  const quase = fr.abertas.filter((c) => c.faltam <= 10).length;
  const topo = fr.abertas.slice(0, 8);
  const resto = fr.abertas.slice(8);

  box.innerHTML = `
    <div class="card" style="margin-bottom:16px; border-left:4px solid #b45309;">
      <h3 style="margin-top:0;">Frentes abertas: ${fr.abertas.length}</h3>
      <p style="margin:4px 0 0; font-size:14px;">
        ${fr.fechadas === 0
          ? `Nenhum caderno seu chegou a ${META_QUESTOES_PADRAO} questões ainda. Abaixo disso o Wilson responde "poucos dados" — ou seja, <strong>o painel inteiro ainda não consegue afirmar nada sobre o seu nível</strong>.`
          : `${fr.fechadas} caderno(s) já passaram de ${META_QUESTOES_PADRAO} questões; estes ${fr.abertas.length} ainda não.`}
      </p>
      <p style="margin:8px 0 0; font-size:14px;">
        Fechar todas custa <strong>${fr.questoesParaFechar} questões</strong>${horas != null ? ` ≈ <strong>${horas} h</strong>` : ""}${semanas != null ? ` (~${semanas} semana(s) no seu ritmo)` : ""}.
        ${quase > 0 ? `<br><strong>${quase}</strong> estão a 10 questões ou menos de fechar.` : ""}
      </p>
      <p style="margin:8px 0 0; font-size:12px; color:var(--color-text-muted);">
        Isto é informação, não regra: nada aqui impede você de abrir caderno novo. A lista está ordenada da mais barata de fechar para a mais cara.
      </p>
      <div style="overflow-x:auto; margin-top:12px;">
        <table class="data-table data-table--fixed" style="min-width:620px;">
          <tr><th>Caderno</th><th style="width:18%;">Disciplina</th><th class="cel-centro" style="width:80px;">Feitas</th><th class="cel-centro" style="width:80px;">Faltam</th><th class="cel-centro" style="width:150px;">Ação</th></tr>
          ${topo.map((c) => linhaFrente(c)).join("")}
        </table>
      </div>
      ${resto.length > 0 ? `
        <button type="button" class="btn-link" id="frentes-mais" style="margin-top:8px;">Ver as outras ${resto.length}</button>
        <div id="frentes-resto" style="display:none; overflow-x:auto; margin-top:8px;">
          <table class="data-table data-table--fixed" style="min-width:620px;">
            ${resto.map((c) => linhaFrente(c)).join("")}
          </table>
        </div>` : ""}
    </div>
  `;

  const btnMais = box.querySelector("#frentes-mais");
  if (btnMais) {
    btnMais.addEventListener("click", () => {
      const d = box.querySelector("#frentes-resto");
      const abrindo = d.style.display === "none";
      d.style.display = abrindo ? "block" : "none";
      btnMais.textContent = abrindo ? "Recolher" : `Ver as outras ${resto.length}`;
    });
  }

  box.querySelectorAll("[data-fila-estudar]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate("/sessoes/nova", {
        disciplineId: btn.dataset.filaDisciplina,
        questionSetId: btn.dataset.filaEstudar,
      });
    });
  });
}

function linhaFrente(c) {
  return `
    <tr>
      <td>${escapeHtml(c.cadernoNome)}</td>
      <td style="font-size:12px; color:var(--color-text-muted);">${escapeHtml(c.disciplinaNome)}</td>
      <td class="cel-centro">${c.questoes}</td>
      <td class="cel-centro"><strong>${c.faltam}</strong></td>
      <td class="cel-centro">
        <button type="button" class="btn-link" style="font-size:12px;"
                data-fila-estudar="${c.questionSetId}" data-fila-disciplina="${c.disciplineId}">registrar sessão</button>
      </td>
    </tr>`;
}

function cardItem(it, posicao) {
  return `
    <div style="border-left:4px solid var(--color-primary); background:var(--color-bg-subtle, #f5f5f5); border-radius:var(--radius); padding:12px 14px; margin-bottom:10px;">
      <div style="display:flex; gap:12px; align-items:baseline; flex-wrap:wrap;">
        <strong style="font-size:15px;">${posicao}. ${escapeHtml(it.cadernoNome)}</strong>
        <span style="font-size:12px; color:var(--color-text-muted);">${escapeHtml(it.disciplinaNome)}${it.wilson != null ? ` · Wilson ${formatPct(it.wilson)}` : ""} · ${it.questoes}q</span>
      </div>
      <p style="margin:8px 0 6px; font-size:13px;">
        ${it.motivos.map((m) => `<span style="color:${MOTIVO_COR[m.tipo] || "var(--color-text-muted)"};">• ${escapeHtml(m.texto)}</span>`).join("<br>")}
      </p>
      <p style="margin:6px 0 10px; font-size:13px;"><strong>Ação:</strong> ${escapeHtml(it.acao)}</p>
      <button type="button" class="btn" style="width:auto; padding:6px 14px; font-size:13px;"
              data-fila-estudar="${it.questionSetId}" data-fila-disciplina="${it.disciplineId}">Registrar sessão deste caderno</button>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
