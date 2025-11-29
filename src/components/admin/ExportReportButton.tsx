import { useState } from 'react';
import { Download, FileText, Table2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  exportToPDF,
  exportToCSV,
  exportOrdersReport,
  exportRevenueReport,
  exportUsersReport,
  exportRestaurantsReport,
} from '@/lib/pdfExport';
import { useAuth } from '@/contexts/AuthContext';

type ReportType = 'orders' | 'revenue' | 'users' | 'restaurants' | 'custom';

interface ExportReportButtonProps {
  reportType: ReportType;
  data: any[];
  dateRange?: { from: Date; to: Date };
  customConfig?: {
    title: string;
    subtitle?: string;
    summary: { label: string; value: string | number; highlight?: boolean }[];
    columns: {
      key: string;
      header: string;
      width?: string;
      align?: 'left' | 'center' | 'right';
      format?: (value: any) => string;
    }[];
  };
  disabled?: boolean;
}

export function ExportReportButton({
  reportType,
  data,
  dateRange,
  customConfig,
  disabled = false,
}: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();

  const generatedBy = user?.email || 'Admin';

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      switch (reportType) {
        case 'orders':
          exportOrdersReport(data, dateRange, generatedBy);
          break;
        case 'revenue':
          exportRevenueReport(data, dateRange, generatedBy);
          break;
        case 'users':
          exportUsersReport(data, generatedBy);
          break;
        case 'restaurants':
          exportRestaurantsReport(data, generatedBy);
          break;
        case 'custom':
          if (customConfig) {
            exportToPDF(
              {
                title: customConfig.title,
                subtitle: customConfig.subtitle,
                dateRange,
                generatedBy,
              },
              customConfig.summary,
              data,
              customConfig.columns
            );
          }
          break;
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      let columns: { key: string; header: string; format?: (v: any) => string }[] = [];
      let filename = 'report';

      switch (reportType) {
        case 'orders':
          filename = 'orders-report';
          columns = [
            { key: 'order_number', header: 'Order #' },
            { key: 'customer_name', header: 'Customer' },
            { key: 'restaurant_name', header: 'Restaurant' },
            { key: 'status', header: 'Status' },
            { key: 'total', header: 'Total', format: (v) => v?.toFixed(2) || '0' },
            { key: 'created_at', header: 'Date', format: (v) => new Date(v).toISOString().split('T')[0] },
          ];
          break;
        case 'revenue':
          filename = 'revenue-report';
          columns = [
            { key: 'date', header: 'Date', format: (v) => new Date(v).toISOString().split('T')[0] },
            { key: 'order_count', header: 'Orders' },
            { key: 'revenue', header: 'Revenue', format: (v) => v?.toFixed(2) || '0' },
            { key: 'commission', header: 'Commission', format: (v) => v?.toFixed(2) || '0' },
            { key: 'net_revenue', header: 'Net Revenue', format: (v) => v?.toFixed(2) || '0' },
          ];
          break;
        case 'users':
          filename = 'users-report';
          columns = [
            { key: 'email', header: 'Email' },
            { key: 'full_name', header: 'Name' },
            { key: 'role', header: 'Role' },
            { key: 'created_at', header: 'Joined', format: (v) => new Date(v).toISOString().split('T')[0] },
            { key: 'last_sign_in_at', header: 'Last Active', format: (v) => v ? new Date(v).toISOString().split('T')[0] : 'Never' },
          ];
          break;
        case 'restaurants':
          filename = 'restaurants-report';
          columns = [
            { key: 'name', header: 'Restaurant' },
            { key: 'city', header: 'City' },
            { key: 'cuisine_type', header: 'Cuisine' },
            { key: 'rating', header: 'Rating', format: (v) => v?.toFixed(1) || '-' },
            { key: 'total_orders', header: 'Orders' },
            { key: 'total_revenue', header: 'Revenue', format: (v) => v?.toFixed(2) || '0' },
            { key: 'is_active', header: 'Status', format: (v) => v ? 'Active' : 'Inactive' },
          ];
          break;
        case 'custom':
          if (customConfig) {
            filename = customConfig.title.toLowerCase().replace(/\s+/g, '-');
            columns = customConfig.columns;
          }
          break;
      }

      if (columns.length > 0) {
        exportToCSV(filename, data, columns);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || data.length === 0} className="gap-2">
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
          <Table2 className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
