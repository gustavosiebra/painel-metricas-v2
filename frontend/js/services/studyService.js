// studyService — registro de sessões de estudo (Fase 4).
// Modo agregado por decisão do usuário (01/07/2026): total por caderno quando
// study_type = "questao"/"simulado"/"discursiva" (session_results); só tempo
// nos demais tipos (revisao/flashcard/leitura/videoaula). question_attempts
// fica vazio por enquanto — schema já preparado, sem uso ainda.

import { supabase } from "../supabaseClient.js";

const TYPES_WITH_MEASURABLE_RESULT = ["questao", "simulado", "discursiva"];

export function hasMeasurableResult(studyType) {
  return TYPES_WITH_MEASURABLE_RESULT.includes(studyType);
}

// payload: {
//   userId, occurredAt, examId, disciplineId, questionSetId, studyType,
//   durationMinutes, selfConfidence, notes,
//   // só quando hasMeasurableResult(studyType):
//   questionsTotal, correctTotal, wrongTotal, score, scoreIsEstimate
// }
export async function createStudySession(payload) {
  const { data: session, error: sessionError } = await supabase
    .from("study_sessions")
    .insert({
      user_id: payload.userId,
      occurred_at: payload.occurredAt,
      exam_id: payload.examId || null,
      board_id: payload.boardId || null,
      discipline_id: payload.disciplineId,
      question_set_id: payload.questionSetId || null,
      study_type: payload.studyType,
      duration_minutes: payload.durationMinutes,
      self_confidence: payload.selfConfidence || null,
      notes: payload.notes || null,
    })
    .select("id")
    .single();

  if (sessionError) throw sessionError;

  if (hasMeasurableResult(payload.studyType)) {
    const { error: resultError } = await supabase.from("session_results").insert({
      user_id: payload.userId,
      session_id: session.id,
      questions_total: payload.questionsTotal ?? 0,
      correct_total: payload.correctTotal ?? 0,
      wrong_total: payload.wrongTotal ?? 0,
      score: payload.score ?? null,
      score_is_estimate: payload.scoreIsEstimate ?? false,
    });
    if (resultError) throw resultError;
  }

  return session;
}

export async function listRecentSessions(limit = 20) {
  const { data, error } = await supabase
    .from("study_sessions")
    .select(
      "id, occurred_at, study_type, duration_minutes, discipline_id, question_set_id, self_confidence, session_results(questions_total, correct_total, wrong_total, score)"
    )
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
