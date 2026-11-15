// Revisión automática de archivos pesados en cada PR (spec 006).
//
// Uso:  node pipeline/checks/revisar-archivos.mjs [rama-base]     (por defecto origin/main)
// En GitHub la corre .github/workflows/revisar-archivos.yml en cada PR hacia main.
//
// Solo revisa los archivos que el PR agrega o cambia. No exige una herramienta: exige un resultado.
// Por qué existe y cómo cumplirla de otra forma: AGENTS.md («Obligatorio si agregas o cambias un modelo 3D»).
//
// Bloquea (error):
//   1. Cualquier archivo de más de 10 MB.
//   2. Archivos de Blender (.blend) o los originales de assets/models/originales/.
//   3. Modelos .glb/.gltf fuera de frontend/public/models/<nombre>/.
//   4. Un modelo sin su versión pc.glb y movil.glb, o que no está en frontend/public/models/manifest.json.
// Solo avisa (no bloquea): pc.glb de más de 4 MB o movil.glb de más de 1.5 MB.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";

const BASE = process.argv[2] ?? "origin/main";
const HARD_LIMIT = 10_000_000;
const BUDGET = { pc: 4_000_000, movil: 1_500_000 };
const MODELS = "frontend/public/models/";
const HELP = "Ver AGENTS.md, sección «Obligatorio si agregas o cambias un modelo 3D».";
const FIX = "Optimízalo: copia el original a assets/models/originales/ y corre «cd pipeline/assets && npm run modelos -- <nombre>.glb».";

const mb = (n) => `${(n / 1e6).toFixed(2)} MB`;
const errors = [];
const warnings = [];
const err = (file, msg) => errors.push({ file, msg });
const warn = (file, msg) => warnings.push({ file, msg });

const changed = execFileSync("git", ["diff", "--name-only", "--diff-filter=AMR", `${BASE}...HEAD`], { encoding: "utf8" })
  .split("\n").map((s) => s.trim()).filter(Boolean).filter((f) => existsSync(f));

let manifest = null;
const manifestPath = `${MODELS}manifest.json`;
if (existsSync(manifestPath)) {
  try { manifest = JSON.parse(readFileSync(manifestPath, "utf8")); }
  catch { err(manifestPath, "manifest.json no es un JSON válido: la app no podría leer ningún modelo."); }
}

const modelIds = new Set();
for (const file of changed) {
  const size = statSync(file).size;
  const lower = file.toLowerCase();

  if (size > HARD_LIMIT) {
    err(file, `pesa ${mb(size)} y el máximo por archivo es 10 MB. ` +
      (lower.endsWith(".glb") || lower.endsWith(".gltf") ? FIX : "Súbelo fuera del repo (YouTube, Drive, R2) y enlázalo."));
  }
  if (/\.blend\d*$/.test(lower)) err(file, "los archivos de Blender no se suben: exporta a .glb y optimízalo.");
  if (lower.startsWith("assets/models/originales/")) err(file, "los originales no se suben (pueden pesar 60 MB). " + FIX);

  if (lower.endsWith(".glb") || lower.endsWith(".gltf")) {
    const m = file.match(/^frontend\/public\/models\/([^/]+)\/(pc|movil)\.glb$/);
    if (!m) {
      if (!lower.startsWith("assets/models/originales/")) {
        err(file, `los modelos van en ${MODELS}<nombre>/pc.glb y movil.glb. ${FIX}`);
      }
      continue;
    }
    const [, id, profile] = m;
    modelIds.add(id);
    if (size > BUDGET[profile] && size <= HARD_LIMIT) {
      warn(file, `pesa ${mb(size)} (sugerido: ${mb(BUDGET[profile])} para ${profile}). No bloquea, pero tarda más en cargar` +
        (profile === "movil" ? " en celulares. Si es de Tripo, reexporten con menos caras." : "."));
    }
  }
}

for (const id of modelIds) {
  for (const profile of ["pc", "movil"]) {
    const path = `${MODELS}${id}/${profile}.glb`;
    if (!existsSync(path)) err(path, `falta. Cada modelo necesita pc.glb y movil.glb (el celular usa movil). ${FIX}`);
    const entry = manifest?.models?.[id]?.[profile];
    if (!entry || entry.url !== `/models/${id}/${profile}.glb`) {
      err(manifestPath, `no tiene «${id}» → «${profile}» con url /models/${id}/${profile}.glb: la app no encontraría el modelo. ` +
        "El optimizador lo agrega solo; si lo optimizaron de otra forma, agréguenlo a mano con la misma forma que los demás.");
    }
  }
}

// Salida: anotaciones de GitHub y resumen del PR.
const gh = !!process.env.GITHUB_ACTIONS;
for (const { file, msg } of errors) console.log(gh ? `::error file=${file}::${msg}` : `✗ ${file}: ${msg}`);
for (const { file, msg } of warnings) console.log(gh ? `::warning file=${file}::${msg}` : `⚠ ${file}: ${msg}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = (list, icon) => list.map(({ file, msg }) => `| ${icon} | \`${file}\` | ${msg} |`).join("\n");
  const summary = [
    errors.length ? "## ✗ Hay archivos que no pueden entrar a main" : "## ✓ Archivos revisados",
    `Archivos revisados en este PR: ${changed.length}.`,
    errors.length || warnings.length ? "\n| | Archivo | Qué pasa |\n|---|---|---|\n" + rows(errors, "✗") + (errors.length && warnings.length ? "\n" : "") + rows(warnings, "⚠") : "",
    errors.length ? `\n**Por qué:** un archivo pesado hace que la página tarde o se cierre en celulares, y queda para siempre en el historial del repo aunque después se borre. ${HELP}` : "",
  ].join("\n");
  execFileSync("bash", ["-c", `cat >> "$GITHUB_STEP_SUMMARY"`], { input: summary + "\n" });
}

console.log(`\n${changed.length} archivos revisados · ${errors.length} errores · ${warnings.length} avisos`);
if (errors.length) {
  console.log(HELP);
  process.exit(1);
}
