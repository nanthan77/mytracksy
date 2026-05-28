import { MYTRACKSY_CONTACT, mytracksyWhatsApp } from './contact';

export const MYTRACKSY_PAYMENT_STATUS = {
    onlineCheckoutEnabled: false,
    notice: 'Online card checkout is temporarily paused while the MyTracksy merchant account and domain approval are completed.',
    support: `For paid activation, request a MyTracksy invoice via ${MYTRACKSY_CONTACT.email} or WhatsApp ${MYTRACKSY_CONTACT.phoneDisplay}.`,
};

export function buildPaymentRequestMessage(context: string): string {
    return [
        'Hi MyTracksy,',
        `I want to activate ${context}.`,
        'Please send me the MyTracksy invoice and payment options.',
    ].join(' ');
}

export function getPaymentRequestUrl(context: string): string {
    return mytracksyWhatsApp(buildPaymentRequestMessage(context));
}
