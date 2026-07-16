import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import loginBg from "@/assets/login-bg.png";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`Welcome back! Successfully logged in as ${email}`);
      navigate({ to: "/" });
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute -left-48 -bottom-48 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -right-48 -top-48 h-96 w-96 rounded-full bg-accent/20 pointer-events-none blur-3xl" />

      {/* Main Container Card */}
      <div className="glass max-w-5xl w-full rounded-[2.5rem] overflow-hidden grid md:grid-cols-12 min-h-[600px] border border-white/10 shadow-premium relative z-10 animate-reveal">
        
        {/* Left Side: Login Form */}
        <div className="md:col-span-6 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-semibold hover:opacity-90 transition-opacity">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-e font-bold">R</span>
              Rezonance
            </Link>

            {/* Title */}
            <div className="mt-12">
              <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Log in to optimize your resumes, track historical scans, and match matching opportunities.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Password</label>
                  <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  required
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary/40 focus:ring-offset-background h-4 w-4"
                />
                <label htmlFor="remember" className="text-xs text-muted-foreground select-none cursor-pointer">Remember me for 30 days</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow-e transition hover:-translate-y-0.5 hover:shadow-glow-g disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                <span className="relative">{loading ? "Logging in..." : "Sign in"}</span>
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-xs text-muted-foreground border-t border-white/5 pt-6">
            Don't have an account? <a href="#" className="text-primary hover:underline font-medium">Create one free</a>
          </div>
        </div>

        {/* Right Side: Showcase Illustration */}
        <div className="hidden md:col-span-6 relative overflow-hidden md:flex flex-col justify-end p-12 text-white border-l border-white/10">
          <div className="absolute inset-0 z-0">
            <img src={loginBg} alt="Cyberdyne secure access grid" className="h-full w-full object-cover opacity-90 scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-xs text-primary mb-4 font-semibold tracking-wide">SECURE ACCESS</div>
            <h2 className="font-display text-3xl font-semibold leading-tight">Tune your resume to Faang standards.</h2>
            <p className="text-sm text-white/70 mt-3 leading-relaxed max-w-md">
              Unlock advanced metrics matching, saved histories, and direct word export files.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
