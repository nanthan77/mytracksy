import React, { useState } from 'react';

interface InvoiceFormProps {
    onSubmit: (invoice: InvoiceData) => void;
    onCancel: () => void;
}

export interface InvoiceData {
    patientName: string;
    serviceType: string;
    hospital: string;
    amount: number;
    date: string;
    notes: string;
    status: 'pending' | 'paid' | 'overdue';
}

const serviceTypes = [
    'Consultation',
    'Surgery',
    'Lab Work',
    'Prescription',
    'Follow-up',
    'Emergency',
    'Diagnostic Imaging',
    'Physiotherapy',
    'Dental',
    'Specialist Referral',
];

const hospitals = [
    'Private Clinic',
    'Asiri Hospital',
    'Lanka Hospitals',
    'Nawaloka Hospital',
    'Durdans Hospital',
    'National Hospital (Colombo)',
    'Teaching Hospital (Kandy)',
    'Government Hospital',
    'Other',
];

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSubmit, onCancel }) => {
    const [form, setForm] = useState<InvoiceData>({
        patientName: '',
        serviceType: serviceTypes[0],
        hospital: hospitals[0],
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'pending',
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.patientName || !form.amount) return;
        onSubmit(form);
        setForm({
            patientName: '',
            serviceType: serviceTypes[0],
            hospital: hospitals[0],
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            notes: '',
            status: 'pending',
        });
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>🏥 Create Medical Invoice</h2>
                    <button onClick={onCancel} style={styles.closeBtn}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Patient Name *</label>
                            <input
                                type="text"
                                name="patientName"
                                value={form.patientName}
                                onChange={handleChange}
                                placeholder="Enter patient name"
                                style={styles.input}
                                required
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Date</label>
                            <input
                                type="date"
                                name="date"
                                value={form.date}
                                onChange={handleChange}
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Service Type</label>
                            <select
                                name="serviceType"
                                value={form.serviceType}
                                onChange={handleChange}
                                style={styles.input}
                            >
                                {serviceTypes.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Hospital / Clinic</label>
                            <select
                                name="hospital"
                                value={form.hospital}
                                onChange={handleChange}
                                style={styles.input}
                            >
                                {hospitals.map((h) => (
                                    <option key={h} value={h}>
                                        {h}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Amount (LKR) *</label>
                            <input
                                type="number"
                                name="amount"
                                value={form.amount || ''}
                                onChange={handleChange}
                                placeholder="0"
                                style={styles.input}
                                min="0"
                                step="100"
                                required
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Status</label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                style={styles.input}
                            >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Notes</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Additional notes..."
                            style={{ ...styles.input, minHeight: 72, resize: 'vertical' as const }}
                        />
                    </div>

                    <div style={styles.actions}>
                        <button type="button" onClick={onCancel} style={styles.cancelBtn}>
                            Cancel
                        </button>
                        <button type="submit" style={styles.submitBtn}>
                            💾 Create Invoice
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        background: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 580,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid #f1f5f9',
    },
    modalTitle: {
        margin: 0,
        fontSize: '1.15rem',
        fontWeight: 700,
        color: '#1e293b',
    },
    closeBtn: {
        background: '#f1f5f9',
        border: 'none',
        width: 32,
        height: 32,
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: '0.95rem',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    form: {
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.35rem',
    },
    label: {
        fontSize: '0.82rem',
        fontWeight: 600,
        color: '#475569',
    },
    input: {
        padding: '0.6rem 0.85rem',
        border: '1.5px solid #e2e8f0',
        borderRadius: 8,
        fontSize: '0.88rem',
        outline: 'none',
        transition: 'border-color 0.2s ease',
        fontFamily: 'inherit',
        width: '100%',
        boxSizing: 'border-box' as const,
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        marginTop: '0.5rem',
    },
    cancelBtn: {
        padding: '0.6rem 1.25rem',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        background: 'white',
        color: '#64748b',
        fontSize: '0.88rem',
        cursor: 'pointer',
        fontWeight: 500,
    },
    submitBtn: {
        padding: '0.6rem 1.5rem',
        border: 'none',
        borderRadius: 8,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: 'white',
        fontSize: '0.88rem',
        cursor: 'pointer',
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
    },
};

export default InvoiceForm;
