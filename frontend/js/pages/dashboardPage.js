// Dashboard (Fase 6) — KPIs, Ranking de Risco, Próxima Ação e gráfico de
// Média Móvel Semanal. Consome as views/funções analíticas da Fase 5; nenhum
// cálculo estatístico é refeito aqui (TEC-006).

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { formatPct, formatDeltaPct } from "../utils/format.js";
import {
  getKpis,
  getCadernosEstudados,
  getRankingRisco,
  getMediaMovelSemanal,
  getContadoresSituacao,
  getProdutividadeGeral,
  getTendenciaSemanal,
  getJanelaTendenciaDisciplina,
  getJanelaTendenciaCadernoDestaques,
  getRetencaoGeral,
  getRetencaoPorDisciplina,
  getHorasPorDisciplina,
  pickProximaAcao,
} from "../services/dashboardService.js";

// "Preliminares" foi trocado por "Poucos dados" (pedido do usuário,
// 03/07/2026) — o termo técnico não deixava claro que só significa "ainda não
// há questões suficientes pra classificar", não é uma categoria de resultado.
const SITUACAO_LABELS = {
  consolidado: { label: "Consolidados", color: "var(--color-success)" },
  atencao: { label: "Atenção", color: "#b45309" },
  critico: { label: "Críticos", color: "var(--color-error)" },
  preliminar: { label: "Poucos dados", color: "var(--color-text-muted)" },
};

let chartMediaMovelInstance = null;
let chartAcertosErrosInstance = null;
let chartHorasInstance = null;
let chartRetencaoInstance = null;

export async function renderDashboardPage(container) {
  // Sem H2 "Dashboard" na página (pedido do usuário, 03/07/2026) — o nome já
  // está na aba de navegação, repetir aqui só ocupa espaço sem dizer nada novo.
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/dashboard")}
        <main class="app-content">
          <div id="dashboard-content"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const content = container.querySelector("#dashboard-content");

  let kpis, cadernosEstudados, ranking, mediaMovelDiaria, situacao, produtividade, janelaDisciplina, janelaCaderno, retencaoGeral, retencaoPorDisciplina, horasPorDisciplina;
  try {
    [kpis, cadernosEstudados, ranking, mediaMovelDiaria, situacao, produtividade, janelaDisciplina, janelaCaderno, retencaoGeral, retencaoPorDisciplina, horasPorDisciplina] = await Promise.all([
      getKpis(),
      getCadernosEstudados(),
      getRankingRisco(),
      getMediaMovelSemanal(),
      getContadoresSituacao(),
      getProdutividadeGeral(),
      getJanelaTendenciaDisciplina(),
      getJanelaTendenciaCadernoDestaques(),
      getRetencaoGeral(),
      getRetencaoPorDisciplina(),
      getHorasPorDisciplina(),
    ]);
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao carregar dashboard: ${escapeHtml(err.message)}</div>`;
    return;
  }

  const proximaAcao = pickProximaAcao(ranking);
  const tendenciaSemanal = getTendenciaSemanal(mediaMovelDiaria);

  // Ordem por impacto de decisão (03/07/2026), não pela ordem em que cada
  // métrica foi construída: 1) visão geral (KPIs + Cadernos por Situação),
  // 2) ação concreta (Próxima Ação + Ranking), 3) tendência ao longo do tempo,
  // 4) aprofundamento (Janela, Transferência, Retenção) pra quem quer investigar mais.
  content.innerHTML = `
    ${renderKpis(kpis, produtividade, cadernosEstudados)}
    ${renderSituacao(situacao)}
    ${renderProximaAcao(proximaAcao)}
    ${renderRanking(ranking)}
    ${renderMediaMovelSemanal(tendenciaSemanal)}
    ${renderAcertosErrosSemana(tendenciaSemanal)}
    ${renderHorasPorDisciplina(horasPorDisciplina)}
    ${renderJanelaTendenciaDisciplina(janelaDisciplina)}
    ${renderJanelaTendenciaCaderno(janelaCaderno)}
    ${renderRetencaoGeral(retencaoGeral)}
    ${renderRetencaoPorDisciplina(retencaoPorDisciplina)}
  `;

  // Cada gráfico é isolado no próprio try/catch: um erro de desenho (ex.:
  // Chart.js não carregado) não pode derrubar os outros gráficos do dashboard.
  if (tendenciaSemanal.semanas.length > 0) {
    tentarDesenhar(content, "media-movel-chart", () => renderChartMediaMovel(content.querySelector("#media-movel-chart"), tendenciaSemanal.semanas));
    tentarDesenhar(content, "acertos-erros-chart", () => renderChartAcertosErros(content.querySelector("#acertos-erros-chart"), tendenciaSemanal.semanas));
  }
  if (horasPorDisciplina.length > 0) {
    tentarDesenhar(content, "horas-disciplina-chart", () => renderChartHoras(content.querySelector("#horas-disciplina-chart"), horasPorDisciplina));
  }
  if (retencaoGeral.length > 0) {
    tentarDesenhar(content, "retencao-geral-chart", () => renderChartRetencao(content.querySelector("#retencao-geral-chart"), retencaoGeral));
  }
}

// Antes falhava em silêncio (canvas ficava em branco, sem pista nenhuma) —
// normalmente Chart.js não carregou (CDN bloqueado/rede), já que a lib vem
// de um <script> externo no index.html.
function tentarDesenhar(content, canvasId, desenhar) {
  try {
    desenhar();
  } catch (err) {
    const canvasEl = content.querySelector(`#${canvasId}`);
    if (canvasEl) {
      canvasEl.outerHTML = `<div class="alert alert--error">Erro ao desenhar o gráfico: ${escapeHtml(err.message)}. Verifique se o Chart.js carregou (console do navegador) — provável CDN bloqueado.</div>`;
    }
  }
}

