import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import loginBg from "@/assets/login-page-pic.png";
import { supabase } from "@/lib/supabase";
import { parseJwt } from "@/lib/google-auth";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const clientId = process.env.VITE_GOOGLE_CLIENT_ID || "443250544855-hleu1un0gi1c478il1h4n4kq2rlcfn0q.apps.googleusercontent.com";
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if ((window as any).google?.accounts?.id) {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              const payload = parseJwt(response.credential);
              if (payload) {
                const userSession = {
                  email: payload.email,
                  name: payload.name,
                  avatarUrl: payload.picture,
                  role: "Software Engineer",
                  loggedInAt: Date.now()
                };
                localStorage.setItem("user_session", JSON.stringify(userSession));
                alert(`Logged in as ${payload.name}!`);
                navigate({ to: "/profile" });
              }
            }
          });
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Real Supabase OAuth Redirect to Google Login
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/profile` : undefined
        }
      });

      if (error) {
        console.error("Supabase OAuth Error:", error.message);
        alert(`Google OAuth Notice: ${error.message}\n\nPlease enable Google Provider in your Supabase Dashboard.`);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("OAuth Exception:", err);
      alert(`Failed to open Google login window: ${err?.message || err}`);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Lighting Effects */}
      <div className="absolute -left-48 -bottom-48 h-[30rem] w-[30rem] rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -right-48 -top-48 h-[30rem] w-[30rem] rounded-full bg-accent/20 pointer-events-none blur-3xl" />

      {/* Main Glass Card Container */}
      <div className="glass max-w-5xl w-full rounded-[2.5rem] overflow-hidden grid md:grid-cols-12 min-h-[580px] border border-white/10 shadow-premium relative z-10 animate-reveal">
        
        {/* Left Side: Form Controls */}
        <div className="md:col-span-6 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Header & Logo */}
            <div className="flex items-center justify-between">
              <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-semibold hover:opacity-90 transition-opacity">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-e font-bold">R</span>
                Rezonance
              </Link>
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 font-medium">
                ← Back to Home
              </Link>
            </div>

            {/* Title */}
            <div className="mt-12">
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Welcome to Rezonance
              </h1>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Log in using your Google account to access scan history, AI ATS score analytics, and recruiter-ready PDF exports.
              </p>
            </div>

            {/* Google Login Only */}
            <div className="mt-10">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-white text-gray-900 border border-gray-200 py-4 px-6 text-sm font-semibold shadow-lg hover:bg-gray-50 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                <span>{loading ? "Opening Google Sign In..." : "Sign in with Google"}</span>
              </button>
              
              <div className="mt-4 text-center">
                <span className="text-[11px] text-muted-foreground/60 flex items-center justify-center gap-1">
                  🔒 Fast & Secure 1-Click Google Authentication
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-muted-foreground border-t border-white/5 pt-4">
            By signing in, you agree to our Terms of Service & Privacy Policy.
          </div>
        </div>

        {/* Right Side: Showcase Illustration Image */}
        <div className="hidden md:col-span-6 relative overflow-hidden md:flex flex-col justify-between p-10 text-white border-l border-white/10 bg-black/40">
          <div className="absolute inset-0 z-0">
            <img src={loginBg} alt="Rezonance ATS Security Grid" className="h-full w-full object-cover opacity-95 hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-black/20" />
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex rounded-full bg-primary/20 border border-primary/30 px-3.5 py-1 text-xs text-primary font-bold tracking-wide backdrop-blur">
              ⚡ REZONANCE PRO v2.0
            </span>
          </div>

          <div className="relative z-10 glass rounded-3xl p-6 border border-white/15 backdrop-blur-xl shadow-2xl">
            <h2 className="font-display text-2xl font-bold leading-tight">Tune your resume to FAANG standards.</h2>
            <p className="text-xs text-white/80 mt-2 leading-relaxed">
              Unlock AI multi-vector keyword scoring, historical scan comparison, and recruiter-ready PDF reports instantly.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
