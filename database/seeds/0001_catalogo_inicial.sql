-- Fase 3 — Catálogo inicial: bancas, disciplinas e concursos (órgãos), fornecidos por Gustavo em 01/07/2026.
-- Todos globais (user_id nulo), mantidos pelo superusuário.
-- Situação/Peso/Risco/Confiança da planilha original (V1) NÃO entram aqui — eram legenda de valores
-- possíveis, não dado por disciplina, e vivem em outro lugar do schema (Caderno e exam_disciplines),
-- a preencher quando existirem cadernos e vínculo concurso×disciplina reais.

-- Bancas
insert into public.exam_boards (user_id, name) values
  (null, 'Multibanca'),
  (null, 'Cebraspe'),
  (null, 'FGV'),
  (null, 'FCC'),
  (null, 'Cesgranrio'),
  (null, 'AOCP'),
  (null, 'Vunesp'),
  (null, 'IBFC'),
  (null, 'IDECAN'),
  (null, 'FUNDATEC')
on conflict do nothing;

-- Disciplinas
insert into public.disciplines (user_id, name) values
  (null, 'AFO'),
  (null, 'Auditoria Governamental'),
  (null, 'Controle Externo'),
  (null, 'Direito Administrativo'),
  (null, 'Direito Constitucional'),
  (null, 'Língua Portuguesa'),
  (null, 'Raciocínio Lógico'),
  (null, 'Informática'),
  (null, 'Obras Hídricas'),
  (null, 'Obras Rodoviárias'),
  (null, 'Edificações'),
  (null, 'PNFL')
on conflict do nothing;

-- Concursos (só nome do órgão por enquanto — sem banca, ano ou cargo vinculados; completar depois)
insert into public.exams (user_id, name, status) values
  (null, 'TCE', 'ativo'),
  (null, 'IF', 'ativo'),
  (null, 'TRT', 'ativo'),
  (null, 'TJ', 'ativo'),
  (null, 'PREFEITURA', 'ativo');
