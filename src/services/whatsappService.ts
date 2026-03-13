// src/services/whatsappService.ts
// WhatsApp deep link generator for legal client communications

export interface WhatsAppMessage {
  phone: string;       // International format: 94771234567
  message: string;
}

/**
 * Format a Sri Lankan phone number for WhatsApp.
 * Accepts: 0771234567, +94771234567, 94771234567, 077-123-4567
 * Returns: 94771234567
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Strip all non-digits
  let cleaned = phone.replace(/\D/g, '');
  // If starts with 0, replace with 94 (Sri Lanka country code)
  if (cleaned.startsWith('0')) {
    cleaned = '94' + cleaned.slice(1);
  }
  // If doesn't start with country code, prepend 94
  if (!cleaned.startsWith('94')) {
    cleaned = '94' + cleaned;
  }
  return cleaned;
}

/**
 * Generate a WhatsApp deep link URL.
 * Opens WhatsApp with a pre-filled message to the given phone number.
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Generate a hearing reminder message for a client.
 */
export function hearingReminderMessage(params: {
  clientName: string;
  caseTitle: string;
  court: string;
  courtNo: string;
  date: string;
  time: string;
  hearingType: string;
}): string {
  const { clientName, caseTitle, court, courtNo, date, time, hearingType } = params;
  const formattedDate = new Date(date).toLocaleDateString('en-LK', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  return `Dear ${clientName},\n\nThis is a reminder that your case "${caseTitle}" is listed for ${hearingType} at ${court}, Court No. ${courtNo} on ${formattedDate} at ${time}.\n\nPlease ensure your attendance.\n\nRegards,\nYour Legal Team`;
}

/**
 * Generate a case update message.
 */
export function caseUpdateMessage(params: {
  clientName: string;
  caseTitle: string;
  update: string;
}): string {
  return `Dear ${params.clientName},\n\nUpdate on your case "${params.caseTitle}":\n\n${params.update}\n\nRegards,\nYour Legal Team`;
}

/**
 * Generate a fee note / invoice message.
 */
export function feeNoteMessage(params: {
  clientName: string;
  caseTitle: string;
  amount: number;
  description: string;
}): string {
  const formattedAmount = new Intl.NumberFormat('en-LK', {
    style: 'currency', currency: 'LKR'
  }).format(params.amount);
  return `Dear ${params.clientName},\n\nA fee note of ${formattedAmount} has been raised for your case "${params.caseTitle}".\n\nDetails: ${params.description}\n\nPlease arrange payment at your earliest convenience.\n\nRegards,\nYour Legal Team`;
}
