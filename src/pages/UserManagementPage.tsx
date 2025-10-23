import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRole } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  last_sign_in_at?: string | null;
}

interface UserActivity {
  id: string;
  date: string;
  description: string;
  type: string;
  performed_by_name: string;
}

const UserManagementPage: React.FC = () => {
  const { profile, signup } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier' as UserRole,
  });

  // Fetch users and their activities
  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setUsers(profiles || []);
    } catch (error) {
      toast.error('Error fetching users: ' + (error as Error).message);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          profiles!activities_performed_by_fkey(name)
        `)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedActivities =
        data?.map((activity: any) => ({
          id: activity.id,
          date: activity.date,
          description: activity.description,
          type: activity.type,
          performed_by_name: activity.profiles?.name || 'Unknown User',
        })) || [];

      setActivities(formattedActivities);
    } catch (error) {
      toast.error('Error fetching activities: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchActivities();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      await signup(formData.email, formData.password, formData.name, formData.role);

      await supabase.from('activities').insert({
        type: 'user_created',
        description: `User ${formData.name} created with role ${formData.role}`,
        product_name: 'User Management',
        performed_by: profile?.id,
        date: new Date().toISOString(),
      });

      toast.success('User created successfully');
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'cashier' });
      fetchUsers();
      fetchActivities();
    } catch (error) {
      toast.error('Error creating user: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setLoading(true);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          role: formData.role,
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      await supabase.from('activities').insert({
        type: 'user_updated',
        description: `User ${formData.name} updated (role: ${formData.role})`,
        product_name: 'User Management',
        performed_by: profile?.id,
        date: new Date().toISOString(),
      });

      toast.success('User updated successfully');
      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'cashier' });
      fetchUsers();
      fetchActivities();
    } catch (error) {
      toast.error('Error updating user: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      console.log('[delete] start', { userId });

      if (!userId) {
        console.warn('[delete] missing userId');
        toast.error('No user id provided');
        return;
      }

      // If this logs, your click handler wiring is OK.
      // If you see this log during render (not click), you’re calling the handler immediately.
      const confirmed = confirm('Are you sure you want to delete this user?');
      console.log('[delete] confirmed?', confirmed);
      if (!confirmed) return;

      setLoading(true);
      console.log('[delete] loading set');

      const userToDelete = users?.find((u) => u.id === userId);
      const userName = userToDelete?.name || 'Unknown User';
      console.log('[delete] userToDelete', userToDelete);

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('[delete] profileError', profileError);
        throw profileError;
      }
      console.log('[delete] profiles row deleted');

      const { error: activityError } = await supabase.from('activities').insert({
        type: 'user_deleted',
        description: `User ${userName} was deleted`,
        product_name: 'User Management',
        performed_by: profile?.id ?? null,
        date: new Date().toISOString(),
      });

      if (activityError) {
        console.error('[delete] activityError', activityError);
        throw activityError;
      }
      console.log('[delete] activity logged');

      toast.success('User deleted successfully');

      // Ensure the UI refreshes finish before clearing loading
      await Promise.allSettled([fetchUsers?.(), fetchActivities?.()]);
      console.log('[delete] lists refreshed');
    } catch (error) {
      console.error('[delete] caught error', error);
      toast.error('Error deleting user: ' + (error as Error).message);
    } finally {
      setLoading(false);
      console.log('[delete] done');
    }
  };


  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: '',
      password: '',
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Gradient header band */}
      <div className="rounded-xl overflow-hidden shadow-elegant border border-blue-100">
        <div className="bg-gradient-to-r from-royal-blue-600 to-primary/80 text-white px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
            <p className="opacity-90">Create, edit, and monitor user accounts</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-royal-blue-600 to-primary text-white hover:opacity-95">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>

            {/* Dialog with gradient header + surfaced body */}
            <DialogContent className="sm:max-w-[520px] rounded-2xl p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-royal-blue-600 to-primary text-white p-5">
                <DialogHeader className="p-0">
                  <DialogTitle className="text-base font-semibold">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </DialogTitle>
                  <DialogDescription className="opacity-90">
                    {editingUser ? 'Update user details below.' : 'Fill in the details to create a new user.'}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                <div className="p-5 space-y-4 bg-card">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                    />
                  </div>//new

                  {!editingUser && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                    >
                      <SelectTrigger className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="inventory">Inventory Manager</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="p-4 bg-muted/60">
                  <Button type="submit" disabled={loading} className="bg-gradient-to-r from-royal-blue-600 to-primary text-white hover:opacity-95">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingUser ? 'Update User' : 'Create User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs rail */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="rounded-xl bg-muted/60 p-1 grid grid-cols-2 w-full">
          <TabsTrigger
            value="users"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
          >
            Users
          </TabsTrigger>
          <TabsTrigger
            value="activities"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
          >
            Activity Logs
          </TabsTrigger>
        </TabsList>

        {/* Users table surface */}
        <TabsContent value="users">
          <div className="page-surface rounded-xl border border-blue-100 shadow-elegant overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell>
                      {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy HH:mm') : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {user.id !== profile?.id && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Activities table surface */}
        <TabsContent value="activities">
          <div className="page-surface rounded-xl border border-blue-100 shadow-elegant overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>{format(new Date(activity.date), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell>{activity.performed_by_name}</TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell className="capitalize">{activity.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagementPage;
