import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'welcome': 'Welcome to FRA Atlas & DSS',
      'gramasabha_role': 'Grama Sabha Portal',
      'empowering_tribes': 'Empowering tribal communities through digital forest rights management',
      'dashboard': 'Dashboard',
      'map': 'Map',
      'alerts': 'Alerts',
      'settings': 'Settings',
      'claims': 'Claims',
      'login': 'Login',
      'logout': 'Logout',
      'email': 'Email',
      'password': 'Password',
      'total_claims': 'Total Claims',
      'approved_pattas': 'Approved Pattas',
      'pending_claims': 'Pending Claims',
      'rejected_claims': 'Rejected Claims',
      'submit_claim': 'Submit New Claim',
      'view_claims': 'View Claims',
      'active_alerts': 'Active Alerts',
      'encroachment_detected': 'Encroachment Detected',
      'claim_approved': 'Claim Approved',
      'upload_documents': 'Upload Documents',
      'applicant_name': 'Applicant Name',
      'claim_type': 'Claim Type',
      'area_hectares': 'Area (Hectares)',
      'submit': 'Submit',
      'cancel': 'Cancel',
      'acknowledge': 'Acknowledge',
      'resolved': 'Resolved',
      'high_priority': 'High Priority',
      'medium_priority': 'Medium Priority',
      'low_priority': 'Low Priority',
      'offline_mode': 'Offline Mode',
      'language_preference': 'Language Preference',
      'profile_settings': 'Profile Settings',
      'about_fra': 'About Forest Rights Act'
    }
  },
  hi: {
    translation: {
      'welcome': 'FRA एटलस और DSS में आपका स्वागत है',
      'gramasabha_role': 'ग्राम सभा पोर्टल',
      'empowering_tribes': 'डिजिटल वन अधिकार प्रबंधन के माध्यम से आदिवासी समुदायों को सशक्त बनाना',
      'dashboard': 'डैशबोर्ड',
      'map': 'मानचित्र',
      'alerts': 'अलर्ट',
      'settings': 'सेटिंग्स',
      'claims': 'दावे',
      'login': 'लॉगिन',
      'logout': 'लॉगआउट',
      'email': 'ईमेल',
      'password': 'पासवर्ड',
      'total_claims': 'कुल दावे',
      'approved_pattas': 'अनुमोदित पट्टे',
      'pending_claims': 'लंबित दावे',
      'rejected_claims': 'अस्वीकृत दावे',
      'submit_claim': 'नया दावा जमा करें',
      'view_claims': 'दावे देखें',
      'active_alerts': 'सक्रिय अलर्ट',
      'encroachment_detected': 'अतिक्रमण का पता चला',
      'claim_approved': 'दावा अनुमोदित',
      'upload_documents': 'दस्तावेज अपलोड करें',
      'applicant_name': 'आवेदक का नाम',
      'claim_type': 'दावा प्रकार',
      'area_hectares': 'क्षेत्र (हेक्टेयर)',
      'submit': 'जमा करें',
      'cancel': 'रद्द करें',
      'acknowledge': 'स्वीकार करें',
      'resolved': 'हल हो गया',
      'high_priority': 'उच्च प्राथमिकता',
      'medium_priority': 'मध्यम प्राथमिकता',
      'low_priority': 'निम्न प्राथमिकता',
      'offline_mode': 'ऑफलाइन मोड',
      'language_preference': 'भाषा प्राथमिकता',
      'profile_settings': 'प्रोफ़ाइल सेटिंग्स',
      'about_fra': 'वन अधिकार अधिनियम के बारे में'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;