// KPIs de topo (Fase 6-E, 03/07/2026): um grid único, sem títulos de seção
// separados. "Diagnóstico geral" virou "Desempenho geral" (termo mais direto).
// "Sessões ativas" saiu (contagem bruta não ajuda a decidir nada). "Cadernos
// estudados" e as duas métricas que antes viviam em "Produtividade e
// Eficiência" (Eficiência Estrita → "Acertos por hora"; Produtividade →
// "Questões por hora") entraram aqui, sem o rótulo técnico entre parênteses —
// Eficiência Global continua fora por decisão anterior do usuário (mistura
// acerto com horas não mensuráveis, vicia o número).
function renderKpis(kpis, produtividade, cadernosEstudados) {
  const diag = kpis.diagnosticoGeral;
  const diagLabel = diag ? formatPct(diag.wilson_pct) : "—";
  const diagBadge = diag ? renderBadge(diag.classificacao) : "";
  return `
    <div class="kpi-grid">
      <div class="kpi-card">
        <p class="kpi-card__label">Desempenho geral</p>
        <p class="kpi-card__value">${diagLabel} ${diagBadge}</p>
      </div>
      <div class="kpi-card">
        <p class="kpi-card__label">Horas estudadas</p>
        <p class="kpi-card__value">${kpis.horasTotais}h</p>
      </div>
      <div class="kpi-card">
        <p class="kpi-card__label">Cadernos estudados</p>
        <p class="kpi-card__value">${cadernosEstudados}</p>
      </div>
      <div class="kpi-card">
        <p class="kpi-card__label">Disciplinas em estudo</p>
        <p class="kpi-card__value">${kpis.disciplinasComSessao}</p>
      </div>
      <div class="kpi-card">
        <p class="kpi-card__label">Acertos por hora</p>
        <p class="kpi-card__value">${produtividade.eficienciaEstrita == null ? "—" : `${produtividade.eficienciaEstrita}/h`}</p>
      </div>
      <div class="kpi-card">
        <p class="kpi-card__label">Questões por hora</p>
        <p class="kpi-card__value">${produtividade.produtividade == null ? "—" : `${produtividade.produtividade}/h`}</p>
      </div>
    </div>
  `;
}

