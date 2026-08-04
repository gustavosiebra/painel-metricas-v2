// editalService (03/08/2026) — conteúdo programático e cobertura.
//
// Por que o vínculo é N:N e não "um caderno = um tópico": um tópico do edital
// costuma ser coberto por vários cadernos do TEC (ex.: "Licitações e
// Contratos" cai em 54) e um caderno pode servir a mais de um tópico. Forçar
// 1:1 exigiria reorganizar o catálogo inteiro pra espelhar o edital — e
// destruiria a granularidade de diagnóstico que já existe por caderno.
//
// O gargalo real desta feature não é o código, é o TRABALHO MANUAL de ligar
// tópico a caderno. Por isso `sugerirCadernos` existe: propõe candidatos por
// similaridade de nome, transformando digitação em confirmação.

import { supabase } from "../supabaseClient.js";

const DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");
// Palavras que aparecem em quase todo nome de caderno/tópico e não ajudam a
// discriminar — se entrassem no cálculo, "Lei nº X" pareceria similar a
// "Lei nº Y" só por causa de "lei".
const STOPWORDS = new Set([
  "de","da","do","das","dos","e","a","o","as","os","em","no","na","nos","nas","para","por","com","sem",
  "the","lei","art","arts","artigo","artigos","n","nº","seus","sua","suas","seu","ou","ao","aos","que",
  "tópicos","topicos","mesclados","demais","temas","outras","outros","questões","questoes","geral","gerais",
]);

