import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { LogIn, Mail, Lock, ShieldCheck, Sparkles } from "lucide-react";

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
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-purple-600 opacity-90"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="relative z-10 w-full h-full flex flex-col justify-center p-20 text-white">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tighter uppercase">ElectroFix</span>
          </div>
          
          <h1 className="text-6xl font-bold leading-tight mb-6">
            The Ultimate <br /> 
            <span className="text-white/70">Repair Management</span> <br />
            Powerhouse.
          </h1>
          <p className="text-xl text-white/60 max-w-lg leading-relaxed">
            Streamline your repair workflow, manage inventory with surgical precision, and deliver world-class service to your customers.
          </p>

          <div className="mt-20 flex gap-10">
            <div className="flex flex-col">
              <span className="text-4xl font-bold">14+</span>
              <span className="text-sm text-white/50 uppercase tracking-widest font-bold">Modules</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-bold">100%</span>
              <span className="text-sm text-white/50 uppercase tracking-widest font-bold">Secure</span>
            </div>
          </div>
        </div>

        {/* Animated Shapes */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right Login Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-950">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
               <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                 <ShieldCheck className="h-8 w-8 text-white" />
               </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-zinc-400">Please enter your details to access your workstation.</p>
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
                placeholder="admin@electrofix.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  icon={<Lock className="h-4 w-4" />}
                  className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-primary"
                />
                <div className="flex justify-end">
                  <button type="button" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
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
