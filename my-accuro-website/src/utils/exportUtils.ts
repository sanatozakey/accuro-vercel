// Export utilities for CSV and Excel data export

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: any, row: T) => string;
}

// Convert data to CSV format
export function toCSV<T>(data: T[], columns: ExportColumn<T>[]): string {
  const headers = columns.map((col) => `"${col.header}"`).join(',');

  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const keys = (col.key as string).split('.');
        let value: any = row;
        for (const k of keys) {
          value = value?.[k];
        }

        if (col.formatter) {
          value = col.formatter(value, row);
        }

        // Escape quotes and wrap in quotes
        if (value === null || value === undefined) return '""';
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(',');
  });

  return [headers, ...rows].join('\n');
}

// Download CSV file
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Convert data to Excel-compatible format (CSV with special handling)
export function toExcel<T>(data: T[], columns: ExportColumn<T>[]): string {
  // Excel CSV is similar to regular CSV but with BOM for proper encoding
  return toCSV(data, columns);
}

// Download Excel file (as CSV that Excel can open)
export function downloadExcel(csv: string, filename: string): void {
  const blob = new Blob(['\ufeff' + csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export configuration presets for common data types
export const exportPresets = {
  users: [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
    { key: 'phone', header: 'Phone' },
    { key: 'company', header: 'Company' },
    { key: 'isEmailVerified', header: 'Email Verified', formatter: (v: boolean) => v ? 'Yes' : 'No' },
    { key: 'loginCount', header: 'Login Count' },
    { key: 'lastLoginAt', header: 'Last Login', formatter: (v: string) => v ? new Date(v).toLocaleString() : 'Never' },
    { key: 'createdAt', header: 'Created', formatter: (v: string) => new Date(v).toLocaleString() },
  ],

  bookings: [
    { key: 'bookingNumber', header: 'Booking #' },
    { key: 'name', header: 'Customer Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'product', header: 'Product' },
    { key: 'status', header: 'Status' },
    { key: 'preferredDate', header: 'Preferred Date', formatter: (v: string) => v ? new Date(v).toLocaleDateString() : '' },
    { key: 'createdAt', header: 'Created', formatter: (v: string) => new Date(v).toLocaleString() },
    { key: 'notes', header: 'Notes' },
  ],

  quotes: [
    { key: 'quoteNumber', header: 'Quote #' },
    { key: 'customerName', header: 'Customer Name' },
    { key: 'customerEmail', header: 'Email' },
    { key: 'customerPhone', header: 'Phone' },
    { key: 'status', header: 'Status' },
    { key: 'totalEstimatedPrice', header: 'Estimated Total', formatter: (v: number) => `PHP ${v?.toLocaleString() || 0}` },
    { key: 'createdAt', header: 'Created', formatter: (v: string) => new Date(v).toLocaleString() },
  ],

  reviews: [
    { key: 'name', header: 'Reviewer' },
    { key: 'email', header: 'Email' },
    { key: 'rating', header: 'Rating' },
    { key: 'comment', header: 'Comment' },
    { key: 'isApproved', header: 'Approved', formatter: (v: boolean) => v ? 'Yes' : 'No' },
    { key: 'createdAt', header: 'Created', formatter: (v: string) => new Date(v).toLocaleString() },
  ],

  contacts: [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'subject', header: 'Subject' },
    { key: 'message', header: 'Message' },
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Created', formatter: (v: string) => new Date(v).toLocaleString() },
  ],

  activityLogs: [
    { key: 'userName', header: 'User' },
    { key: 'userEmail', header: 'Email' },
    { key: 'action', header: 'Action' },
    { key: 'resourceType', header: 'Resource Type' },
    { key: 'details', header: 'Details' },
    { key: 'ipAddress', header: 'IP Address' },
    { key: 'createdAt', header: 'Date', formatter: (v: string) => new Date(v).toLocaleString() },
  ],
};

// Helper to format date for filename
export function getExportFilename(prefix: string, format: 'csv' | 'xlsx' = 'csv'): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.${format}`;
}
