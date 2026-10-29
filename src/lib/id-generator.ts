import { TrackType, TRACK_DETAILS } from '@/types/fellow';

/**
 * Returns the current year (2-digit) and quarter window string.
 * Example for October 2026: "26Q4"
 */
export function getCurrentCohortWindow(customDate?: Date): string {
  const d = customDate || new Date();
  const year2Digit = d.getFullYear().toString().slice(-2);
  const month = d.getMonth(); // 0-indexed: 0-2 = Q1, 3-5 = Q2, 6-8 = Q3, 9-11 = Q4
  const quarter = `Q${Math.floor(month / 3) + 1}`;
  return `${year2Digit}${quarter}`;
}

/**
 * Generates smart student ID adhering to TOCHI studio standard:
 * Structure: TCL-[YY][Quarter]-[TRACK_CODE]-[4_DIGIT_SEQ]
 * Example: TCL-26Q4-WEB-0001
 * 
 * @param track TrackType enum value
 * @param existingIds Optional array of existing student IDs to auto-calculate the next sequence number
 * @param manualSequence Optional sequence number override
 */
export function generateStudentId(
  track: TrackType,
  existingIds: string[] = [],
  manualSequence?: number
): string {
  const windowStr = getCurrentCohortWindow();
  const trackCode = TRACK_DETAILS[track]?.code || 'DEV';
  const prefix = `TCL-${windowStr}-${trackCode}-`;

  if (manualSequence !== undefined && manualSequence > 0) {
    const seqStr = manualSequence.toString().padStart(4, '0');
    return `${prefix}${seqStr}`;
  }

  // Find the highest sequence number among existing IDs matching this track and window
  let maxSeq = 0;
  for (const id of existingIds) {
    if (!id || typeof id !== 'string') continue;
    // Format: TCL-26Q4-WEB-0001
    const parts = id.split('-');
    if (parts.length >= 4) {
      const existingTrackCode = parts[2];
      const seqPart = parts[3];
      // Compare track code
      if (existingTrackCode === trackCode) {
        const parsed = parseInt(seqPart, 10);
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      }
    }
  }

  const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
  return `${prefix}${nextSeq}`;
}

/**
 * Validates whether an ID matches the TOCHI student ID standard.
 */
export function isValidStudentId(id: string): boolean {
  if (!id) return false;
  // Regex: TCL-\d{2}Q[1-4]-[A-Z]{3,4}-\d{4}
  const regex = /^TCL-\d{2}Q[1-4]-[A-Z]{3,4}-\d{4}$/;
  return regex.test(id.trim());
}

