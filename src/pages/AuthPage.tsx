import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, Eye, EyeOff, Info } from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

export default function AuthPage() {
  const { login, signup, loading } = useAuth();

  const [tab, setTab] = useState<"login" | "signup">("login");

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // signup
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("cashier");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Please fill in your email and password");
      return;
    }
    try {
      await login(loginEmail, loginPassword);
      // optionally persist `remember` yourself (localStorage) if desired
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !signupEmail || !signupPassword) {
      toast.error("Please fill in all the fields");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      await signup(signupEmail, signupPassword, name, role);
      toast.success("Account created! Please confirm your email before logging in.");
      setTab("login");
      setSignupPassword("");
    } catch {
      toast.error("Sign up failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-secondary/5 flex items-start md:items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-blue-100 overflow-hidden">
        {/* Royal-blue top header with logo & tagline */}
        <div className="bg-gradient-to-b from-royal-blue-600 to-primary text-white px-6 pb-8 pt-10 text-center relative">
          <div className="absolute -top-9 left-1/2 -translate-x-1/2">
            <div className="bg-white rounded-2xl shadow-lg px-6 py-3">
              <img src={logo} alt="Sote Minimart" className="h-10 w-auto" />
            </div>
          </div>
          <h1 className="mt-6 text-2xl md:text-3xl font-extrabold">Welcome Back!</h1>
          <p className="opacity-90">Sign in to access your POS system</p>
        </div>

        <CardContent className="p-6">
          {/* Tabs like in the screenshot */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger
                value="login"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-9 h-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-9 pr-10 h-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Alert className="border border-blue-200 bg-blue-50 text-blue-900">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    If you just created an account, please confirm your email before logging in.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="text-primary hover:underline">
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-to-r from-royal-blue-600 to-primary hover:opacity-95"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login to Dashboard"}
                </Button>
              </form>
            </TabsContent>

            {/* SIGN UP */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-9 h-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="Create a password (min 6 chars)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pl-9 pr-10 h-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                      disabled={loading}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label="Toggle password visibility"
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger className="h-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-to-r from-royal-blue-600 to-primary hover:opacity-95"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
