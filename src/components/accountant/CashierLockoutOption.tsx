
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Clock, Calendar, UserCog, AlertTriangle, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ActiveSession {
  id: string;
  cashier_id: string;
  start_time: string;
  end_time: string | null;
  float_amount: number;
  cashier_name: string;
  cashier_role: string;
}

export const CashierLockoutOption: React.FC = () => {
  const [showScheduleLockout, setShowScheduleLockout] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch active cashier sessions from database
  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      
      // Get all shifts with cashier profile data - active sessions have null end_time
      const { data: shifts, error } = await supabase
        .from('shifts')
        .select(`
          id,
          cashier_id,
          start_time,
          end_time,
          float_amount,
          profiles!shifts_cashier_id_fkey (
            name,
            role
          )
        `)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching shifts:', error);
        toast.error('Failed to load cashier sessions');
        return;
      }

      if (shifts) {
        const formattedSessions: ActiveSession[] = shifts.map(shift => ({
          id: shift.id,
          cashier_id: shift.cashier_id,
          start_time: shift.start_time,
          end_time: shift.end_time,
          float_amount: shift.float_amount,
          cashier_name: (shift.profiles as any)?.name || 'Unknown',
          cashier_role: (shift.profiles as any)?.role || 'cashier'
        }));
        
        setActiveSessions(formattedSessions);
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      toast.error('Failed to load cashier sessions');
    } finally {
      setLoading(false);
    }
  };

  // End a shift (lock cashier session)
  const endShift = async (shiftId: string) => {
    try {
      const { error } = await supabase
        .from('shifts')
        .update({ end_time: new Date().toISOString() })
        .eq('id', shiftId);

      if (error) {
        toast.error('Failed to end shift');
        return;
      }

      toast.success('Shift ended successfully');
      fetchActiveSessions(); // Refresh data
    } catch (error) {
      toast.error('Failed to end shift');
    }
  };

  // Calculate session duration
  const calculateSessionDuration = (startTime: string, endTime: string | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    return formatDistanceToNow(start, { addSuffix: false });
  };

  // Get session status
  const getSessionStatus = (endTime: string | null) => {
    return endTime === null ? 'active' : 'ended';
  };

  useEffect(() => {
    fetchActiveSessions();
    
    // Set up real-time subscription for shifts table changes
    const channel = supabase
      .channel('shifts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts'
        },
        () => {
          fetchActiveSessions(); // Refresh data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Mock data for scheduled lockouts (keep this for now)
  const scheduledLockouts = [
    {
      id: 1,
      time: '17:30',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      enabled: true
    },
    {
      id: 2,
      time: '22:00',
      days: ['Saturday', 'Sunday'],
      enabled: true
    }
  ];
  
  // Format days array to readable string
  const formatDays = (days: string[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && 
        days.includes('Monday') && 
        days.includes('Tuesday') && 
        days.includes('Wednesday') && 
        days.includes('Thursday') && 
        days.includes('Friday')) return 'Weekdays';
    if (days.length === 2 && 
        days.includes('Saturday') && 
        days.includes('Sunday')) return 'Weekends';
    return days.join(', ');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <Lock className="mr-2 h-5 w-5 text-primary" />
            Cashier Lockout Options
          </CardTitle>
          <Button onClick={() => setShowScheduleLockout(!showScheduleLockout)}>
            {showScheduleLockout ? 'Cancel' : 'Schedule Lockout'}
          </Button>
        </div>
        <CardDescription>
          Control cashier access and schedule automatic session lockouts
        </CardDescription>
      </CardHeader>
      
      {showScheduleLockout && (
        <CardContent className="border-t border-b py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lockout-time">Lockout Time</Label>
              <Input id="lockout-time" type="time" />
            </div>
            
            <div className="space-y-2">
              <Label>Days Active</Label>
              <div className="grid grid-cols-7 gap-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="h-8 w-8 p-0" 
                    data-state={index < 5 ? "selected" : ""}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lockout-message">Lockout Message</Label>
              <Input id="lockout-message" placeholder="e.g., End of business day" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allow-override">Allow Manager Override</Label>
              <Select defaultValue="yes">
                <SelectTrigger id="allow-override">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, with manager PIN</SelectItem>
                  <SelectItem value="no">No, strict lockout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShowScheduleLockout(false)}>
              Save Schedule
            </Button>
          </div>
        </CardContent>
      )}
      
      <CardContent className={`space-y-6 ${showScheduleLockout ? "pt-4" : ""}`}>
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-1" /> Scheduled Lockouts
          </h3>
          <div className="space-y-2">
            {scheduledLockouts.map((schedule) => (
              <div key={schedule.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                <div>
                  <div className="font-medium">{schedule.time}</div>
                  <div className="text-xs text-muted-foreground">{formatDays(schedule.days)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={schedule.enabled} />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <UserCog className="h-4 w-4 mr-1" /> Active Cashier Sessions
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cashier</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Session Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Loading cashier sessions...
                  </TableCell>
                </TableRow>
              ) : activeSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No cashier sessions found
                  </TableCell>
                </TableRow>
              ) : (
                activeSessions.map((session) => {
                  const status = getSessionStatus(session.end_time);
                  const sessionDuration = calculateSessionDuration(session.start_time, session.end_time);
                  
                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        <div>{session.cashier_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Role: {session.cashier_role}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">Shift #{session.id.slice(-4)}</div>
                        <div className="text-xs text-muted-foreground">
                          Float: KES {session.float_amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {status === 'active' ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800">
                            Ended
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          {sessionDuration}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Started: {new Date(session.start_time).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {status === 'active' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600"
                            onClick={() => endShift(session.id)}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            End Shift
                          </Button>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Ended: {session.end_time ? new Date(session.end_time).toLocaleString() : 'N/A'}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" /> Emergency Lockout
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800 mb-3">
              Use this option only in case of emergency to immediately lock all active cashier sessions.
            </p>
            <Button variant="destructive">
              <Lock className="h-4 w-4 mr-1" />
              Emergency Lockout All Cashiers
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
