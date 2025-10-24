import React, { useState } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, Eye, EyeOff, Info } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png"; // ✅ use your provided logo

const LoginPage: React.FC = () => {
  const { login, signup, loading } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");

  // login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);

  // signup state
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("cashier");
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [showSPass, setShowSPass] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields");
    try {
      await login(email, password);
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sEmail || !sPassword) return toast.error("Please fill in all fields");
    if (sPassword.length < 6) return toast.error("Password must be at least 6 characters long");
    try {
      await signup(sEmail, sPassword, name, role);
      setShowEmailConfirmation(true);
      setTab("login");
    } catch {
      toast.error("Signup failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-primary/10 via-background to-secondary/5 flex items-start md:items-center justify-center p-6">
      <Card className="w-full max-w-lg overflow-hidden shadow-xl border-blue-100">
        {/* ✅ Blue Header with Logo Inside */}
        <div className="bg-gradient-to-b from-blue-700 to-blue-600 text-white px-6 pb-10 pt-8 text-center relative rounded-b-none">
          <div className="flex justify-center mb-4">
            <img
              src={logo}
              alt="SOTE MINIMART"
              className="h-20 w-auto bg-white rounded-xl p-2 drop-shadow-md"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">Welcome Back!</h1>
          <p className="opacity-90 text-sm">Sign in to access your POS system</p>
        </div>

        <CardContent className="p-6">
          {/* Tabs (Login / Signup) */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6 bg-muted/60 p-1 rounded-xl">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      type={showPass ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10 h-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  <a className="text-primary hover:underline" href="#">
                    Forgot Password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-700 to-blue-500 hover:opacity-95"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login to Dashboard"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* SIGNUP */}
            <TabsContent value="signup">
              {showEmailConfirmation && (
                <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Account created! Please check your email for a confirmation link before logging in.
                  </AlertDescription>
                </Alert>
              )}
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
                      value={sEmail}
                      onChange={(e) => setSEmail(e.target.value)}
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
                      type={showSPass ? "text" : "password"}
                      placeholder="Create a password (min 6 characters)"
                      value={sPassword}
                      onChange={(e) => setSPassword(e.target.value)}
                      className="pl-9 pr-10 h-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                      disabled={loading}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showSPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-700 to-blue-500 hover:opacity-95"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
