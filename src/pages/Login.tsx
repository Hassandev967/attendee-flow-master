import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, ArrowLeft, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ciExportLogo from "@/assets/ci-export-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email requis", description: "Entrez votre email pour réinitialiser le mot de passe.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email envoyé !", description: "Consultez votre boîte mail pour réinitialiser votre mot de passe." });
      setForgotMode(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({ title: "Erreur de connexion", description: error.message, variant: "destructive" });
    } else {
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 overflow-hidden border border-border/40 shadow-sm">
            <img src={ciExportLogo} alt="Agence CI Export" className="w-full h-full object-contain p-2" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">FORMATION PLATEFORME</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {forgotMode ? "Réinitialisation du mot de passe" : "Connectez-vous au back-office"}
          </p>
        </div>

        <form onSubmit={forgotMode ? handleForgotPassword : handleLogin} className="stat-card space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cotedivoirexport.ci"
              required
              className="h-10"
            />
          </div>
          {!forgotMode && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-10"
              />
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-10">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
            {forgotMode ? "Envoyer le lien" : "Se connecter"}
          </Button>

          {!forgotMode && (
            <button
              type="button"
              onClick={() => setForgotMode(true)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Mot de passe oublié ?
            </button>
          )}

          {forgotMode && (
            <button
              type="button"
              onClick={() => setForgotMode(false)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Retour à la connexion
            </button>
          )}
        </form>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-6 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Connexion sécurisée
        </p>
      </div>
    </div>
  );
};

export default Login;
