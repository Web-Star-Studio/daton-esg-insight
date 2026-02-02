import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serverPasswordSchema, checkRateLimit, clearRateLimit } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple hash function for passwords (in production, use bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + Deno.env.get("SUPPLIER_AUTH_SECRET") || "supplier_secret_key");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize document (remove special chars)
function normalizeDocument(doc: string): string {
  return doc.replace(/[^\d]/g, '');
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { action, ...params } = await req.json();
    console.log(`📦 Supplier Auth - Action: ${action}`);

    switch (action) {
      case "login": {
        const { document, password } = params;
        
        if (!document || !password) {
          return new Response(
            JSON.stringify({ error: "Documento e senha são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const normalizedDoc = normalizeDocument(document);
        const clientIP = req.headers.get("x-forwarded-for") || "unknown";
        const rateLimitKey = `supplier-login:${normalizedDoc}:${clientIP}`;
        
        // Check rate limit (5 attempts per 15 minutes)
        const rateCheck = checkRateLimit(rateLimitKey, 5, 15);
        if (!rateCheck.allowed) {
          console.log(`⚠️ Rate limit exceeded for ${rateLimitKey}`);
          return new Response(
            JSON.stringify({ 
              error: `Muitas tentativas. Tente novamente em ${Math.ceil(rateCheck.resetInSeconds / 60)} minutos.` 
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log(`🔐 Login attempt for document: ${normalizedDoc.substring(0, 4)}***`);

        // Find supplier by CPF or CNPJ
        const { data: supplier, error: findError } = await supabase
          .from("supplier_management")
          .select("*")
          .or(`cpf.eq.${normalizedDoc},cnpj.eq.${normalizedDoc}`)
          .single();

        // Use generic error message to prevent user enumeration
        if (findError || !supplier) {
          console.log(`❌ Supplier not found`);
          return new Response(
            JSON.stringify({ error: "Credenciais inválidas" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if portal is enabled
        if (!supplier.portal_enabled) {
          return new Response(
            JSON.stringify({ error: "Acesso ao portal desabilitado" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if account is locked
        if (supplier.is_locked) {
          return new Response(
            JSON.stringify({ error: "Conta bloqueada. Entre em contato com a empresa." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify password
        let isValidPassword = false;
        
        // Check if using temporary password (first login)
        if (supplier.must_change_password && supplier.temporary_password === password) {
          isValidPassword = true;
        } else if (supplier.password_hash) {
          // Check hashed password
          const hashedInput = await hashPassword(password);
          isValidPassword = hashedInput === supplier.password_hash;
        }

        if (!isValidPassword) {
          // Increment login attempts
          const newAttempts = (supplier.login_attempts || 0) + 1;
          const isLocked = newAttempts >= 5;
          
          await supabase
            .from("supplier_management")
            .update({ 
              login_attempts: newAttempts,
              is_locked: isLocked
            })
            .eq("id", supplier.id);

          return new Response(
            JSON.stringify({ 
              error: isLocked 
                ? "Conta bloqueada após múltiplas tentativas" 
                : `Senha incorreta. Tentativas restantes: ${5 - newAttempts}`
            }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Reset login attempts and rate limit on successful login
        clearRateLimit(rateLimitKey);
        await supabase
          .from("supplier_management")
          .update({ 
            login_attempts: 0,
            last_login_at: new Date().toISOString()
          })
          .eq("id", supplier.id);

        // Create session
        const sessionToken = generateSessionToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiry

        await supabase
          .from("supplier_sessions")
          .insert({
            supplier_id: supplier.id,
            session_token: sessionToken,
            ip_address: req.headers.get("x-forwarded-for") || "unknown",
            user_agent: req.headers.get("user-agent") || "unknown",
            expires_at: expiresAt.toISOString()
          });

        console.log(`✅ Login successful for supplier: ${supplier.id}`);

        return new Response(
          JSON.stringify({
            success: true,
            sessionToken,
            mustChangePassword: supplier.must_change_password,
            supplier: {
              id: supplier.id,
              name: supplier.name,
              email: supplier.email,
              company_id: supplier.company_id
            }
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "change_password": {
        const { sessionToken, newPassword } = params;
        
        if (!sessionToken || !newPassword) {
          return new Response(
            JSON.stringify({ error: "Token e nova senha são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate password strength with full requirements
        const passwordValidation = serverPasswordSchema.safeParse(newPassword);
        if (!passwordValidation.success) {
          return new Response(
            JSON.stringify({ error: passwordValidation.error.issues[0].message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify session
        const { data: session, error: sessionError } = await supabase
          .from("supplier_sessions")
          .select("*, supplier_management(*)")
          .eq("session_token", sessionToken)
          .eq("is_valid", true)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ error: "Sessão inválida ou expirada" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Hash and update password
        const hashedPassword = await hashPassword(newPassword);
        
        await supabase
          .from("supplier_management")
          .update({
            password_hash: hashedPassword,
            must_change_password: false,
            temporary_password: null // Clear temporary password
          })
          .eq("id", session.supplier_id);

        console.log(`✅ Password changed for supplier: ${session.supplier_id}`);

        return new Response(
          JSON.stringify({ success: true, message: "Senha alterada com sucesso" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "validate_session": {
        const { sessionToken } = params;
        
        if (!sessionToken) {
          return new Response(
            JSON.stringify({ valid: false }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: session, error: sessionError } = await supabase
          .from("supplier_sessions")
          .select("*, supplier_management(*)")
          .eq("session_token", sessionToken)
          .eq("is_valid", true)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ valid: false }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const supplier = session.supplier_management as any;

        return new Response(
          JSON.stringify({
            valid: true,
            mustChangePassword: supplier.must_change_password,
            supplier: {
              id: supplier.id,
              name: supplier.name,
              email: supplier.email,
              company_id: supplier.company_id
            }
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "logout": {
        const { sessionToken } = params;
        
        if (sessionToken) {
          await supabase
            .from("supplier_sessions")
            .update({ is_valid: false })
            .eq("session_token", sessionToken);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Ação não reconhecida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("❌ Supplier Auth Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
