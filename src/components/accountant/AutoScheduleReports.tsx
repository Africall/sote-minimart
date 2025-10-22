
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, FileText, Mail, Clock, Bell, Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  frequency: string;
  recipients: string[];
  last_sent_at: string | null;
  next_scheduled_at: string | null;
  active: boolean;
}

export const AutoScheduleReports: React.FC = () => {
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduledReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScheduledReports(data || []);
    } catch (error: any) {
      console.error('Error fetching scheduled reports:', error);
      toast.error('Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  const toggleReportActive = async (reportId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ active })
        .eq('id', reportId);

      if (error) throw error;
      
      setScheduledReports(prev => 
        prev.map(report => 
          report.id === reportId ? { ...report, active } : report
        )
      );
      
      toast.success(`Report ${active ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    }
  };

  const getReportTypeName = (type: string) => {
    switch (type) {
      case 'sales': return 'Sales Report';
      case 'stock': return 'Stock Valuation Report';
      case 'profit': return 'Loss/Profit Report';
      case 'vat': return 'VAT Report';
      case 'expense': return 'Expense Report';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            Auto Schedule Reports
          </CardTitle>
          <Button onClick={() => setShowAddSchedule(!showAddSchedule)}>
            {showAddSchedule ? 'Cancel' : 'Schedule New Report'}
          </Button>
        </div>
        <CardDescription>
          Set up automatic report generation and email delivery
        </CardDescription>
      </CardHeader>
      
      {showAddSchedule && (
        <CardContent className="border-t border-b py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-name">Schedule Name</Label>
              <Input id="report-name" placeholder="e.g., Daily Sales Summary" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="stock">Stock Valuation Report</SelectItem>
                  <SelectItem value="profit">Loss/Profit Report</SelectItem>
                  <SelectItem value="vat">VAT Report</SelectItem>
                  <SelectItem value="expense">Expense Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select>
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Delivery Time</Label>
              <Input id="time" type="time" defaultValue="08:00" />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
              <Input id="recipients" placeholder="manager@example.com, owner@example.com" />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="format">File Format</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input type="radio" id="pdf" name="format" defaultChecked />
                  <Label htmlFor="pdf">PDF</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" id="excel" name="format" />
                  <Label htmlFor="excel">Excel</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" id="both" name="format" />
                  <Label htmlFor="both">Both</Label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShowAddSchedule(false)}>
              Schedule Report
            </Button>
          </div>
        </CardContent>
      )}
      
      <CardContent className={showAddSchedule ? "pt-0" : ""}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Next Scheduled</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : scheduledReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No scheduled reports found
                </TableCell>
              </TableRow>
            ) : (
              scheduledReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="font-medium">{report.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                      To: {report.recipients.join(', ')}
                    </div>
                  </TableCell>
                  <TableCell>{getReportTypeName(report.report_type)}</TableCell>
                  <TableCell className="capitalize">{report.frequency}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      {report.next_scheduled_at 
                        ? new Date(report.next_scheduled_at).toLocaleDateString()
                        : 'Not scheduled'
                      }
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch 
                      checked={report.active} 
                      onCheckedChange={(checked) => toggleReportActive(report.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Bell className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
