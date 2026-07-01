-- Fase 1 — Tipos enumerados usados em todo o schema (Documento Único de Referência, seção 2)

create type record_status as enum ('ativo', 'inativo');
create type weight_level as enum ('baixo', 'medio', 'alto');
create type learning_level as enum ('novo', 'aprendendo', 'consolidando', 'dominado');
create type risk_level as enum ('baixo', 'medio', 'alto', 'muito_alto');
create type study_type as enum ('questao', 'simulado', 'discursiva', 'revisao', 'flashcard', 'leitura', 'videoaula');
create type contact_type as enum ('primeira_tentativa', 'revisao');
create type confidence_level as enum ('baixa', 'media', 'alta');
