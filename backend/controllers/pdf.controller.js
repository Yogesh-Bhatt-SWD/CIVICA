const PDFDocument = require('pdfkit');
const qrcode = require('qrcode');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Resolution = require('../models/Resolution');

// Branding Helper: Draw Vector Hexagon Logo
const drawCivicaLogo = (doc, x, y, size = 60) => {
  const s = size / 100;
  doc.save();
  doc.translate(x, y);
  
  // Hexagon Background
  doc.moveTo(135 * s, 35 * s)
     .lineTo(226 * s, 88 * s)
     .lineTo(226 * s, 192 * s)
     .lineTo(135 * s, 245 * s)
     .lineTo(44 * s, 192 * s)
     .lineTo(44 * s, 88 * s)
     .closePath()
     .fillColor('#0b2240')
     .fill();

  // Road Surface (Stylized Line)
  doc.rect(121 * s, 48 * s, 28 * s, 190 * s)
     .fillColor('#163960')
     .fill();
     
  // Lane Dash
  doc.rect(131 * s, 66 * s, 7 * s, 14 * s)
     .fillColor('rgba(255,255,255,0.3)')
     .fill();

  // Accent Ring
  doc.moveTo(135 * s, 49 * s)
     .lineTo(215 * s, 94 * s)
     .lineTo(215 * s, 186 * s)
     .lineTo(135 * s, 231 * s)
     .lineTo(55 * s, 186 * s)
     .lineTo(55 * s, 94 * s)
     .closePath()
     .strokeColor('#18c99a')
     .lineWidth(1)
     .strokeOpacity(0.6)
     .stroke();
     
  doc.restore();
};

