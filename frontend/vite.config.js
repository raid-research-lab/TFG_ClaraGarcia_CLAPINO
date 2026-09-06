import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/*
 * CLAPINO se despliega bajo la ruta /clapino, por lo que todos los
 * recursos (JS, CSS, imágenes) deben generarse con ese prefijo.
 */
export default defineConfig({
  base: '/clapino/',

  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: 5173,

    /*
     * Solo para desarrollo local:
     * /clapino/api/... se reenvía al backend quitando el prefijo,
     * igual que hace nginx en producción.
     */
    proxy: {
      '/clapino/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/clapino\/api/, ''),
      },
    },
  },
})
