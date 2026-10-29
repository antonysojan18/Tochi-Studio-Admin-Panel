import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { Fellow, TRACK_DETAILS } from '@/types/fellow';

export async function generateCertificatePdf(fellow: Fellow, hostUrl?: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // A4 Landscape: 841.89 x 595.28
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontCourierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Exact background ivory tone from certificate image
  const colorIvory = rgb(249 / 255, 245 / 255, 237 / 255);
  const colorBurgundy = rgb(59 / 255, 13 / 255, 31 / 255); // #3B0D1F
  const colorDark = rgb(35 / 255, 35 / 255, 35 / 255);

  const templatePath = path.join(process.cwd(), 'public', 'assets', 'certificate-template.jpg');
  const hasTemplate = fs.existsSync(templatePath);

  if (hasTemplate) {
    const templateBytes = fs.readFileSync(templatePath);
    const templateImage = await pdfDoc.embedJpg(templateBytes);

    // 1. Draw base high-res certificate image
    page.drawImage(templateImage, {
      x: 0,
      y: 0,
      width,
      height,
    });

    const trackInfo = TRACK_DETAILS[fellow.track] || { label: fellow.track, shortLabel: fellow.track };

    // 2. Cover [INTERN FULL NAME] and render student name in large bold burgundy
    page.drawRectangle({
      x: 200,
      y: 302,
      width: 442,
      height: 42,
      color: colorIvory,
    });

    const studentName = fellow.full_name.toUpperCase();
    const nameFontSize = studentName.length > 24 ? 22 : 26;
    const nameWidth = fontHelveticaBold.widthOfTextAtSize(studentName, nameFontSize);
    page.drawText(studentName, {
      x: (width - nameWidth) / 2,
      y: 314,
      size: nameFontSize,
      font: fontHelveticaBold,
      color: colorBurgundy,
    });

    // 3. Cover placeholder domain line in paragraph: "program in _____________,"
    page.drawRectangle({
      x: 508,
      y: 256,
      width: 158,
      height: 18,
      color: colorIvory,
    });

    page.drawText(`${trackInfo.label},`, {
      x: 512,
      y: 260,
      size: 10.5,
      font: fontHelveticaBold,
      color: colorBurgundy,
    });

    // 4. Cover Duration & Domain line:
    // "Duration: [Start Date] - [End Date]         Domain: ___________"
    page.drawRectangle({
      x: 160,
      y: 194,
      width: 520,
      height: 24,
      color: colorIvory,
    });

    page.drawText('Duration: ', {
      x: 164,
      y: 201,
      size: 10.5,
      font: fontHelveticaBold,
      color: colorDark,
    });

    page.drawText(`${fellow.cohort_start_date} - ${fellow.cohort_end_date}`, {
      x: 220,
      y: 201,
      size: 10.5,
      font: fontHelvetica,
      color: colorDark,
    });

    page.drawText('Domain: ', {
      x: 480,
      y: 201,
      size: 10.5,
      font: fontHelveticaBold,
      color: colorDark,
    });

    page.drawText(trackInfo.label, {
      x: 532,
      y: 201,
      size: 10.5,
      font: fontHelvetica,
      color: colorDark,
    });

    // 5. Generate and draw real live verification QR code over placeholder QR
    const baseUrl = hostUrl || 'https://tochidevstudio.in';
    const verifyUrl = `${baseUrl}/verify?hash=${fellow.qr_verify_hash}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 140,
      color: {
        dark: '#3B0D1F',
        light: '#F9F5ED',
      },
    });
    const qrImage = await pdfDoc.embedPng(qrDataUrl);

    // Cover placeholder QR
    page.drawRectangle({
      x: 390,
      y: 78,
      width: 62,
      height: 62,
      color: colorIvory,
    });

    page.drawImage(qrImage, {
      x: 391,
      y: 79,
      width: 60,
      height: 60,
    });

    // 6. Cover Certificate ID and redraw real student/cert ID
    page.drawRectangle({
      x: 320,
      y: 58,
      width: 202,
      height: 18,
      color: colorIvory,
    });

    const certIdText = `Certificate ID: ${fellow.student_id}`;
    const certIdWidth = fontHelveticaBold.widthOfTextAtSize(certIdText, 8.5);
    page.drawText(certIdText, {
      x: (width - certIdWidth) / 2,
      y: 63,
      size: 8.5,
      font: fontHelveticaBold,
      color: colorDark,
    });
  } else {
    // Pure vector fallback if image is missing
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: colorIvory,
    });
    page.drawText('Tochi .dev Studio - Certificate of Internship Completion', {
      x: 50,
      y: height - 100,
      size: 20,
      font: fontHelveticaBold,
      color: colorBurgundy,
    });
  }

  return await pdfDoc.save();
}
