// Dicionário (Admin) — Fase 10, 05/07/2026. Pedido do usuário depois de notar
// que Concursos/Bancas/Disciplinas/Cadernos criados como admin apareciam pra
// TODOS os usuários (inclusive gente de fora, num app agora compartilhado
// num grupo de WhatsApp). Duas mudanças formam a solução completa:
// 1) catalogService.js: cadastro sob demanda agora é sempre pessoal, nunca
//    mais global automaticamente (ver comentário lá).
// 2) Esta tela: admin enxerga e administra o catálogo de TODOS os usuários
//    num só lugar (RLS ganhou bypass de is_admin() pra isso — ver migration
//    admin_full_access_catalogo_e_cadastro_pessoal).
//
// Só é alcançável por quem é admin (link some da navbar pra outros usuários);
// o guard abaixo é defesa em profundidade — a segurança de verdade é a RLS.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { getState } from "../state.js";
import { navigate } from "../router.js";
import {
  listExamsAdmin,
  listExamBoardsAdmin,
  listDisciplinesAdmin,
  listQuestionSetsAdmin,
  adminListUsers,
  updateExamName,
  updateExamBoardName,
  updateDisciplineName,
  updateQuestionSetName,
  deleteExam,
  deleteExamBoard,
  deleteDiscipline,
  deleteQuestionSet,
} from "../services/catalogService.js";

export async function renderAdminDictionaryPage(container) {
  const { isAdmin, user } = getState();
  if (!isAdmin) {
    navigate("/dashboard");
    return;
  }

  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/admin/dicionario")}
        <main class="app-content">
          <h2 class="form-title">Dicionário (Admin)</h2>
          <p style="color:var(--color-text-muted); margin-top:-8px;">
            Concursos, Bancas, Disciplinas e Cadernos de TODOS os usuários. Editar muda só o nome; apagar remove o registro (bloqueado se houver sessão/caderno vinculado).
          </p>
          <div id="admin-dict-content"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const content = container.querySelector("#admin-dict-content");
  await carregarERenderizar(content, user.id);
}

