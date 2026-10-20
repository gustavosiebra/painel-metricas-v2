
-- Pedido do usuário (05/07/2026): apagar uma Banca não deve travar por causa
-- da Multibanca. study_session_boards é só a tabela de junção "essa sessão
-- também cobriu tal banca" — apagar em cascata aqui NÃO apaga a sessão em si
-- nem os resultados (session_results), só remove a etiqueta daquela banca
-- específica na sessão. Risco avaliado como baixo e aceito explicitamente.
-- Disciplina continua com RESTRICT de propósito (discipline_id é obrigatório
-- em sessão/caderno — cascade ali apagaria dado de estudo real).
alter table study_session_boards
  drop constraint study_session_boards_board_id_fkey;

alter table study_session_boards
  add constraint study_session_boards_board_id_fkey
  foreign key (board_id) references exam_boards(id) on delete cascade;
;
