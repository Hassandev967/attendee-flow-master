import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is superadmin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller?.email) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check superadmin via DB function
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isSuperAdmin } = await adminClient.rpc("is_superadmin", {
      check_email: caller.email,
    });

    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Accès réservé aux super-administrateurs" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, email, password, nom_complet, role, user_id } = await req.json();

    switch (action) {
      case "create_user": {
        // Create auth user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (createError) throw createError;

        // Add to admins whitelist
        const { error: insertError } = await adminClient
          .from("admins")
          .insert({ email, nom_complet: nom_complet || null, role: role || "admin" });
        if (insertError) throw insertError;

        // Audit log
        await adminClient.from("audit_log").insert({
          action: "Création de compte",
          details: `Compte créé pour ${nom_complet || email} (${role || "admin"})`,
          user_email: caller.email,
        });

        return new Response(JSON.stringify({ success: true, user_id: newUser.user?.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset_password": {
        if (!user_id && !email) throw new Error("user_id ou email requis");

        let targetUserId = user_id;
        if (!targetUserId) {
          // Find user by email
          const { data: { users } } = await adminClient.auth.admin.listUsers();
          const found = users.find((u: any) => u.email === email);
          if (!found) throw new Error("Utilisateur non trouvé");
          targetUserId = found.id;
        }

        const { error } = await adminClient.auth.admin.updateUserById(targetUserId, { password });
        if (error) throw error;

        await adminClient.from("audit_log").insert({
          action: "Réinitialisation mot de passe",
          details: `Mot de passe réinitialisé pour ${email || user_id}`,
          user_email: caller.email,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        if (!email) throw new Error("Email requis");

        // Find and delete auth user
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const found = users.find((u: any) => u.email === email);
        if (found) {
          const { error } = await adminClient.auth.admin.deleteUser(found.id);
          if (error) throw error;
        }

        // Delete from admins table
        await adminClient.from("admins").delete().eq("email", email);

        await adminClient.from("audit_log").insert({
          action: "Suppression de compte",
          details: `Compte supprimé pour ${email}`,
          user_email: caller.email,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Action inconnue: ${action}`);
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