function tokens(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .replace(/[^a-z0-9\s.]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export async function listTopics(examId) {
  const { data, error } = await supabase
    .from("exam_topics")
    .select("id, exam_id, discipline_id, parent_id, position, name, expected_questions, notes")
    .eq("exam_id", examId)
    .order("position");
  if (error) throw error;
  return data;
}

// Quantos tópicos cada concurso já tem. Serve pra escolher um padrão sensato
// no seletor da tela (04/08/2026): o comportamento anterior — abrir sempre no
// primeiro concurso da lista — deixou o usuário cadastrar 6 tópicos e 155
// vínculos num concurso que não era o que ele acompanha, sem nenhum sinal na
// interface. Abrir no concurso que já tem conteúdo elimina a classe inteira
// de erro "escrevi no edital errado".
export async function countTopicsByExam() {
  const { data, error } = await supabase.from("exam_topics").select("exam_id");
  if (error) throw error;
  const m = new Map();
  for (const r of data || []) m.set(r.exam_id, (m.get(r.exam_id) || 0) + 1);
  return m;
}

export async function listVinculos(examId) {
  // Traz os vínculos dos tópicos deste edital (join implícito via topic).
  const { data, error } = await supabase
    .from("exam_topic_question_sets")
    .select("id, topic_id, question_set_id, exam_topics!inner(exam_id)")
    .eq("exam_topics.exam_id", examId);
  if (error) throw error;
  return (data || []).map((v) => ({ id: v.id, topicId: v.topic_id, questionSetId: v.question_set_id }));
}

export async function listCobertura(examId) {
  const { data, error } = await supabase
    .from("v_edital_cobertura")
    .select("topic_id, discipline_id, disciplina_nome, position, topico_nome, expected_questions, cadernos_vinculados, questoes, acertos, wilson_pct, ultimo_estudo, situacao")
    .eq("exam_id", examId)
    .order("position");
  if (error) throw error;
  return (data || []).map((r) => ({
    topicId: r.topic_id,
    disciplineId: r.discipline_id,
    disciplinaNome: r.disciplina_nome,
    topicoNome: r.topico_nome,
    expectedQuestions: r.expected_questions,
    cadernosVinculados: r.cadernos_vinculados,
    questoes: Number(r.questoes || 0),
    acertos: Number(r.acertos || 0),
    wilson: r.wilson_pct == null ? null : Number(r.wilson_pct),
    ultimoEstudo: r.ultimo_estudo,
    situacao: r.situacao,
  }));
}

// linhas: [{ name, disciplineId, expectedQuestions }] — cadastro em lote a
// partir de texto colado do edital. Em lote de propósito: digitar 100 tópicos
// um a um num formulário seria o suficiente pra feature morrer no primeiro dia.
export async function createTopics({ userId, examId, linhas }) {
  const { data: existentes, error: errExist } = await supabase
    .from("exam_topics")
    .select("position")
    .eq("exam_id", examId)
    .order("position", { ascending: false })
    .limit(1);
  if (errExist) throw errExist;
  let pos = existentes && existentes.length ? Number(existentes[0].position) + 1 : 0;

  const payload = linhas.map((l) => ({
    user_id: userId,
    exam_id: examId,
    discipline_id: l.disciplineId || null,
    name: l.name,
    expected_questions: l.expectedQuestions ?? null,
    position: pos++,
  }));
  const { data, error } = await supabase.from("exam_topics").insert(payload).select("id, name, discipline_id, position");
  if (error) throw error;
  return data;
}

export async function deleteTopic(id) {
  const { error } = await supabase.from("exam_topics").delete().eq("id", id);
  if (error) throw error;
}

export async function updateTopic(id, { name, disciplineId, expectedQuestions }) {
  const { error } = await supabase
    .from("exam_topics")
    .update({ name, discipline_id: disciplineId || null, expected_questions: expectedQuestions ?? null })
    .eq("id", id);
  if (error) throw error;
}

// Divide um tópico grande em vários (03/08/2026). Necessário porque conteúdo
// programático de edital vem em blocos corridos — uma disciplina inteira num
// parágrafo, separada por ponto e ponto-e-vírgula. Cadastrar assim mede
// cobertura por disciplina, que o painel já fazia; o ganho do edital
// estruturado só aparece no nível do assunto.
// Os vínculos do tópico original são descartados junto (cascata): as partes
// novas precisam de mapeamento próprio, e herdar todos os cadernos do bloco
// em cada parte produziria cobertura falsa.
export async function splitTopic({ userId, examId, topicId, partes, disciplineId }) {
  const criados = await createTopics({
    userId,
    examId,
    linhas: partes.map((name) => ({ name, disciplineId })),
  });
  const { error } = await supabase.from("exam_topics").delete().eq("id", topicId);
  if (error) throw error;
  return criados;
}

// Quebra o texto em candidatos a subtópico. Separadores típicos de edital:
// ponto final, ponto-e-vírgula e travessão. Não divide em vírgula de
// propósito — "substantivo, adjetivo, numeral" é uma enumeração dentro do
// mesmo assunto, não três assuntos.
export function sugerirDivisao(texto) {
  return (texto || "")
    .split(/[.;]\s+|\s+[–—]\s+/)
    .map((t) => t.replace(/^[\d.]+\s*[-–)]?\s*/, "").trim())
    .map((t) => t.replace(/[.;,\s]+$/, "").trim())
    .filter((t) => t.length > 3);
}

export async function vincularCaderno({ userId, topicId, questionSetId }) {
  const { error } = await supabase
    .from("exam_topic_question_sets")
    .insert({ user_id: userId, topic_id: topicId, question_set_id: questionSetId });
  // 23505 = já vinculado; não é erro do ponto de vista do usuário.
  if (error && error.code !== "23505") throw error;
}

// Vínculo em lote (04/08/2026). O modo um-a-um era o gargalo real da feature:
// o usuário confirmou 155 vínculos manualmente na primeira montagem. Um único
// insert também evita 30 idas ao servidor e o estado intermediário feio de
// metade dos vínculos criados se a conexão cair no meio.
// ignoreDuplicates: marcar de novo algo já vinculado é normal (o usuário não
// decora o que já ligou) e não deve virar erro.
export async function vincularCadernos({ userId, topicId, questionSetIds }) {
  const ids = [...new Set((questionSetIds || []).filter(Boolean))];
  if (ids.length === 0) return 0;
  const { error } = await supabase
    .from("exam_topic_question_sets")
    .upsert(
      ids.map((questionSetId) => ({ user_id: userId, topic_id: topicId, question_set_id: questionSetId })),
      { onConflict: "topic_id,question_set_id", ignoreDuplicates: true }
    );
  if (error) throw error;
  return ids.length;
}

export async function desvincularCaderno(id) {
  const { error } = await supabase.from("exam_topic_question_sets").delete().eq("id", id);
  if (error) throw error;
}

// Sugere cadernos para um tópico por sobreposição de tokens. Heurística
// simples de propósito: o objetivo não é acertar sozinha, é encurtar a lista
// de 1120 cadernos pra uma dúzia de candidatos que o usuário confirma com um
// clique. Restringe à disciplina do tópico — cruzar disciplinas geraria ruído.
export function sugerirCadernos(topico, cadernos, { limite = 12 } = {}) {
  const alvo = tokens(topico.name);
  if (alvo.length === 0) return [];
  const alvoSet = new Set(alvo);

  const pontuados = cadernos
    .map((c) => {
      const t = tokens(c.name);
      if (t.length === 0) return { caderno: c, score: 0, comuns: 0 };
      let comuns = 0;
      for (const tok of new Set(t)) if (alvoSet.has(tok)) comuns += 1;
      // Normaliza pelo tamanho do MENOR conjunto: um tópico curto ("Modalidades")
      // não deve ser penalizado por bater com um caderno de nome longo.
      const score = comuns / Math.min(alvoSet.size, new Set(t).size);
      return {
        caderno: c,
        score,
        comuns,
        // Marcado, não excluído (04/08/2026). Filtrar por disciplina era rígido
        // demais: o caderno "SICRO - Sistema de Custos Rodoviários do DNIT" está
        // catalogado em PNFL, enquanto o tópico "Sistema de Custos Rodoviários do
        // DNIT (SICRO)" é de Obras Rodoviárias — nome praticamente idêntico e
        // ZERO sugestões na tela. A divisão por disciplina do catálogo não
        // coincide com a do edital, e alguns assuntos (SICRO, BDI, ABNT) caem
        // legitimamente em mais de uma. Então mostramos os de fora também, no
        // fim da lista e sinalizados, em vez de esconder acerto óbvio.
        foraDaDisciplina: Boolean(topico.disciplineId) && c.discipline_id !== topico.disciplineId,
      };
    })
    .filter((x) => x.comuns > 0);

  // Ordena: mesma disciplina primeiro, depois por semelhança.
  pontuados.sort(
    (a, b) =>
      Number(a.foraDaDisciplina) - Number(b.foraDaDisciplina) ||
      b.score - a.score ||
      b.comuns - a.comuns
  );
  return pontuados.slice(0, limite);
}


// ==================== PARSER DE EDITAL COMPLETO (04/08/2026) ====================
//
// Objetivo: colar o Anexo I inteiro de uma vez, em vez de fazer 11 colagens
// separadas escolhendo a disciplina na mão a cada uma.
//
// Como editais de fato se parecem (verificado no Anexo I do TCE-SP 2026):
// cada disciplina aparece como "Nome da Disciplina: conteúdo conteúdo...", e
// dentro de Conhecimentos Específicos as sub-áreas usam exatamente o mesmo
// padrão, só que no meio do parágrafo ("... Lei nº 13.303/2016. Obras de
// Edificações: Organização do canteiro de obras, ...").
//
// A armadilha: "Nome:" também é como o edital escreve enumerações comuns
// ("Pontuação. Classes de palavras: substantivo, adjetivo, ..."), que NÃO são
// disciplinas. O discriminador que funciona na prática é a caixa da primeira
// palavra depois dos dois-pontos — conteúdo de disciplina começa maiúsculo
// ("Legislação: Lei Complementar..."), enumeração continua minúsculo
// ("Classes de palavras: substantivo..."). Não é perfeito: "Especificações de
// materiais: Características físicas" passa como falso positivo.
//
// Por isso o parser NÃO tenta ser exato. Ele erra pra mais (blocos demais) e a
// tela oferece "juntar ao anterior" — corrigir dois falsos positivos com um
// clique é muito mais barato que caçar uma disciplina que o parser engoliu em
// silêncio. Errar pra menos seria o erro perigoso.

// Linhas que são cabeçalho de seção do edital, não disciplina.
const SECOES_IGNORADAS =
  /^(conhecimentos\s+gerais|conhecimentos\s+específicos|conhecimentos\s+especificos|anexo\b|conteúdo\s+programático|conteudo\s+programatico|ensino\s+superior|ensino\s+médio|ensino\s+medio)/i;

export function parsearEditalCompleto(texto) {
  // Junta as quebras de linha do PDF: pdftotext quebra parágrafo em várias
  // linhas, e essas quebras são de diagramação, não de conteúdo. Trabalhar com
  // o texto corrido evita depender de uma formatação que não sobrevive à cópia.
  const corrido = (texto || "")
    .split("\n")
    .map((l) => l.trim())
    // Descarta a linha só quando ela é APENAS o cabeçalho de seção. Descartar
    // a linha inteira era um bug (04/08/2026): no PDF do TCE-SP a linha é
    // "Conhecimentos Específicos: Obras – Definições, Planejamento, Normas,
    // Fiscalização e Legislação: Manual de obras e" — jogá-la fora apagava
    // junto o cabeçalho da primeira disciplina de Específicos, e o bloco
    // anterior (Legislação, de Gerais) absorvia 51 tópicos que não eram dele.
    .filter((l) => l && !/^(conhecimentos\s+(gerais|específicos|especificos)|anexo\b.*|conteúdo\s+programático|conteudo\s+programatico|ensino\s+(superior|médio|medio)).{0,20}$/i.test(l))
    .map((l) => l.replace(/^conhecimentos\s+(gerais|específicos|especificos)\s*:\s*/i, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/-\s+/g, "-");

  // Candidato a cabeçalho: "Título:" com 1 a 8 palavras, seguido de MAIÚSCULA.
  // O lookahead exige letra maiúscula (ou dígito/"Lei") logo depois — é o que
  // separa disciplina de enumeração (ver comentário acima).
  // O título não pode conter ponto: permitir ponto fazia o título engolir a
  // frase anterior inteira ("Regência verbal e nominal. Colocação pronominal.
  // Crase. Raciocínio Lógico e Analítico:"). Títulos reais de edital usam
  // vírgula e travessão, nunca ponto final.
  const re = /(^|(?<=[.;]\s))([A-ZÀ-ÜÁÉÍÓÚÂÊÔÃÕÇ][^.;:]{2,90}):\s+(?=[A-ZÀ-ÜÁÉÍÓÚÂÊÔÃÕÇ0-9])/g;

  const marcas = [];
  let m;
  while ((m = re.exec(corrido)) !== null) {
    const titulo = m[2].trim();
    // Até 12 palavras: cabeçalhos reais de edital são longos ("Obras
    // Rodoviárias e Obras e Serviços de Pavimentação Urbana:" tem 9). Com o
    // limite em 8, esse título não era detectado e o bloco anterior engolia a
    // disciplina inteira — erro pra menos, o tipo que passa despercebido.
    if (titulo.split(/\s+/).length > 12) continue;
    if (SECOES_IGNORADAS.test(titulo)) continue;
    marcas.push({ titulo, inicio: m.index + m[0].length });
  }

  if (marcas.length === 0) {
    return [{ titulo: "", corpo: corrido, topicos: sugerirDivisao(corrido) }];
  }

  return marcas.map((marca, i) => {
    const fim = i + 1 < marcas.length ? corrido.lastIndexOf(marcas[i + 1].titulo, marcas[i + 1].inicio) : corrido.length;
    const corpo = corrido.slice(marca.inicio, fim).trim();
    return { titulo: marca.titulo, corpo, topicos: sugerirDivisao(corpo) };
  });
}

// Casa o título detectado com uma disciplina já cadastrada, ignorando acento,
// caixa e palavras de ligação. Devolve null quando não há candidato bom — e
// null aqui significa "pergunte ao usuário", nunca "crie sozinho": criar
// disciplina por adivinhação polui o catálogo, que é justamente o problema que
// a constraint de unicidade foi criada pra resolver.
export function casarDisciplina(titulo, disciplinas) {
  const alvo = tokens(titulo);
  if (alvo.length === 0) return null;
  let melhor = null;
  for (const d of disciplinas) {
    const cand = tokens(d.name);
    if (cand.length === 0) continue;
    const inter = cand.filter((t) => alvo.includes(t)).length;
    const score = inter / Math.min(cand.length, alvo.length);
    if (score >= 0.6 && (!melhor || score > melhor.score)) melhor = { discipline: d, score };
  }
  return melhor ? melhor.discipline : null;
}