// Contadores por Situação (Fase 6-B) — quantos cadernos caem em cada
// classificação de Diagnóstico Wilson. Responde "como estou" no nível mais
// granular (caderno), complementando o KPI de Desempenho Geral (agregado
// total) e o Ranking de Risco (por disciplina). Sem título de seção (pedido
// do usuário, 03/07/2026) — fica como continuação natural do grid de cima.
function renderSituacao(situacao) {
  const total = Object.values(situacao).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return "";
  }
  const cards = Object.entries(SITUACAO_LABELS)
    .map(([key, meta]) => {
      const count = situacao[key] ?? 0;
      return `
        <div class="kpi-card">
          <p class="kpi-card__label">${escapeHtml(meta.label)}</p>
          <p class="kpi-card__value" style="color:${meta.color};">${count}</p>
        </div>
      `;
    })
    .join("");
  return `<div class="kpi-grid">${cards}</div>`;
}

// Tendência Semanal (Fase 6-C) — substitui o gráfico diário original (400
// pontos, ilegível) por 12 blocos semanais + comparação explícita semana
// atual vs anterior. Continua sendo a resposta direta a "melhorou ou piorou
// em relação à semana passada?". O usuário pediu de volta (03/07/2026) —
// tinha sido trocado pelo card de Acertos vs Erros por engano; os dois
// ficam, não é um ou outro.
function renderMediaMovelSemanal(t) {
  if (!t.semanas || t.semanas.length === 0) {
    return `
      <div class="card" style="margin-bottom:24px;">
        <h3 style="margin-top:0;">Tendência Semanal (% de acerto)</h3>
        <p style="color:var(--color-text-muted);">Sem sessões mensuráveis suficientes ainda.</p>
      </div>
    `;
  }
  const fmtData = (iso) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  let deltaHtml = '<p style="color:var(--color-text-muted);">Ainda não há uma semana anterior completa para comparar.</p>';
  if (t.deltaSemana != null) {
    const cor = t.deltaSemana > 0 ? "var(--color-success)" : t.deltaSemana < 0 ? "var(--color-error)" : "var(--color-text-muted)";
    const seta = t.deltaSemana > 0 ? "▲" : t.deltaSemana < 0 ? "▼" : "＝";
    deltaHtml = `
      <p style="margin: 4px 0 12px;">
        Semana atual (${fmtData(t.semanaAtual.inicio)}–${fmtData(t.semanaAtual.fim)}): <strong>${formatPct(t.semanaAtual.pct)}</strong>
        vs. semana anterior (${fmtData(t.semanaAnterior.inicio)}–${fmtData(t.semanaAnterior.fim)}): <strong>${formatPct(t.semanaAnterior.pct)}</strong>
        — <strong style="color:${cor};">${seta} ${Math.abs(t.deltaSemana).toFixed(2)} p.p.</strong>
      </p>
    `;
  }
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Tendência Semanal (% de acerto)</h3>
      ${deltaHtml}
      <canvas id="media-movel-chart" height="90"></canvas>
    </div>
  `;
}

// Acertos vs. Erros por Semana (Fase 6-D) — card adicional, não substitui o
// de cima. Mostra volume BRUTO (não %) pra responder também "o volume de
// erros está encolhendo", complementando a razão do gráfico de %. Referência:
// dashboards de Gran Cursos/Deltinha/Aprovado.
function renderAcertosErrosSemana(t) {
  if (!t.semanas || t.semanas.length === 0) return "";
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Acertos vs. Erros por Semana (volume)</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Número bruto de questões, não %. Mostra se o volume de erros está encolhendo em termos absolutos, não só na razão.</p>
      <canvas id="acertos-erros-chart" height="90"></canvas>
    </div>
  `;
}

