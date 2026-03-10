/**
 * GOLDEN LIST — Tax-Deductible Expense Categories for Sri Lankan Doctors
 * 
 * Under Sri Lankan law, doctors CANNOT claim expenses against Government salary.
 * However, they CAN deduct expenses incurred in production of PRIVATE/BUSINESS income.
 * 
 * These categories are pre-built so doctors know exactly what they can legally claim,
 * making the app pay for itself through tax savings.
 */

export interface GoldenCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    taxNote: string;       // Brief legal note shown in UI
    examples: string[];    // Example items
    vendors: string[];     // Auto-categorization keywords
    isCapitalItem?: boolean; // If true, triggers depreciation tracking
}

export const GOLDEN_LIST: GoldenCategory[] = [
    {
        id: 'professional-fees',
        name: 'Professional Fees & Memberships',
        icon: '🏛️',
        color: '#6366f1',
        taxNote: 'Fully deductible against private income. SLMC, GMOA, and specialist college fees.',
        examples: ['SLMC Annual Renewal', 'GMOA Membership', 'College of Surgeons', 'Ceylon College of Physicians', 'College of Radiologists'],
        vendors: ['slmc', 'medical council', 'gmoa', 'college of surgeons', 'college of physicians', 'specialist college', 'membership', 'registration fee'],
    },
    {
        id: 'cme-training',
        name: 'CME / Training & Education',
        icon: '📚',
        color: '#8b5cf6',
        taxNote: 'Conference fees, journal subscriptions, PGIM exam fees — all deductible.',
        examples: ['SLMA Conference', 'International CME', 'BMJ Subscription', 'UpToDate Subscription', 'PGIM Exam Fees', 'Medical Journals'],
        vendors: ['conference', 'seminar', 'workshop', 'training', 'slma', 'pgim', 'bmj', 'uptodate', 'lancet', 'journal', 'cme', 'education', 'exam fee', 'registration'],
    },
    {
        id: 'clinic-rent',
        name: 'Clinic Rent & Utilities',
        icon: '🏠',
        color: '#06b6d4',
        taxNote: 'Only for private clinic/dispensary. Rent, electricity, water, cleaning.',
        examples: ['Clinic Rent', 'Electricity Bill', 'Water Bill', 'Cleaning Service', 'Maintenance', 'Waste Disposal'],
        vendors: ['rent', 'lease', 'electricity', 'ceb', 'leco', 'water', 'nwsdb', 'cleaning', 'maintenance', 'waste'],
    },
    {
        id: 'clinic-staff',
        name: 'Clinic Staff Salaries',
        icon: '👩‍⚕️',
        color: '#ec4899',
        taxNote: 'Wages for dispenser, nurse, receptionist, clinic cleaner working at your private practice.',
        examples: ['Dispenser Salary', 'Nurse Salary', 'Receptionist Salary', 'Clinic Cleaner', 'Lab Assistant'],
        vendors: ['salary', 'wages', 'dispenser', 'nurse', 'receptionist', 'cleaner', 'assistant', 'staff', 'epf', 'etf'],
    },
    {
        id: 'consumables',
        name: 'Medical Consumables',
        icon: '💊',
        color: '#ef4444',
        taxNote: 'Medicines bought wholesale, sanitizers, gloves, syringes, prescription pads.',
        examples: ['Medicines (Wholesale)', 'Surgical Gloves', 'Syringes', 'Sanitizer', 'Prescription Pads', 'Face Masks', 'Gauze & Bandages'],
        vendors: ['pharmacy', 'pharmaceutical', 'drug', 'medicine', 'gloves', 'syringe', 'sanitizer', 'prescription pad', 'medical supplies', 'surgical', 'state pharmaceuticals', 'sp corporation'],
    },
    {
        id: 'capital-equipment',
        name: 'Medical Equipment (Capital)',
        icon: '🔬',
        color: '#f59e0b',
        taxNote: 'Depreciation claimed annually — not all at once. Log purchase price; auditor claims legal rate.',
        examples: ['Stethoscope', 'BP Monitor', 'Ultrasound Scanner', 'ECG Machine', 'Laptop for Patient Records', 'Ophthalmoscope', 'Otoscope'],
        vendors: ['stethoscope', 'bp monitor', 'ultrasound', 'ecg', 'equipment', 'scanner', 'instrument', 'laptop', 'computer', 'printer', 'medical device'],
        isCapitalItem: true,
    },
    {
        id: 'transport',
        name: 'Transport (Private Clinic Travel)',
        icon: '🚗',
        color: '#f97316',
        taxNote: 'Only the % of travel between private clinics — NOT home-to-government hospital.',
        examples: ['Fuel (Clinic Travel)', 'Vehicle Maintenance', 'Leasing Interest', 'PickMe/Uber (Clinic)', 'Toll Fees', 'Parking'],
        vendors: ['fuel', 'petrol', 'diesel', 'lanka ioc', 'ceypetco', 'shell', 'vehicle maintenance', 'service', 'leasing', 'pickme', 'uber', 'taxi', 'parking', 'toll'],
    },
    {
        id: 'telecom',
        name: 'Telecom & Communication',
        icon: '📱',
        color: '#10b981',
        taxNote: 'Dialog/Mobitel bills for tele-consultations. Apportion private vs personal usage.',
        examples: ['Dialog Bill (Tele-consult)', 'Mobitel Bill', 'Internet (Clinic)', 'Zoom/Teams Subscription', 'SMS Gateway'],
        vendors: ['dialog', 'mobitel', 'hutch', 'airtel', 'slt', 'internet', 'broadband', 'zoom', 'teams', 'phone bill', 'mobile bill'],
    },
    {
        id: 'insurance-indemnity',
        name: 'Professional Indemnity & Insurance',
        icon: '🛡️',
        color: '#3b82f6',
        taxNote: 'Medical malpractice insurance / professional indemnity — deductible against private income.',
        examples: ['Medical Indemnity', 'Professional Insurance', 'Clinic Insurance', 'Fire Insurance (Clinic)'],
        vendors: ['insurance', 'indemnity', 'sri lanka insurance', 'allianz', 'ceylinco', 'aia', 'janashakthi', 'cooperative insurance'],
    },
    {
        id: 'office-supplies',
        name: 'Office / Clinic Supplies',
        icon: '📎',
        color: '#64748b',
        taxNote: 'Stationery, patient record folders, stamps, printing for private practice.',
        examples: ['Stationery', 'Patient Record Folders', 'Letterheads', 'Stamps', 'Printer Ink/Toner', 'Envelopes'],
        vendors: ['office', 'stationery', 'atlas', 'paper', 'printing', 'stamp', 'folder', 'envelope', 'toner', 'ink', 'cartridge'],
    },
    {
        id: 'app-subscription',
        name: 'MyTracksy Subscription',
        icon: '✨',
        color: '#a855f7',
        taxNote: '100% deductible! Your MyTracksy subscription is a professional business expense.',
        examples: ['MyTracksy Monthly', 'MyTracksy Annual Plan'],
        vendors: ['mytracksy', 'tracksy'],
    },
    {
        id: 'other',
        name: 'Other Deductible Expense',
        icon: '📋',
        color: '#94a3b8',
        taxNote: 'Any other expense incurred in the production of private practice income.',
        examples: ['Bank Charges (Business Account)', 'Accounting/Tax Filing Fees', 'Legal Fees', 'Marketing/Signage'],
        vendors: [],
    },
];

/** Auto-categorize from vendor name */
export function autoCategorizeDr(vendor: string): string {
    const v = vendor.toLowerCase();
    for (const cat of GOLDEN_LIST) {
        if (cat.vendors.some(kw => v.includes(kw))) return cat.name;
    }
    return 'Other Deductible Expense';
}

/** Get category details by name */
export function getCategoryByName(name: string): GoldenCategory | undefined {
    return GOLDEN_LIST.find(c => c.name === name);
}

/** Check if a category is a capital item (depreciation) */
export function isCapitalItem(categoryName: string): boolean {
    return GOLDEN_LIST.find(c => c.name === categoryName)?.isCapitalItem || false;
}
