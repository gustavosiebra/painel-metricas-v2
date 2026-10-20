
-- Trava de unicidade de nomes no catálogo (26/07/2026).
-- Contexto: a validação de nome duplicado era só client-side e foi furada na
-- prática (3x "Vedações Constitucionais" em AFO) — a lista no navegador
-- estava truncada pelo corte de 1000 linhas do PostgREST, então a checagem
-- não enxergava o que já existia. Constraint no banco é a única garantia
-- atômica, imune a corrida entre abas e a lista desatualizada.
--
-- Normalização: mesmo critério do cliente (normalizeForCompare em
-- studyFormPage.js) — minúscula + sem acento. unaccent() não é IMMUTABLE
-- (dicionário configurável), então não pode entrar direto num índice;
-- wrapper IMMUTABLE com dicionário fixado resolve (padrão documentado).
-- Extensão unaccent vive no schema "extensions" (padrão Supabase).
--
-- Escopo por "dono": user_id null (catálogo global) é tratado como um dono
-- único via coalesce; cada usuário é outro dono. Assim um usuário não é
-- bloqueado por nomes de OUTRO usuário (que ele nem enxerga via RLS), mas é
-- bloqueado por repetir o próprio nome. Duplicar nome de item GLOBAL continua
-- possível no banco (donos diferentes) — esse caso o cliente cobre, porque o
-- item global é sempre visível na lista.
create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

-- Cadernos: único por dono + disciplina (mesmo nome pode existir em
-- disciplinas diferentes, legítimo).
create unique index if not exists question_sets_owner_disc_name_uniq
  on public.question_sets (
    coalesce(user_id::text, 'global'),
    discipline_id,
    public.immutable_unaccent(lower(name))
  );

-- Disciplinas, Bancas e Concursos: único por dono.
create unique index if not exists disciplines_owner_name_uniq
  on public.disciplines (
    coalesce(user_id::text, 'global'),
    public.immutable_unaccent(lower(name))
  );

create unique index if not exists exam_boards_owner_name_uniq
  on public.exam_boards (
    coalesce(user_id::text, 'global'),
    public.immutable_unaccent(lower(name))
  );

create unique index if not exists exams_owner_name_uniq
  on public.exams (
    coalesce(user_id::text, 'global'),
    public.immutable_unaccent(lower(name))
  );
;
