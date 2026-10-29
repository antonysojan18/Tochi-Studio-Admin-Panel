import { Fellow, TRACK_DETAILS } from '@/types/fellow';

export type WhatsAppMessageType = 'WELCOME' | 'OFFER' | 'SPRINT_UPDATE' | 'CERTIFICATE';

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

export function generateWhatsAppLink(
  fellow: Fellow,
  type: WhatsAppMessageType,
  hostUrl: string = 'https://tochidevstudio.in'
): string {
  const phone = cleanPhoneNumber(fellow.phone);
  const trackInfo = TRACK_DETAILS[fellow.track] || { label: fellow.track, shortLabel: fellow.track };
  const verifyUrl = `${hostUrl}/verify?hash=${fellow.qr_verify_hash}`;

  let text = '';

  switch (type) {
    case 'WELCOME':
      text = `Hello ${fellow.full_name}, greetings from Tochi .dev Studio.\n\nYour application for the ${trackInfo.shortLabel} internship program has been received. Your Student ID is ${fellow.student_id}. Our team is reviewing portfolios and will share cohort updates shortly.`;
      break;

    case 'OFFER':
      text = `Notice of Selection: ${fellow.full_name}\n\nYou have been selected for the Tochi .dev Studio Internship (${trackInfo.shortLabel} track).\n\nStudent ID: ${fellow.student_id}\nInternship Dates: ${fellow.cohort_start_date} to ${fellow.cohort_end_date}\n\nWe have dispatched your official Offer Letter to ${fellow.email}.\nVerification record: ${verifyUrl}\n\nPlease check your email for onboarding instructions.`;
      break;

    case 'SPRINT_UPDATE':
      text = `Internship Check-in: ${fellow.full_name}\n\nThis is a scheduled operational check-in from Tochi .dev Studio for the ${trackInfo.shortLabel} track. Deliverables are due shortly. Please ensure your project repository and demo walkthrough are updated.\n\nStudent ID: ${fellow.student_id}\nReach out here if you require mentor guidance.`;
      break;

    case 'CERTIFICATE':
      text = `Internship Certified: ${fellow.full_name}\n\nYou have completed the 4-week Tochi .dev Studio Internship (${trackInfo.shortLabel} track).\n\nYour Certificate of Internship Completion has been issued and dispatched to ${fellow.email}.\n\nPublic verification link: ${verifyUrl}\n\nYou may reference your credential on LinkedIn and professional portfolios.`;
      break;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
