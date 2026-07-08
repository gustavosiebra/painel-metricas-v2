// parameterService — Fase 7 (Parâmetros). Lê/escreve user_parameters (NEG-005:
// faixas/limiares/pesos configuráveis, nunca números mágicos em fórmula) e
// risk_rules pessoal (Situação × Peso → ação recomendada). Os defaults abaixo
// são os MESMOS embutidos em get_user_param() no banco (Fase 5) — mantidos
// aqui só para pré-preencher o formulário quando o usuário ainda não tem linha
// própria; a fonte de verdade do cálculo continua sendo o banco.

import { supabase } from "../supabaseClient.js";

export const PARAM_DEFAULTS = {
  wilson_thresholds: { consolidado: 80, atencao: 60 },
  diagnostico_min_n: 30,
  estabilidade_min_n: 30,
  janela_tendencia: { curta: 100, longa: 300 },
  // Janela (dias corridos) da versão "recente" de Acertos/hora e Questões/hora
  // no Dashboard (07/07/2026, pedido do usuário) — só uso do lado do cliente,
  // repassado direto pro parâmetro p_dias de eficiencia_caderno() na chamada
  // (não é lido via get_user_param() no banco, diferente dos outros acima).
  produtividade_janela_dias: 28,
  // Piso de N — Tendência Semanal (08/07/2026, pedido do usuário) — abaixo
  // desse volume de questões NA SEMANA, o % daquela semana some do gráfico
  // "Tendência Semanal (% de acerto)" em vez de mostrar um número tipo 100%
  // em cima de 3 questões. Só uso do lado do cliente (getTendenciaSemanal),
  // mesmo padrão de produtividade_janela_dias acima — não é lido via
  // get_user_param() no banco. Validado com o usuário: nem 30 nem 50 tornam
  // o % "estatisticamente preciso" (IC 95% Wilson ainda largo nessa faixa de
  // N), é só uma barreira contra a distorção mais grosseira, não uma garantia
  // de precisão. Sem acúmulo entre semanas — cada semana é avaliada isolada;
  // se não bater o piso, fica em branco (não funde com a semana seguinte).
  tendencia_semanal_min_questoes: 50,
  retencao_buckets: [
    { max: 3, label: "0-3 dias" },
    { max: 7, label: "4-7 dias" },
    { max: 14, label: "8-14 dias" },
    { max: 30, label: "15-30 dias" },
    { max: null, label: "30+ dias" },
  ],
};

export async function getParam(userId, key) {
  const { data, error } = await supabase
    .from("user_parameters")
    .select("value")
    .eq("user_id", userId)
    .eq("scope", "global")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return data ? data.value : PARAM_DEFAULTS[key];
}

export async function getAllParams(userId) {
  const keys = Object.keys(PARAM_DEFAULTS);
  const values = await Promise.all(keys.map((key) => getParam(userId, key)));
  return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
}

export async function setParam({ userId, key, value }) {
  const { error } = await supabase
    .from("user_parameters")
    .upsert({ user_id: userId, scope: "global", key, value }, { onConflict: "user_id,scope,key" });
  if (error) throw error;
}

export async function listRiskRules() {
  const { data, error } = await supabase
    .from("risk_rules")
    .select("id, learning_level, weight, risk, recommended_action, user_id")
    .order("learning_level")
    .order("weight");
  if (error) throw error;
  return data || [];
}

// Upsert pessoal manual (não usa .upsert()/ON CONFLICT): a unicidade
// (user_id, learning_level, weight) é um índice PARCIAL (where user_id is not
// null, ver migration 0012) para coexistir com o índice global (learning_level,
// weight) where user_id is null. O upsert do PostgREST gera um ON CONFLICT sem
// o predicado parcial, que o Postgres rejeita (42P10) — por isso aqui é
// select-then-insert/update em vez de depender do ON CONFLICT do banco.
export async function upsertRiskRule({ userId, learningLevel, weight, risk, recommendedAction }) {
  const { data: existing, error: findError } = await supabase
    .from("risk_rules")
    .select("id")
    .eq("user_id", userId)
    .eq("learning_level", learningLevel)
    .eq("weight", weight)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase
      .from("risk_rules")
      .update({ risk, recommended_action: recommendedAction, active: true })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("risk_rules").insert({
      user_id: userId,
      learning_level: learningLevel,
      weight,
      risk,
      recommended_action: recommendedAction,
      active: true,
    });
    if (error) throw error;
  }
}

export async function deleteRiskRule(id) {
  const { error } = await supabase.from("risk_rules").delete().eq("id", id);
  if (error) throw error;
}
