
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useShiftTimer = () => {
  const { profile } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Load shift state on component mount
  useEffect(() => {
    loadShiftState();
  }, [profile?.id]);

  const loadShiftState = async () => {
    if (!profile?.id) return;

    try {
      // Check for active shift in database
      const { data: activeShift, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('cashier_id', profile.id)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading shift state:', error);
        return;
      }

      if (activeShift) {
        // Resume active shift
        setIsActive(true);
        setCurrentShiftId(activeShift.id);
        const startTime = new Date(activeShift.start_time).getTime();
        startTimeRef.current = startTime;
        
        // Calculate elapsed time
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);

        // Start the timer
        intervalRef.current = setInterval(() => {
          const currentTime = Date.now();
          const currentElapsed = Math.floor((currentTime - startTime) / 1000);
          setElapsedTime(currentElapsed);
        }, 1000);

        console.log('Resumed active shift:', activeShift.id);
      }
    } catch (error) {
      console.error('Error loading shift state:', error);
    }
  };

  const startShift = async () => {
    if (!profile?.id) {
      toast.error('User profile not found');
      return;
    }

    try {
      // Create new shift in database
      const { data: newShift, error } = await supabase
        .from('shifts')
.insert({
          cashier_id: profile.id,
          start_time: new Date().toISOString(),
          float_amount: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating shift:', error);
        toast.error('Failed to start shift');
        return;
      }

      setIsActive(true);
      setCurrentShiftId(newShift.id);
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTimeRef.current) / 1000);
          setElapsedTime(elapsed);
        }
      }, 1000);

      // Log activity
      await supabase.from('activities').insert({
        type: 'shift_start',
        description: `${profile.name} started shift`,
        product_name: 'System',
        performed_by: profile.id,
        date: new Date().toISOString()
      });

      console.log('Started new shift:', newShift.id);
    } catch (error) {
      console.error('Error starting shift:', error);
      toast.error('Failed to start shift');
    }
  };

  const endShift = async () => {
    if (!profile?.id || !currentShiftId) {
      toast.error('No active shift found');
      return;
    }

    try {
      // Update shift end time in database
      const { error } = await supabase
        .from('shifts')
        .update({ 
          end_time: new Date().toISOString()
        })
        .eq('id', currentShiftId);

      if (error) {
        console.error('Error ending shift:', error);
        toast.error('Failed to end shift');
        return;
      }

      setIsActive(false);
      setCurrentShiftId(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsedTime(0);
      startTimeRef.current = null;

      // Log activity
      await supabase.from('activities').insert({
        type: 'shift_end',
        description: `${profile.name} ended shift`,
        product_name: 'System',
        performed_by: profile.id,
        date: new Date().toISOString()
      });

      console.log('Ended shift:', currentShiftId);
    } catch (error) {
      console.error('Error ending shift:', error);
      toast.error('Failed to end shift');
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isActive,
    elapsedTime,
    formattedTime: formatTime(elapsedTime),
    startShift,
    endShift,
    currentShiftId
  };
};
