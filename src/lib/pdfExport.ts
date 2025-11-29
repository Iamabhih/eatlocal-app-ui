// PDF Export Utility
// Uses browser's print functionality for PDF generation (no external dependencies)

interface PDFReportOptions {
  title: string;
  subtitle?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  generatedBy?: string;
  companyName?: string;
}

interface TableColumn {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

interface SummaryItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

// Format currency
function formatCurrency(amount: number): string {
  return `R${amount.toFixed(2)}`;
}

// Format date
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Generate PDF-ready HTML
export function generatePDFHTML(
  options: PDFReportOptions,
  summary: SummaryItem[],
  tableData: any[],
  columns: TableColumn[]
): string {
  const {
    title,
    subtitle,
    dateRange,
    generatedBy = 'System',
    companyName = 'EatLocal',
  } = options;

  const dateRangeText = dateRange
    ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
    : 'All Time';

  const currentDate = formatDate(new Date());

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #333;
          padding: 40px;
        }

        @media print {
          body {
            padding: 20px;
          }

          @page {
            margin: 15mm;
          }
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #4f46e5;
        }

        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #4f46e5;
        }

        .report-info {
          text-align: right;
        }

        .report-info h1 {
          font-size: 20px;
          margin-bottom: 4px;
        }

        .report-info p {
          font-size: 11px;
          color: #666;
        }

        .meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          font-size: 11px;
          color: #666;
        }

        .summary-section {
          margin-bottom: 30px;
        }

        .summary-section h2 {
          font-size: 14px;
          margin-bottom: 15px;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }

        .summary-item {
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .summary-item.highlight {
          background: #4f46e5;
          color: white;
        }

        .summary-item label {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          opacity: 0.8;
          margin-bottom: 4px;
        }

        .summary-item .value {
          font-size: 20px;
          font-weight: bold;
        }

        .table-section {
          margin-bottom: 30px;
        }

        .table-section h2 {
          font-size: 14px;
          margin-bottom: 15px;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        th {
          background: #f3f4f6;
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        td {
          padding: 10px 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        tr:nth-child(even) {
          background: #f9fafb;
        }

        .text-right {
          text-align: right;
        }

        .text-center {
          text-align: center;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 10px;
          color: #666;
          text-align: center;
        }

        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${companyName}</div>
        <div class="report-info">
          <h1>${title}</h1>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
      </div>

      <div class="meta">
        <div>
          <strong>Period:</strong> ${dateRangeText}
        </div>
        <div>
          <strong>Generated:</strong> ${currentDate} by ${generatedBy}
        </div>
      </div>

      ${summary.length > 0 ? `
        <div class="summary-section">
          <h2>Summary</h2>
          <div class="summary-grid">
            ${summary.map(item => `
              <div class="summary-item ${item.highlight ? 'highlight' : ''}">
                <label>${item.label}</label>
                <div class="value">${item.value}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${tableData.length > 0 ? `
        <div class="table-section">
          <h2>Details</h2>
          <table>
            <thead>
              <tr>
                ${columns.map(col => `
                  <th style="${col.width ? `width: ${col.width}` : ''}" class="${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}">
                    ${col.header}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableData.map(row => `
                <tr>
                  ${columns.map(col => `
                    <td class="${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}">
                      ${col.format ? col.format(row[col.key]) : row[col.key] || '-'}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <p>This report was automatically generated by ${companyName} Platform</p>
        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

// Export report as PDF using browser print
export function exportToPDF(
  options: PDFReportOptions,
  summary: SummaryItem[],
  tableData: any[],
  columns: TableColumn[]
): void {
  const html = generatePDFHTML(options, summary, tableData, columns);

  // Open new window with report
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // printWindow.close(); // Uncomment to auto-close after print dialog
    }, 250);
  };
}

// Pre-configured export functions for common reports

export function exportOrdersReport(
  orders: any[],
  dateRange?: { from: Date; to: Date },
  generatedBy?: string
): void {
  const summary: SummaryItem[] = [
    { label: 'Total Orders', value: orders.length, highlight: true },
    { label: 'Total Revenue', value: formatCurrency(orders.reduce((sum, o) => sum + (o.total || 0), 0)) },
    { label: 'Avg Order Value', value: formatCurrency(orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length : 0) },
    { label: 'Completed', value: orders.filter(o => o.status === 'delivered' || o.status === 'completed').length },
    { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
  ];

  const columns: TableColumn[] = [
    { key: 'order_number', header: 'Order #', width: '15%' },
    { key: 'customer_name', header: 'Customer', width: '20%' },
    { key: 'restaurant_name', header: 'Restaurant', width: '20%' },
    { key: 'status', header: 'Status', width: '15%', align: 'center' },
    { key: 'total', header: 'Total', width: '15%', align: 'right', format: (v) => formatCurrency(v || 0) },
    { key: 'created_at', header: 'Date', width: '15%', format: (v) => new Date(v).toLocaleDateString('en-ZA') },
  ];

  exportToPDF(
    {
      title: 'Orders Report',
      subtitle: 'Complete Order Summary',
      dateRange,
      generatedBy,
    },
    summary,
    orders,
    columns
  );
}

export function exportRevenueReport(
  data: any[],
  dateRange?: { from: Date; to: Date },
  generatedBy?: string
): void {
  const totalRevenue = data.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const totalOrders = data.reduce((sum, d) => sum + (d.order_count || 0), 0);

  const summary: SummaryItem[] = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), highlight: true },
    { label: 'Total Orders', value: totalOrders },
    { label: 'Avg Daily Revenue', value: formatCurrency(data.length > 0 ? totalRevenue / data.length : 0) },
    { label: 'Reporting Days', value: data.length },
  ];

  const columns: TableColumn[] = [
    { key: 'date', header: 'Date', width: '25%', format: (v) => new Date(v).toLocaleDateString('en-ZA') },
    { key: 'order_count', header: 'Orders', width: '20%', align: 'center' },
    { key: 'revenue', header: 'Revenue', width: '25%', align: 'right', format: (v) => formatCurrency(v || 0) },
    { key: 'commission', header: 'Commission', width: '15%', align: 'right', format: (v) => formatCurrency(v || 0) },
    { key: 'net_revenue', header: 'Net', width: '15%', align: 'right', format: (v) => formatCurrency(v || 0) },
  ];

  exportToPDF(
    {
      title: 'Revenue Report',
      subtitle: 'Financial Summary',
      dateRange,
      generatedBy,
    },
    summary,
    data,
    columns
  );
}

export function exportUsersReport(
  users: any[],
  generatedBy?: string
): void {
  const summary: SummaryItem[] = [
    { label: 'Total Users', value: users.length, highlight: true },
    { label: 'Customers', value: users.filter(u => u.role === 'customer').length },
    { label: 'Restaurants', value: users.filter(u => u.role === 'restaurant').length },
    { label: 'Delivery Partners', value: users.filter(u => u.role === 'delivery_partner').length },
    { label: 'Active Today', value: users.filter(u => {
      const lastActive = new Date(u.last_sign_in_at);
      const today = new Date();
      return lastActive.toDateString() === today.toDateString();
    }).length },
  ];

  const columns: TableColumn[] = [
    { key: 'email', header: 'Email', width: '30%' },
    { key: 'full_name', header: 'Name', width: '20%' },
    { key: 'role', header: 'Role', width: '15%', align: 'center' },
    { key: 'created_at', header: 'Joined', width: '15%', format: (v) => new Date(v).toLocaleDateString('en-ZA') },
    { key: 'last_sign_in_at', header: 'Last Active', width: '20%', format: (v) => v ? new Date(v).toLocaleDateString('en-ZA') : 'Never' },
  ];

  exportToPDF(
    {
      title: 'Users Report',
      subtitle: 'Platform User Overview',
      generatedBy,
    },
    summary,
    users,
    columns
  );
}

export function exportRestaurantsReport(
  restaurants: any[],
  generatedBy?: string
): void {
  const summary: SummaryItem[] = [
    { label: 'Total Restaurants', value: restaurants.length, highlight: true },
    { label: 'Active', value: restaurants.filter(r => r.is_active).length },
    { label: 'Currently Open', value: restaurants.filter(r => r.is_open).length },
    { label: 'Avg Rating', value: (restaurants.reduce((sum, r) => sum + (r.rating || 0), 0) / restaurants.length || 0).toFixed(1) },
  ];

  const columns: TableColumn[] = [
    { key: 'name', header: 'Restaurant', width: '25%' },
    { key: 'city', header: 'City', width: '15%' },
    { key: 'cuisine_type', header: 'Cuisine', width: '15%' },
    { key: 'rating', header: 'Rating', width: '10%', align: 'center', format: (v) => v ? `${v.toFixed(1)}` : '-' },
    { key: 'total_orders', header: 'Orders', width: '10%', align: 'center' },
    { key: 'total_revenue', header: 'Revenue', width: '15%', align: 'right', format: (v) => formatCurrency(v || 0) },
    { key: 'is_active', header: 'Status', width: '10%', align: 'center', format: (v) => v ? 'Active' : 'Inactive' },
  ];

  exportToPDF(
    {
      title: 'Restaurants Report',
      subtitle: 'Partner Restaurant Overview',
      generatedBy,
    },
    summary,
    restaurants,
    columns
  );
}

// CSV Export utility (alternative to PDF)
export function exportToCSV(
  filename: string,
  data: any[],
  columns: TableColumn[]
): void {
  const headers = columns.map(col => col.header).join(',');
  const rows = data.map(row =>
    columns.map(col => {
      let value = col.format ? col.format(row[col.key]) : row[col.key];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
