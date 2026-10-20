
-- Novo tipo de estudo "correcao_ativa" (28/07/2026, decidido com o usuário).
-- Motivo: o fechamento de erro (as 4 perguntas da metodologia — por que errei,
-- qual regra resolve, como a banca induziu, como reconheço na próxima) cruza
-- várias disciplinas de uma vez. Registrar como "revisao" não servia: revisão
-- exige disciplina no formulário, o que obrigaria a escolher uma
-- arbitrariamente (corrompendo Horas por Disciplina) ou a quebrar em N
-- sessões curtas. Nasce isolado das views analíticas: as 12 views que olham
-- study_type filtram explicitamente ('questao','simulado','discursiva'), então
-- Wilson/Retenção/Eficiência não mudam.
alter type study_type add value if not exists 'correcao_ativa';
;