// Horas por Disciplina (Fase 6-D) — rosca (doughnut) de alocação de tempo.
// Preenche a lacuna do KPI único "Horas estudadas" (não quebrado por nada).
// Todos os tipos de estudo contam (mesmo critério do KPI) — é tempo, não
// acerto, sem risco de viés tipo Eficiência Global.
function renderHorasPorDisciplina(linhas) {
  if (!linhas || linhas.length === 0) return "";
  const total = linhas.reduce((acc, l) => acc + l.horas, 0);
  // Tabela com % exato ao lado do gráfico: com 9 disciplinas e horas muito
  // desiguais, uma fatia com <1h num total de ~2000h vira uma fatia de menos
  // de 1 grau — visualmente imperceptível na rosca (não é bug, é matemática
  // de pizza), mas o número exato precisa continuar visível em algum lugar.
  const rows = linhas
    .map(
      (l) => `
      <tr>
        <td>${escapeHtml(l.disciplinaNome)}</td>
        <td>${l.horas}h</td>
        <td>${formatPct(total > 0 ? (l.horas / total) * 100 : null)}</td>
      </tr>
    `
    )
    .join("");
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Horas por Disciplina</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Total: ${Math.round(total * 10) / 10}h, todos os tipos de estudo. Disciplinas com fatia muito pequena podem não aparecer visível na rosca — a tabela abaixo tem o número exato de todas.</p>
      <div style="display:flex; gap:24px; flex-wrap:wrap; align-items:flex-start;">
        <div style="max-width:340px; flex:1; min-width:280px;">
          <canvas id="horas-disciplina-chart" height="260"></canvas>
        </div>
        <div style="flex:1; min-width:280px;">
          <table class="data-table">
            <tr><th>Disciplina</th><th>Horas</th><th>%</th></tr>
            ${rows}
          </table>
        </div>
      </div>
    </div>
  `;
}

// Janela de Tendência por Disciplina (Fase 6-C) — view v_janela_tendencia já
// existia (Fase 5) mas nunca foi exposta em tela. Curta = últimas ~100
// questões; Longa = últimas ~300. Responde "em quais disciplinas realmente
// evoluí" e "tendência subir ou estagnar" olhando desempenho recente vs. mais
// antigo, não percentual acumulado desde o início.
function renderJanelaTendenciaDisciplina(linhas) {
  if (!linhas || linhas.length === 0) return "";
  const TENDENCIA_LABEL = { subindo: "Subindo", caindo: "Caindo", estavel: "Estável" };
  const TENDENCIA_COR = { subindo: "var(--color-success)", caindo: "var(--color-error)", estavel: "var(--color-text-muted)" };
  const rows = linhas
    .map((l) => {
      const cor = TENDENCIA_COR[l.tendencia] || "var(--color-text-muted)";
      const label = TENDENCIA_LABEL[l.tendencia] || "—";
      return `
        <tr>
          <td>${escapeHtml(l.disciplinaNome)}</td>
          <td>${formatPct(l.pctCurta)} (${l.questoesCurta ?? 0}q)</td>
          <td>${formatPct(l.pctLonga)} (${l.questoesLonga ?? 0}q)</td>
          <td style="color:${cor};"><strong>${formatDeltaPct(l.delta)} — ${label}</strong></td>
        </tr>
      `;
    })
    .join("");
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Tendência por Disciplina (recente vs. mais antigo)</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Compara as últimas ~100 questões com as últimas ~300 — diferença até 3 p.p. é tratada como estável.</p>
      <table class="data-table">
        <tr><th>Disciplina</th><th>Janela curta</th><th>Janela longa</th><th>Delta</th></tr>
        ${rows}
      </table>
    </div>
  `;
}

