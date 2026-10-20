-- Cadastro dos 36 cadernos de Engenharia Civil a partir do Índice do Caderno
-- do TEC Concursos (Cebraspe, desde 2018, 3425 questões no total), mapeados
-- pelo usuário para as 4 disciplinas existentes (Edificações, Obras
-- Rodoviárias, Obras Hídricas, PNFL). Cadernos globais (user_id null),
-- exam_id null (uso geral, reaproveitável entre concursos, ver Doc. Único
-- 2.3). metadata guarda a quantidade/percentual histórico de origem, pra
-- rastreabilidade de onde veio o número (nunca inventado).

insert into public.question_sets (discipline_id, exam_id, name, source, learning_level, metadata)
select d.id, null, v.name, 'TEC Concursos', 'novo'::learning_level,
  jsonb_build_object(
    'banca_historica', 'Cebraspe',
    'periodo_historico', '2018+',
    'hierarquia_tec', v.codigo,
    'quantidade_historica', v.quantidade,
    'percentual_historico', v.percentual
  )
from (values
  ('01', 'Sondagens de Solos', 40, '1.17%', 'Edificações'),
  ('03', 'Resistência dos Materiais', 30, '0.88%', 'Edificações'),
  ('04', 'Análise Estrutural', 85, '2.48%', 'Edificações'),
  ('05', 'Estruturas (Engenharia Civil)', 352, '10.28%', 'Edificações'),
  ('06', 'Fundações', 92, '2.69%', 'Edificações'),
  ('08', 'Edificações', 425, '12.41%', 'Edificações'),
  ('12', 'Topografia', 52, '1.52%', 'Edificações'),
  ('13', 'Locação de Obras', 3, '0.09%', 'Edificações'),
  ('34', 'Softwares Aplicados à Engenharia Civil', 33, '0.96%', 'Edificações'),
  ('35', 'Eletrotécnica', 2, '0.06%', 'Edificações'),
  ('36', 'Outros Assuntos de Engenharia Civil', 47, '1.37%', 'Edificações'),

  ('02', 'Mecânica de Solos', 203, '5.93%', 'Obras Rodoviárias'),
  ('07', 'Terraplenagem', 83, '2.42%', 'Obras Rodoviárias'),
  ('09', 'Obras Rodoviárias', 204, '5.96%', 'Obras Rodoviárias'),
  ('17', 'Obras Ferroviárias e Metroviárias', 10, '0.29%', 'Obras Rodoviárias'),
  ('20', 'Transportes e Logística', 19, '0.55%', 'Obras Rodoviárias'),
  ('21', 'Engenharia de Tráfego', 15, '0.44%', 'Obras Rodoviárias'),
  ('22', 'Planejamento e Mobilidade Urbana', 7, '0.20%', 'Obras Rodoviárias'),

  ('10', 'Hidráulica', 302, '8.82%', 'Obras Hídricas'),
  ('11', 'Obras de Saneamento', 249, '7.27%', 'Obras Hídricas'),
  ('14', 'Hidrologia', 68, '1.99%', 'Obras Hídricas'),
  ('15', 'Irrigação', 35, '1.02%', 'Obras Hídricas'),
  ('16', 'Obras Portuárias e Aeroportuárias', 60, '1.75%', 'Obras Hídricas'),
  ('33', 'Poços', 1, '0.03%', 'Obras Hídricas'),

  ('18', 'Meio-Ambiente (Engenharia Civil)', 12, '0.35%', 'PNFL'),
  ('19', 'Canteiro de Obras e Segurança e Higiene no Trabalho', 38, '1.11%', 'PNFL'),
  ('23', 'Urbanização', 6, '0.18%', 'PNFL'),
  ('24', 'Normas da ABNT aplicadas à Engenharia Civil', 202, '5.90%', 'PNFL'),
  ('25', 'Planejamento e Controle de Obras', 172, '5.02%', 'PNFL'),
  ('26', 'Fiscalização de Obras Públicas', 245, '7.15%', 'PNFL'),
  ('27', 'Viabilidade Econômico e Financeira', 8, '0.23%', 'PNFL'),
  ('28', 'Análise Orçamentária', 288, '8.41%', 'PNFL'),
  ('29', 'Gestão de Projetos na Engenharia Civil', 6, '0.18%', 'PNFL'),
  ('30', 'Gestão da Qualidade na Engenharia Civil', 4, '0.12%', 'PNFL'),
  ('31', 'Desenho Técnico', 15, '0.44%', 'PNFL'),
  ('32', 'Compatibilização de Projetos de Engenharia Civil', 12, '0.35%', 'PNFL')
) as v(codigo, name, quantidade, percentual, disciplina_nome)
join public.disciplines d on d.name = v.disciplina_nome and d.user_id is null;

-- View de apoio: total histórico e % por disciplina, só sobre os cadernos
-- que carregam esse metadado (fonte = TEC Concursos) — referência pra tela
-- de Peso, não entra automaticamente em v_prioridade (NEG-007: sem fórmula
-- de combinação única inventada).
create view public.v_peso_historico_civil
with (security_invoker = true) as
select
  d.id as discipline_id,
  d.name as discipline_name,
  qs.metadata->>'banca_historica' as banca_historica,
  count(*) as cadernos,
  sum((qs.metadata->>'quantidade_historica')::int) as quantidade_historica_total,
  round(
    100.0 * sum((qs.metadata->>'quantidade_historica')::int)
    / sum(sum((qs.metadata->>'quantidade_historica')::int)) over (partition by qs.metadata->>'banca_historica'),
    2
  ) as percentual_dentro_do_mapeado
from public.question_sets qs
join public.disciplines d on d.id = qs.discipline_id
where qs.source = 'TEC Concursos' and qs.metadata ? 'quantidade_historica'
group by d.id, d.name, qs.metadata->>'banca_historica';
;
