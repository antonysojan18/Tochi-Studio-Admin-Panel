import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { Fellow, TRACK_DETAILS } from '@/types/fellow';

export async function generateOfferLetterPdf(fellow: Fellow, hostUrl?: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // Standard A4 Portrait: 595.28 x 841.89 pt
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontCourierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Palette: Clean Warm Ivory & Burgundy
  const colorBurgundy = rgb(84 / 255, 18 / 255, 40 / 255);     // #541228
  const colorIvoryTint = rgb(250 / 255, 246 / 255, 240 / 255); // #FAF6F0
  const colorDarkText = rgb(28 / 255, 24 / 255, 27 / 255);     // #1C181B
  const colorMuted = rgb(104 / 255, 95 / 255, 100 / 255);      // #685F64
  const colorBorder = rgb(231 / 255, 223 / 255, 211 / 255);    // #E7DFD3

  // 1. Soft Warm Ivory Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(253 / 255, 251 / 255, 247 / 255),
  });

  // Top Burgundy Accent Bar
  page.drawRectangle({
    x: 0,
    y: height - 8,
    width,
    height: 8,
    color: colorBurgundy,
  });

  // Minimal Hairline Outer Frame
  page.drawRectangle({
    x: 32,
    y: 28,
    width: width - 64,
    height: height - 56,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  // 2. Embed Official TOCHI Logo (Bigger & Cleaner)
  // 2. Official TOCHI /LABS Brand Logo
  const logoWidth = 120;
  const logoHeight = Math.round(logoWidth * (168 / 434)); // ~46 pt
  const headerTopY = height - 42;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'tochi-logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      page.drawImage(logoImage, {
        x: 48,
        y: headerTopY - logoHeight - 6,
        width: logoWidth,
        height: logoHeight,
      });
    }
  } catch (err) {
    console.warn('Could not load logo png:', err);
  }

  // 3. Header Text beside Logo
  const textLeftX = 48 + logoWidth + 18; // ~186 pt
  page.drawText('Tochi .dev Studio', {
    x: textLeftX,
    y: headerTopY - 18,
    size: 21,
    font: fontHelveticaBold,
    color: colorBurgundy,
  });

  page.drawText('Autonomous Systems | Digital Engineering | AI Architecture', {
    x: textLeftX,
    y: headerTopY - 36,
    size: 9.5,
    font: fontHelvetica,
    color: colorDarkText,
  });

  page.drawText('Govt. of India MSME Registered | tochi.devstudio@gmail.com', {
    x: textLeftX,
    y: headerTopY - 52,
    size: 8,
    font: fontCourier,
    color: colorMuted,
  });

  // Horizontal Divider Line below Header
  let cursorY = headerTopY - logoHeight - 20; // ~734 pt
  page.drawLine({
    start: { x: 48, y: cursorY },
    end: { x: width - 48, y: cursorY },
    thickness: 1,
    color: colorBorder,
  });

  // 4. Meta Row: Date & Student ID Badge
  cursorY -= 28; // ~678 pt
  const issueDateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  page.drawText(`Date: ${issueDateStr}`, {
    x: 48,
    y: cursorY,
    size: 10,
    font: fontHelvetica,
    color: colorDarkText,
  });

  // Student ID Badge Box
  const badgeWidth = 205;
  const badgeHeight = 24;
  page.drawRectangle({
    x: width - 48 - badgeWidth,
    y: cursorY - 6,
    width: badgeWidth,
    height: badgeHeight,
    color: colorIvoryTint,
    borderColor: colorBurgundy,
    borderWidth: 1,
  });

  page.drawText(`STUDENT ID: ${fellow.student_id}`, {
    x: width - 48 - badgeWidth + 12,
    y: cursorY + 1,
    size: 10,
    font: fontCourierBold,
    color: colorBurgundy,
  });

  // 5. Addressed to Student (Generous Spacing & High-Contrast Typography)
  cursorY -= 36; // ~642 pt
  page.drawText('TO:', {
    x: 48,
    y: cursorY,
    size: 8.5,
    font: fontHelveticaBold,
    color: colorMuted,
  });

  cursorY -= 17; // ~625 pt
  page.drawText(fellow.full_name, {
    x: 48,
    y: cursorY,
    size: 14.5,
    font: fontHelveticaBold,
    color: colorBurgundy,
  });

  cursorY -= 16; // ~609 pt
  const collegeInfo = fellow.college || 'Engineering Student';
  page.drawText(collegeInfo, {
    x: 48,
    y: cursorY,
    size: 10,
    font: fontHelvetica,
    color: colorDarkText,
  });

  cursorY -= 15; // ~594 pt
  page.drawText(`Email: ${fellow.email} | Contact: ${fellow.phone}`, {
    x: 48,
    y: cursorY,
    size: 9,
    font: fontCourier,
    color: colorMuted,
  });

  // 6. Subject Line (Distinct, Spacious Box)
  cursorY -= 34; // ~560 pt
  const trackInfo = TRACK_DETAILS[fellow.track] || { label: fellow.track, code: 'DEV' };
  const subjectBoxHeight = 30;

  page.drawRectangle({
    x: 48,
    y: cursorY - 7,
    width: width - 96,
    height: subjectBoxHeight,
    color: colorIvoryTint,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  page.drawText(`SUBJECT: OFFER OF INTERNSHIP APPOINTMENT - ${trackInfo.label.toUpperCase()}`, {
    x: 60,
    y: cursorY + 3,
    size: 9.5,
    font: fontHelveticaBold,
    color: colorBurgundy,
  });

  // 7. Salutation & Opening Paragraph
  cursorY -= 42; // ~518 pt
  page.drawText(`Dear ${fellow.full_name},`, {
    x: 48,
    y: cursorY,
    size: 11,
    font: fontHelveticaBold,
    color: colorDarkText,
  });

  cursorY -= 22; // ~496 pt
  const paragraph1 = `We are pleased to offer you an appointment as an Engineering Intern at Tochi .dev Studio under the ${trackInfo.label} (${trackInfo.code}) track. Based on your application, problem-solving skills, and technical aptitude, we are delighted to welcome you to our upcoming internship cohort.`;
  const p1Height = drawWrappedText(page, paragraph1, 48, cursorY, width - 96, fontHelvetica, 10.2, colorDarkText, 16);
  cursorY -= p1Height;

  // 8. Section 1: INTERNSHIP DURATION & SCHEDULE
  cursorY -= 26;
  page.drawText('1. INTERNSHIP DURATION & SCHEDULE', {
    x: 48,
    y: cursorY,
    size: 10.5,
    font: fontHelveticaBold,
    color: colorBurgundy,
  });

  cursorY -= 18;
  const timelineText = `The internship is a structured 4-week intensive program commencing on ${fellow.cohort_start_date} and concluding on ${fellow.cohort_end_date}. During this period, you will collaborate on modern web architecture, autonomous workflow engineering, and production-ready applications.`;
  const p2Height = drawWrappedText(page, timelineText, 48, cursorY, width - 96, fontHelvetica, 10, colorDarkText, 15.5);
  cursorY -= p2Height;

  // 9. Section 2: ROLES, SCOPE & DELIVERABLES
  cursorY -= 26;
  page.drawText('2. ROLES, SCOPE & DELIVERABLES', {
    x: 48,
    y: cursorY,
    size: 10.5,
    font: fontHelveticaBold,
    color: colorBurgundy,
  });

  cursorY -= 18;
  const rolesText = `You will be assigned to practical development tasks and engineering sprints. Deliverables include participating in design reviews, adhering to modern code standards, and deploying project repositories that demonstrate competence in your chosen specialization.`;
  const p3Height = drawWrappedText(page, rolesText, 48, cursorY, width - 96, fontHelvetica, 10, colorDarkText, 15.5);
  cursorY -= p3Height;

  // 10. Section 3: VERIFICATION & CERTIFICATION
  cursorY -= 26;
  page.drawText('3. VERIFICATION & CERTIFICATION', {
    x: 48,
    y: cursorY,
    size: 10.5,
    font: fontHelveticaBold,
    color: colorBurgundy,
  });

  cursorY -= 18;
  const certText = `Upon successful completion of the internship milestones and submission review, you will be awarded an official, cryptographically verified Certificate of Internship Completion issued by Tochi .dev Studio and registered under MSME.`;
  const p4Height = drawWrappedText(page, certText, 48, cursorY, width - 96, fontHelvetica, 10, colorDarkText, 15.5);
  cursorY -= p4Height;

  // 11. Sign-off and Verification Footer Section
  // Nicely spaced at the bottom with no empty void
  cursorY -= 36;

  // Left: Signature block (Antony Sojan as Founder only, NO cryptographic seal badge)
  page.drawText('Sincerely,', {
    x: 48,
    y: cursorY,
    size: 9.5,
    font: fontHelvetica,
    color: colorMuted,
  });

  cursorY -= 18;
  page.drawText('Antony Sojan', {
    x: 48,
    y: cursorY,
    size: 14.5,
    font: fontHelveticaBold,
    color: colorBurgundy,
  });

  cursorY -= 14;
  page.drawText('Founder', {
    x: 48,
    y: cursorY,
    size: 10.5,
    font: fontHelveticaBold,
    color: colorDarkText,
  });

  cursorY -= 14;
  page.drawText('Tochi .dev Studio', {
    x: 48,
    y: cursorY,
    size: 9.5,
    font: fontHelvetica,
    color: colorMuted,
  });

  // Right: Live Verification QR Code
  const baseUrl = hostUrl || 'https://tochidevstudio.in';
  const verifyUrl = `${baseUrl}/verify?hash=${fellow.qr_verify_hash}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 140,
    color: {
      dark: '#541228',
      light: '#00000000',
    },
  });
  const qrImage = await pdfDoc.embedPng(qrDataUrl);

  const qrBoxX = width - 146;
  const qrBoxY = 48;
  page.drawImage(qrImage, {
    x: qrBoxX,
    y: qrBoxY + 14,
    width: 86,
    height: 86,
  });

  page.drawText('SCAN TO VERIFY APPOINTMENT', {
    x: qrBoxX - 16,
    y: qrBoxY + 4,
    size: 6.5,
    font: fontCourierBold,
    color: colorBurgundy,
  });

  page.drawText(fellow.student_id, {
    x: qrBoxX + 6,
    y: qrBoxY - 5,
    size: 7,
    font: fontCourier,
    color: colorMuted,
  });

  // Bottom Hairline Divider & Verification Note
  page.drawLine({
    start: { x: 48, y: 44 },
    end: { x: qrBoxX - 24, y: 44 },
    thickness: 0.5,
    color: colorBorder,
  });

  page.drawText('Official Internship Appointment Document issued by Tochi .dev Studio. Verify live at tochidevstudio.in/verify', {
    x: 48,
    y: 35,
    size: 6.5,
    font: fontHelveticaOblique,
    color: colorMuted,
  });

  return await pdfDoc.save();
}

/**
 * Helper to wrap and draw text, returning the total height consumed.
 */
function drawWrappedText(
  page: any,
  text: string,
  startX: number,
  startY: number,
  maxWidth: number,
  font: any,
  fontSize: number,
  color: any,
  lineHeight: number
): number {
  const words = text.split(' ');
  let currentLine = '';
  let y = startY;
  let lineCount = 0;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth) {
      page.drawText(currentLine, {
        x: startX,
        y,
        size: fontSize,
        font,
        color,
      });
      currentLine = word;
      y -= lineHeight;
      lineCount++;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    page.drawText(currentLine, {
      x: startX,
      y,
      size: fontSize,
      font,
      color,
    });
    lineCount++;
  }

  return (lineCount - 1) * lineHeight;
}
