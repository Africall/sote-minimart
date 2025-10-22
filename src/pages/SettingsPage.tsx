
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useDarkMode } from '@/hooks/useDarkMode';
import { AccountingSettings } from '@/components/accounting/AccountingSettings';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
    id: string;
    name: string;
    role: 'admin' | 'cashier' | 'inventory_manager' | 'accountant';
    avatar_url?: string;
    created_at: string;
    last_sign_in_at?: string | null;
}

const SettingsPage = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const { darkMode, toggleDarkMode } = useDarkMode();
    const { profile: authProfile } = useAuth();
    const hasAccountingAccess = authProfile?.role === 'admin' || authProfile?.role === 'accountant';

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (data) {
                setProfile(data);
                setName(data.name);
                setAvatarUrl(data.avatar_url || '');
            }
        };
        loadProfile();
    }, []);

    const handleUpdate = async () => {
        if (!profile) return;
        const updates = { id: profile.id, name, avatar_url: avatarUrl };
        await supabase.from('profiles').upsert(updates);
        alert('Profile updated successfully');
    };

    return (
        <div className="flex h-screen font-sans bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 p-6 border-r dark:border-gray-700 transition-colors duration-200">
                <div className="flex items-center mb-6">
                    <img
                        src={avatarUrl || `https://ui-avatars.com/api/?name=${name}`}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                        alt="avatar"
                    />
                    <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.role}</p>
                    </div>
                </div>
                <ul className="space-y-4 text-gray-700 dark:text-gray-200">
                    <li className="font-semibold">My Profile</li>
                    <li className="hover:underline cursor-pointer">Security</li>
                    <li className="hover:underline cursor-pointer">Teams</li>
                    <li className="hover:underline cursor-pointer">Notifications</li>
                    <li className="hover:underline cursor-pointer">Billing</li>
                    <li>
                        {/* Preferences */}
                        <div>
                            <h3 className="text-md font-semibold mb-2">App Preferences</h3>
                            <div className="flex items-center justify-between border border-gray-200 dark:border-gray-600 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
                                <span className="text-gray-900 dark:text-gray-100">Enable Dark Mode</span>
                                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                            </div>
                        </div>
                    </li>
                </ul>
                <div className="mt-10">
                    <Button variant="destructive">Delete Account</Button>
                </div>
            </aside>

            {/* Main Panel */}
            <main className="flex-1 p-10 overflow-y-auto text-gray-900 dark:text-gray-100 transition-colors duration-200">
                <h1 className="text-2xl font-bold mb-6">Settings</h1>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        {hasAccountingAccess && (
                            <TabsTrigger value="accounting">Accounting</TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="profile">
                        {/* Profile Section */}
                        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 transition-colors duration-200">
                            <h2 className="text-lg font-semibold mb-4">My Profile</h2>
                            <div className="flex items-center space-x-4">
                                <img
                                    src={avatarUrl || `https://ui-avatars.com/api/?name=${name}`}
                                    className="w-16 h-16 rounded-full object-cover"
                                    alt="avatar"
                                />
                                <div>
                                    <p className="font-medium text-xl">{name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.role}</p>
                                </div>
                            </div>
                        </section>

                        {/* Editable Fields */}
                        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 space-y-6 transition-colors duration-200">
                            {/* Personal Info */}
                            <div>
                                <h3 className="text-md font-semibold mb-2">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                        <Input 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)}
                                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avatar URL</label>
                                        <Input 
                                            value={avatarUrl} 
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleUpdate}>Save Changes</Button>
                        </section>
                    </TabsContent>

                    {hasAccountingAccess && (
                        <TabsContent value="accounting">
                            <AccountingSettings />
                        </TabsContent>
                    )}
                </Tabs>
            </main>
        </div>
    );
};

export default SettingsPage;
