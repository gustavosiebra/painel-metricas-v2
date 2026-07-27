// errorService (27/07/2026) — registro de erros classificados por causa raiz
// (T1–T7). Cada registro é UM erro (ou chute/acerto inseguro) com ciclo de
// vida aberto → encerrado. Ver migração error_records no Supabase para o
// racional completo. RLS garante que cada usuário só vê/mexe nos próprios.

import { supabase } from "../supabaseClient.js";

const SELECT_COLS =
  "id, session_id, discipline_id, question_set_id, board_id, subtema, resultado, tipo, causa, regra, gatilho, anotacao, status, closed_at, created_at";

// Paginado desde o nascimento (lição do corte de 1000 linhas do PostgREST
// que escondia cadernos no catálogo — ver listQuestionSets).
export async function listErrorRecords() {
  const PAGE = 1000;
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("error_records")
      .select(SELECT_COLS)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

export async function createErrorRecord(payload) {
  const { data, error } = await supabase
    .from("error_records")
    .insert({
      user_id: payload.userId,
      session_id: payload.sessionId || null,
      discipline_id: payload.disciplineId,
      question_set_id: payload.questionSetId || null,
      board_id: payload.boardId || null,
      subtema: payload.subtema,
      resultado: payload.resultado,
      tipo: payload.tipo,
      causa: payload.causa,
      regra: payload.regra || null,
      gatilho: payload.gatilho || null,
      anotacao: payload.anotacao || null,
    })
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data;
}

// Encerrar/reabrir — closed_at acompanha o status (métrica de tempo de vida
// do erro depende dele).
export async function setErrorStatus(id, status) {
  const { error } = await supabase
    .from("error_records")
    .update({ status, closed_at: status === "encerrado" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteErrorRecord(id) {
  const { error } = await supabase.from("error_records").delete().eq("id", id);
  if (error) throw error;
}
