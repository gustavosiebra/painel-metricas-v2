// capacidadeService (04/08/2026) — "dá tempo?".
//
// PREMISSA CENTRAL: esta tela não pode inventar número nenhum. Todo valor
// exibido tem que ser (a) medido no histórico do usuário, ou (b) declarado por
// ele num campo editável. Nada de constante mágica de "horas por assunto"
// tirada de blog de concurseiro.
//
// Por que NÃO existe um "custo até dominar" calibrado no histórico dele:
// verificado no banco em 04/08/2026 — dos 62 cadernos tocados, ZERO chegaram a
// consolidado (Wilson>=80 com n>=30). Sem uma única observação de "quanto custa
// consolidar", qualquer curva de custo seria chute. Então o modelo aqui mede
// outra coisa, que É observável: quanto custa levar cada tópico até MASSA
// CRÍTICA (n questões suficientes pra medição confiável). Isso é honesto e
// acionável, mas atenção — massa crítica não é domínio. Chegar a 30 questões
// num tópico só garante que o Wilson vai parar de dizer "poucos dados"; se o
// resultado vier ruim, o custo real é maior. Por isso o orçamento sai em duas
// linhas separadas (cobertura mínima e reforço), nunca somadas em silêncio.
//
// Por que horizonte em vez de data da prova: decidido com o usuário em
// 04/08/2026 — o edital do TCE-SC 2026 ainda não saiu, exams.exam_date está
// null, e cravar uma data estimada produziria precisão falsa. O horizonte
// inverte a pergunta pra uma que os dados respondem: "o que dá pra cobrir em
// N semanas no meu ritmo real?".

import { supabase } from "../supabaseClient.js";

// Massa crítica padrão = 30 questões. Não é número novo: é exatamente o mesmo
// limiar que o painel já usa pra sair de "preliminar" no diagnóstico Wilson
// (ver v_diagnostico_caderno). Reaproveitado aqui de propósito, pra tela de
// capacidade e tela de diagnóstico não discordarem sobre o que é "medido".
export const META_QUESTOES_PADRAO = 30;

// Ritmo real de estudo, em horas por semana.
//
// Mediana e não média: uma semana de viagem ou doença puxa a média pra baixo e
// contamina toda a projeção. A mediana ignora o extremo sem precisar de regra
// arbitrária de descarte.
//
// Exclui a semana corrente SEMPRE: ela está pela metade por definição, e
// entrar na conta faria o ritmo despencar toda segunda-feira de manhã.
export async function getRitmo({ nSemanas = 4 } = {}) {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("occurred_at, duration_minutes")
    .eq("status", "ativo");
  if (error) throw error;

  const sessoes = data || [];
  if (sessoes.length === 0) {
    return { horasPorSemana: 0, semanas: [], amostra: 0, fonte: "sem sessões registradas" };
  }

  const porSemana = new Map();
  for (const s of sessoes) {
    const k = chaveSemana(new Date(s.occurred_at));
    porSemana.set(k, (porSemana.get(k) || 0) + Number(s.duration_minutes || 0) / 60);
  }

  const semanaAtual = chaveSemana(new Date());
  const completas = [...porSemana.entries()]
    .filter(([k]) => k < semanaAtual)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, nSemanas)
    .map(([inicio, horas]) => ({ inicio, horas: Math.round(horas * 10) / 10 }));

  if (completas.length === 0) {
    return { horasPorSemana: 0, semanas: [], amostra: 0, fonte: "nenhuma semana completa ainda" };
  }

  return {
    horasPorSemana: mediana(completas.map((s) => s.horas)),
    semanas: completas,
    amostra: completas.length,
    fonte: `mediana das últimas ${completas.length} semana(s) completa(s)`,
  };
}

// Produtividade: questões por hora, medida só em sessões que de fato produzem
// questões. Somar as horas de flashcard/leitura/revisão no denominador
// afundaria a taxa e faria o orçamento de questões parecer muito mais caro do
// que é — são atividades reais, mas o "custo por questão" não sai delas.
const TIPOS_COM_QUESTAO = ["questao", "simulado", "discursiva", "caderno_erros"];

export async function getProdutividade() {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("duration_minutes, study_type, session_results(questions_total)")
    .eq("status", "ativo")
    .in("study_type", TIPOS_COM_QUESTAO);
  if (error) throw error;

  let horas = 0;
  let questoes = 0;
  let sessoes = 0;
  for (const s of data || []) {
    const q = Array.isArray(s.session_results)
      ? s.session_results.reduce((a, r) => a + Number(r.questions_total || 0), 0)
      : Number(s.session_results?.questions_total || 0);
    if (q <= 0) continue; // sessão do tipo certo mas sem resultado lançado
    horas += Number(s.duration_minutes || 0) / 60;
    questoes += q;
    sessoes += 1;
  }

  return {
    questoesPorHora: horas > 0 ? Math.round((questoes / horas) * 10) / 10 : 0,
    horas: Math.round(horas * 10) / 10,
    questoes,
    sessoes,
    fonte: `${sessoes} sessão(ões) com questões lançadas`,
  };
}

