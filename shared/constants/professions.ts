import { ProfessionConfig } from '../types/profession';

export const PROFESSIONS: ProfessionConfig[] = [
  { id: 'medical',      label: 'Medical',      icon: '🩺', route: '/dr',        verificationField: 'slmc_number',       verificationLabel: 'SLMC Number',          color: '#E53E3E' },
  { id: 'legal',        label: 'Legal',        icon: '⚖️', route: '/lawyer',    verificationField: 'bar_registration',  verificationLabel: 'Bar Registration',     color: '#3182CE' },
  { id: 'business',     label: 'Business',     icon: '📈', route: '/biz',       verificationField: 'business_reg',      verificationLabel: 'Business Registration',color: '#38A169' },
  { id: 'engineering',  label: 'Engineering',  icon: '⚙️', route: '/engineer',  verificationField: 'iesl_membership',   verificationLabel: 'IESL Membership',      color: '#DD6B20' },
  { id: 'trading',      label: 'Trading',      icon: '📊', route: '/trader',    verificationField: 'trading_license',   verificationLabel: 'Trading License',      color: '#805AD5' },
  { id: 'automotive',   label: 'Automotive',   icon: '🚗', route: '/auto',      verificationField: 'business_reg',      verificationLabel: 'Business Registration',color: '#D53F8C' },
  { id: 'marketing',    label: 'Marketing',    icon: '📢', route: '/marketing', verificationField: 'company_reg',       verificationLabel: 'Company Registration', color: '#00B5D8' },
  { id: 'travel',       label: 'Travel',       icon: '✈️', route: '/travel',    verificationField: 'sltda_license',     verificationLabel: 'SLTDA License',        color: '#319795' },
  { id: 'transport',    label: 'Transport',    icon: '🚛', route: '/transport', verificationField: 'transport_license', verificationLabel: 'Transport License',    color: '#975A16' },
  { id: 'retail',       label: 'Retail',       icon: '🛒', route: '/retail',    verificationField: 'business_reg',      verificationLabel: 'Business Registration',color: '#E53E3E' },
  { id: 'aquaculture',  label: 'Aquaculture',  icon: '🐟', route: '/aqua',      verificationField: 'naqda_license',     verificationLabel: 'NAQDA License',        color: '#2B6CB0' },
  { id: 'individual',   label: 'Individual',   icon: '👤', route: '/personal',  verificationField: 'nic_number',        verificationLabel: 'NIC Number',           color: '#718096' },
];

export const PROFESSION_MAP = Object.fromEntries(
  PROFESSIONS.map(p => [p.id, p])
);
