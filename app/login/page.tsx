"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuthStore();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  

  useEffect(() => {
    if (session) {
      login({
        id: "google_user",
        email: session.user.email!,
        name: session.user.name!,
        avatar: session.user.image!,
      });
      router.push("/");
    }
  }, [session, login, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: "user_1",
      email: formData.email,
      name: "Emma Thompson",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    });
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted/20 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
      >
        <div className="text-center md:text-left ">
          <h1 className="heading-section text-4xl font-bold mb-4">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-lg">
            Sign in to access your account, orders, and wishlist.
          </p>
        </div>
        <div className="text-center md:border-l md:border-border md:pl-8">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={40} className="text-muted-foreground" />
          </div>
          <form
            onSubmit={handleLogin}
            className="space-y-4 text-left max-w-sm mx-auto"
          >
            <div>
              <label className="text-label block mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input-fashion rounded-md"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="text-label block mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="input-fashion rounded-md"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn-primary-fashion w-full">
              Sign In
            </button>
            <div className="mt-4">
              <button
                onClick={() => signIn("google")}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          </form>
          <p className="text-sm text-muted-foreground mt-6">
            Dont have an account?{" "}
            <button className="text-primary hover:underline">Create one</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
