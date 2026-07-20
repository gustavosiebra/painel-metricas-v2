// Cache-busting dos assets estáticos do frontend (19/07/2026).
//
// Contexto: o site é 100% estático (sem bundler/build, ver .github/workflows/
// deploy-pages.yml) e o GitHub Pages/CDN + navegadores (principalmente
// mobile) cacheiam JS/CSS por um tempo depois de cada deploy. Resultado
// observado: usuário fez o push, o deploy rodou, mas o celular continuou
// mostrando comportamento antigo (semana começando no domingo) porque o
// dashboardService.js em cache não tinha sido invalidado.
//
// Este script roda SÓ dentro do workflow de deploy (nunca contra o
// repositório de verdade — ver deploy-pages.yml), numa cópia já "checked
// out" pelo runner do GitHub Actions, e reescreve toda referência local a
// .css/.js (tags <link>/<script> do index.html + imports estáticos e
// dinâmicos dos módulos JS) acrescentando "?v=<sha do commit>". Como o SHA
// muda a cada push, o navegador enxerga uma URL nova e busca o arquivo de
// novo, sem precisar de intervenção manual em deploy nenhum daqui pra
// frente. O código-fonte no git nunca ganha esse "?v=" — só a cópia
// publicada.
import fs from "node:fs";
import path from "node:path";

const version = process.argv[2];
if (!version) {
  console.error("Uso: node inject-cache-version.mjs <versao>");
  process.exit(1);
}

const frontendDir = path.join(process.cwd(), "frontend");

// 1) index.html — só nas tags que apontam pra css/, js/ ou vendor/ locais
// terminando em .css/.js (não mexe em favicon/manifest/OG image, que não
// têm essa extensão nesses prefixos).
const indexPath = path.join(frontendDir, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
html = html.replace(
  /(href|src)="((?:css|js|vendor)\/[^"]+\.(?:css|js))"/g,
  (_, attr, url) => `${attr}="${url}?v=${version}"`
);
fs.writeFileSync(indexPath, html);

// 2) Todo import local (estático "from './x.js'" ou dinâmico "import('./x.js')")
// dentro de frontend/js/**/*.js.
const jsDir = path.join(frontendDir, "js");

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".js")) processFile(full);
  }
}

function processFile(file) {
  let code = fs.readFileSync(file, "utf8");
  const importRegex = /\b(from|import)(\s*\(?\s*)(["'])(\.\.?\/[^"']+\.js)\3/g;
  code = code.replace(
    importRegex,
    (_, kw, mid, quote, specifier) => `${kw}${mid}${quote}${specifier}?v=${version}${quote}`
  );
  fs.writeFileSync(file, code);
}

walk(jsDir);

console.log(`Cache-busting aplicado (v=${version}) em index.html e frontend/js/**/*.js`);
