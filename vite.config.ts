import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
<<<<<<< HEAD
import legacy from "@vitejs/plugin-legacy";
=======
>>>>>>> 8da0f2fc8bfbcd88f7891534139bd07fc91986e8
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
<<<<<<< HEAD
  plugins: [
    react(),
    legacy({
      targets: ["chrome >= 87", "firefox >= 78", "safari >= 14"],
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
=======
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
>>>>>>> 8da0f2fc8bfbcd88f7891534139bd07fc91986e8
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
<<<<<<< HEAD
}));
=======
}));
>>>>>>> 8da0f2fc8bfbcd88f7891534139bd07fc91986e8
