import { DailyLogState, PhotoLogEntry, WeatherReport } from '../types';

// Declare jsPDF from window since it is loaded from CDN.
declare const jspdf: any;

// --- Professional Design Constants ---
const COLORS = {
  PRIMARY: '#2563eb', // A professional blue
  PRIMARY_LIGHT: '#dbeafe', // light blue for backgrounds
  TEXT_DARK: '#1e293b', // slate-800
  TEXT_NORMAL: '#334155', // slate-700
  TEXT_LIGHT: '#64748b', // slate-500
  BORDER: '#e2e8f0', // slate-200
  HEADER_BG: '#f8fafc', // slate-50
};

const FONTS = {
  SIZE_H1: 22,
  SIZE_H2: 14,
  SIZE_BODY: 10,
  SIZE_SMALL: 8,
};

const MARGIN = 15;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const addFooters = (doc: any, data: DailyLogState) => {
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.TEXT_LIGHT);
  doc.setFontSize(FONTS.SIZE_SMALL);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerText = `Page ${i} of ${pageCount} | ${data.project}`;
    doc.text(footerText, MARGIN, doc.internal.pageSize.height - 10);
  }
};

const addFirstPageHeader = (doc: any, data: DailyLogState) => {
    // Blue Masthead Background
    doc.setFillColor(COLORS.PRIMARY);
    doc.rect(0, 0, PAGE_WIDTH, 45, 'F');

    // Main Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONTS.SIZE_H1);
    doc.setTextColor('#FFFFFF');
    doc.text('Construction Daily Report', MARGIN, 22);
    
    // Sub-details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(FONTS.SIZE_BODY);
    doc.setTextColor('#FFFFFF');
    doc.text(`Project: ${data.project}`, MARGIN, 32);
    doc.text(`Date: ${new Date(data.reportDate + 'T00:00:00').toLocaleDateString()}`, PAGE_WIDTH - MARGIN, 32, { align: 'right' });
    doc.text(`Address: ${data.address}`, MARGIN, 38);
};


const addSectionTitle = (doc: any, title: string, startY: number) => {
    const pageHeight = doc.internal.pageSize.height;
    if (startY > pageHeight - 30) {
        doc.addPage();
        return MARGIN; // Start at top margin on new page
    }
    doc.setFontSize(FONTS.SIZE_H2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.TEXT_DARK);
    doc.text(title, MARGIN, startY);
    
    // Title underline accent
    doc.setDrawColor(COLORS.PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, startY + 2, MARGIN + 40, startY + 2);
    
    return startY + 12;
}

const addWeatherSection = (doc: any, data: DailyLogState, startY: number) => {
    let currentY = addSectionTitle(doc, 'Weather Report', startY);

    const weather = data.weather;
    // Helper to strip non-numeric characters to prevent unit duplication
    const cleanValue = (str: string) => String(str || '').replace(/[^0-9.-]/g, '');

    const uniqueConditions = [...new Set([weather.morning, weather.afternoon, weather.evening].filter(c => c && c.trim() !== ''))];
    const conditionString = uniqueConditions.length > 0 ? uniqueConditions.join(' / ') : 'N/A';
    
    const boxHeight = 25;
    const boxPadding = 5;
    const columnWidth = CONTENT_WIDTH / 2;

    // Draw container box
    doc.setFillColor(COLORS.HEADER_BG);
    doc.setDrawColor(COLORS.BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, currentY, CONTENT_WIDTH, boxHeight, 3, 3, 'FD');

    const textCenterY = currentY + (boxHeight / 2);
    
    const drawInfo = (label: string, value: string | string[], x: number) => {
      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.SIZE_SMALL);
      doc.setTextColor(COLORS.TEXT_LIGHT);
      doc.text(label, x, textCenterY - 4);
      
      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONTS.SIZE_BODY);
      doc.setTextColor(COLORS.TEXT_DARK);
      doc.text(value, x, textCenterY + 4);
    };

    const conditionLines = doc.splitTextToSize(conditionString, columnWidth - boxPadding * 2);

    drawInfo('Temperature', `${cleanValue(weather.highTemp)}°C / ${cleanValue(weather.lowTemp)}°C`, MARGIN + boxPadding);
    drawInfo('Conditions', conditionLines, MARGIN + boxPadding + columnWidth);

    currentY += boxHeight;
    
    if (weather.comments) {
      currentY += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONTS.SIZE_SMALL);
      doc.setTextColor(COLORS.TEXT_DARK);
      doc.text('Comments:', MARGIN, currentY);
      
      currentY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.TEXT_NORMAL);
      const commentLines = doc.splitTextToSize(weather.comments, CONTENT_WIDTH);
      doc.text(commentLines, MARGIN, currentY);
      currentY += (commentLines.length * 4); // Use smaller line height for comments
    }

    return currentY + 10;
};