// Cadernos que mais subiram/caíram (Fase 6-C) — mesma lógica, granularidade
// de caderno, só destaques (não lista completa) pra não poluir o dashboard.
function renderJanelaTendenciaCaderno(dados) {
  if (!dados || (dados.subindo.length === 0 && dados.caindo.length === 0)) return "";
  const linha = (l) => `
    <tr>
      <td>${escapeHtml(l.cadernoNome)}</td>
      <td>${formatPct(l.pctCurta)}</td>
      <td>${formatPct(l.pctLonga)}</td>
      <td>${formatDeltaPct(l.delta)}</td>
    </tr>
  `;
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Cadernos que mais mudaram (recente vs. mais antigo)</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Só cadernos com pelo menos 20 questões na janela longa. Mostra os 5 maiores avanços e as 5 maiores quedas.</p>
      <div style="display:flex; gap:24px; flex-wrap:wrap;">
        <div style="flex:1; min-width:280px;">
          <p style="margin:0 0 4px; color:var(--color-success); font-weight:600;">Maiores avanços</p>
          <table class="data-table">
            <tr><th>Caderno</th><th>Curta</th><th>Longa</th><th>Delta</th></tr>
            ${dados.subindo.map(linha).join("") || '<tr><td colspan="4">—</td></tr>'}
          </table>
        </div>
        <div style="flex:1; min-width:280px;">
          <p style="margin:0 0 4px; color:var(--color-error); font-weight:600;">Maiores quedas</p>
          <table class="data-table">
            <tr><th>Caderno</th><th>Curta</th><th>Longa</th><th>Delta</th></tr>
            ${dados.caindo.map(linha).join("") || '<tr><td colspan="4">—</td></tr>'}
          </table>
        </div>
      </div>
    </div>
  `;
}

// Transferência entre Editais foi movida pra historyPage.js (03/07/2026 —
// decisão do usuário: não é acionável no dia a dia, mais exploratória).

// Retenção Geral por faixa de intervalo (Fase 6-C) — agrega v_retencao_caderno
// (proxy por caderno, Fase 5) somando todos os cadernos por faixa. Responde
// "minhas revisões estão aumentando minha retenção" — olhe se o % de acerto
// sobe conforme o intervalo desde o último toque diminui. Isto é o dado bruto,
// sem conclusão automática: com poucas questões numa faixa, a diferença pode
// ser ruído, não sinal real.
function renderRetencaoGeral(linhas) {
  if (!linhas || linhas.length === 0) return "";
  const rows = linhas
    .map(
      (l) => `
      <tr>
        <td>${escapeHtml(l.faixa)}</td>
        <td>${formatPct(l.pct)}</td>
        <td>${l.questoes}</td>
      </tr>
    `
    )
    .join("");
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Retenção por Intervalo de Revisão</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Acerto médio agrupado pelo intervalo desde a última vez que você tocou naquele caderno (qualquer tipo de estudo conta como "toque"). Proxy por caderno — não por questão individual (question_attempts não é usado, registro é agregado desde a Fase 4). Curva no estilo da curva de esquecimento (Anki): se sobe da direita pra esquerda, revisão está segurando retenção.</p>
      <canvas id="retencao-geral-chart" height="80"></canvas>
      <table class="data-table" style="margin-top:16px;">
        <tr><th>Intervalo desde o último toque</th><th>% acerto</th><th>Questões</th></tr>
        ${rows}
      </table>
    </div>
  `;
}

