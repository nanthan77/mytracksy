export const MYTRACKSY_CONTACT = {
    email: 'info@mytracksy.com',
    phoneDisplay: '070 373 6555',
    phoneHref: 'tel:+94703736555',
    whatsappNumber: '94703736555',
    whatsappUrl: 'https://wa.me/94703736555',
};

export function mytracksyMailto(subject: string): string {
    return `mailto:${MYTRACKSY_CONTACT.email}?subject=${encodeURIComponent(subject)}`;
}

export function mytracksyWhatsApp(message: string): string {
    return `${MYTRACKSY_CONTACT.whatsappUrl}?text=${encodeURIComponent(message)}`;
}
