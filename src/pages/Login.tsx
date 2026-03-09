import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, UserPlus, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import ciExportLogo from "@/assets/ci-export-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [forgotMode, setForgotMode] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

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
      if (error.message.includes("Email not confirmed")) {
        toast({ title: "Email non vérifié", description: "Vérifiez votre boîte mail et confirmez votre email.", variant: "destructive" });
      } else {
        toast({ title: "Erreur de connexion", description: error.message, variant: "destructive" });
      }
    } else {
      navigate("/admin");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith("@cotedivoirexport.ci")) {
      toast({ title: "Email non autorisé", description: "Seules les adresses @cotedivoirexport.ci sont acceptées.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Mot de passe trop court", description: "Minimum 6 caractères.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setPendingEmail(email);
      setOtpMode(true);
      toast({
        title: "Code envoyé !",
        description: "Un code de vérification a été envoyé à votre adresse email.",
      });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast({ title: "Code incomplet", description: "Veuillez saisir les 6 chiffres du code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: otpCode,
      type: "signup",
    });
    setLoading(false);

    if (error) {
      toast({ title: "Code invalide", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Compte vérifié !", description: "Votre email a été confirmé. Bienvenue !" });
      navigate("/admin");
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Code renvoyé", description: "Un nouveau code a été envoyé à votre email." });
    }
  };

  // OTP Verification screen
  if (otpMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Vérification par email</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Un code à 6 chiffres a été envoyé à
            </p>
            <p className="text-sm font-medium text-foreground">{pendingEmail}</p>
          </div>

          <form onSubmit={handleVerifyOtp} className="stat-card space-y-6">
            <div className="space-y-3">
              <Label className="text-center block">Code de vérification</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Vérifier le code
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Renvoyer le code
              </button>
              <br />
              <button
                type="button"
                onClick={() => {
                  setOtpMode(false);
                  setOtpCode("");
                  setMode("signup");
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Retour
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={ciExportLogo} alt="Agence CI Export" className="w-24 h-24 rounded-xl mx-auto mb-4 object-contain" />
          <h1 className="text-xl font-semibold text-foreground">FORMATION PLATEFORME</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {forgotMode
              ? "Entrez votre email pour recevoir un lien de réinitialisation"
              : mode === "login"
                ? "Connectez-vous pour accéder au back-office"
                : "Créez votre compte administrateur"}
          </p>
        </div>

        <form onSubmit={forgotMode ? handleForgotPassword : mode === "login" ? handleLogin : handleSignup} className="stat-card space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cotedivoirexport.ci"
              required
            />
          </div>
          {!forgotMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : mode === "login" ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            {forgotMode ? "Envoyer le lien" : mode === "login" ? "Se connecter" : "Créer le compte"}
          </Button>

          {mode === "login" && !forgotMode && (
            <button
              type="button"
              onClick={() => setForgotMode(true)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Mot de passe oublié ?
            </button>
          )}

          <button
            type="button"
            onClick={() => { setForgotMode(false); setMode(mode === "login" ? "signup" : "login"); }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {forgotMode ? "Retour à la connexion" : mode === "login" ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