const addDynamicTable = (doc: any, title: string, head: string[][], body: any[], startY: number) => {
    if (body.length === 0) return startY;
    
    let currentY = addSectionTitle(doc, title, startY);

    doc.autoTable({
        head: head,
        body: body,
        startY: currentY,
        theme: 'grid',
        headStyles: { 
            fillColor: false, // No background color
            textColor: COLORS.PRIMARY,
            fontStyle: 'bold',
            lineColor: COLORS.BORDER,
            lineWidth: { top: 0, right: 0, bottom: 0.5, left: 0 }, // Bottom border only
        },
        styles: { 
            fontSize: FONTS.SIZE_SMALL,
            cellPadding: 2.5,
            lineColor: COLORS.BORDER,
            lineWidth: 0.15,
            textColor: COLORS.TEXT_NORMAL,
            valign: 'middle',
        },
    });

    return doc.lastAutoTable.finalY + 10;
};

const addApprovalSection = (doc: any, startY: number) => {
    const sectionHeight = 60;
    const pageHeight = doc.internal.pageSize.height;
    let currentY = startY;

    if (currentY + sectionHeight > pageHeight - MARGIN) {
        doc.addPage();
        currentY = MARGIN;
    }
    
    currentY = addSectionTitle(doc, 'Supervisor Approval', currentY);

    const fieldYMargin = 18;
    const lineLength = 80;
    const labelX = MARGIN;
    const lineXStart = MARGIN + 28;
    
    doc.setFontSize(FONTS.SIZE_BODY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.TEXT_NORMAL);
    doc.setDrawColor(COLORS.TEXT_LIGHT);
    doc.setLineWidth(0.2);
    
    // Name field
    doc.text('Name:', labelX, currentY);
    doc.line(lineXStart, currentY + 1, lineXStart + lineLength, currentY + 1);
    currentY += fieldYMargin;

    // Title field
    doc.text('Title:', labelX, currentY);
    doc.line(lineXStart, currentY + 1, lineXStart + lineLength, currentY + 1);
    currentY += fieldYMargin;
    
    // Signature field
    doc.text('Signature:', labelX, currentY);
    doc.line(lineXStart, currentY + 1, lineXStart + lineLength, currentY + 1);
    currentY += fieldYMargin;

    return currentY;
};


