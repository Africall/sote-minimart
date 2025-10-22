
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useDarkMode = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load dark mode preference on mount
  useEffect(() => {
    const loadDarkModePreference = async () => {
      try {
        // First check localStorage for immediate application
        const localPreference = localStorage.getItem('darkMode');
        if (localPreference !== null) {
          const isDark = localPreference === 'true';
          setDarkMode(isDark);
          document.documentElement.classList.toggle('dark', isDark);
        }

        // If user is logged in, sync with database preference
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('dark_mode_preference')
            .eq('id', user.id)
            .single();

          if (!error && data && data.dark_mode_preference !== null) {
            const dbPreference = data.dark_mode_preference;
            setDarkMode(dbPreference);
            document.documentElement.classList.toggle('dark', dbPreference);
            localStorage.setItem('darkMode', String(dbPreference));
          }
        }
      } catch (error) {
        console.error('Error loading dark mode preference:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDarkModePreference();
  }, [user]);

  const toggleDarkMode = async (enabled?: boolean) => {
    const newDarkMode = enabled !== undefined ? enabled : !darkMode;
    
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));

    // Save to database if user is logged in
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ dark_mode_preference: newDarkMode })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error saving dark mode preference:', error);
      }
    }
  };

  return { darkMode, toggleDarkMode, loading };
};
