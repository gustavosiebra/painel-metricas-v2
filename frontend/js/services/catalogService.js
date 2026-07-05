// catalogService — leitura do catálogo (bancas, disciplinas, concursos, cadernos)
// e criação de cadernos sob demanda (Fase 4: "cadernos vão sendo criados aos
// poucos, ao registrar sessões"). RLS decide sozinho se o registro criado é
// global (admin) ou pessoal (usuário comum) — não precisamos replicar essa
// regra aqui, só chamar insert com o user_id certo.

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

// Cria um caderno novo. isAdmin=true grava user_id nulo (catálogo global,
// reaproveitado por todo mundo); caso contrário grava user_id = próprio usuário
// (pessoal). exam_id é opcional — deixe nulo para caderno de estudo geral,
// reaproveitável entre concursos (ver Doc. Único, seção 2.3).
export async function createQuestionSet({ name, disciplineId, examId, isAdmin, userId }) {
  const { data, error } = await supabase
    .from("question_sets")
    .insert({
      name,
      discipline_id: disciplineId,
      exam_id: examId || null,
      user_id: isAdmin ? null : userId,
    })
    .select("id, name, discipline_id, exam_id, status, learning_level")
    .single();
  if (error) throw error;
  return data;
}

// Cadastro sob demanda de Concurso, Banca e Disciplina (05/07/2026) — mesmo
// padrão acima, estendido às outras 3 entidades do catálogo. A tela de
// Catálogo foi removida da navbar (Fase 8), então sem isso a pessoa ficaria
// travada em Nova Sessão sempre que precisasse de um concurso/banca/
// disciplina que ainda não existe. RLS (disciplines_insert/exam_boards_insert/
// exams_insert) segue a mesma regra de question_sets: user_id nulo só é aceito
// se for admin (catálogo global); usuário comum sempre grava com seu próprio
// user_id (item pessoal, só ele enxerga via *_select).
export async function createExam({ name, isAdmin, userId }) {
  const { data, error } = await supabase
    .from("exams")
    .insert({ name, user_id: isAdmin ? null : userId })
    .select("id, name, year, role, area, exam_date, status, board_id")
    .single();
  if (error) throw error;
  return data;
}

export async function createExamBoard({ name, isAdmin, userId }) {
  const { data, error } = await supabase
    .from("exam_boards")
    .insert({ name, user_id: isAdmin ? null : userId })
    .select("id, name")
    .single();
  if (error) throw error;
  return data;
}

export async function createDiscipline({ name, isAdmin, userId }) {
  const { data, error } = await supabase
    .from("disciplines")
    .insert({ name, user_id: isAdmin ? null : userId })
    .select("id, name, category, status")
    .single();
  if (error) throw error;
  return data;
}
