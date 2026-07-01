// catalogService — leitura do catálogo (bancas, disciplinas, concursos, cadernos).
// Escrita fica restrita a admin nas políticas RLS (Fase 1); esta versão só lê.

import { supabase } from "../supabaseClient.js";

export async function listDisciplines() {
  const { data, error } = await supabase
    .from("disciplines")
    .select("id, name, category, status")
    .order("name");
  if (error) throw error;
  return data;
}

export async function listExamBoards() {
  const { data, error } = await supabase
    .from("exam_boards")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data;
}

export async function listExams() {
  const { data, error } = await supabase
    .from("exams")
    .select("id, name, year, role, area, exam_date, status, board_id")
    .order("name");
  if (error) throw error;
  return data;
}

export async function listQuestionSets() {
  const { data, error } = await supabase
    .from("question_sets")
    .select("id, name, discipline_id, exam_id, status, learning_level")
    .order("name");
  if (error) throw error;
  return data;
}
