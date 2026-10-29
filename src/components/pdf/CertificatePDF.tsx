import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Fellow, TRACK_DETAILS } from '@/types/fellow';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#F9F5ED',
    position: 'relative',
    padding: 0,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nameCover: {
    position: 'absolute',
    top: 250,
    left: 180,
    right: 180,
    height: 38,
    backgroundColor: '#F9F5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  internName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#3B0D1F',
    textTransform: 'uppercase',
  },
  qrCover: {
    position: 'absolute',
    bottom: 78,
    left: 390,
    width: 62,
    height: 62,
    backgroundColor: '#F9F5ED',
  },
  qrImage: {
    width: 60,
    height: 60,
  },
  certIdCover: {
    position: 'absolute',
    bottom: 60,
    left: 320,
    right: 320,
    height: 16,
    backgroundColor: '#F9F5ED',
    alignItems: 'center',
  },
  certIdText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#222222',
  },
});

interface CertificateProps {
  fellow: Fellow;
  qrDataUrl: string;
}

export const CertificatePDF: React.FC<CertificateProps> = ({ fellow, qrDataUrl }) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Image src="/assets/certificate-template.jpg" style={styles.backgroundImage} />
        
        <View style={styles.overlayContainer}>
          {/* Overwrite Candidate Name */}
          <View style={styles.nameCover}>
            <Text style={styles.internName}>{fellow.full_name}</Text>
          </View>

          {/* Overwrite Live QR */}
          <View style={styles.qrCover}>
            {qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImage} /> : null}
          </View>

          {/* Overwrite Certificate ID */}
          <View style={styles.certIdCover}>
            <Text style={styles.certIdText}>Certificate ID: {fellow.student_id}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
