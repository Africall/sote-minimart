import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, EyeOff, Info, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const { resetPassword, loading } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    await resetPassword(newPassword);
  };

  const passwordStrength = (password: string) => {
    if (password.length === 0) return { strength: "", color: "" };
    if (password.length < 6) return { strength: "Too short", color: "text-red-600" };
    if (password.length < 8) return { strength: "Weak", color: "text-orange-600" };
    if (password.length < 12) return { strength: "Good", color: "text-yellow-600" };
    return { strength: "Strong", color: "text-green-600" };
  };

  const strength = passwordStrength(newPassword);

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
          <h1 className="text-2xl md:text-3xl font-extrabold">Set New Password</h1>
          <p className="opacity-90">Choose a strong password</p>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert className="border border-blue-200 bg-blue-50 text-blue-900">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Your new password must be at least 6 characters long.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9 pr-10 h-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                  disabled={loading}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && (
                <p className={`text-sm font-medium ${strength.color}`}>
                  Password strength: {strength.strength}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 pr-10 h-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                  disabled={loading}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && newPassword === confirmPassword && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Passwords match</span>
                </div>
              )}
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-600">
                  Passwords do not match
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-gradient-to-r from-royal-blue-600 to-primary hover:opacity-95"
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
