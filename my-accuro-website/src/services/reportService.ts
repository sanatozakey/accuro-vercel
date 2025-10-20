import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  // Generate User Activity Report
  async generateUserActivityReport(filters: ReportFilters) {
    const response = await axios.post(
      `${API_URL}/reports/user-activity`,
      filters,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Generate Sales/Booking Report
  async generateSalesBookingReport(filters: ReportFilters) {
    const response = await axios.post(
      `${API_URL}/reports/sales-booking`,
      filters,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Generate Product Performance Report
  async generateProductPerformanceReport(filters: ReportFilters) {
    const response = await axios.post(
      `${API_URL}/reports/product-performance`,
      filters,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Generate Quote Request Report
  async generateQuoteRequestReport(filters: ReportFilters) {
    const response = await axios.post(
      `${API_URL}/reports/quote-request`,
      filters,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Generate Contact Form Report
  async generateContactFormReport(filters: ReportFilters) {
    const response = await axios.post(
      `${API_URL}/reports/contact-form`,
      filters,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Get all reports
  async getAllReports() {
    const response = await axios.get(`${API_URL}/reports`, this.getAuthHeader());
    return response.data;
  }

  // Get report by ID
  async getReportById(reportId: string) {
    const response = await axios.get(
      `${API_URL}/reports/${reportId}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Delete report
  async deleteReport(reportId: string) {
    const response = await axios.delete(
      `${API_URL}/reports/${reportId}`,
      this.getAuthHeader()
    );
    return response.data;
  }

  // Export report to PDF
  async exportReportToPDF(reportId: string) {
    const response = await axios.get(
      `${API_URL}/reports/${reportId}/export-pdf`,
      {
        ...this.getAuthHeader(),
        responseType: 'blob',
      }
    );
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
}

export default new ReportService();
