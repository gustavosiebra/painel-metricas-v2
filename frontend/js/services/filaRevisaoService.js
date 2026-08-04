// filaRevisaoService (03/08/2026) — Fila de Revisão Condicional.
//
// Por que existe: o painel diagnosticava bem ONDE o usuário estava mal, mas a
// tradução disso em "o que fazer agora" acontecia só na conversa, nunca no
// sistema. Os apps de mercado (Aprovado, Estudei, Gran) resolvem com revisão
// espaçada por calendário fixo (3-7-15 dias, igual pra todo conteúdo). Aqui a
// regra é diferente e deliberada: a fila é priorizada pelo DIAGNÓSTICO que já
// medimos — Wilson, recorrência da banca, peso da disciplina, retenção no
// reencontro, erro em aberto — não pelo relógio. Conteúdo que você domina não
// volta cedo só porque "deu o prazo".
//
// As regras vivem aqui (JS) e não numa view, de propósito: são heurísticas de
// produto que devem mudar com o uso, e mexer nelas não pode exigir migração.

import { supabase } from "../supabaseClient.js";

// Pesos do score. Somados; o maior vai pro topo da fila. Escala arbitrária mas
// calibrada pra que "lacuna grande em tema que cai muito" supere "esqueci algo
// que eu já dominava".
const P = {
  wilsonCritico: 40,
  wilsonAtencao: 20,
  recorrenciaAlta: 25,
  recorrenciaMedia: 10,
  pesoAlto: 15,
  reencontroRuim: 30, // voltou ao caderno e ainda assim errou muito
  preliminar: 12, // amostra insuficiente: diagnóstico não fecha
  erroAberto: 18, // por erro T1–T7 em aberto naquele caderno
  erroReincidente: 25, // mesmo subtema errado 2+ vezes
  esquecimentoPorSemana: 3, // cresce com o tempo sem tocar (teto abaixo)
  esquecimentoTeto: 24,
};

const DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");
const norm = (t) => (t || "").trim().toLowerCase().normalize("NFD").replace(DIACRITICOS, "");