async function carregarERenderizar(content, adminId) {
  content.innerHTML = "<p>Carregando…</p>";
  let exams, boards, disciplines, questionSets, usuarios;
  try {
    [exams, boards, disciplines, questionSets, usuarios] = await Promise.all([
      listExamsAdmin(),
      listExamBoardsAdmin(),
      listDisciplinesAdmin(),
      listQuestionSetsAdmin(),
      adminListUsers(),
    ]);
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao carregar dicionário: ${escapeHtml(err.message)}</div>`;
    return;
  }

  const userMap = new Map((usuarios || []).map((u) => [u.id, u]));
  const disciplineNameMap = new Map((disciplines || []).map((d) => [d.id, d.name]));

  content.innerHTML = [
    renderSection({
      titulo: "Concursos",
      itens: exams,
      colunasExtra: [],
      extrair: () => [],
    }),
    renderSection({
      titulo: "Bancas",
      itens: boards,
      colunasExtra: [],
      extrair: () => [],
    }),
    renderSection({
      titulo: "Disciplinas",
      itens: disciplines,
      colunasExtra: [],
      extrair: () => [],
    }),
    renderSection({
      titulo: "Cadernos",
      itens: questionSets,
      colunasExtra: ["Disciplina"],
      extrair: (item) => [escapeHtml(disciplineNameMap.get(item.discipline_id) || "—")],
    }),
  ]
    .map((s) => s.html)
    .join("");

  // Wiring: cada seção expõe editar/apagar via data-attributes, resolvido
  // aqui contra a função de update/delete certa pra aquele tipo de item.
  const acoesPorTipo = {
    exam: { update: updateExamName, delete: deleteExam },
    board: { update: updateExamBoardName, delete: deleteExamBoard },
    discipline: { update: updateDisciplineName, delete: deleteDiscipline },
    questionSet: { update: updateQuestionSetName, delete: deleteQuestionSet },
  };

  content.querySelectorAll("[data-edit-tipo]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tipo = btn.dataset.editTipo;
      const id = btn.dataset.editId;
      const nomeAtual = btn.dataset.editNome;
      const novoNome = window.prompt("Novo nome:", nomeAtual);
      if (novoNome === null) return;
      const trimmed = novoNome.trim();
      if (!trimmed || trimmed === nomeAtual) return;
      try {
        await acoesPorTipo[tipo].update(id, trimmed);
        await carregarERenderizar(content, adminId);
      } catch (err) {
        window.alert("Erro ao editar: " + (err.message || "desconhecido"));
      }
    });
  });

  content.querySelectorAll("[data-delete-tipo]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tipo = btn.dataset.deleteTipo;
      const id = btn.dataset.deleteId;
      const nome = btn.dataset.deleteNome;
      if (!window.confirm(`Apagar "${nome}" definitivamente? Isso não pode ser desfeito.`)) return;
      try {
        await acoesPorTipo[tipo].delete(id);
        await carregarERenderizar(content, adminId);
      } catch (err) {
        // 23503 = violação de chave estrangeira (Postgres) — tem sessão/
        // caderno/peso vinculado, apagar quebraria o histórico dessas pessoas.
        if (err.code === "23503") {
          window.alert(`Não é possível apagar "${nome}": existem sessões, cadernos ou pesos vinculados a esse registro.`);
        } else {
          window.alert("Erro ao apagar: " + (err.message || "desconhecido"));
        }
      }
    });
  });

  // Rótulo de dono precisa do userMap, então é resolvido depois do innerHTML
  // ir pra tela (os spans já saem com o id cru no data-owner-id).
  content.querySelectorAll("[data-owner-id]").forEach((span) => {
    const ownerId = span.dataset.ownerId;
    span.textContent = ownerLabel(ownerId, userMap, adminId);
  });

  content.querySelectorAll("[data-filter-input]").forEach((input) => {
    const tipo = input.dataset.filterInput;
    const table = content.querySelector(`[data-filter-table="${tipo}"]`);
    input.addEventListener("input", () => {
      const termo = input.value.trim().toLowerCase();
      table.querySelectorAll("[data-filter-row]").forEach((row) => {
        row.style.display = row.dataset.filterNome.includes(termo) ? "" : "none";
      });
    });
  });
}

function renderSection({ titulo, itens, colunasExtra, extrair }) {
  const tipoPorTitulo = { Concursos: "exam", Bancas: "board", Disciplinas: "discipline", Cadernos: "questionSet" };
  const tipo = tipoPorTitulo[titulo];

  if (!itens || itens.length === 0) {
    return {
      html: `
        <div class="card" style="margin-bottom:16px;">
          <h3 style="margin-top:0;">${titulo} (0)</h3>
          <p style="color:var(--color-text-muted);">Nenhum registro ainda.</p>
        </div>
      `,
    };
  }

  const extraHeaders = colunasExtra.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const rows = itens
    .map((item) => {
      const extraCols = extrair(item)
        .map((v) => `<td>${v}</td>`)
        .join("");
      return `
        <tr data-filter-row data-filter-nome="${escapeHtml(item.name.toLowerCase())}">
          <td>${escapeHtml(item.name)}</td>
          ${extraCols}
          <td><span data-owner-id="${item.user_id || ""}">…</span></td>
          <td>${item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : "—"}</td>
          <td>
            <button class="btn-link" data-edit-tipo="${tipo}" data-edit-id="${item.id}" data-edit-nome="${escapeHtml(item.name)}">Editar</button>
            &nbsp;|&nbsp;
            <button class="btn-link" style="color:var(--color-error);" data-delete-tipo="${tipo}" data-delete-id="${item.id}" data-delete-nome="${escapeHtml(item.name)}">Apagar</button>
          </td>
        </tr>
      `;
    })
    .join("");

  // Busca por nome (05/07/2026) — Cadernos sozinho já passa de 1000 linhas;
  // sem filtro, achar um registro específico pra editar/apagar seria
  // impraticável. Filtro é só display:none client-side, nenhuma query nova.
  return {
    html: `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">${titulo} (${itens.length})</h3>
        <div class="form-field" style="max-width:320px;">
          <input type="text" data-filter-input="${tipo}" placeholder="Buscar por nome..." />
        </div>
        <table class="data-table" data-filter-table="${tipo}">
          <tr><th>Nome</th>${extraHeaders}<th>Dono</th><th>Criado em</th><th>Ações</th></tr>
          ${rows}
        </table>
      </div>
    `,
  };
}

function ownerLabel(userId, userMap, adminId) {
  if (!userId) return "Global";
  const info = userMap.get(userId);
  const nome = info?.display_name?.trim() || info?.email || `usuário ${userId.slice(0, 8)}`;
  return userId === adminId ? `${nome} (você)` : nome;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
