import { Report, IReport } from '../models/Report';
import Booking from '../models/Booking';
import Quote from '../models/Quote';
import Contact from '../models/Contact';
import User from '../models/User';
import ActivityLog from '../models/ActivityLog';
import mongoose from 'mongoose';

interface ReportFilters {
  startDate: Date;
  endDate: Date;
  status?: string;
  userId?: string;
  productCategory?: string;
  [key: string]: any;
}

class ReportService {
  // User Activity Report
  async generateUserActivityReport(filters: ReportFilters, generatedBy: string) {
    const { startDate, endDate, userId } = filters;

    const query: any = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (userId) {
      query.user = new mongoose.Types.ObjectId(userId);
    }

    const activities = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary statistics
    const totalActivities = activities.length;
    const activityByType = activities.reduce((acc: any, activity) => {
      acc[activity.resourceType] = (acc[activity.resourceType] || 0) + 1;
      return acc;
    }, {});

    const uniqueUsers = new Set(activities.map((a) => a.user.toString())).size;

    const mostActiveUsers = await ActivityLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          userName: { $first: '$userName' },
          userEmail: { $first: '$userEmail' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const summary = {
      totalRecords: totalActivities,
      keyMetrics: {
        uniqueUsers,
        activityByType,
        mostActiveUsers,
      },
    };

    const report = await Report.create({
      reportType: 'user_activity',
      title: `User Activity Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
      generatedBy: new mongoose.Types.ObjectId(generatedBy),
      dateRange: { startDate, endDate },
      filters,
      data: activities,
      summary,
    });

    return report;
  }

  // Sales/Booking Report
  async generateSalesBookingReport(filters: ReportFilters, generatedBy: string) {
    const { startDate, endDate, status } = filters;

    const query: any = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email company')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary statistics
    const totalBookings = bookings.length;
    const bookingsByStatus = bookings.reduce((acc: any, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    const bookingsByProduct = bookings.reduce((acc: any, booking) => {
      acc[booking.product] = (acc[booking.product] || 0) + 1;
      return acc;
    }, {});

    const topProducts = Object.entries(bookingsByProduct)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
      .map(([product, count]) => ({ product, count }));

    const conversionRate =
      totalBookings > 0
        ? ((bookingsByStatus.completed || 0) / totalBookings) * 100
        : 0;

    const summary = {
      totalRecords: totalBookings,
      keyMetrics: {
        bookingsByStatus,
        topProducts,
        conversionRate: conversionRate.toFixed(2) + '%',
        totalCompleted: bookingsByStatus.completed || 0,
        totalPending: bookingsByStatus.pending || 0,
        totalCancelled: bookingsByStatus.cancelled || 0,
      },
    };

    const report = await Report.create({
      reportType: 'sales_booking',
      title: `Sales & Booking Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
      generatedBy: new mongoose.Types.ObjectId(generatedBy),
      dateRange: { startDate, endDate },
      filters,
      data: bookings,
      summary,
    });

    return report;
  }

  // Product Performance Report
  async generateProductPerformanceReport(filters: ReportFilters, generatedBy: string) {
    const { startDate, endDate } = filters;

    const query: any = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Get booking data
    const bookings = await Booking.find(query).lean();

    // Get quote data
    const quotes = await Quote.find(query).lean();

    // Aggregate product data from bookings
    const productBookings = bookings.reduce((acc: any, booking) => {
      if (!acc[booking.product]) {
        acc[booking.product] = {
          name: booking.product,
          bookings: 0,
          completed: 0,
          cancelled: 0,
        };
      }
      acc[booking.product].bookings++;
      if (booking.status === 'completed') acc[booking.product].completed++;
      if (booking.status === 'cancelled') acc[booking.product].cancelled++;
      return acc;
    }, {});

    // Aggregate product data from quotes
    const productQuotes: any = {};
    quotes.forEach((quote) => {
      quote.items.forEach((item) => {
        if (!productQuotes[item.productName]) {
          productQuotes[item.productName] = {
            name: item.productName,
            category: item.category,
            totalQuantity: 0,
            totalValue: 0,
            quotes: 0,
          };
        }
        productQuotes[item.productName].totalQuantity += item.quantity;
        productQuotes[item.productName].totalValue += item.estimatedPrice * item.quantity;
        productQuotes[item.productName].quotes++;
      });
    });

    // Combine data
    const productPerformance = Object.keys({ ...productBookings, ...productQuotes }).map(
      (productName) => ({
        product: productName,
        bookings: productBookings[productName]?.bookings || 0,
        completed: productBookings[productName]?.completed || 0,
        cancelled: productBookings[productName]?.cancelled || 0,
        quoteRequests: productQuotes[productName]?.quotes || 0,
        totalQuantityQuoted: productQuotes[productName]?.totalQuantity || 0,
        totalValueQuoted: productQuotes[productName]?.totalValue || 0,
        category: productQuotes[productName]?.category || 'N/A',
      })
    );

    // Sort by total activity
    productPerformance.sort(
      (a, b) => b.bookings + b.quoteRequests - (a.bookings + a.quoteRequests)
    );

    const topPerformers = productPerformance.slice(0, 10);

    const summary = {
      totalRecords: productPerformance.length,
      keyMetrics: {
        totalProducts: productPerformance.length,
        topPerformers,
        totalBookings: bookings.length,
        totalQuotes: quotes.length,
      },
    };

    const report = await Report.create({
      reportType: 'product_performance',
      title: `Product Performance Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
      generatedBy: new mongoose.Types.ObjectId(generatedBy),
      dateRange: { startDate, endDate },
      filters,
      data: productPerformance,
      summary,
    });

    return report;
  }

  // Quote Request Report
  async generateQuoteRequestReport(filters: ReportFilters, generatedBy: string) {
    const { startDate, endDate, status } = filters;

    const query: any = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const quotes = await Quote.find(query)
      .populate('userId', 'name email company')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary statistics
    const totalQuotes = quotes.length;
    const quotesByStatus = quotes.reduce((acc: any, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1;
      return acc;
    }, {});

    const totalValue = quotes.reduce((sum, quote) => sum + quote.totalEstimatedPrice, 0);
    const averageValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;

    const topCustomers = await Quote.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$customerEmail',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalEstimatedPrice' },
          customerName: { $first: '$customerName' },
          company: { $first: '$company' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const summary = {
      totalRecords: totalQuotes,
      keyMetrics: {
        quotesByStatus,
        totalValue,
        averageValue,
        topCustomers,
        acceptanceRate: totalQuotes > 0
          ? ((quotesByStatus.accepted || 0) / totalQuotes * 100).toFixed(2) + '%'
          : '0%',
      },
    };

    const report = await Report.create({
      reportType: 'quote_request',
      title: `Quote Request Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
      generatedBy: new mongoose.Types.ObjectId(generatedBy),
      dateRange: { startDate, endDate },
      filters,
      data: quotes,
      summary,
    });

    return report;
  }

  // Contact Form Report
  async generateContactFormReport(filters: ReportFilters, generatedBy: string) {
    const { startDate, endDate, status } = filters;

    const query: any = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const contacts = await Contact.find(query).sort({ createdAt: -1 }).lean();

    // Calculate summary statistics
    const totalContacts = contacts.length;
    const contactsByStatus = contacts.reduce((acc: any, contact) => {
      acc[contact.status] = (acc[contact.status] || 0) + 1;
      return acc;
    }, {});

    const responseRate =
      totalContacts > 0
        ? ((contactsByStatus.responded || 0) / totalContacts) * 100
        : 0;

    const contactsBySubject = contacts.reduce((acc: any, contact) => {
      acc[contact.subject] = (acc[contact.subject] || 0) + 1;
      return acc;
    }, {});

    const topSubjects = Object.entries(contactsBySubject)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
      .map(([subject, count]) => ({ subject, count }));

    const summary = {
      totalRecords: totalContacts,
      keyMetrics: {
        contactsByStatus,
        responseRate: responseRate.toFixed(2) + '%',
        topSubjects,
        totalNew: contactsByStatus.new || 0,
        totalResponded: contactsByStatus.responded || 0,
      },
    };

    const report = await Report.create({
      reportType: 'contact_form',
      title: `Contact Form Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
      generatedBy: new mongoose.Types.ObjectId(generatedBy),
      dateRange: { startDate, endDate },
      filters,
      data: contacts,
      summary,
    });

    return report;
  }

  // Get all reports
  async getAllReports(userId?: string) {
    const query: any = {};
    if (userId) {
      query.generatedBy = new mongoose.Types.ObjectId(userId);
    }

    const reports = await Report.find(query)
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 })
      .select('-data') // Exclude large data field from list view
      .lean();

    return reports;
  }

  // Get report by ID
  async getReportById(reportId: string) {
    const report = await Report.findById(reportId)
      .populate('generatedBy', 'name email')
      .lean();

    return report;
  }

  // Delete report
  async deleteReport(reportId: string) {
    const report = await Report.findByIdAndDelete(reportId);
    return report;
  }
}

export default new ReportService();
