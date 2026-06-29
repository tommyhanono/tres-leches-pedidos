import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Aviso claro en consola si faltan las variables de entorno.
export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey)

if (!supabaseConfigurado) {
  console.warn(
    '[Tres Leches] Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
      'Crea un archivo .env (mira .env.example).'
  )
}

export const supabase = supabaseConfigurado
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const BUCKET = 'comprobantes'
