
-- Duração oficial da prova no modelo (27/07/2026) — habilita a métrica de
-- ritmo: min/questão usados na tentativa vs orçamento da prova (duração ÷
-- total de questões). Opcional; null = modelo sem duração definida.
alter table public.exam_templates add column duration_minutes numeric;
;
