import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

// vite-plugin-cesium copies Cesium's static Workers/Assets/Widgets into the
// build output and sets window.CESIUM_BASE_URL automatically.
export default defineConfig({
  plugins: [react(), cesium()],
  server: {
    host: true,
  },
});
