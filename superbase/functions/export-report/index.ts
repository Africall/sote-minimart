import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  reportType: 'trial_balance' | 'income_statement' | 'balance_sheet' | 'vat_return' | 'cashbook';
  format: 'pdf' | 'excel';
  params?: {
    startDate?: string;
    endDate?: string;
    asOfDate?: string;
    accountCode?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const body: ExportRequest = await req.json();
    const { reportType, format, params = {} } = body;

    let reportData: any[] = [];
    let reportTitle = '';
    let reportSubtitle = '';

    // Fetch report data based on type
    switch (reportType) {
      case 'trial_balance':
        const { data: tbData } = await supabaseClient
          .from('v_trial_balance')
          .select('*')
          .order('code');
        reportData = tbData || [];
        reportTitle = 'Trial Balance';
        reportSubtitle = 'All Account Balances';
        break;

      case 'income_statement':
        const { data: plData } = await supabaseClient.rpc('v_income_statement', {
          p_start: params.startDate || new Date().toISOString().split('T')[0],
          p_end: params.endDate || new Date().toISOString().split('T')[0],
        });
        reportData = plData || [];
        reportTitle = 'Income Statement (P&L)';
        reportSubtitle = `${params.startDate} to ${params.endDate}`;
        break;

      case 'balance_sheet':
        const { data: bsData } = await supabaseClient.rpc('v_balance_sheet', {
          p_asof: params.asOfDate || new Date().toISOString().split('T')[0],
        });
        reportData = bsData || [];
        reportTitle = 'Balance Sheet';
        reportSubtitle = `As of ${params.asOfDate}`;
        break;

      case 'vat_return':
        const { data: vatData } = await supabaseClient.rpc('v_vat_return', {
          p_start: params.startDate || new Date().toISOString().split('T')[0],
          p_end: params.endDate || new Date().toISOString().split('T')[0],
        });
        reportData = vatData || [];
        reportTitle = 'VAT Return';
        reportSubtitle = `${params.startDate} to ${params.endDate}`;
        break;

      case 'cashbook':
        const { data: cbData } = await supabaseClient.rpc('v_cashbook', {
          p_account_code: params.accountCode || '1100',
          p_start: params.startDate || new Date().toISOString().split('T')[0],
          p_end: params.endDate || new Date().toISOString().split('T')[0],
        });
        reportData = cbData || [];
        reportTitle = 'Cashbook';
        reportSubtitle = `Account ${params.accountCode} | ${params.startDate} to ${params.endDate}`;
        break;
    }

    if (format === 'excel') {
      // Generate Excel file
      const workbookData = generateExcel(reportTitle, reportSubtitle, reportData, reportType);
      
      return new Response(workbookData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    } else {
      // Generate PDF (simplified - would use proper PDF library in production)
      const pdfContent = generatePDF(reportTitle, reportSubtitle, reportData, reportType);
      
      return new Response(pdfContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateExcel(title: string, subtitle: string, data: any[], reportType: string): Uint8Array {
  // Simplified Excel generation - in production, use SheetJS or similar
  const csv = convertToCSV(title, subtitle, data, reportType);
  return new TextEncoder().encode(csv);
}

function convertToCSV(title: string, subtitle: string, data: any[], reportType: string): string {
  let csv = `${title}\n${subtitle}\n\n`;
  
  if (data.length === 0) return csv;
  
  // Add headers
  const headers = Object.keys(data[0]);
  csv += headers.join(',') + '\n';
  
  // Add data rows
  data.forEach(row => {
    csv += headers.map(h => {
      const value = row[h];
      return typeof value === 'number' ? value.toFixed(2) : `"${value}"`;
    }).join(',') + '\n';
  });
  
  return csv;
}

function generatePDF(title: string, subtitle: string, data: any[], reportType: string): Uint8Array {
  // Simplified PDF generation - in production, use jsPDF or similar
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          h2 { color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .number { text-align: right; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <h2>${subtitle}</h2>
        <table>
          ${generateTableHTML(data, reportType)}
        </table>
        <p style="margin-top: 40px; color: #999; font-size: 12px;">
          Generated on ${new Date().toLocaleString()} | Sote Minimart POS
        </p>
      </body>
    </html>
  `;
  
  return new TextEncoder().encode(html);
}

function generateTableHTML(data: any[], reportType: string): string {
  if (data.length === 0) return '<tr><td>No data available</td></tr>';
  
  const headers = Object.keys(data[0]);
  let html = '<thead><tr>';
  headers.forEach(h => {
    html += `<th>${h.replace(/_/g, ' ').toUpperCase()}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  data.forEach(row => {
    html += '<tr>';
    headers.forEach(h => {
      const value = row[h];
      const isNumber = typeof value === 'number';
      html += `<td class="${isNumber ? 'number' : ''}">${
        isNumber ? 'KSh ' + value.toLocaleString('en-KE', { minimumFractionDigits: 2 }) : value
      }</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody>';
  return html;
}