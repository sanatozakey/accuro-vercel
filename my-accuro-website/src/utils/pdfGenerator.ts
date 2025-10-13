import jsPDF from 'jspdf';

interface BookingReceiptData {
  bookingId: string;
  date: string;
  time: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  purpose: string;
  location: string;
  product: string;
  additionalInfo?: string;
  createdAt: string;
}

export const generateBookingReceipt = (data: BookingReceiptData) => {
  const doc = new jsPDF();

  // Set fonts
  doc.setFont('helvetica');

  // Add logo/header
  doc.setFontSize(24);
  doc.setTextColor(30, 58, 138); // Navy blue
  doc.text('ACCURO', 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Gray
  doc.text('Calibration Excellence', 20, 32);

  // Draw header line
  doc.setDrawColor(59, 130, 246); // Blue
  doc.setLineWidth(1);
  doc.line(20, 38, 190, 38);

  // Title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Meeting Request Receipt', 20, 50);

  // Receipt details
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Receipt Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 58);
  doc.text(`Booking ID: ${data.bookingId}`, 20, 64);

  // Meeting Information Section
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Meeting Information', 20, 78);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  let yPos = 88;
  const lineHeight = 6;

  // Meeting details
  doc.setFont('helvetica', 'bold');
  doc.text('Scheduled Date:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 65, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('Time:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.time, 65, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('Purpose:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.purpose, 65, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('Location:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.location, 65, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('Product/Service:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  const productText = doc.splitTextToSize(data.product, 120);
  doc.text(productText, 65, yPos);
  yPos += lineHeight * productText.length;

  yPos += 5; // Extra spacing

  // Contact Information Section
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Contact Information', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'bold');
  doc.text('Company:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.company, 65, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('Contact Person:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.contactName, 65, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('Email:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.contactEmail, 65, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'bold');
  doc.text('Phone:', 25, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.contactPhone, 65, yPos);
  yPos += lineHeight;

  yPos += 5; // Extra spacing

  // Additional Information Section
  if (data.additionalInfo && data.additionalInfo.trim()) {
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('Additional Information', 20, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    // Split text to fit page width
    const additionalText = doc.splitTextToSize(data.additionalInfo, 170);
    const maxLinesPerPage = 25; // Approximate lines that fit on a page

    additionalText.forEach((line: string, index: number) => {
      if (yPos > 270) { // If near bottom of page, add new page
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 25, yPos);
      yPos += 5;
    });

    yPos += 5; // Extra spacing
  }

  // Status Section
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  yPos += 5;
  doc.setFillColor(239, 246, 255); // Light blue background
  doc.rect(20, yPos - 5, 170, 18, 'F');

  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.text('Status: Pending Confirmation', 25, yPos + 2);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('You will receive a confirmation email with the meeting status within 24 hours.', 25, yPos + 9);

  // Footer
  yPos = 280;
  doc.setDrawColor(229, 231, 235); // Light gray
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Accuro - Calibration Excellence', 20, yPos + 5);
  doc.text('Email: info@accuro.com.ph | Phone: +63 9171507737', 20, yPos + 10);
  doc.text('This is an automated receipt. Please keep it for your records.', 20, yPos + 15);

  // Save the PDF
  const fileName = `Accuro-Meeting-Receipt-${data.bookingId}.pdf`;
  doc.save(fileName);

  return fileName;
};