const addPhotosSection = async (doc: any, photos: PhotoLogEntry[], startY: number) => {
    if (photos.length === 0) return startY;
    
    let currentY = addSectionTitle(doc, 'Photo Log', startY);

    const photoHeight = 55;
    const photoWidth = 75;
    const padding = 4;
    const photosPerRow = 2;
    const verticalGap = 5;
    const captionAreaHeight = 18; // Fixed height for 2 lines of text + padding
    const itemWidth = photoWidth + (padding * 2);
    const horizontalGap = (CONTENT_WIDTH - (photosPerRow * itemWidth)) / (photosPerRow - 1);
    const itemHeight = photoHeight + captionAreaHeight + (padding * 2);

    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const col = i % photosPerRow;
        const isNewRow = col === 0;

        if (isNewRow && i > 0) {
            currentY += itemHeight + verticalGap;
        }
        
        if (currentY + itemHeight > doc.internal.pageSize.height - MARGIN) {
            doc.addPage();
            currentY = MARGIN; // Reset Y for new page
        }

        const currentX = MARGIN + col * (itemWidth + horizontalGap);
        
        // Photo container
        doc.setFillColor(COLORS.HEADER_BG);
        doc.setDrawColor(COLORS.BORDER);
        doc.setLineWidth(0.2);
        doc.roundedRect(currentX, currentY, itemWidth, itemHeight, 3, 3, 'FD');
        
        try {
            const dataUrl = photo.previewUrl;
            doc.addImage(dataUrl, 'JPEG', currentX + padding, currentY + padding, photoWidth, photoHeight);
            
            doc.setFontSize(FONTS.SIZE_SMALL);
            doc.setTextColor(COLORS.TEXT_LIGHT);
            
            // Truncate caption to 2 lines to prevent overflow
            const captionLines = doc.splitTextToSize(photo.caption || 'No caption', photoWidth).slice(0, 2);
            doc.text(captionLines, currentX + padding, currentY + padding + photoHeight + 6);
        } catch (error) {
            console.error('Error adding image to PDF:', error);
            doc.text('Error loading image', currentX + padding, currentY + padding + photoHeight / 2);
        }
    }
    
    return currentY + itemHeight + verticalGap;
}


export const exportPdf = async (data: DailyLogState) => {
    const doc = new jspdf.jsPDF();
    let currentY = 55; // Start content below the first page masthead

    addFirstPageHeader(doc, data);
    
    currentY = addWeatherSection(doc, data, currentY);

    currentY = addDynamicTable(doc, 'Manpower Log', [['Company', 'Trades', 'Manpower', 'Work Done', 'Major Equipment']], data.manpower.map(i => [i.company, i.trades, i.manpower.toString(), i.workDone, i.majorEquipment]), currentY);
    currentY = addDynamicTable(doc, 'Concrete Log', [['Building', 'Order #', 'Date', 'Mix', 'Application', 'Location', 'Vol. Added']], data.concrete.map(i => [i.building, i.orderNumber, i.date, i.concreteMix, i.application, i.location, i.volumeAddedToday]), currentY);
    currentY = addDynamicTable(doc, 'Steel Log', [['Building', 'Order #', 'Date', 'Location', 'Weight Added']], data.steel.map(i => [i.building, i.orderNumber, i.date, i.location, i.totalWeightAddedToday]), currentY);
    currentY = addDynamicTable(doc, 'Delay Log', [['Delay Type', 'Comments']], data.delay.map(i => [i.delayType, i.comments]), currentY);
    currentY = addDynamicTable(doc, 'Accident Log', [['Details']], data.accident.map(i => [i.details]), currentY);
    currentY = addDynamicTable(doc, 'Visitor Log', [['Visitor', 'Start', 'End', 'Details']], data.visitor.map(i => [i.visitor, i.startTime, i.endTime, i.details]), currentY);
    currentY = addDynamicTable(doc, 'Rental & Delivery Log', [['Time', 'From', 'Tracking #', 'Contents']], data.rental.map(i => [i.time, i.deliveryFrom, i.trackingNumber, i.contents]), currentY);
    currentY = addDynamicTable(doc, 'Notes & Issues Log', [['Issue', 'Comments', 'Details']], data.notes.map(i => [i.issue, i.comments, i.issueDetails]), currentY);

    currentY = addApprovalSection(doc, currentY);
    
    currentY = await addPhotosSection(doc, data.photos, currentY);

    addFooters(doc, data); // Add footers to all pages at the end

    doc.save(`Daily_Report_${data.reportDate}.pdf`);
};