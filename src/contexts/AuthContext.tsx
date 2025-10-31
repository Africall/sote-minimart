
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Define user roles
export type UserRole = 'admin' | 'cashier' | 'inventory' | 'accountant';

export interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  branch?: string;
  terminal_id?: string;
  branch_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Cache for profile data
const profileCache = new Map<string, { profile: UserProfile; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthProvider: Initializing authentication...');
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Getting session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('AuthProvider: Session error:', sessionError);
          throw sessionError;
        }

        if (session) {
          console.log('AuthProvider: Session found, user:', session.user.email);
          setSession(session);
          setUser(session.user);

          // Fetch profile
          const userProfile = await fetchProfile(session.user.id);
          if (userProfile && mounted) {
            console.log('AuthProvider: Profile loaded:', userProfile.role);
            setProfile(userProfile);
          }
        } else {
          console.log('AuthProvider: No session found');
        }
      } catch (error) {
        console.error('AuthProvider: Error initializing auth:', error);
      } finally {
        if (mounted) {
          console.log('AuthProvider: Setting loading to false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthProvider: Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        setUser(session.user);
        
        // Defer profile fetching and navigation to avoid deadlock
        setTimeout(async () => {
          const userProfile = await fetchProfile(session.user.id);
          if (mounted && userProfile) {
            setProfile(userProfile);
            console.log('AuthProvider: Navigating to role-based route:', userProfile.role);
          }
        }, 0);
      } else if (event === 'PASSWORD_RECOVERY') {
        // When user clicks password reset link, don't redirect - let them stay on reset page
        console.log('AuthProvider: Password recovery detected');
        setSession(session);
        setUser(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthProvider: User signed out');
        setSession(null);
        setUser(null);
        setProfile(null);
        profileCache.clear();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
      }
    });

    return () => {
      console.log('AuthProvider: Cleaning up...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Function to fetch profile with caching
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    // Check cache first
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.profile;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Update cache
      profileCache.set(userId, { profile, timestamp: Date.now() });
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Function to update last sign in time and log activity
  const updateLastSignIn = async (userId: string, userName: string) => {
    try {
      // Update last sign in time in profiles table
      await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', userId);

      // Log login activity
      await supabase
        .from('activities')
        .insert({
          type: 'login',
          description: `${userName} logged in`,
          product_name: 'System',
          performed_by: userId,
          date: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating last sign in:', error);
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    login: async (email: string, password: string) => {
      try {
        console.log('AuthProvider: Login attempt for:', email);
        setLoading(true);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('AuthProvider: Login error:', error);
          
          // Handle specific error cases with user-friendly messages
          if (error.message.includes('Email not confirmed')) {
            toast.error('Please check your email and click the confirmation link before logging in.');
            return;
          } else if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please check your credentials and try again.');
            return;
          } else if (error.message.includes('Too many requests')) {
            toast.error('Too many login attempts. Please wait a moment and try again.');
            return;
          } else {
            toast.error(error.message || 'Login failed. Please try again.');
            return;
          }
        }

        if (data.user && data.session) {
          console.log('AuthProvider: Login successful, user:', data.user.email);
          setUser(data.user);
          setSession(data.session);
          
          const userProfile = await fetchProfile(data.user.id);
          
          if (userProfile) {
            console.log('AuthProvider: Profile fetched, role:', userProfile.role);
            setProfile(userProfile);
            
            // Update last sign in time and log activity
            await updateLastSignIn(data.user.id, userProfile.name || data.user.email || 'Unknown User');
            
            toast.success(`Welcome back, ${userProfile.name || data.user.email}!`);
            
            // Navigate based on role
            const role = userProfile.role as UserRole;
            console.log('AuthProvider: Navigating to:', role);
            
            switch (role) {
              case 'admin':
                navigate('/dashboard');
                break;
              case 'inventory':
                navigate('/inventory-dashboard');
                break;
              case 'cashier':
                navigate('/cashier-pos');
                break;
              case 'accountant':
                navigate('/reports');
                break;
              default:
                console.warn('AuthProvider: Unknown role, redirecting to login');
                navigate('/login');
            }
          } else {
            console.error('AuthProvider: Failed to fetch profile');
            toast.error('Login successful, but failed to load user profile. Please try again.');
          }
        }
      } catch (error) {
        console.error('AuthProvider: Login exception:', error);
        toast.error('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    signup: async (email: string, password: string, name: string, role: UserRole) => {
      try {
        setLoading(true);
        console.log('AuthProvider: Signup attempt for:', email);

        // First attempt to create the auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
            },
            emailRedirectTo: `${window.location.origin}/login`
          },
        });

        if (authError) {
          console.error('AuthProvider: Signup error:', authError);
          
          if (authError.message.includes('User already registered')) {
            toast.error('This email is already registered. Please try logging in instead.');
          } else if (authError.message.includes('Password should be at least')) {
            toast.error('Password must be at least 6 characters long.');
          } else if (authError.message.includes('Unable to validate email address')) {
            toast.error('Please enter a valid email address.');
          } else {
            toast.error(authError.message || 'Signup failed. Please try again.');
          }
          return;
        }

        if (authData?.user) {
          console.log('AuthProvider: User created successfully:', authData.user.email);
          
          // Create profile in profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                name,
                role,
              },
            ]);

          if (profileError) {
            console.error('AuthProvider: Profile creation error:', profileError);
            toast.error('Account created but profile setup failed. Please contact support.');
            return;
          }

          console.log('AuthProvider: Profile created successfully');
          toast.success('Account created successfully! Please check your email for verification.');
        }
      } catch (error) {
        console.error('AuthProvider: Signup exception:', error);
        toast.error('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    logout: async () => {
      try {
        setLoading(true);
        
        // Log logout activity before signing out
        if (user && profile) {
          await supabase
            .from('activities')
            .insert({
              type: 'logout',
              description: `${profile.name} logged out`,
              product_name: 'System',
              performed_by: user.id,
              date: new Date().toISOString()
            });
        }

        const { error } = await supabase.auth.signOut();

        if (error) {
          toast.error(error.message);
          return;
        }

        setUser(null);
        setProfile(null);
        setSession(null);
        profileCache.clear();
        toast.info('You have been logged out');
        navigate('/login');
      } catch (error) {
        console.error('AuthProvider: Logout error:', error);
        toast.error('Logout failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    requestPasswordReset: async (email: string) => {
      try {
        setLoading(true);
        console.log('AuthProvider: Password reset request for:', email);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          console.error('AuthProvider: Password reset error:', error);
          toast.error(error.message || 'Failed to send password reset email. Please try again.');
          return;
        }

        toast.success('Password reset email sent! Please check your inbox.');
      } catch (error) {
        console.error('AuthProvider: Password reset exception:', error);
        toast.error('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    resetPassword: async (newPassword: string) => {
      try {
        setLoading(true);
        console.log('AuthProvider: Updating password...');

        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          console.error('AuthProvider: Password update error:', error);
          toast.error(error.message || 'Failed to update password. Please try again.');
          return;
        }

        toast.success('Password updated successfully! You can now log in with your new password.');
        navigate('/login');
      } catch (error) {
        console.error('AuthProvider: Password update exception:', error);
        toast.error('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    isAuthenticated: !!user,
    hasPermission: (requiredRoles: UserRole[]): boolean => {
      if (!user || !profile) return false;
      return requiredRoles.includes(profile.role as UserRole);
    },
  }), [user, profile, session, loading, navigate]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
