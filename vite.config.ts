import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
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
    build: {
      sourcemap: false, // Turn off debug sourcemaps in production
    },
  }
})