// Núcleo do cálculo. Puro (sem I/O) de propósito — assim os campos editáveis da
// tela recalculam na hora, sem ida ao banco, e o mesmo código é testável.
//
// cobertura: saída de editalService.listCobertura()
// disciplinasEscopo: [{ id, nome, peso }] do concurso — serve pra denunciar o
//   que está FORA da conta (disciplina sem tópico cadastrado não vira zero,
//   vira aviso; zerar seria mentir por omissão).
export function calcularCapacidade({
  cobertura = [],
  disciplinasEscopo = [],
  horizonteSemanas,
  horasPorSemana,
  questoesPorHora,
  metaQuestoes = META_QUESTOES_PADRAO,
  wilsonAlvo = 80,
}) {
  const horasDisponiveis = horizonteSemanas * horasPorSemana;

  const porDisciplina = new Map();
  for (const c of cobertura) {
    const chave = c.disciplinaNome || "(sem disciplina)";
    const g =
      porDisciplina.get(chave) ||
      { disciplina: chave, disciplineId: c.disciplineId, topicos: 0, semCaderno: 0, qFaltantes: 0, reforco: 0, jaMedidos: 0 };
    g.topicos += 1;

    // Tópico sem caderno vinculado não é "zero questões": é imensurável. Entra
    // numa contagem própria, porque o custo dele é desconhecido até o
    // mapeamento existir — somar como se faltassem 30 questões inventaria
    // orçamento pra algo que talvez já esteja estudado.
    if (c.cadernosVinculados === 0) {
      g.semCaderno += 1;
      porDisciplina.set(chave, g);
      continue;
    }

    const feitas = Number(c.questoes || 0);
    if (feitas < metaQuestoes) {
      g.qFaltantes += metaQuestoes - feitas;
    } else {
      g.jaMedidos += 1;
      // Já tem massa crítica mas o Wilson ficou abaixo do alvo: precisa de mais
      // estudo, e quanto exatamente NINGUÉM sabe. Contamos as rodadas de
      // reforço à parte, com custo declarado (metaQuestoes por rodada), e a
      // tela mostra essa linha separada — nunca embutida no total principal.
      if (c.wilson != null && c.wilson < wilsonAlvo) {
        g.reforco += 1;
        g.qFaltantes += 0;
      }
    }
    porDisciplina.set(chave, g);
  }

  const linhas = [...porDisciplina.values()].map((g) => {
    const horasCobertura = questoesPorHora > 0 ? g.qFaltantes / questoesPorHora : null;
    const horasReforco = questoesPorHora > 0 ? (g.reforco * metaQuestoes) / questoesPorHora : null;
    return {
      ...g,
      qReforco: g.reforco * metaQuestoes,
      horasCobertura: horasCobertura == null ? null : Math.round(horasCobertura * 10) / 10,
      horasReforco: horasReforco == null ? null : Math.round(horasReforco * 10) / 10,
    };
  });
  linhas.sort((a, b) => (b.horasCobertura || 0) - (a.horasCobertura || 0));

  const qFaltantes = linhas.reduce((a, l) => a + l.qFaltantes, 0);
  const qReforco = linhas.reduce((a, l) => a + l.qReforco, 0);
  const horasCobertura = questoesPorHora > 0 ? qFaltantes / questoesPorHora : null;
  const horasReforco = questoesPorHora > 0 ? qReforco / questoesPorHora : null;

  // Disciplinas do concurso que sequer têm tópico cadastrado. Enquanto essa
  // lista não estiver vazia, o total é um PISO, não uma estimativa — e a tela
  // precisa dizer isso com todas as letras.
  const comTopico = new Set(cobertura.map((c) => c.disciplinaNome).filter(Boolean));
  const foraDaConta = disciplinasEscopo.filter((d) => !comTopico.has(d.nome));

  // Detecção de granularidade falsa (04/08/2026). O modelo trata cada tópico
  // como uma unidade de `metaQuestoes`. Se o "tópico" é na verdade um bloco de
  // disciplina inteiro colado numa linha só (sintoma: dezenas de cadernos
  // vinculados a um único tópico), a conta vira absurdo — 6 blocos × 30 = 180
  // questões pra "cobrir o edital todo". O número continua correto pela
  // fórmula e completamente inútil na prática, que é o pior tipo de erro:
  // aquele que não parece erro. Então a tela precisa denunciar, não só exibir.
  const LIMIAR_BLOCO = 10;
  const topicosBloco = cobertura.filter((c) => c.cadernosVinculados >= LIMIAR_BLOCO).length;

  const saldo = horasCobertura == null ? null : horasDisponiveis - horasCobertura;

  return {
    horasDisponiveis: Math.round(horasDisponiveis * 10) / 10,
    horasCobertura: horasCobertura == null ? null : Math.round(horasCobertura * 10) / 10,
    horasReforco: horasReforco == null ? null : Math.round(horasReforco * 10) / 10,
    saldo: saldo == null ? null : Math.round(saldo * 10) / 10,
    qFaltantes,
    qReforco,
    topicosTotal: cobertura.length,
    topicosSemCaderno: cobertura.filter((c) => c.cadernosVinculados === 0).length,
    linhas,
    foraDaConta,
    topicosBloco,
    limiarBloco: LIMIAR_BLOCO,
    // Só é possível responder "dá tempo" quando não há buraco no escopo. Com
    // disciplina fora da conta ou tópico sem caderno, a resposta honesta é
    // "ainda não dá pra saber" — e a tela usa esta flag pra dizer exatamente isso.
    confiavel:
      foraDaConta.length === 0 &&
      topicosBloco === 0 &&
      cobertura.every((c) => c.cadernosVinculados > 0),
  };
}

function mediana(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  const v = s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  return Math.round(v * 10) / 10;
}

// Segunda-feira da semana da data, em ISO local (mesma âncora do dashboard —
// ver getSegundaDaSemana em dashboardService.js; duplicado aqui pra não criar
// dependência entre serviços por causa de uma função de 4 linhas).
function chaveSemana(d) {
  const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const desloc = (dia.getDay() + 6) % 7; // 0 = segunda
  dia.setDate(dia.getDate() - desloc);
  const mm = String(dia.getMonth() + 1).padStart(2, "0");
  const dd = String(dia.getDate()).padStart(2, "0");
  return `${dia.getFullYear()}-${mm}-${dd}`;
}