// Retenção por Disciplina (Fase 6-F, 03/07/2026) — resposta direta a "como vou
// saber qual disciplina/caderno eu revisei": a curva geral acima soma tudo, aqui
// quebra a mesma faixa por disciplina. Disciplina é o meio-termo — por caderno
// individual (613 deles) seria uma tabela ilegível; por disciplina (9) cabe
// numa tela só. Célula em branco = disciplina sem sessão naquela faixa ainda.
function renderRetencaoPorDisciplina(dados) {
  if (!dados || !dados.disciplinas || dados.disciplinas.length === 0) return "";
  const headerFaixas = dados.faixasOrdenadas.map((f) => `<th>${escapeHtml(f)}</th>`).join("");
  const rows = dados.disciplinas
    .map((d) => {
      const celulas = d.faixas
        .map((f) => (f.questoes > 0 ? `<td>${formatPct(f.pct)} <span style="color:var(--color-text-muted); font-size:11px;">(${f.questoes}q)</span></td>` : `<td style="color:var(--color-text-muted);">—</td>`))
        .join("");
      return `<tr><td>${escapeHtml(d.disciplinaNome)}</td>${celulas}</tr>`;
    })
    .join("");
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Retenção por Disciplina</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Mesma curva de cima, quebrada por disciplina — pra ver qual disciplina está puxando pra cima ou pra baixo cada faixa de intervalo.</p>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <tr><th>Disciplina</th>${headerFaixas}</tr>
          ${rows}
        </table>
      </div>
    </div>
  `;
}

// Próxima Ação (reescrita 03/07/2026): antes expunha classificação técnica e
// % Wilson direto ("Crítico — peso alto, Wilson 65,74%"), o que exige saber os
// cortes de classificação pra fazer sentido — sem esse contexto, o número
// parece arbitrário. Agora o motivo vem em texto simples, sem % nem badge;
// os números completos continuam disponíveis no Ranking de Risco logo abaixo,
// pra quem quiser ver o detalhe.
function renderProximaAcao(item) {
  if (!item) {
    return `<div class="proxima-acao"><strong>Foco sugerido:</strong> ainda não há dado mensurável suficiente para sugerir foco.</div>`;
  }
  let motivo;
  if (item.classificacao === "consolidado") {
    motivo = item.usouPesoAlto
      ? `está consolidada mesmo sendo peso alto — priorize manutenção, não é urgência.`
      : `é a que está com o resultado mais discreto agora, mas seguindo bem.`;
  } else if (item.classificacao === "preliminar") {
    motivo = item.usouPesoAlto
      ? `é peso alto e ainda não tem questões suficientes pra saber como você está indo — vale testar.`
      : `ainda não tem questões suficientes pra saber como você está indo.`;
  } else {
    motivo = item.usouPesoAlto
      ? `é a disciplina de peso alto com o resultado mais frágil agora.`
      : `é a disciplina com o resultado mais frágil entre as que você estuda.`;
  }
  return `
    <div class="proxima-acao">
      <strong>Foco sugerido:</strong> <strong>${escapeHtml(item.disciplinaNome)}</strong> ${motivo}
    </div>
  `;
}

function renderRanking(ranking) {
  if (ranking.length === 0) {
    return `<div class="card" style="margin-bottom:24px;"><p style="color:var(--color-text-muted);">Nenhuma disciplina com sessão mensurável ainda.</p></div>`;
  }
  const rows = ranking
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.disciplinaNome)}</td>
        <td>${renderBadge(r.classificacao)}</td>
        <td>${formatPct(r.wilsonPct)}</td>
        <td>${r.questoesTotal}</td>
        <td>${r.weight ? renderPesoBadge(r.weight) : "—"}${r.pesoNumericoPct != null ? ` (${formatPct(r.pesoNumericoPct)})` : ""}</td>
      </tr>
    `
    )
    .join("");

  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Ranking de Risco</h3>
      <table class="data-table">
        <tr><th>Disciplina</th><th>Diagnóstico</th><th>Wilson</th><th>Questões</th><th>Peso</th></tr>
        ${rows}
      </table>
    </div>
  `;
}

function renderBadge(classificacao) {
  if (!classificacao) return "";
  return `<span class="badge badge--${classificacao}">${classificacao}</span>`;
}

function renderPesoBadge(weight) {
  return `<span class="badge badge--peso-${weight}">${weight}</span>`;
}

// Recebe os blocos semanais já agregados (getTendenciaSemanal) — no máximo
// ~12 pontos, em vez dos ~400 dias corridos que tornavam o gráfico anterior
// ilegível (muitos rótulos amontoados no eixo X, linha diária cheia de ruído
// escondendo qualquer tendência). % de acerto por semana — o gráfico original
// (Fase 6-C), restaurado como card próprio a pedido do usuário (03/07/2026).
function renderChartMediaMovel(canvas, semanas) {
  if (chartMediaMovelInstance) {
    chartMediaMovelInstance.destroy();
    chartMediaMovelInstance = null;
  }
  const fmtData = (iso) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  const labels = semanas.map((s) => `${fmtData(s.inicio)}–${fmtData(s.fim)}`);
  const dataPct = semanas.map((s) => s.pct);

  chartMediaMovelInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "% acerto na semana", data: dataPct, backgroundColor: "#1f3864" }],
    },
    options: {
      responsive: true,
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => formatPct(v) } } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatPct(ctx.parsed.y)}` } },
      },
    },
  });
}