export async function getFilaRevisao() {
  const [cadernosRes, errosRes] = await Promise.all([
    supabase
      .from("v_fila_revisao_caderno")
      .select(
        "question_set_id, caderno_nome, discipline_id, disciplina_nome, questoes_total, wilson_pct, classificacao_wilson, classificacao_recorrencia, classificacao_prioridade, peso_disciplina, ultimo_estudo, dias_sem_estudar, reencontro_pct, reencontro_faixa"
      ),
    supabase
      .from("error_records")
      .select("id, question_set_id, discipline_id, subtema, tipo, status, created_at")
      .eq("status", "aberto"),
  ]);
  if (cadernosRes.error) throw cadernosRes.error;
  if (errosRes.error) throw errosRes.error;

  const erros = errosRes.data || [];

  // Reincidência por subtema normalizado dentro da disciplina — o
  // indicador-mestre da metodologia de erro. Conta TODOS os registros (não só
  // os abertos): errar 3x o mesmo ponto é sinal mesmo que 2 já tenham sido
  // encerrados.
  const contagemSubtema = new Map();
  for (const e of erros) {
    const k = `${e.discipline_id}|${norm(e.subtema)}`;
    contagemSubtema.set(k, (contagemSubtema.get(k) || 0) + 1);
  }

  const errosPorCaderno = new Map();
  for (const e of erros) {
    if (!e.question_set_id) continue;
    const lista = errosPorCaderno.get(e.question_set_id) || [];
    lista.push(e);
    errosPorCaderno.set(e.question_set_id, lista);
  }

  const itens = (cadernosRes.data || []).map((c) => {
    const motivos = [];
    let score = 0;

    const wilson = c.wilson_pct == null ? null : Number(c.wilson_pct);
    if (c.classificacao_wilson === "critico") {
      score += P.wilsonCritico;
      motivos.push({ texto: `Diagnóstico crítico (Wilson ${wilson?.toFixed(1)}%)`, tipo: "critico" });
    } else if (c.classificacao_wilson === "atencao") {
      score += P.wilsonAtencao;
      motivos.push({ texto: `Diagnóstico em atenção (Wilson ${wilson?.toFixed(1)}%)`, tipo: "atencao" });
    } else if (c.classificacao_wilson === "preliminar") {
      score += P.preliminar;
      const faltam = Math.max(30 - Number(c.questoes_total || 0), 0);
      motivos.push({ texto: `Diagnóstico não fecha — faltam ~${faltam} questões pra sair de preliminar`, tipo: "preliminar" });
    }

    if (c.classificacao_recorrencia === "alta") {
      score += P.recorrenciaAlta;
      motivos.push({ texto: "Tema de alta recorrência na banca", tipo: "recorrencia" });
    } else if (c.classificacao_recorrencia === "media") {
      score += P.recorrenciaMedia;
    }

    if (c.peso_disciplina === "alto") {
      score += P.pesoAlto;
      motivos.push({ texto: "Disciplina de peso alto no edital", tipo: "peso" });
    }

    // Voltou ao caderno e ainda errou muito: não é esquecimento, é conteúdo
    // que nunca foi aprendido na primeira passada. Merece teoria, não mais
    // questão às cegas.
    const reenc = c.reencontro_pct == null ? null : Number(c.reencontro_pct);
    if (reenc != null && reenc < 60) {
      score += P.reencontroRuim;
      motivos.push({ texto: `No reencontro (${c.reencontro_faixa}) acertou só ${reenc.toFixed(0)}%`, tipo: "retencao" });
    }

    const errosDoCaderno = errosPorCaderno.get(c.question_set_id) || [];
    if (errosDoCaderno.length > 0) {
      score += P.erroAberto * Math.min(errosDoCaderno.length, 3);
      motivos.push({ texto: `${errosDoCaderno.length} erro(s) em aberto`, tipo: "erro" });
    }
    const reincidentes = errosDoCaderno.filter((e) => (contagemSubtema.get(`${e.discipline_id}|${norm(e.subtema)}`) || 0) >= 2);
    if (reincidentes.length > 0) {
      score += P.erroReincidente;
      motivos.push({ texto: `Reincidência: ${reincidentes.map((e) => e.subtema).join(", ")}`, tipo: "reincidencia" });
    }

    const dias = c.dias_sem_estudar == null ? null : Number(c.dias_sem_estudar);
    if (dias != null && dias >= 14) {
      score += Math.min(Math.floor(dias / 7) * P.esquecimentoPorSemana, P.esquecimentoTeto);
      motivos.push({ texto: `${dias} dias sem tocar`, tipo: "tempo" });
    }

    return {
      questionSetId: c.question_set_id,
      cadernoNome: c.caderno_nome,
      disciplineId: c.discipline_id,
      disciplinaNome: c.disciplina_nome,
      questoes: Number(c.questoes_total || 0),
      wilson,
      classificacao: c.classificacao_wilson,
      recorrencia: c.classificacao_recorrencia,
      peso: c.peso_disciplina,
      diasSemEstudar: dias,
      reencontroPct: reenc,
      score,
      motivos,
      acao: sugerirAcao({ classificacao: c.classificacao_wilson, reencontro: reenc, errosAbertos: errosDoCaderno.length, questoes: Number(c.questoes_total || 0) }),
    };
  });

  // Só entra na fila quem tem motivo real. Caderno consolidado, recente e sem
  // erro aberto não precisa aparecer — fila cheia de item irrelevante é fila
  // que ninguém lê.
  return itens.filter((i) => i.motivos.length > 0).sort((a, b) => b.score - a.score);
}

// A ação depende do PORQUÊ, não só do quanto: reencontro ruim pede teoria;
// amostra pequena pede volume; erro aberto pede fechamento. É a diferença
// entre esta fila e uma agenda de revisão por calendário.
function sugerirAcao({ classificacao, reencontro, errosAbertos, questoes }) {
  if (reencontro != null && reencontro < 60) {
    return "Teoria dirigida (15–30 min) e só depois questões — no reencontro o acerto caiu, sinal de que não foi aprendido na primeira passada.";
  }
  if (errosAbertos > 0) {
    return "Fechar os erros em aberto: resolver questões novas do mesmo ponto e encerrar o registro se acertar sabendo explicar.";
  }
  if (classificacao === "critico") {
    return "Reforço dirigido: revisar a teoria do ponto fraco e fazer 20 questões novas.";
  }
  if (classificacao === "preliminar" && questoes < 30) {
    return `Fechar diagnóstico: +${Math.max(30 - questoes, 0)} questões pra o Wilson deixar de ser preliminar.`;
  }
  if (classificacao === "atencao") {
    return "Bloco de 20 questões pra confirmar se subiu ou estabilizou.";
  }
  return "Manutenção: bloco curto de questões pra confirmar retenção.";
}
