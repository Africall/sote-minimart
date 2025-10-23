import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRole } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logo from '@/assets/logo.png';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [activeTab, setActiveTab] = useState('login');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const { login, signup, loading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    try {
      await signup(email, password, name, role);
      setShowEmailConfirmation(true);
      setActiveTab('login');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 animate-slide-up">
        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl opacity-30 gradient-accent animate-gradient-shift bg-[length:200%_200%]" />
          <img
            src={logo}
            alt="SOTE MINIMART"
            className="relative h-16 w-auto animate-float drop-shadow"
          />
        </div>

        {/* Auth Card */}
        <Card className="w-full max-w-md rounded-xl border-2 border-primary/10 shadow-elegant bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome to SOTE Minimart</CardTitle>
            <CardDescription className="text-center">
              Sign in or create an account to access the POS system.
            </CardDescription>
          </CardHeader>

          {showEmailConfirmation && (
            <div className="px-6 pb-0">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Account created! Please check your email for a confirmation link before logging in.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="px-6">
            <TabsList className="grid grid-cols-2 w-full rounded-xl bg-muted/60">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="input-strong"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="input-strong"
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      If you just created an account, please confirm your email before logging in.
                    </AlertDescription>
                  </Alert>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full hover-scale gradient-primary text-white shadow-glow-primary"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* SIGN UP */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Name</Label>
                    <Input
                      id="signup-name"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                      className="input-strong"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="input-strong"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      className="input-strong"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <Select
                      value={role}
                      onValueChange={(value) => setRole(value as UserRole)}
                      disabled={loading}
                    >
                      <SelectTrigger className="input-strong">
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
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full hover-scale gradient-secondary text-white shadow-glow-secondary"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center">
          By continuing, you agree to the Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
