// catalogService — leitura do catálogo (bancas, disciplinas, concursos, cadernos)
// e criação sob demanda dos 4 (Fase 4/10). RLS decide sozinho o que cada
// usuário enxerga — não precisamos replicar essa regra aqui.

import { supabase } from "../supabaseClient.js";

export async function listDisciplines() {
  const { data, error } = await supabase
    .from("disciplines")
    .select("id, name, category, status, user_id")
    .order("name");
  if (error) throw error;
  return data;
}

export async function listExamBoards() {
  const { data, error } = await supabase
    .from("exam_boards")
    .select("id, name, user_id")
    .order("name");
  if (error) throw error;
  return data;
}

export async function listExams() {
  const { data, error } = await supabase
    .from("exams")
    .select("id, name, year, role, area, exam_date, status, board_id, user_id")
    .order("name");
  if (error) throw error;
  return data;
}

export async function listQuestionSets() {
  const { data, error } = await supabase
    .from("question_sets")
    .select("id, name, discipline_id, exam_id, status, learning_level, user_id")
    .order("name");
  if (error) throw error;
  return data;
}

// Cadastro sob demanda de Concurso, Banca, Disciplina e Caderno (Fase 4/10).
// Endurecido em 05/07/2026 (pedido do usuário): antes, quando quem cadastrava
// era admin, o item virava GLOBAL (user_id nulo, visível a todo mundo) — isso
// fazia com que cada concurso/banca/disciplina/caderno de teste do admin
// vazasse pra qualquer usuário novo que se cadastrasse no site. Agora TODO
// mundo, inclusive admin, cria sempre como item PESSOAL (user_id = quem
// criou) — cada usuário monta o próprio catálogo do zero. Promover algo
// pessoal pra global (visível a todos) virou uma ação manual, feita direto
// no banco quando o usuário pedir explicitamente — não existe mais esse
// caminho automático via "+ Cadastrar novo".
export async function createQuestionSet({ name, disciplineId, examId, userId }) {
  const { data, error } = await supabase
    .from("question_sets")
    .insert({ name, discipline_id: disciplineId, exam_id: examId || null, user_id: userId })
    .select("id, name, discipline_id, exam_id, status, learning_level")
    .single();
  if (error) throw error;
  return data;
}

export async function createExam({ name, userId }) {
  const { data, error } = await supabase
    .from("exams")
    .insert({ name, user_id: userId })
    .select("id, name, year, role, area, exam_date, status, board_id")
    .single();
  if (error) throw error;
  return data;
}

export async function createExamBoard({ name, userId }) {
  const { data, error } = await supabase
    .from("exam_boards")
    .insert({ name, user_id: userId })
    .select("id, name")
    .single();
  if (error) throw error;
  return data;
}

export async function createDiscipline({ name, userId }) {
  const { data, error } = await supabase
    .from("disciplines")
    .insert({ name, user_id: userId })
    .select("id, name, category, status")
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Painel Admin — "Dicionário" (Fase 10, 05/07/2026). Só faz sentido pra quem é
// admin: as 4 listagens abaixo devolvem TODOS os registros de TODOS os
// usuários (a RLS de select agora tem bypass de is_admin(), sem essa
// permissão o admin só veria global + próprio, igual usuário comum). Cada uma
// inclui user_id + created_at, que as listagens normais acima não trazem
// (são só pro formulário de Nova Sessão, não precisam saber o dono).
export async function listDisciplinesAdmin() {
  const { data, error } = await supabase
    .from("disciplines")
    .select("id, name, category, status, user_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listExamBoardsAdmin() {
  const { data, error } = await supabase
    .from("exam_boards")
    .select("id, name, user_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listExamsAdmin() {
  const { data, error } = await supabase
    .from("exams")
    .select("id, name, user_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listQuestionSetsAdmin() {
  const { data, error } = await supabase
    .from("question_sets")
    .select("id, name, discipline_id, user_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Dono de cada item (email + nome de exibição) — junta auth.users, que não é
// legível direto pelo cliente. Função SQL admin_list_users() (SECURITY
// DEFINER) devolve vazio pra quem não é admin, então é seguro chamar sempre.
export async function adminListUsers() {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return data;
}

export async function updateDisciplineName(id, name) {
  const { error } = await supabase.from("disciplines").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function updateExamBoardName(id, name) {
  const { error } = await supabase.from("exam_boards").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function updateExamName(id, name) {
  const { error } = await supabase.from("exams").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function updateQuestionSetName(id, name) {
  const { error } = await supabase.from("question_sets").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteDiscipline(id) {
  const { error } = await supabase.from("disciplines").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteExamBoard(id) {
  const { error } = await supabase.from("exam_boards").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteExam(id) {
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteQuestionSet(id) {
  const { error } = await supabase.from("question_sets").delete().eq("id", id);
  if (error) throw error;
}
