import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Fellow, TRACK_DETAILS } from '@/types/fellow';

const styles = StyleSheet.create({
  page: {
    padding: 42,
    backgroundColor: '#FAF6F0',
    fontFamily: 'Helvetica',
    color: '#1C181B',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#541228',
  },
  borderFrame: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 1,
    borderColor: '#E7DFD3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7DFD3',
  },
  logoImage: {
    width: 104,
    height: 40,
    marginRight: 16,
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#541228',
  },
  tagline: {
    fontSize: 9,
    color: '#1C181B',
    marginTop: 4,
  },
  msmeText: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: '#665E64',
    marginTop: 3,
  },
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  idBadge: {
    backgroundColor: '#FAF6F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#541228',
  },
  idBadgeText: {
    color: '#541228',
    fontSize: 9.5,
    fontFamily: 'Courier-Bold',
  },
  toSection: {
    marginBottom: 16,
  },
  candidateName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#541228',
    marginVertical: 3,
  },
  subjectBox: {
    backgroundColor: '#FAF6F0',
    padding: 9,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E7DFD3',
  },
  subjectText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#541228',
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.55,
    marginBottom: 14,
    color: '#1C181B',
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#541228',
    marginTop: 10,
    marginBottom: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 38,
    left: 42,
    right: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E7DFD3',
    paddingTop: 10,
  },
  signatoryBlock: {
    flexDirection: 'column',
  },
  qrBlock: {
    alignItems: 'center',
  },
  qrImage: {
    width: 72,
    height: 72,
  },
});

interface OfferLetterProps {
  fellow: Fellow;
  qrDataUrl: string;
}

export const OfferLetterPDF: React.FC<OfferLetterProps> = ({ fellow, qrDataUrl }) => {
  const trackInfo = TRACK_DETAILS[fellow.track] || { label: fellow.track, code: 'DEV' };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />
        <View style={styles.borderFrame} />

        <View style={styles.header}>
          <Image src="/assets/tochi-logo.png" style={styles.logoImage} />
          <View>
            <Text style={styles.brandTitle}>Tochi .dev Studio</Text>
            <Text style={styles.tagline}>
              Autonomous Systems | Digital Engineering | AI Architecture
            </Text>
            <Text style={styles.msmeText}>
              Govt. of India MSME Registered | tochi.devstudio@gmail.com
            </Text>
          </View>
        </View>

        <View style={styles.metaBar}>
          <Text style={{ fontSize: 9.5 }}>Date: {new Date().toLocaleDateString()}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>STUDENT ID: {fellow.student_id}</Text>
          </View>
        </View>

        <View style={styles.toSection}>
          <Text style={{ fontSize: 8.5, color: '#665E64' }}>TO:</Text>
          <Text style={styles.candidateName}>{fellow.full_name}</Text>
          <Text style={{ fontSize: 9.5 }}>{fellow.college || 'Engineering Student'}</Text>
          <Text style={{ fontSize: 8.5, color: '#665E64' }}>
            {fellow.email} | Contact: {fellow.phone}
          </Text>
        </View>

        <View style={styles.subjectBox}>
          <Text style={styles.subjectText}>
            SUBJECT: OFFER OF INTERNSHIP APPOINTMENT - {trackInfo.label.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.bodyText}>
          Dear {fellow.full_name},
        </Text>

        <Text style={styles.bodyText}>
          We are pleased to offer you an appointment as an Engineering Intern at Tochi .dev Studio under the {trackInfo.label} ({trackInfo.code}) track. Based on your application, problem-solving skills, and technical aptitude, we are delighted to welcome you to our upcoming internship cohort.
        </Text>

        <Text style={styles.sectionTitle}>1. INTERNSHIP DURATION & SCHEDULE</Text>
        <Text style={styles.bodyText}>
          The internship is a structured 4-week intensive program commencing on {fellow.cohort_start_date} and concluding on {fellow.cohort_end_date}. During this period, you will collaborate on modern web architecture, autonomous workflow engineering, and production-ready applications.
        </Text>

        <Text style={styles.sectionTitle}>2. ROLES, SCOPE & DELIVERABLES</Text>
        <Text style={styles.bodyText}>
          You will be assigned to practical development tasks and engineering sprints. Deliverables include participating in design reviews, adhering to modern code standards, and deploying project repositories that demonstrate competence in your chosen specialization.
        </Text>

        <Text style={styles.sectionTitle}>3. VERIFICATION & CERTIFICATION</Text>
        <Text style={styles.bodyText}>
          Upon successful completion of the internship milestones and submission review, you will be awarded an official, cryptographically verified Certificate of Internship Completion issued by Tochi .dev Studio and registered under MSME.
        </Text>

        <View style={styles.footer}>
          <View style={styles.signatoryBlock}>
            <Text style={{ fontSize: 9, color: '#665E64' }}>Sincerely,</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#541228', marginTop: 3 }}>
              Antony Sojan
            </Text>
            <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold' }}>Founder</Text>
            <Text style={{ fontSize: 8, color: '#665E64' }}>Tochi .dev Studio</Text>
          </View>

          <View style={styles.qrBlock}>
            {qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImage} /> : null}
            <Text style={{ fontSize: 7, fontFamily: 'Courier-Bold', color: '#541228', marginTop: 2 }}>
              SCAN TO VERIFY LIVE
            </Text>
            <Text style={{ fontSize: 6.5, color: '#665E64' }}>
              {fellow.student_id}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
