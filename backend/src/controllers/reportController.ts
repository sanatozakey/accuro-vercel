import { Request, Response } from 'express';
import reportService from '../services/reportService';
import { jsPDF } from 'jspdf';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

class ReportController {
  // Generate User Activity Report
  async generateUserActivityReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, userId } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }

      const filters = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId,
      };

      const report = await reportService.generateUserActivityReport(
        filters,
        req.user!.userId
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating user activity report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate user activity report',
      });
    }
  }

  // Generate Sales/Booking Report
  async generateSalesBookingReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, status } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }

      const filters = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
      };

      const report = await reportService.generateSalesBookingReport(
        filters,
        req.user!.userId
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating sales/booking report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate sales/booking report',
      });
    }
  }

  // Generate Product Performance Report
  async generateProductPerformanceReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }

      const filters = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };

      const report = await reportService.generateProductPerformanceReport(
        filters,
        req.user!.userId
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating product performance report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate product performance report',
      });
    }
  }

  // Generate Quote Request Report
  async generateQuoteRequestReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, status } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }

      const filters = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
      };

      const report = await reportService.generateQuoteRequestReport(
        filters,
        req.user!.userId
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating quote request report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate quote request report',
      });
    }
  }

  // Generate Contact Form Report
  async generateContactFormReport(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, status } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }

      const filters = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
      };

      const report = await reportService.generateContactFormReport(
        filters,
        req.user!.userId
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating contact form report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate contact form report',
      });
    }
  }

  // Get all reports
  async getAllReports(req: AuthRequest, res: Response) {
    try {
      const reports = await reportService.getAllReports();

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch reports',
      });
    }
  }

  // Get report by ID
  async getReportById(req: AuthRequest, res: Response) {
    try {
      const { reportId } = req.params;

      const report = await reportService.getReportById(reportId);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error fetching report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch report',
      });
    }
  }

  // Delete report
  async deleteReport(req: AuthRequest, res: Response) {
    try {
      const { reportId } = req.params;

      const report = await reportService.deleteReport(reportId);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete report',
      });
    }
  }

  // Export report to PDF
  async exportReportToPDF(req: AuthRequest, res: Response) {
    try {
      const { reportId } = req.params;

      const report = await reportService.getReportById(reportId);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      // Create PDF using jsPDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Add company branding/logo placeholder
      doc.setFontSize(24);
      doc.setTextColor(31, 41, 55); // Navy color
      doc.text('ACCURO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Add report title
      doc.setFontSize(18);
      doc.text(report.title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Add date range
      doc.setFontSize(12);
      doc.setTextColor(75, 85, 99);
      doc.text(
        `Period: ${new Date(report.dateRange.startDate).toLocaleDateString()} - ${new Date(
          report.dateRange.endDate
        ).toLocaleDateString()}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 10;

      // Add generation info
      doc.setFontSize(10);
      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 5;
      doc.text(
        `Generated by: ${(report.generatedBy as any)?.name || 'Admin'}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 15;

      // Add summary section
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('Summary', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setTextColor(75, 85, 99);
      doc.text(`Total Records: ${report.summary.totalRecords}`, 20, yPosition);
      yPosition += 8;

      // Add key metrics
      if (report.summary.keyMetrics) {
        for (const [key, value] of Object.entries(report.summary.keyMetrics)) {
          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
          ) {
            const metricText = `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}`;
            doc.text(metricText, 20, yPosition);
            yPosition += 6;

            // Add new page if needed
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
          }
        }
      }

      yPosition += 10;

      // Add footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          'Confidential - For Internal Use Only',
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      // Convert to buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${report.reportType}_${Date.now()}.pdf"`
      );

      // Send PDF
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error exporting report to PDF:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export report to PDF',
      });
    }
  }
}

export default new ReportController();
