// Inicialização do cliente Supabase. Toda comunicação com o banco passa por aqui,
// nunca diretamente de dentro de componentes de interface (ver Doc. 17, princípio 5).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
