import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { LogIn, Mail, Lock, Sparkles } from "lucide-react";
import logoImg from "@/assets/logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await login(formData);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0A0A0B] overflow-hidden">
      {/* Left Decoration Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden border-r border-zinc-900">
        {/* Soft, studio radial glow centered behind the logo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(12,185,193,0.1)_0%,transparent_60%)]"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(0.54 0.07 194.6) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        <div className="relative z-10 w-full h-full flex flex-col justify-center p-20">
          <div className="mb-12 flex items-center justify-start">
            <img
              src={logoImg}
              alt="Sri Senthil Spares & Services Logo"
              className="h-32 w-auto object-contain hover:scale-[1.02] transition-transform duration-300 drop-shadow-[0_0_15px_rgba(12,185,193,0.15)]"
            />
          </div>

          <h1 className="text-5xl font-black leading-tight mb-6 text-white tracking-tight">
            The Ultimate <br />
            <span className="text-primary">Spares & Services</span> <br />
            Powerhouse.
          </h1>
          <p className="text-lg text-zinc-400 max-w-lg leading-relaxed font-medium">
            Surgical precision in managing your motors, fans, mixers, electrical
            equipment, inventory and services.
          </p>

          <div className="mt-20 flex gap-16">
            <div className="flex flex-col">
              <span className="text-4xl font-black text-white">14+</span>
              <span className="text-xs text-zinc-500 uppercase tracking-[0.2em] font-black mt-1">
                Modules
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-black text-white">100%</span>
              <span className="text-xs text-zinc-500 uppercase tracking-[0.2em] font-black mt-1">
                Secure
              </span>
            </div>
          </div>
        </div>

        {/* Subtle Decorative Gradient Blobs */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      {/* Right Login Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-950 relative overflow-hidden">
        {/* Soft, studio radial glow centered behind the login card */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(12,185,193,0.1)_0%,transparent_60%)]"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(0.54 0.07 194.6) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>
        
        <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-1 duration-700">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="bg-white p-4 rounded-3xl shadow-xl border border-zinc-800/20 max-w-[200px]">
                <img
                  src={logoImg}
                  alt="Sri Senthil Spares & Services Logo"
                  className="h-14 w-auto object-contain"
                />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-zinc-400">
              Please enter your details to access your workstation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Work Email"
                type="email"
                required
                placeholder="admin@srisenthil.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                icon={<Mail className="h-4 w-4" />}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-primary"
              />

              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  icon={<Lock className="h-4 w-4" />}
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-primary"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20 group"
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  Sign In to System
                </div>
              )}
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t border-zinc-900 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Restricted Access: Authorized Personnel Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
