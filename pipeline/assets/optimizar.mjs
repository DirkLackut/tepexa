// Spec 006 · Optimiza los modelos .glb del equipo para la web (PC y móvil).
//
// Uso (desde la raíz del repo):
//   cd pipeline/assets && npm install        (una sola vez)
//   npm run modelos                          (optimiza todo lo que haya en assets/models/originales/)
//   npm run modelos -- drone.glb             (solo ese archivo)
//
// Entrada:  assets/models/originales/<nombre>.glb   (NO va a Git: pueden pesar 60 MB)
// Salida:   frontend/public/models/<nombre>/pc.glb y movil.glb  +  frontend/public/models/manifest.json
//
// Nunca borra ni cambia los originales. Si un modelo se pasa del presupuesto, AVISA pero no falla:
// el equipo decide. Si la optimización de un modelo falla, el manifiesto lo marca y el resto sigue.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const SRC = join(REPO, "assets", "models", "originales");
const OUT = join(REPO, "frontend", "public", "models");
const CLI = join(HERE, "node_modules", ".bin", process.platform === "win32" ? "gltf-transform.cmd" : "gltf-transform");

// Presupuesto por modelo (avisos, no errores). Ver specs/006-assets-3d-y-rive/plan.md.
const BUDGET = { pc: 4_000_000, movil: 1_500_000 };
// Triángulos objetivo. En PC solo se simplifica si el modelo pasa de PC_SIMPLIFY_ABOVE (p. ej. escaneos
// de Tripo con ~2 millones): un terreno de 600 mil triángulos se deja intacto.
const PC_SIMPLIFY_ABOVE = 1_000_000;
const PC_TARGET_TRIS = 300_000;
const MOVIL_TARGET_TRIS = 75_000;

function profilesFor(tris) {
  const pcRatio = tris > PC_SIMPLIFY_ABOVE ? PC_TARGET_TRIS / tris : 1;
  // Un modelo que ya viene liviano (p. ej. Smart Mesh o Retopology de Tripo, ~10-20 mil triángulos) no se
  // simplifica: quitarle triángulos solo dañaría la textura. El celular recibe la misma geometría con texturas de 1024 px.
  const movilRatio = Math.min(1, MOVIL_TARGET_TRIS / Math.max(tris, 1));
  const simplify = (r) => (r >= 1 ? ["--simplify", "false"]
    : ["--simplify", "true", "--simplify-ratio", r.toFixed(4), "--simplify-error", "0.01"]);
  return {
    pc: ["--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "2048", ...simplify(pcRatio)],
    movil: ["--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "1024", ...simplify(movilRatio)],
    // Si el móvil se pasa del presupuesto: la mitad de triángulos, más tolerancia de error y texturas de 512 px.
    movilFallback: ["--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "512",
                    "--simplify", "true", "--simplify-ratio", (movilRatio / 2).toFixed(4), "--simplify-error", "0.05"],
  };
}

/** Lee el JSON del .glb y cuenta triángulos, texturas y extensiones (sin decodificar la geometría). */
function inspect(path) {
  const b = readFileSync(path);
  const len = b.readUInt32LE(12);
  const js = JSON.parse(b.subarray(20, 20 + len).toString("utf8"));
  let triangles = 0;
  for (const m of js.meshes ?? []) for (const p of m.primitives) {
    const acc = js.accessors[p.indices ?? p.attributes.POSITION];
    triangles += Math.floor(acc.count / 3);
  }
  return { bytes: statSync(path).size, triangles, textures: (js.images ?? []).length,
           animations: (js.animations ?? []).length, extensions: js.extensionsUsed ?? [] };
}

function run(input, output, args) {
  execFileSync(CLI, ["optimize", input, output, ...args], { stdio: "pipe", shell: process.platform === "win32" });
}

function slug(name) {
  return basename(name, ".glb").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

if (!existsSync(CLI)) {
  console.error("Falta instalar: cd pipeline/assets && npm install");
  process.exit(1);
}
mkdirSync(SRC, { recursive: true });
mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
const files = readdirSync(SRC).filter((f) => f.toLowerCase().endsWith(".glb") && (!only.length || only.includes(f)));
if (!files.length) {
  console.log(`No hay .glb en ${SRC}. Copien ahí los modelos exportados de Blender o Tripo.`);
  process.exit(0);
}

const manifestPath = join(OUT, "manifest.json");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { models: {} };
function saveManifest() {
  manifest.generated_at = new Date().toISOString();
  manifest.budget_bytes = BUDGET;
  manifest.note = "Generado por pipeline/assets/optimizar.mjs. El frontend elige pc o movil y usa un reemplazo si un modelo falla.";
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}

for (const file of files) {
  const id = slug(file);
  const input = join(SRC, file);
  const dir = join(OUT, id);
  mkdirSync(dir, { recursive: true });
  const entry = { source_file: file, source: inspect(input), warnings: [], ok: true };
  try {
    const profiles = profilesFor(entry.source.triangles);
    for (const profile of ["pc", "movil"]) {
      const out = join(dir, `${profile}.glb`);
      run(input, out, profiles[profile]);
      let info = inspect(out);
      if (profile === "movil" && info.bytes > BUDGET.movil) {
        const alt = join(dir, "movil-alt.glb");
        run(input, alt, profiles.movilFallback);
        const altInfo = inspect(alt);
        if (altInfo.bytes < info.bytes) { renameSync(alt, out); info = altInfo; } else rmSync(alt);
      }
      entry[profile] = { url: `/models/${id}/${profile}.glb`, ...info };
      if (info.bytes > BUDGET[profile]) {
        entry.warnings.push(`${profile}: ${(info.bytes / 1e6).toFixed(2)} MB supera el presupuesto de ${BUDGET[profile] / 1e6} MB`);
      }
    }
    if (entry.source.extensions.includes("KHR_materials_transmission")) {
      entry.warnings.push("usa transmisión (vidrio/agua): costosa en celulares; el frontend puede apagarla en móvil");
    }
  } catch (err) {
    entry.ok = false;
    entry.warnings.push(`no se pudo optimizar: ${String(err.stderr ?? err.message).split("\n")[0]}`);
  }
  manifest.models[id] = entry;
  saveManifest(); // después de cada modelo: si el proceso se corta, lo ya hecho queda registrado
  const s =(n) => (n / 1e6).toFixed(2).padStart(6) + " MB";
  console.log(`${id.padEnd(28)} original ${s(entry.source.bytes)}  ` +
    (entry.ok ? `pc ${s(entry.pc.bytes)} (${entry.pc.triangles.toLocaleString()} tri)  movil ${s(entry.movil.bytes)} (${entry.movil.triangles.toLocaleString()} tri)` : "FALLÓ") +
    (entry.warnings.length ? `\n${"".padEnd(30)}⚠ ${entry.warnings.join("\n" + "".padEnd(30) + "⚠ ")}` : ""));
}

console.log(`\nManifiesto: ${manifestPath}`);
