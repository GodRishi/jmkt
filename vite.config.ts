import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type UserConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  // Load env variables with VITE_, NEXT_PUBLIC_, and NEXT_ prefixes
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_', 'NEXT_'])

  return {
    plugins: [react()],
    // Expose NEXT_PUBLIC_ and NEXT_ prefixed variables to client code alongside VITE_
    envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'NEXT_'],
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_SUPABASE_URL || env.VITE_SUPABASE_URL || ''
      ),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''
      ),
      'process.env.NEXT_PUBLIC_APP_PIN': JSON.stringify(
        env.NEXT_PUBLIC_APP_PIN || env.VITE_APP_PIN || ''
      ),
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
