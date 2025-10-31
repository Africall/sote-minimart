import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, Info } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function ForgotPasswordPage() {
  const { requestPasswordReset, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      return;
    }
    await requestPasswordReset(email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-blue-100 overflow-hidden">
        {/* Royal-blue top header with logo */}
        <div className="bg-gradient-to-b from-royal-blue-600 to-primary text-white px-6 pb-8 pt-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl shadow-lg px-6 py-3">
              <img src={logo} alt="Sote Minimart" className="h-10 w-auto" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">Reset Password</h1>
          <p className="opacity-90">We'll send you a reset link</p>
        </div>

        <CardContent className="p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Alert className="border border-blue-200 bg-blue-50 text-blue-900">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </AlertDescription>
              </Alert>

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

              <Button
                type="submit"
                className="w-full h-12 text-base bg-gradient-to-r from-royal-blue-600 to-primary hover:opacity-95"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="text-center">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert className="border border-green-200 bg-green-50 text-green-900">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <strong>Check your email!</strong>
                  <p className="mt-1 text-sm">
                    We've sent a password reset link to <strong>{email}</strong>. 
                    Click the link in the email to reset your password.
                  </p>
                </AlertDescription>
              </Alert>

              <Alert className="border border-blue-200 bg-blue-50 text-blue-900">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <p className="font-semibold mb-1">Didn't receive the email?</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Check your spam/junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>Wait a few minutes and try again</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="w-full h-12"
                >
                  Try Different Email
                </Button>
                <Link to="/auth">
                  <Button variant="ghost" className="w-full h-12">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
