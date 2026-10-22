import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin, type UserConfig } from 'vite'
import { authMiddleware } from './server/authMiddleware.ts'

function authApiPlugin(): Plugin {
  return {
    name: 'auth-api-plugin',
    configureServer(server) {
      server.middlewares.use(authMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(authMiddleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  // Load env variables with VITE_, NEXT_PUBLIC_, and NEXT_ prefixes
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_', 'NEXT_', 'APP_'])

  // Expose APP_MASTER_PIN to server-side process.env only (NEVER to client define)
  if (env.APP_MASTER_PIN) {
    process.env.APP_MASTER_PIN = env.APP_MASTER_PIN
  }
  if (env.APP_SESSION_SECRET) {
    process.env.APP_SESSION_SECRET = env.APP_SESSION_SECRET
  }

  return {
    plugins: [react(), authApiPlugin()],
    // Expose NEXT_PUBLIC_ and NEXT_ prefixed variables to client code alongside VITE_
    envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'NEXT_'],
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_SUPABASE_URL || env.VITE_SUPABASE_URL || ''
      ),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''
      ),
      // NOTE: APP_MASTER_PIN is NEVER defined here to prevent client bundle leaks!
      'process.env': {},
    },
    server: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
    preview: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
    build: {
      sourcemap: false, // Turn off debug sourcemaps in production
    },
  }
})