// Acertos vs. Erros por Semana (Fase 6-D) — duas áreas em volume bruto (não
// %), no mesmo padrão de dashboards de apps de concurso (Gran/Deltinha/
// Aprovado) — mostra se o volume de erros está encolhendo em número absoluto,
// complementando (não substituindo) o gráfico de % acima.
function renderChartAcertosErros(canvas, semanas) {
  if (chartAcertosErrosInstance) {
    chartAcertosErrosInstance.destroy();
    chartAcertosErrosInstance = null;
  }
  const fmtData = (iso) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  const labels = semanas.map((s) => `${fmtData(s.inicio)}–${fmtData(s.fim)}`);
  const dataAcertos = semanas.map((s) => s.acertos);
  const dataErros = semanas.map((s) => s.erros);

  chartAcertosErrosInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Acertos",
          data: dataAcertos,
          borderColor: "#1e7e34",
          backgroundColor: "rgba(30, 126, 52, 0.25)",
          fill: "origin",
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: "Erros",
          data: dataErros,
          borderColor: "#c0392b",
          backgroundColor: "rgba(192, 57, 43, 0.25)",
          fill: "origin",
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, title: { display: true, text: "Questões" } } },
    },
  });
}

// Rosca de horas por disciplina (Fase 6-D).
function renderChartHoras(canvas, linhas) {
  if (chartHorasInstance) {
    chartHorasInstance.destroy();
    chartHorasInstance = null;
  }
  const CORES = ["#1f3864", "#2e7d32", "#c0392b", "#b45309", "#6a1b9a", "#00838f", "#8d6e63", "#546e7a", "#ad1457"];
  const total = linhas.reduce((acc, l) => acc + l.horas, 0);
  chartHorasInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: linhas.map((l) => l.disciplinaNome),
      datasets: [
        {
          data: linhas.map((l) => l.horas),
          backgroundColor: linhas.map((_, i) => CORES[i % CORES.length]),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right" },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed}h (${formatPct(total > 0 ? (ctx.parsed / total) * 100 : null)})`,
          },
        },
      },
    },
  });
}

// Curva de Retenção (Fase 6-D) — estilo curva de esquecimento (Anki):
// intervalo desde o último toque no eixo X, % acerto no eixo Y.
function renderChartRetencao(canvas, linhas) {
  if (chartRetencaoInstance) {
    chartRetencaoInstance.destroy();
    chartRetencaoInstance = null;
  }
  chartRetencaoInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: linhas.map((l) => l.faixa),
      datasets: [
        {
          label: "% acerto",
          data: linhas.map((l) => l.pct),
          borderColor: "#1f3864",
          backgroundColor: "rgba(31, 56, 100, 0.15)",
          fill: true,
          tension: 0.3,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => formatPct(v) } } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => formatPct(ctx.parsed.y) } },
      },
    },
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
