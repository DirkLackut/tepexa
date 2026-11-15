import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Puerto 5173: es el que la API acepta en CORS para desarrollo local.
// publicDir apunta a frontend/public para servir /models/manifest.json y los modelos optimizados del equipo.
export default defineConfig({
  plugins: [react()],
  publicDir: "../../public",
  server: { port: 5173, strictPort: true },
});
