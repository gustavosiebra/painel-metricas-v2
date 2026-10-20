
-- Base da Fila de Revisão Condicional (03/08/2026).
--
-- Racional: o painel já diagnostica bem ONDE o usuário está mal, mas a ponte
-- para "o que fazer agora" era feita só na conversa, nunca pelo sistema. Os
-- apps de mercado (Aprovado, Estudei, Gran) resolvem isso com revisão
-- espaçada por regra fixa de calendário (3-7-15 dias, igual pra tudo). Aqui a
-- fila é INFORMADA PELO DIAGNÓSTICO: prioriza pelo que já medimos (Wilson,
-- recorrência da banca, tempo sem tocar, tamanho da amostra), não pelo
-- relógio.
--
-- Esta view consolida os sinais por caderno; a montagem da fila em si (que
-- cruza também os erros T1–T7 em aberto) fica no serviço, onde as regras são
-- mais fáceis de ajustar sem migração.
create or replace view public.v_fila_revisao_caderno
with (security_invoker = true) as
with toques as (
  select ss.user_id, ss.question_set_id,
         max(ss.occurred_at) as ultimo_estudo,
         count(distinct (ss.occurred_at at time zone 'America/Fortaleza')::date) as dias_distintos
  from study_sessions ss
  where ss.status = 'ativo'::record_status
    and ss.question_set_id is not null
    and ss.study_type = any (array['questao'::study_type,'simulado'::study_type,'discursiva'::study_type])
  group by ss.user_id, ss.question_set_id
),
-- Último reencontro (faixa_ordem > 1): retenção medida na volta ao caderno.
reencontro as (
  select distinct on (user_id, question_set_id)
         user_id, question_set_id, faixa, pct_acerto as reencontro_pct
  from v_retencao_caderno
  where faixa_ordem > 1 and questoes_total > 0
  order by user_id, question_set_id, faixa_ordem desc
)
select
  p.user_id,
  p.question_set_id,
  p.caderno_nome,
  p.discipline_id,
  p.disciplina_nome,
  p.questoes_total,
  p.wilson_pct,
  p.classificacao_wilson,
  p.classificacao_recorrencia,
  p.classificacao_prioridade,
  p.prioridade_rank,
  ed.weight as peso_disciplina,
  t.ultimo_estudo,
  t.dias_distintos,
  case when t.ultimo_estudo is null then null
       else (current_date - (t.ultimo_estudo at time zone 'America/Fortaleza')::date) end as dias_sem_estudar,
  r.reencontro_pct,
  r.faixa as reencontro_faixa
from v_prioridade_caderno p
left join toques t on t.user_id = p.user_id and t.question_set_id = p.question_set_id
left join reencontro r on r.user_id = p.user_id and r.question_set_id = p.question_set_id
left join question_sets qs on qs.id = p.question_set_id
left join exam_disciplines ed on ed.discipline_id = p.discipline_id and ed.exam_id = qs.exam_id and ed.user_id = p.user_id
where qs.status = 'ativo'
  -- Só cadernos que o usuário já tocou: a fila é de REVISÃO, não de
  -- descoberta. Caderno nunca estudado é assunto da tela Prioridade.
  and t.ultimo_estudo is not null;
;
