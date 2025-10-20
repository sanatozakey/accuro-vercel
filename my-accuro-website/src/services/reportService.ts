import api from './api';

export interface ReportFilters {
  startDate: string;
  endDate: string;
  status?: string;
  userId?: string;
  productCategory?: string;
}

export interface Report {
  _id: string;
  reportType: 'user_activity' | 'sales_booking' | 'product_performance' | 'quote_request' | 'contact_form' | 'custom';
  title: string;
  generatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters?: any;
  data: any[];
  summary: {
    totalRecords: number;
    keyMetrics: any;
  };
  createdAt: string;
  updatedAt: string;
}

class ReportService {
  // Generate User Activity Report
  async generateUserActivityReport(filters: ReportFilters) {
    const response = await api.post('/reports/user-activity', filters);
    return response.data;
  }

  // Generate Sales/Booking Report
  async generateSalesBookingReport(filters: ReportFilters) {
    const response = await api.post('/reports/sales-booking', filters);
    return response.data;
  }

  // Generate Product Performance Report
  async generateProductPerformanceReport(filters: ReportFilters) {
    const response = await api.post('/reports/product-performance', filters);
    return response.data;
  }

  // Generate Quote Request Report
  async generateQuoteRequestReport(filters: ReportFilters) {
    const response = await api.post('/reports/quote-request', filters);
    return response.data;
  }

  // Generate Contact Form Report
  async generateContactFormReport(filters: ReportFilters) {
    const response = await api.post('/reports/contact-form', filters);
    return response.data;
  }

  // Get all reports
  async getAllReports() {
    const response = await api.get('/reports');
    return response.data;
  }

  // Get report by ID
  async getReportById(reportId: string) {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  }

  // Delete report
  async deleteReport(reportId: string) {
    const response = await api.delete(`/reports/${reportId}`);
    return response.data;
  }

  // Export report to PDF
  async exportReportToPDF(reportId: string) {
    const response = await api.get(`/reports/${reportId}/export-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Helper to download PDF
  downloadPDF(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Download report as PDF
  async downloadReportPDF(reportId: string) {
    const blob = await this.exportReportToPDF(reportId);
    this.downloadPDF(blob, `report_${reportId}_${Date.now()}.pdf`);
  }
}

export default new ReportService();
