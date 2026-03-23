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

    // Verify caller is active admin
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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin status
    const { data: isAdmin } = await adminClient.rpc("is_active_admin", {
      check_email: caller.email,
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Accès réservé aux administrateurs" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      // ── Export all data ──
      case "export_participants": {
        const { data, error } = await adminClient
          .from("participants")
          .select("*, participant_secteurs(secteur_id, secteurs(nom)), sources_information(nom)")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "export_inscriptions": {
        const { formation_id } = params;
        let query = adminClient.from("v_inscriptions").select("*");
        if (formation_id) query = query.eq("formation_id", formation_id);
        const { data, error } = await query.order("date_inscription", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "export_formations": {
        const { data, error } = await adminClient
          .from("v_taux_remplissage")
          .select("*")
          .order("date_debut", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "export_stats": {
        const { data, error } = await adminClient
          .from("v_stats_dashboard")
          .select("*")
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Data management ──
      case "update_participant": {
        const { participant_id, updates } = params;
        if (!participant_id) throw new Error("participant_id requis");
        const { data, error } = await adminClient
          .from("participants")
          .update(updates)
          .eq("id", participant_id)
          .select()
          .single();
        if (error) throw error;

        await adminClient.from("audit_log").insert({
          action: "Modification participant",
          details: `Participant ${participant_id} modifié`,
          user_email: caller.email,
        });

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_inscription": {
        const { inscription_id, updates } = params;
        if (!inscription_id) throw new Error("inscription_id requis");
        const { data, error } = await adminClient
          .from("inscriptions")
          .update(updates)
          .eq("id", inscription_id)
          .select()
          .single();
        if (error) throw error;

        await adminClient.from("audit_log").insert({
          action: "Modification inscription",
          details: `Inscription ${inscription_id} modifiée`,
          user_email: caller.email,
        });

        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_participant": {
        const { participant_id } = params;
        if (!participant_id) throw new Error("participant_id requis");

        // Check superadmin for delete
        const { data: isSuperAdmin } = await adminClient.rpc("is_superadmin", {
          check_email: caller.email,
        });
        if (!isSuperAdmin) {
          return new Response(JSON.stringify({ error: "Suppression réservée aux super-administrateurs" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete related data first
        await adminClient.from("participant_secteurs").delete().eq("participant_id", participant_id);
        const { data: inscriptions } = await adminClient
          .from("inscriptions")
          .select("id")
          .eq("participant_id", participant_id);
        
        if (inscriptions?.length) {
          const inscriptionIds = inscriptions.map((i: any) => i.id);
          await adminClient.from("presences").delete().in("inscription_id", inscriptionIds);
          await adminClient.from("inscriptions").delete().eq("participant_id", participant_id);
        }

        const { error } = await adminClient.from("participants").delete().eq("id", participant_id);
        if (error) throw error;

        await adminClient.from("audit_log").insert({
          action: "Suppression participant",
          details: `Participant ${participant_id} supprimé avec ses données liées`,
          user_email: caller.email,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "bulk_update_presences": {
        const { presences } = params;
        if (!presences?.length) throw new Error("Liste de présences requise");

        for (const p of presences) {
          await adminClient
            .from("presences")
            .upsert({
              inscription_id: p.inscription_id,
              present: p.present,
              note: p.note || null,
              enregistre_par: caller.email,
            }, { onConflict: "inscription_id" });
        }

        await adminClient.from("audit_log").insert({
          action: "Mise à jour présences",
          details: `${presences.length} présence(s) mise(s) à jour`,
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
