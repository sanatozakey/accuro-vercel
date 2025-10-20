import React, { useState } from 'react';
import { FileText, Download, Calendar, Loader } from 'lucide-react';
import bookingService from '../services/bookingService';
import userService from '../services/userService';
import quoteService from '../services/quoteService';
import contactService from '../services/contactService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'bookings' | 'users' | 'quotes' | 'contacts';

interface ReportData {
  type: ReportType;
  title: string;
  dateRange: { start: string; end: string };
  data: any[];
  summary: {
    totalRecords: number;
    [key: string]: any;
  };
}

export function SimpleReportsTab() {
  const [reportType, setReportType] = useState<ReportType>('bookings');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let data: any[] = [];
      let summary: any = { totalRecords: 0 };

      switch (reportType) {
        case 'bookings':
          const bookingsResponse = await bookingService.getAll({ startDate, endDate });
          data = bookingsResponse.data;
          summary = {
            totalRecords: data.length,
            pending: data.filter(b => b.status === 'pending').length,
            confirmed: data.filter(b => b.status === 'confirmed').length,
            completed: data.filter(b => b.status === 'completed').length,
            cancelled: data.filter(b => b.status === 'cancelled').length,
          };
          break;

        case 'users':
          const usersResponse = await userService.getAll();
          data = usersResponse.data;
          summary = {
            totalRecords: data.length,
            admins: data.filter(u => u.role === 'admin').length,
            users: data.filter(u => u.role === 'user').length,
          };
          break;

        case 'quotes':
          const quotesResponse = await quoteService.getAll();
          data = quotesResponse.data || [];
          summary = {
            totalRecords: data.length,
            pending: data.filter(q => q.status === 'pending').length,
            sent: data.filter(q => q.status === 'sent').length,
          };
          break;

        case 'contacts':
          const contactsResponse = await contactService.getAll();
          data = contactsResponse.data || [];
          summary = {
            totalRecords: data.length,
            pending: data.filter(c => c.status === 'pending').length,
            responded: data.filter(c => c.status === 'responded').length,
          };
          break;
      }

      setReportData({
        type: reportType,
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        dateRange: { start: startDate, end: endDate },
        data,
        summary,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.text(reportData.title, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      28,
      { align: 'center' }
    );
    doc.text(
      `Period: ${new Date(reportData.dateRange.start).toLocaleDateString()} - ${new Date(reportData.dateRange.end).toLocaleDateString()}`,
      pageWidth / 2,
      34,
      { align: 'center' }
    );

    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 14, 45);
    doc.setFontSize(10);
    let yPos = 52;
    Object.entries(reportData.summary).forEach(([key, value]) => {
      doc.text(
        `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`,
        14,
        yPos
      );
      yPos += 6;
    });

    // Table
    yPos += 5;
    const tableData = reportData.data.map((item) => {
      switch (reportData.type) {
        case 'bookings':
          return [
            new Date(item.date).toLocaleDateString(),
            item.company,
            item.contactName,
            item.product,
            item.status,
          ];
        case 'users':
          return [
            new Date(item.createdAt).toLocaleDateString(),
            item.name,
            item.email,
            item.role,
          ];
        case 'quotes':
          return [
            new Date(item.createdAt).toLocaleDateString(),
            item.userId?.name || 'N/A',
            item.userId?.email || 'N/A',
            item.status,
          ];
        case 'contacts':
          return [
            new Date(item.createdAt).toLocaleDateString(),
            `${item.firstName} ${item.lastName}`,
            item.email,
            item.subject,
            item.status,
          ];
        default:
          return [];
      }
    });

    const tableHeaders =
      reportData.type === 'bookings'
        ? ['Date', 'Company', 'Contact', 'Product', 'Status']
        : reportData.type === 'users'
        ? ['Joined', 'Name', 'Email', 'Role']
        : reportData.type === 'quotes'
        ? ['Date', 'Name', 'Email', 'Status']
        : ['Date', 'Name', 'Email', 'Subject', 'Status'];

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(
      `${reportData.type}-report-${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  return (
    <div className="space-y-6">
      {/* Generate Report Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Generate Report</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bookings">Bookings Report</option>
              <option value="users">Users Report</option>
              <option value="quotes">Quotes Report</option>
              <option value="contacts">Contacts Report</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{reportData.title}</h3>
              <p className="text-sm text-gray-600">
                {new Date(reportData.dateRange.start).toLocaleDateString()} -{' '}
                {new Date(reportData.dateRange.end).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={downloadPDF}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(reportData.summary).map(([key, value]) => (
              <div key={key} className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-2xl font-bold text-blue-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {reportData.type === 'bookings' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </>
                  )}
                  {reportData.type === 'users' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                    </>
                  )}
                  {reportData.type === 'quotes' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </>
                  )}
                  {reportData.type === 'contacts' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.data.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {reportData.type === 'bookings' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.company}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.contactName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.product}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </>
                    )}
                    {reportData.type === 'users' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">{item.role}</td>
                      </>
                    )}
                    {reportData.type === 'quotes' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.userId?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.userId?.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">{item.status}</td>
                      </>
                    )}
                    {reportData.type === 'contacts' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.firstName} {item.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.subject}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">{item.status}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reportData.data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No data found for the selected date range
            </div>
          )}
        </div>
      )}
    </div>
  );
}
