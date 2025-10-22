
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
import { Loader2, Plus, Edit2, Trash2, UserCog } from 'lucide-react';

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
      console.log('Fetching users...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      console.log('Fetched profiles:', profiles);
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast.error('Error fetching users: ' + (error as Error).message);
    }
  };

  const fetchActivities = async () => {
    try {
      console.log('Fetching activities...');
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          profiles!activities_performed_by_fkey(name)
        `)
        .order('date', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching activities:', error);
        throw error;
      }
      
      console.log('Fetched activities:', data);
      
      const formattedActivities = data?.map(activity => ({
        id: activity.id,
        date: activity.date,
        description: activity.description,
        type: activity.type,
        performed_by_name: activity.profiles?.name || 'Unknown User'
      })) || [];
      
      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error in fetchActivities:', error);
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
      console.log('Creating user with data:', formData);
      setLoading(true);

      // Use the signup function from AuthContext instead of admin API
      await signup(formData.email, formData.password, formData.name, formData.role);

      // Log user creation activity
      await supabase
        .from('activities')
        .insert({
          type: 'user_created',
          description: `User ${formData.name} created with role ${formData.role}`,
          product_name: 'User Management',
          performed_by: profile?.id,
          date: new Date().toISOString()
        });

      toast.success('User created successfully');
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'cashier' });
      fetchUsers();
      fetchActivities();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error creating user: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      console.log('Updating user:', editingUser.id, 'with data:', formData);
      setLoading(true);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          role: formData.role,
        })
        .eq('id', editingUser.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Log user update activity
      await supabase
        .from('activities')
        .insert({
          type: 'user_updated',
          description: `User ${formData.name} updated (role: ${formData.role})`,
          product_name: 'User Management',
          performed_by: profile?.id,
          date: new Date().toISOString()
        });

      toast.success('User updated successfully');
      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'cashier' });
      fetchUsers();
      fetchActivities();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error updating user: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      console.log('Deleting user:', userId);
      setLoading(true);

      // Get user name before deletion
      const userToDelete = users.find(u => u.id === userId);
      const userName = userToDelete?.name || 'Unknown User';

      // Delete profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw profileError;
      }

      // Log user deletion activity
      await supabase
        .from('activities')
        .insert({
          type: 'user_deleted',
          description: `User ${userName} was deleted`,
          product_name: 'User Management',
          performed_by: profile?.id,
          date: new Date().toISOString()
        });

      toast.success('User deleted successfully');
      fetchUsers();
      fetchActivities();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: '', // We don't show email in edit mode
      password: '', // We don't show password in edit mode
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Update user details below.'
                  : 'Fill in the details to create a new user.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
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
                    <SelectTrigger>
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
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activities">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
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
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at
                        ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy HH:mm')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {user.id !== profile?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.id)}
                        >
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

        <TabsContent value="activities">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      {format(new Date(activity.date), 'MMM d, yyyy HH:mm')}
                    </TableCell>
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
