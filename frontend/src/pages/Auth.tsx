import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Github, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Logo } from "@/components/shared/Logo";

export default function Auth() {
  const { user, loading, signInWithGithub } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(217_91%_60%_/_0.08),_transparent_50%)]" />
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8 animate-slide-up">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" showText={false} />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles size={18} className="text-primary animate-pulse-glow" />
            <span className="text-sm font-medium text-primary">{t("app_subtitle")}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {t("auth_title")}
          </h1>
          <p className="text-muted-foreground">
            {t("auth_subtitle")}
          </p>
        </div>

        {/* Login Card */}
        <div 
          className="p-8 rounded-2xl bg-card border border-border/50 shadow-lg animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <Button
            variant="glow"
            size="lg"
            className="w-full h-12 text-base"
            onClick={signInWithGithub}
          >
            <Github size={20} />
            {t("auth_github_button")}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
          © 2024 ACP. All rights reserved.
        </p>
      </div>
    </div>
  );
}