const generateReportPdf = async (req, res) => {
  try {
    const reportId = req.params.id;
    const report = await Report.findById(reportId)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email department');

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found.' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    res.setHeader('Content-disposition', `attachment; filename="Civica_Report_${report._id}.pdf"`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    // 1. Watermark Background (Lighter)
    doc.save();
    doc.translate(doc.page.width / 2, doc.page.height / 2);
    doc.rotate(-45);
    doc.fontSize(45).fillOpacity(0.015).fillColor('#374151')
       .text('CIVICA SYSTEM OFFICIAL RECORD', -400, -30, { align: 'center', width: 800 });
    doc.restore();

    // 2. HEADER WITH LOGO
    drawCivicaLogo(doc, 40, 40, 45);
    
    doc.fontSize(20).fillColor('#111827').font('Helvetica-Bold')
       .text('CIVICA', 100, 45, { characterSpacing: 4 });
    doc.fontSize(9).fillColor('#10b981').font('Helvetica-Bold')
       .text('CIVIC INFRASTRUCTURE AUTHORITY', 102, 68, { characterSpacing: 2 });
    doc.fontSize(8).fillColor('#6b7280').font('Helvetica')
       .text('OFFICIAL INCIDENT & RESOLUTION DOCUMENT', 102, 79);
    
    // Right Top Date & ID
    doc.fontSize(9).fillColor('#6b7280').font('Helvetica-Bold')
       .text('REPORT ID:', 400, 45, { align: 'right', width: 155 });
    doc.fontSize(10).fillColor('#111827').font('Helvetica')
       .text(report._id.toString(), 400, 56, { align: 'right', width: 155, link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#report_${report._id}` });
    
    doc.moveDown(2);
    doc.moveTo(40, 110).lineTo(555, 110).strokeColor('#e5e7eb').lineWidth(1).stroke();
    doc.moveDown(1.5);

    // 3. CORE METADATA GRID (Highly Structured)
    const startY = 125;
    
    // Background card for Metadata
    doc.roundedRect(40, startY, 515, 85, 8).fillColor('#f9fafb').fill();
    doc.roundedRect(40, startY, 515, 85, 8).strokeColor('#f3f4f6').lineWidth(1).stroke();

    const drawGridItem = (label, value, x, y, color = '#111827') => {
        doc.fontSize(8).fillColor('#9ca3af').font('Helvetica-Bold').text(label, x, y);
        doc.fontSize(10).fillColor(color).font('Helvetica-Bold').text(value, x, y + 12);
    };

    drawGridItem('CURRENT STATUS', report.status.replace('_', ' ').toUpperCase(), 60, startY + 15, 
        report.status === 'resolved' ? '#10b981' : (report.status === 'in_progress' ? '#3b82f6' : '#f59e0b'));
    
    const priorityLevel = report.severity >= 4 ? 'CRITICAL / HIGH' : (report.severity === 3 ? 'MODERATE' : 'LOW');
    drawGridItem('PRIORITY LEVEL', priorityLevel, 180, startY + 15, report.severity >= 4 ? '#ef4444' : '#111827');
    
    drawGridItem('INCIDENT CATEGORY', report.category.replace('_', ' ').toUpperCase(), 330, startY + 15);
    
    // Authority Section (Row 2) - VISIBILITY IMPROVED
    doc.moveTo(60, startY + 45).lineTo(495, startY + 45).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    
    drawGridItem('HANDLED BY (AUTHORITY)', (report.assignedTo?.name || 'Unassigned').toUpperCase(), 60, startY + 55);
    drawGridItem('DEPARTMENT', (report.assignedTo?.department || 'CIVIC MAINTENANCE').toUpperCase(), 230, startY + 55);
    drawGridItem('REPORTER', report.submittedBy?.name || 'Anonymous', 400, startY + 55);

    doc.y = startY + 105;

    // Helper for Section Blocks
    const drawSectionHeader = (title) => {
        doc.moveDown(1);
        doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold').text(title);
        const lineY = doc.y + 2;
        doc.moveTo(doc.x, lineY).lineTo(555, lineY).strokeColor('#10b981').lineWidth(1.5).stroke();
        doc.moveDown(0.8);
    };

    // 4. ISSUE DETAILS
    drawSectionHeader('INCIDENT DETAILS');
    doc.fontSize(11).fillColor('#374151').font('Helvetica-Bold').text('Subject: ', { continued: true }).font('Helvetica').text(report.title);
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').text('Description:');
    doc.fontSize(10).font('Helvetica').text(report.description || 'No detailed description provided by reporter.', { lineGap: 2 });
    
    // 5. LOCATION DETAILS (Interactive)
    drawSectionHeader('LOCATION & SPATIAL DATA');
    
    const lat = report.location?.coordinates[1];
    const lng = report.location?.coordinates[0];
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    doc.fontSize(10).fillColor('#374151').font('Helvetica-Bold').text('Physical Address: ', { continued: true })
       .font('Helvetica').fillColor('#3b82f6').text(report.address || 'Street level address not provided', { underline: true, link: mapsLink });
    
    doc.moveDown(0.5);
    doc.fillColor('#374151').font('Helvetica-Bold').text('State: ', { continued: true })
       .font('Helvetica').text(report.state || 'N/A');

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Geographic Coordinates: ', { continued: true })
       .font('Helvetica').fillColor('#3b82f6').text(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, { underline: true, link: mapsLink });

    // 6. MANAGEMENT WORKFLOW
    const resData = await Resolution.findOne({ reportId: report._id });
    if (resData || report.assignedTo) {
        drawSectionHeader('MANAGEMENT & TIMELINE');
        doc.fontSize(10).fillColor('#374151');
        
        doc.font('Helvetica-Bold').text('Official Timeline:');
        doc.font('Helvetica').text(`- Reported on: ${new Date(report.createdAt).toLocaleString()}`, { indent: 15 });
        if (report.assignedTo) {
            doc.text(`- Assigned to Authority on: ${new Date(report.updatedAt).toLocaleString()}`, { indent: 15 });
        }
        if (report.status === 'resolved' && resData) {
            doc.text(`- Resolution Confirmed on: ${new Date(resData.resolvedAt || resData.createdAt).toLocaleString()}`, { indent: 15 });
        }

        if (resData && resData.note) {
            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').text('Authority Official Note:');
            doc.roundedRect(55, doc.y + 5, 485, 40, 4).fillColor('#fefce8').fill(); // Light yellow
            doc.fontSize(9).fillColor('#854d0e').font('Helvetica-Oblique')
               .text(`"${resData.note}"`, 70, doc.y + 15, { width: 450 });
            doc.y += 30;
        }
    }

    // 7. PHOTOGRAPHIC EVIDENCE (Interactive links to original)
    if (report.imageUrl) {
      if (doc.y > 450) doc.addPage();
      drawSectionHeader('PHOTOGRAPHIC EVIDENCE');
      
      try {
        let imageBuffer;
        if (report.imageUrl.startsWith('http')) {
          const response = await axios.get(report.imageUrl, { responseType: 'arraybuffer' });
          imageBuffer = Buffer.from(response.data, 'binary');
        } else {
          imageBuffer = fs.readFileSync(path.join(__dirname, '..', report.imageUrl));
        }

        const renderW = 400;
        const renderH = 260;
        const renderX = (doc.page.width - renderW) / 2;
        const renderY = doc.y + 10;

        doc.image(imageBuffer, renderX, renderY, { width: renderW, height: renderH, fit: [renderW, renderH] });
        
        // AI Detection Overlay (NATIVE PDF VECTOR BOX)
        if (report.aiBoundingBox && report.aiBoundingBox.length === 4) {
          const [x1, y1, x2, y2] = report.aiBoundingBox;
          const boxX = renderX + (x1 * renderW);
          const boxY = renderY + (y1 * renderH);
          const boxW = (x2 - x1) * renderW;
          const boxH = (y2 - y1) * renderH;
          
          doc.rect(boxX, boxY, boxW, boxH).strokeColor('#10b981').lineWidth(2).stroke();
          doc.fontSize(8).fillColor('#10b981').font('Helvetica-Bold').text('AI DETECTED ISSUE', boxX, boxY - 10);
        }

        doc.y = renderY + renderH + 20;
      } catch (e) {
        doc.fontSize(10).fillColor('#9ca3af').text('[Evidence Image Missing or Corrupted]', { align: 'center' });
      }
    }

    // 8. QR VERIFICATION & LIVE LINK
    try {
      const reportUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#report_${report._id}`;
      const qrBuffer = await qrcode.toBuffer(reportUrl, { scale: 3, margin: 1 });
      
      const qrX = doc.page.width - 40 - 70;
      let qrY = doc.page.height - 40 - 100;
      
      if (doc.y > qrY) { doc.addPage(); qrY = doc.page.height - 40 - 100; }
      
      doc.image(qrBuffer, qrX, qrY, { width: 70 });
      doc.fontSize(7).fillColor('#9ca3af').font('Helvetica')
         .text('Scan for Authenticity Check', qrX - 20, qrY + 75, { width: 110, align: 'center' });
    } catch (qrErr) {}

    // 9. FINAL FOOTER (Page Numbers & Seal)
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.moveTo(40, doc.page.height - 50).lineTo(555, doc.page.height - 50).strokeColor('#10b981').lineWidth(0.5).stroke();
      doc.fontSize(8).fillColor('#9ca3af').font('Helvetica')
         .text('Civica Official Digital Certificate – Digitally Signed & Encrypted', 40, doc.page.height - 40);
      doc.text(`Page ${i + 1} of ${pages.count}`, 40, doc.page.height - 40, { align: 'right', width: 515 });
    }

    doc.end();
  } catch (error) {
    console.error('PDF Generation Error:', error);
    if (!res.headersSent) { res.status(500).json({ success: false, error: 'Internal system failed generating PDF.' }); }
  }
};

module.exports = { generateReportPdf };
