import { Fellow, TRACK_DETAILS } from '@/types/fellow';

export type EmailTemplateType = 'WELCOME' | 'OFFER' | 'SUBMISSION' | 'CERTIFICATE';

export function getEmailSubject(type: EmailTemplateType, fellow: Fellow): string {
  const trackInfo = TRACK_DETAILS[fellow.track]?.shortLabel || fellow.track;
  switch (type) {
    case 'WELCOME':
      return `[Tochi .dev Studio] Application Received - Student ID: ${fellow.student_id}`;
    case 'OFFER':
      return `[OFFER LETTER] Internship Appointment (${trackInfo}) - ${fellow.student_id}`;
    case 'SUBMISSION':
      return `[ACTION REQUIRED] Mid-Sprint Deliverables Protocol - ${fellow.student_id}`;
    case 'CERTIFICATE':
      return `[CREDENTIAL ISSUED] Certificate of Internship Completion - ${fellow.student_id}`;
  }
}

export function generateEmailHtml(type: EmailTemplateType, fellow: Fellow, hostUrl: string = 'https://tochidevstudio.in'): string {
  const trackInfo = TRACK_DETAILS[fellow.track] || { label: fellow.track, shortLabel: fellow.track, code: 'DEV' };
  const verifyLink = `${hostUrl}/verify?hash=${fellow.qr_verify_hash}`;
  const googleFormSubmissionLink = `https://forms.gle/tochi-labs-sprint-submission?entry.student_id=${encodeURIComponent(fellow.student_id)}&entry.name=${encodeURIComponent(fellow.full_name)}&entry.track=${encodeURIComponent(trackInfo.label)}`;

  const brandHeader = `
    <div style="background-color: #541228; padding: 24px 28px; border-bottom: 2px solid #3B0D1C; text-align: left;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <h1 style="margin: 0; color: #FAF6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
              Tochi .dev Studio
            </h1>
            <p style="margin: 3px 0 0 0; color: #F4EDE2; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.5px;">
              // TOCHI .LABS INTERNSHIP ENGINE
            </p>
          </td>
          <td align="right">
            <span style="display: inline-block; background-color: rgba(250, 246, 240, 0.15); border: 1px solid rgba(250, 246, 240, 0.25); padding: 4px 10px; border-radius: 4px; color: #FAF6F0; font-family: 'Courier New', monospace; font-size: 11px;">
              ${fellow.student_id}
            </span>
          </td>
        </tr>
      </table>
    </div>
  `;

  const brandFooter = `
    <div style="background-color: #FAF6F0; padding: 20px 28px; border-top: 1px solid #E7DFD3; color: #665E64; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.6;">
      <p style="margin: 0 0 6px 0; color: #1C181B; font-weight: 600;">
        Tochi .dev Studio &bull; Autonomous Systems & Engineering Architecture
      </p>
      <p style="margin: 0 0 6px 0;">
        Antony Sojan, Founder &bull; MSME Registered &bull; <a href="mailto:tochi.devstudio@gmail.com" style="color: #541228; text-decoration: none; font-weight: 600;">tochi.devstudio@gmail.com</a>
      </p>
      <p style="margin: 0; font-size: 10px; color: #9E959B;">
        Verification portal: <a href="${verifyLink}" style="color: #0D7A53; text-decoration: none;">${verifyLink}</a>
      </p>
    </div>
  `;

  let contentBody = '';

  if (type === 'WELCOME') {
    contentBody = `
      <h2 style="color: #1C181B; font-size: 18px; margin-top: 0; font-weight: 700;">
        Application Received & Candidate Acknowledgment
      </h2>
      <p style="color: #332E32; font-size: 13.5px; line-height: 1.6;">
        Dear <strong>${fellow.full_name}</strong>,
      </p>
      <p style="color: #332E32; font-size: 13.5px; line-height: 1.6;">
        Your application for the <strong>${trackInfo.label}</strong> internship program has been logged into the Tochi .dev Studio cohort pipeline.
      </p>
      
      <div style="background-color: #FAF6F0; border-left: 3px solid #541228; padding: 14px 16px; margin: 18px 0; border-radius: 0 4px 4px 0;">
        <p style="margin: 0 0 5px 0; font-family: 'Courier New', monospace; font-size: 12px; color: #1C181B;">
          <strong>ASSIGNED STUDENT ID:</strong> <span style="background-color: #541228; color: #FAF6F0; padding: 2px 7px; border-radius: 3px;">${fellow.student_id}</span>
        </p>
        <p style="margin: 0 0 5px 0; font-size: 12.5px; color: #554D52;">
          <strong>Track:</strong> ${trackInfo.label} (${trackInfo.code})
        </p>
        <p style="margin: 0; font-size: 12.5px; color: #554D52;">
          <strong>Internship Schedule:</strong> ${fellow.cohort_start_date} to ${fellow.cohort_end_date}
        </p>
      </div>

      <p style="color: #332E32; font-size: 13.5px; line-height: 1.6;">
        Applications are evaluated on technical problem solving and practical aptitude. If selected, your official internship offer document will be dispatched to your email address.
      </p>
    `;
  } else if (type === 'OFFER') {
    contentBody = `
      <div style="background-color: #EDF9F4; border: 1px solid #B7E7D5; padding: 10px 14px; border-radius: 4px; margin-bottom: 18px;">
        <span style="color: #0D7A53; font-weight: 700; font-size: 12px; font-family: 'Courier New', monospace;">
          [CONFIRMED] INTERNSHIP APPOINTMENT
        </span>
      </div>

      <h2 style="color: #1C181B; font-size: 20px; margin-top: 0; font-weight: 700;">
        Offer of Internship: ${trackInfo.label}
      </h2>
      <p style="color: #332E32; font-size: 13.5px; line-height: 1.6;">
        Dear <strong>${fellow.full_name}</strong>,
      </p>
      <p style="color: #332E32; font-size: 13.5px; line-height: 1.6;">
        We are pleased to offer you appointment as an Engineering Intern at Tochi .dev Studio under the <strong>${trackInfo.label}</strong> track. Your dynamic vector Offer Letter is attached to this dispatch.
      </p>

      <div style="background-color: #FAF6F0; border: 1px solid #E7DFD3; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; font-size: 13px; color: #541228; text-transform: uppercase; letter-spacing: 0.5px;">
          Onboarding Protocol
        </h3>
        <ol style="margin: 0; padding-left: 18px; font-size: 12.5px; line-height: 1.65; color: #332E32;">
          <li><strong>Local Environment:</strong> Ensure Node.js 20+, Git, and your IDE are configured.</li>
          <li><strong>Sprint Kickoff:</strong> Begins on <strong>${fellow.cohort_start_date}</strong>. Check WhatsApp for mentor introductions.</li>
          <li><strong>Verification:</strong> Your Offer Letter contains a verification QR code linked to our live registry.</li>
        </ol>
      </div>

      <p style="color: #332E32; font-size: 13.5px; line-height: 1.6;">
        Please review the attached PDF for comprehensive terms and project deliverables.
      </p>
    `;
  } else if (type === 'SUBMISSION') {
    contentBody = `
      <h2 style="color: #1C181B; font-size: 18px; margin-top: 0; font-weight: 700;">
        Mid-Sprint Deliverable Submission Protocol
      </h2>
      <p style="color: #332E32; font-size: 13.5px; line-height: 1.6;">
        Hi <strong>${fellow.full_name}</strong>,
      </p>
      <p style="color: #332E32; font-size: 13.5px; line-height: 1.6;">
        You have reached the mid-sprint evaluation window in the <strong>${trackInfo.label}</strong> track. Please submit your project repositories, architectural walkthrough, and deployment links for review.
      </p>

      <div style="background-color: #FEF8EC; border: 1px solid #FDE4B0; padding: 14px 16px; border-radius: 4px; margin: 18px 0;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #B45309; font-size: 12.5px;">
          Submission Guidelines:
        </p>
        <ul style="margin: 0; padding-left: 18px; color: #78350F; font-size: 12px; line-height: 1.6;">
          <li>Include public GitHub repositories with thorough documentation.</li>
          <li>Provide a demo walkthrough link showcasing key functionality.</li>
          <li>Your Student ID (<strong>${fellow.student_id}</strong>) is pre-filled below.</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${googleFormSubmissionLink}" style="background-color: #541228; color: #FAF6F0; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 13px; display: inline-block;">
          Open Submission Form &rarr;
        </a>
      </div>
    `;
  } else if (type === 'CERTIFICATE') {
    contentBody = `
      <h2 style="color: #1C181B; font-size: 20px; margin-top: 0; font-weight: 700;">
        Certificate of Internship Completion
      </h2>
      <p style="color: #665E64; font-size: 12px; margin-top: -6px; margin-bottom: 16px; font-family: 'Courier New', monospace;">
        CREDENTIAL RECORD: ${fellow.student_id}
      </p>

      <p style="color: #332E32; font-size: 13.5px; line-height: 1.6;">
        Dear <strong>${fellow.full_name}</strong>,
      </p>
      <p style="color: #332E32; font-size: 13.5px; line-height: 1.6;">
        Congratulations. On behalf of Tochi .dev Studio, we hereby issue your official <strong>Certificate of Internship Completion</strong> for successfully completing the <strong>${trackInfo.label}</strong> internship program.
      </p>

      <div style="background-color: #FAF6F0; border: 1px solid #E7DFD3; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1C181B; font-size: 13px;">
          Verified Credential Details:
        </h4>
        <p style="margin: 0 0 5px 0; font-size: 12.5px; color: #332E32;">
          <strong>Student ID:</strong> ${fellow.student_id}
        </p>
        <p style="margin: 0 0 5px 0; font-size: 12.5px; color: #332E32;">
          <strong>Domain:</strong> ${trackInfo.label}
        </p>
        <p style="margin: 0 0 10px 0; font-size: 12.5px; color: #332E32;">
          <strong>Verification Endpoint:</strong> <a href="${verifyLink}" style="color: #0D7A53; text-decoration: none;">${verifyLink}</a>
        </p>
        <p style="margin: 0; font-size: 11px; color: #665E64;">
          Backed by cryptographic hash <code style="background-color: #F3EDE2; padding: 2px 4px; border-radius: 3px;">${fellow.qr_verify_hash}</code> and MSME Registered status.
        </p>
      </div>

      <p style="color: #332E32; font-size: 13.5px; line-height: 1.6;">
        Your high-resolution Certificate PDF is attached to this dispatch and archived in our live registry.
      </p>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${getEmailSubject(type, fellow)}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #FAF6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E7DFD3; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          ${brandHeader}
          <div style="padding: 28px;">
            ${contentBody}
          </div>
          ${brandFooter}
        </div>
      </body>
    </html>
  `;
}
