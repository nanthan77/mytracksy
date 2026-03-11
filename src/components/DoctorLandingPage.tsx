import React, { useState, useEffect } from 'react';

interface DoctorLandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onBack: () => void;
}

const DoctorLandingPage: React.FC<DoctorLandingPageProps> = ({ onGetStarted, onLogin, onBack }) => {
    const [scrollY, setScrollY] = useState(0);
    const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
    const [isNavbarFrosted, setIsNavbarFrosted] = useState(false);
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
            setIsNavbarFrosted(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setVisibleElements((prev) => new Set([...prev, entry.target.id]));
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('[data-scroll-reveal]').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const styles = {
        '@keyframes fadeUp': {
            from: { opacity: 0, transform: 'translateY(30px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes gradientShift': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
        },
        '@keyframes orbFloat1': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(30px, -30px)' },
        },
        '@keyframes orbFloat2': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(-40px, 20px)' },
        },
        '@keyframes shimmer': {
            '0%': { backgroundPosition: '-1000px 0' },
            '100%': { backgroundPosition: '1000px 0' },
        },
        '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
        },
    };

    const ppContainer: React.CSSProperties = {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#1f2937',
        backgroundColor: '#f9fafb',
        overflow: 'hidden',
    };

    const ppSection: React.CSSProperties = {
        padding: '60px 20px',
        position: 'relative',
        overflow: 'hidden',
    };

    const ppSectionLarge: React.CSSProperties = {
        ...ppSection,
        padding: '100px 20px',
    };

    const ppInner: React.CSSProperties = {
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
    };

    const ppSR: React.CSSProperties = {
        opacity: 0,
        animation: 'fadeUp 0.6s ease-out forwards',
    };

    const ppBtn: React.CSSProperties = {
        padding: '12px 28px',
        fontSize: '15px',
        fontWeight: 600,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        fontFamily: "'Inter', sans-serif",
    };

    const ppBtnPrimary: React.CSSProperties = {
        ...ppBtn,
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
        color: '#fff',
    };

    const ppBtnOutline: React.CSSProperties = {
        ...ppBtn,
        border: '2px solid #0891b2',
        color: '#0891b2',
        backgroundColor: 'transparent',
    };

    const ppHeading: React.CSSProperties = {
        fontSize: '36px',
        fontWeight: 800,
        marginBottom: '24px',
        lineHeight: 1.2,
        color: '#111827',
    };

    const ppHeadingSmall: React.CSSProperties = {
        fontSize: '24px',
        fontWeight: 700,
        marginBottom: '16px',
        color: '#111827',
    };

    const ppBadge: React.CSSProperties = {
        display: 'inline-block',
        padding: '8px 16px',
        backgroundColor: '#f0f9ff',
        color: '#0891b2',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 600,
        marginBottom: '16px',
        border: '1px solid #a5f3fc',
    };

    const ppCard: React.CSSProperties = {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
        transition: 'all 0.3s ease',
        border: '1px solid #e5e7eb',
    };

    // Navbar styles
    const navbar: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        zIndex: 1000,
        backgroundColor: isNavbarFrosted ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
        backdropFilter: isNavbarFrosted ? 'blur(10px)' : 'none',
        borderBottom: isNavbarFrosted ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
        transition: 'all 0.3s ease',
    };

    const navbarLeft: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
    };

    const navbarRight: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    };

    const navButton: React.CSSProperties = {
        ...ppBtn,
        padding: '10px 18px',
        fontSize: '14px',
    };

    // Hero section styles
    const heroSection: React.CSSProperties = {
        ...ppSectionLarge,
        paddingTop: '120px',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #f0fdfa 100%)',
    };

    const heroInner: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '60px',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
    };

    const heroLeft: React.CSSProperties = {
        zIndex: 2,
    };

    const heroHeadline: React.CSSProperties = {
        fontSize: '52px',
        fontWeight: 900,
        lineHeight: 1.1,
        marginBottom: '24px',
        color: '#111827',
    };

    const heroHeadlineGradient: React.CSSProperties = {
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    };

    const heroSubheadline: React.CSSProperties = {
        fontSize: '18px',
        lineHeight: 1.6,
        color: '#4b5563',
        marginBottom: '32px',
    };

    const heroButtons: React.CSSProperties = {
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
        flexWrap: 'wrap',
    };

    const microText: React.CSSProperties = {
        fontSize: '13px',
        color: '#6b7280',
        marginTop: '8px',
    };

    const heroRight: React.CSSProperties = {
        position: 'relative',
        height: '450px',
    };

    const videoPlaceholder: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: '#1f2937',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
    };

    const playButton: React.CSSProperties = {
        width: '80px',
        height: '80px',
        backgroundColor: 'rgba(8, 145, 178, 0.9)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        transition: 'all 0.3s ease',
    };

    // Problem section
    const problemSection: React.CSSProperties = {
        ...ppSection,
        backgroundColor: '#fff',
    };

    const problemIconRow: React.CSSProperties = {
        display: 'flex',
        gap: '16px',
        marginBottom: '32px',
        justifyContent: 'center',
    };

    const problemIcon: React.CSSProperties = {
        fontSize: '32px',
        padding: '12px 16px',
    };

    const problemTitle: React.CSSProperties = {
        ...ppHeading,
        fontSize: '40px',
        textAlign: 'center',
    };

    const problemSub: React.CSSProperties = {
        textAlign: 'center',
        fontSize: '18px',
        color: '#4b5563',
        marginBottom: '48px',
        maxWidth: '600px',
        margin: '0 auto 48px',
    };

    const problemCards: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px',
    };

    const problemCard: React.CSSProperties = {
        ...ppCard,
        borderLeft: '4px solid #ef4444',
    };

    const problemCardTitle: React.CSSProperties = {
        ...ppHeadingSmall,
        marginBottom: '12px',
    };

    const problemCardDescription: React.CSSProperties = {
        fontSize: '15px',
        color: '#6b7280',
        lineHeight: 1.6,
    };

    const problemClosing: React.CSSProperties = {
        textAlign: 'center',
        fontSize: '20px',
        fontWeight: 700,
        color: '#111827',
        paddingTop: '24px',
        borderTop: '2px solid #e5e7eb',
    };

    // Solutions section
    const solutionsSection: React.CSSProperties = {
        ...ppSection,
        backgroundColor: '#f9fafb',
    };

    const solutionsGrid: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
    };

    const solutionCard: React.CSSProperties = {
        ...ppCard,
        borderTop: '4px solid #0891b2',
    };

    const solutionIcon: React.CSSProperties = {
        fontSize: '40px',
        marginBottom: '16px',
    };

    const solutionTitle: React.CSSProperties = {
        ...ppHeadingSmall,
        marginBottom: '12px',
    };

    const solutionDescription: React.CSSProperties = {
        fontSize: '15px',
        color: '#6b7280',
        marginBottom: '20px',
        lineHeight: 1.6,
    };

    const bulletList: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    };

    const bulletItem: React.CSSProperties = {
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#4b5563',
    };

    const bulletLabel: React.CSSProperties = {
        fontWeight: 700,
        color: '#0891b2',
    };

    // Add-on section
    const addonSection: React.CSSProperties = {
        ...ppSection,
        background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
    };

    const addonTitle: React.CSSProperties = {
        ...ppHeading,
        textAlign: 'center',
    };

    const addonSub: React.CSSProperties = {
        textAlign: 'center',
        fontSize: '18px',
        color: '#4b5563',
        marginBottom: '48px',
        maxWidth: '600px',
        margin: '0 auto 48px',
    };

    const addonCards: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
    };

    const addonCard: React.CSSProperties = {
        ...ppCard,
        backgroundColor: '#fff',
        borderLeft: '4px solid #0891b2',
    };

    // Security section
    const securitySection: React.CSSProperties = {
        ...ppSection,
        background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
        color: '#fff',
    };

    const securityInner: React.CSSProperties = {
        maxWidth: '1000px',
        margin: '0 auto',
    };

    const securityIcon: React.CSSProperties = {
        fontSize: '40px',
        marginRight: '12px',
    };

    const securityTitle: React.CSSProperties = {
        ...ppHeading,
        color: '#fff',
        fontSize: '36px',
    };

    const securitySub: React.CSSProperties = {
        fontSize: '18px',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: '32px',
        maxWidth: '700px',
    };

    const securityBadges: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
    };

    const securityBadge: React.CSSProperties = {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '24px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
    };

    const securityBadgeTitle: React.CSSProperties = {
        fontSize: '16px',
        fontWeight: 700,
        marginBottom: '8px',
        color: '#fff',
    };

    const securityBadgeText: React.CSSProperties = {
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: 1.6,
    };

    // ============ PRICING SECTION STYLES ============
    const pricingSection: React.CSSProperties = {
        ...ppSection,
        backgroundColor: '#fff',
        paddingBottom: '40px',
    };

    const pricingTitle: React.CSSProperties = {
        ...ppHeading,
        textAlign: 'center',
    };

    const pricingSub: React.CSSProperties = {
        textAlign: 'center',
        fontSize: '18px',
        color: '#4b5563',
        maxWidth: '640px',
        margin: '0 auto 32px',
        lineHeight: 1.7,
    };

    // Annual / Monthly toggle
    const toggleWrap: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '44px',
    };

    const toggleLabel = (active: boolean): React.CSSProperties => ({
        fontSize: '15px',
        fontWeight: active ? 700 : 500,
        color: active ? '#111827' : '#9ca3af',
        cursor: 'pointer',
        transition: 'color 0.2s ease',
    });

    const toggleTrack: React.CSSProperties = {
        width: '52px',
        height: '28px',
        borderRadius: '14px',
        backgroundColor: billingCycle === 'annual' ? '#0891b2' : '#d1d5db',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
    };

    const toggleThumb: React.CSSProperties = {
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        position: 'absolute',
        top: '3px',
        left: billingCycle === 'annual' ? '3px' : '27px',
        transition: 'left 0.3s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    };

    const saveBadge: React.CSSProperties = {
        backgroundColor: '#ecfdf5',
        color: '#059669',
        fontSize: '12px',
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: '20px',
        border: '1px solid #a7f3d0',
    };

    // 3-card grid
    const pricingGrid: React.CSSProperties = {
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        maxWidth: '1140px',
        margin: '0 auto 40px',
    };

    const pricingCardBase: React.CSSProperties = {
        ...ppCard,
        flex: '1 1 320px',
        maxWidth: '360px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 28px',
    };

    const pricingCardIntern: React.CSSProperties = {
        ...pricingCardBase,
        borderTop: '4px solid #9ca3af',
    };

    const pricingCardPro: React.CSSProperties = {
        ...pricingCardBase,
        borderTop: '4px solid #0891b2',
        boxShadow: '0 8px 40px rgba(8, 145, 178, 0.18)',
        transform: 'scale(1.03)',
        zIndex: 2,
    };

    const pricingCardDirector: React.CSSProperties = {
        ...pricingCardBase,
        borderTop: '4px solid #7c3aed',
        background: 'linear-gradient(135deg, #faf5ff 0%, #fff 100%)',
    };

    const popularBadge: React.CSSProperties = {
        position: 'absolute' as const,
        top: '-14px',
        right: '20px',
        backgroundColor: '#0891b2',
        color: '#fff',
        fontSize: '11px',
        fontWeight: 700,
        padding: '4px 14px',
        borderRadius: '20px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    };

    const eliteBadge: React.CSSProperties = {
        ...popularBadge,
        backgroundColor: '#7c3aed',
    };

    const planTierLabel = (color: string): React.CSSProperties => ({
        fontSize: '13px',
        fontWeight: 700,
        color,
        textTransform: 'uppercase' as const,
        letterSpacing: '1.5px',
        marginBottom: '4px',
    });

    const planName: React.CSSProperties = {
        fontSize: '20px',
        fontWeight: 700,
        color: '#111827',
        marginBottom: '14px',
    };

    const planPrice: React.CSSProperties = {
        fontSize: '40px',
        fontWeight: 900,
        color: '#111827',
        marginBottom: '4px',
        lineHeight: 1.1,
    };

    const planPriceFree: React.CSSProperties = {
        ...planPrice,
        fontSize: '36px',
        color: '#6b7280',
    };

    const planCycle: React.CSSProperties = {
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '24px',
    };

    const planOldPrice: React.CSSProperties = {
        fontSize: '14px',
        color: '#9ca3af',
        textDecoration: 'line-through',
        marginRight: '8px',
    };

    const featureList: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '24px',
        flex: 1,
    };

    const featureItem: React.CSSProperties = {
        display: 'flex',
        gap: '8px',
        fontSize: '14px',
        color: '#374151',
        lineHeight: 1.5,
    };

    const featureItemHook: React.CSSProperties = {
        ...featureItem,
        color: '#0891b2',
        fontWeight: 600,
        backgroundColor: '#f0fdfa',
        padding: '8px 10px',
        borderRadius: '6px',
        margin: '4px -10px',
    };

    const featureItemDisabled: React.CSSProperties = {
        ...featureItem,
        color: '#9ca3af',
    };

    const taxShieldBox: React.CSSProperties = {
        backgroundColor: '#ecfdf5',
        border: '1px solid #a7f3d0',
        borderRadius: '8px',
        padding: '14px',
        marginBottom: '20px',
        fontSize: '13px',
        color: '#065f46',
        fontWeight: 500,
        lineHeight: 1.6,
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start',
    };

    const auditorROIBox: React.CSSProperties = {
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '14px',
        marginTop: '16px',
        marginBottom: '20px',
        fontSize: '13px',
        color: '#1e40af',
        fontWeight: 500,
        lineHeight: 1.6,
    };

    const freePlanBtn: React.CSSProperties = {
        ...ppBtn,
        backgroundColor: '#f3f4f6',
        color: '#374151',
        fontWeight: 600,
        border: '2px solid #d1d5db',
        width: '100%',
    };

    const directorBtn: React.CSSProperties = {
        ...ppBtn,
        backgroundColor: '#7c3aed',
        color: '#fff',
        fontWeight: 700,
        border: 'none',
        width: '100%',
    };

    // AI Token Store styles
    const tokenStoreWrap: React.CSSProperties = {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 20px',
    };

    const tokenStoreCard: React.CSSProperties = {
        backgroundColor: '#fffbeb',
        border: '2px solid #fcd34d',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
    };

    const tokenStoreTitle: React.CSSProperties = {
        fontSize: '22px',
        fontWeight: 800,
        color: '#92400e',
        marginBottom: '6px',
    };

    const tokenStoreSub: React.CSSProperties = {
        fontSize: '15px',
        color: '#78350f',
        marginBottom: '20px',
    };

    const tokenPrice: React.CSSProperties = {
        fontSize: '28px',
        fontWeight: 900,
        color: '#111827',
        marginBottom: '6px',
    };

    const tokenPriceLabel: React.CSSProperties = {
        fontSize: '14px',
        color: '#92400e',
        marginBottom: '24px',
        fontWeight: 600,
    };

    const tokenGrid: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        textAlign: 'left',
    };

    const tokenItemStyle: React.CSSProperties = {
        backgroundColor: '#fff',
        border: '1px solid #fde68a',
        borderRadius: '8px',
        padding: '12px 14px',
        fontSize: '13px',
        color: '#374151',
        lineHeight: 1.5,
    };

    const tokenCost: React.CSSProperties = {
        fontWeight: 700,
        color: '#92400e',
        marginRight: '6px',
    };

    // ============ COMPLIANCE TRUST STRIP STYLES ============
    const complianceStrip: React.CSSProperties = {
        ...ppSection,
        backgroundColor: '#f0fdf4',
        paddingTop: '40px',
        paddingBottom: '40px',
        borderTop: '2px solid #bbf7d0',
        borderBottom: '2px solid #bbf7d0',
    };

    const complianceInner: React.CSSProperties = {
        maxWidth: '1100px',
        margin: '0 auto',
        textAlign: 'center',
    };

    const complianceTitle: React.CSSProperties = {
        fontSize: '22px',
        fontWeight: 800,
        color: '#065f46',
        marginBottom: '8px',
    };

    const complianceSub: React.CSSProperties = {
        fontSize: '14px',
        color: '#047857',
        marginBottom: '28px',
        lineHeight: 1.7,
        maxWidth: '700px',
        margin: '0 auto 28px',
    };

    const complianceBadges: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
    };

    const complianceBadgeItem: React.CSSProperties = {
        backgroundColor: '#fff',
        border: '1px solid #a7f3d0',
        borderRadius: '10px',
        padding: '14px 20px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#065f46',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
    };

    const complianceDisclaimer: React.CSSProperties = {
        fontSize: '11px',
        color: '#6b7280',
        lineHeight: 1.7,
        maxWidth: '900px',
        margin: '0 auto',
        fontStyle: 'italic',
    };

    // FAQ section
    const faqSection: React.CSSProperties = {
        ...ppSection,
        backgroundColor: '#f9fafb',
    };

    const faqTitle: React.CSSProperties = {
        ...ppHeading,
        textAlign: 'center',
    };

    const faqList: React.CSSProperties = {
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    };

    const faqItem: React.CSSProperties = {
        backgroundColor: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
    };

    const faqQuestion: React.CSSProperties = {
        padding: '20px',
        cursor: 'pointer',
        fontWeight: 600,
        color: '#111827',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        transition: 'background-color 0.2s ease',
    };

    const faqAnswer: React.CSSProperties = {
        padding: '20px',
        color: '#4b5563',
        lineHeight: 1.7,
        fontSize: '15px',
        backgroundColor: '#fff',
        borderTop: '1px solid #e5e7eb',
    };

    const faqToggleIcon: React.CSSProperties = {
        fontSize: '20px',
        transition: 'transform 0.3s ease',
    };

    // Final CTA
    const ctaSection: React.CSSProperties = {
        ...ppSection,
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
        color: '#fff',
        textAlign: 'center',
    };

    const ctaHeading: React.CSSProperties = {
        fontSize: '40px',
        fontWeight: 800,
        marginBottom: '32px',
        color: '#fff',
    };

    const ctaButton: React.CSSProperties = {
        ...ppBtn,
        backgroundColor: '#fff',
        color: '#0891b2',
        fontWeight: 700,
    };

    // Footer — Premium dark design
    const footer: React.CSSProperties = {
        padding: '40px 20px 32px',
        textAlign: 'center',
        backgroundColor: '#020617',
        color: '#94a3b8',
        fontSize: '14px',
        lineHeight: 1.6,
    };

    const footerLinks: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        marginTop: '14px',
    };

    const footerLink: React.CSSProperties = {
        color: '#94a3b8',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'color 0.2s ease',
    };

    const footerDivider: React.CSSProperties = {
        color: '#334155',
    };

    const footerAgencyRow: React.CSSProperties = {
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #1e293b',
        fontSize: '13px',
        color: '#64748b',
    };

    return (
        <div style={ppContainer}>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                    
                    @keyframes fadeUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    @keyframes gradientShift {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }

                    @keyframes orbFloat1 {
                        0%, 100% { transform: translate(0, 0); }
                        50% { transform: translate(30px, -30px); }
                    }

                    @keyframes orbFloat2 {
                        0%, 100% { transform: translate(0, 0); }
                        50% { transform: translate(-40px, 20px); }
                    }

                    @keyframes shimmer {
                        0% { background-position: -1000px 0; }
                        100% { background-position: 1000px 0; }
                    }

                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-20px); }
                    }

                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    .pp-sr {
                        animation: fadeUp 0.6s ease-out forwards;
                    }

                    .pp-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                    }

                    .pp-btn:active {
                        transform: translateY(0);
                    }

                    .pp-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
                    }

                    @media (max-width: 768px) {
                        ${Object.entries({
                            'nav-left': { gap: '12px' },
                            'nav-right': { gap: '8px' },
                            'hero-section': { paddingTop: '100px', paddingBottom: '60px' },
                            'hero-grid': { gridTemplateColumns: '1fr', gap: '40px' },
                            'hero-headline': { fontSize: '36px' },
                            'hero-right': { height: '300px' },
                            'hero-buttons': { flexDirection: 'column' },
                            'problem-title': { fontSize: '32px' },
                            'solutions-grid': { gridTemplateColumns: '1fr' },
                            'addon-grid': { gridTemplateColumns: '1fr' },
                            'security-title': { fontSize: '28px' },
                            'security-badges': { gridTemplateColumns: '1fr' },
                            'pricing-card': { maxWidth: '100%' },
                            'faq-list': { maxWidth: '100%' },
                            'cta-heading': { fontSize: '28px' },
                        })
                            .map(([cls, obj]) =>
                                Object.entries(obj)
                                    .map(([key, val]) => `.pp-${cls} { ${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${val} }`)
                                    .join('\n')
                            )
                            .join('\n')}
                    }
                `}
            </style>

            {/* NAVBAR */}
            <nav style={navbar}>
                <div style={navbarLeft}>
                    <button
                        style={{ ...navButton, ...ppBtnOutline }}
                        onClick={onBack}
                    >
                        ← All Professions
                    </button>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#0891b2' }}>
                        MyTracksy Doctor
                    </div>
                </div>
                <div style={navbarRight}>
                    <button
                        style={{ ...navButton, backgroundColor: 'transparent', border: 'none', color: '#0891b2', fontWeight: 600 }}
                        onClick={onLogin}
                    >
                        Login
                    </button>
                    <button
                        style={{ ...navButton, ...ppBtnPrimary }}
                        onClick={onGetStarted}
                    >
                        Start Free Trial
                    </button>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section style={heroSection}>
                <div style={heroInner}>
                    <div style={heroLeft}>
                        <div style={ppBadge} data-scroll-reveal>
                            🇱🇰 BUILT EXCLUSIVELY FOR SRI LANKAN MEDICAL PROFESSIONALS
                        </div>
                        <h1 style={heroHeadline} data-scroll-reveal>
                            You Mastered Medicine.
                            <div style={heroHeadlineGradient}>
                                Let AI Master Your Admin.
                            </div>
                        </h1>
                        <p style={heroSubheadline} data-scroll-reveal>
                            Juggling Government ward rounds, evening channeling, and complex IRD taxes? MyTracksy is the first AI-powered super-app designed for the chaotic, dual-income lifestyle of the Sri Lankan doctor. Dictate clinical notes in "Singlish," automate your tax deductions, and reclaim 20 hours of your life every month.
                        </p>
                        <div style={heroButtons} data-scroll-reveal>
                            <button
                                style={ppBtnPrimary}
                                onClick={onGetStarted}
                            >
                                👉 Start Your 14-Day Free Trial
                            </button>
                            <button
                                style={ppBtnOutline}
                                onClick={() => alert('Watch demo - Feature coming soon')}
                            >
                                📺 Watch the 1-Minute Demo
                            </button>
                        </div>
                        <div style={microText}>
                            No App Store required. 100% Tax-Deductible Professional Software.
                        </div>
                    </div>
                    <div style={heroRight}>
                        <div
                            style={videoPlaceholder}
                            onClick={() => alert('Demo video - Feature coming soon')}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <div style={playButton}>▶</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PROBLEM SECTION */}
            <section style={problemSection}>
                <div style={ppInner}>
                    <div style={problemIconRow}>
                        <div style={problemIcon}>⏰</div>
                        <div style={problemIcon}>🧾</div>
                        <div style={problemIcon}>🚗</div>
                    </div>
                    <h2 style={problemTitle} data-scroll-reveal>
                        The Sri Lankan Doctor's Reality is Exhausting.
                    </h2>
                    <p style={problemSub} data-scroll-reveal>
                        You didn't spend 5 years in Medical Faculty and countless nights at the PGIM to become a part-time accountant and data-entry clerk.
                    </p>
                    <div style={problemCards} data-scroll-reveal>
                        <div style={problemCard}>
                            <div style={problemCardTitle}>❌ Lost Wealth</div>
                            <p style={problemCardDescription}>
                                Forgetting to check if private hospitals actually deposited your channeling payments into your bank account.
                            </p>
                        </div>
                        <div style={problemCard}>
                            <div style={problemCardTitle}>❌ Tax Anxiety</div>
                            <p style={problemCardDescription}>
                                Handing your auditor a shoebox of faded Keells and fuel receipts in March while guessing your PAYE/APIT brackets.
                            </p>
                        </div>
                        <div style={problemCard}>
                            <div style={problemCardTitle}>❌ Lost Knowledge</div>
                            <p style={problemCardDescription}>
                                Seeing a rare clinical case during a 24-hour Casualty shift, but having zero time to type out the BHT notes for your Casebooks.
                            </p>
                        </div>
                        <div style={problemCard}>
                            <div style={problemCardTitle}>❌ Schedule Chaos</div>
                            <p style={problemCardDescription}>
                                Sitting in Baseline Road traffic, realizing you are going to be late for your private clinic waiting room.
                            </p>
                        </div>
                    </div>
                    <div style={problemClosing} data-scroll-reveal>
                        Stop working for your clinic. Make your clinic work for you.
                    </div>
                </div>
            </section>

            {/* SOLUTIONS SECTION */}
            <section style={solutionsSection}>
                <div style={ppInner}>
                    <h2 style={{ ...ppHeading, textAlign: 'center' }} data-scroll-reveal>
                        Core Solutions (3 Major Feature Blocks)
                    </h2>
                    <div style={solutionsGrid}>
                        {/* Solution 1: Voice Vault */}
                        <div style={solutionCard} data-scroll-reveal>
                            <div style={solutionIcon}>🎙️</div>
                            <h3 style={solutionTitle}>The AI Voice Vault</h3>
                            <p style={solutionDescription}>
                                Zero typing. Just speak. Our proprietary medical AI understands rapid medical jargon mixed with Sri Lankan accents and "Singlish."
                            </p>
                            <ul style={bulletList}>
                                <li style={bulletItem}>
                                    <span style={bulletLabel}>How it works:</span> {' '}
                                    Hold the mic and say, "Patient K.M. awa severe fever eka ekka. Suspected Dengue. Check FBC tomorrow."
                                </li>
                                <li style={bulletItem}>
                                    <span style={bulletLabel}>The Magic:</span> {' '}
                                    In 3 seconds, MyTracksy generates a formal, structured clinical note, tags it #Dengue #RareCase for your MD/MS exams, and automatically adds "Check FBC" to your morning To-Do list.
                                </li>
                                <li style={bulletItem}>
                                    <span style={bulletLabel}>Offline-First:</span> {' '}
                                    Works flawlessly even in the thick concrete dead-zones of government hospital wards. It saves locally and auto-syncs when you get a 4G signal.
                                </li>
                            </ul>
                        </div>

                        {/* Solution 2: Smart Accountant */}
                        <div style={solutionCard} data-scroll-reveal>
                            <div style={solutionIcon}>🏦</div>
                            <h3 style={solutionTitle}>The "Zero-Touch" Smart Accountant</h3>
                            <p style={solutionDescription}>
                                Your finances and taxes, on autopilot. Designed specifically for the Sri Lankan dual-income model (Government Salary + Private Channeling).
                            </p>
                            <ul style={bulletList}>
                                <li style={bulletItem}>
                                    <span style={bulletLabel}>Auto-Bank Sync:</span> {' '}
                                    Auto-forward your bank email alerts. The app instantly reads the deposit and logs your private channeling income without you typing a single number.
                                </li>
                                <li style={bulletItem}>
                                    <span style={bulletLabel}>The IRD Tax Estimator Speedometer:</span> {' '}
                                    Watch your tax liability estimate in real-time based on the latest Sri Lankan national budget brackets. Tax algorithms independently verified by CA Sri Lanka professionals. No end-of-year shocks.
                                </li>
                                <li style={bulletItem}>
                                    <span style={bulletLabel}>1-Click Auditor Export:</span> {' '}
                                    In April, tap one button to email a perfect ISO-standard Excel sheet and a ZIP file of scanned receipts directly to your Chartered Accountant.
                                </li>
                            </ul>
                        </div>

                        {/* Solution 3: Smart Logistics */}
                        <div style={solutionCard} data-scroll-reveal>
                            <div style={solutionIcon}>🚗</div>
                            <h3 style={solutionTitle}>The Smart Logistics Dispatcher</h3>
                            <p style={solutionDescription}>
                                Never double-book. Never be late.
                            </p>
                            <ul style={bulletList}>
                                <li style={bulletItem}>
                                    <span style={bulletLabel}>Dual-Roster Sync:</span> {' '}
                                    Visually merges your MoH Duty Roster (Casualty/On-Call) with your Private Channeling slots so you never clash.
                                </li>
                                <li style={bulletItem}>
                                    <span style={bulletLabel}>Smart Commute Alerts:</span> {' '}
                                    Connects to live traffic data. Get an automated WhatsApp ping: "Heavy traffic on Ward Place. Leave NHSL in 10 mins to make your 4:30 PM Nawaloka clinic."
                                </li>
                                <li style={bulletItem}>
                                    <span style={bulletLabel}>Life Admin:</span> {' '}
                                    Automated reminders for SLMC renewals, vehicle leasing, and GMOA subscriptions.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ADD-ON STORE SECTION */}
            <section style={addonSection}>
                <div style={ppInner}>
                    <h2 style={addonTitle} data-scroll-reveal>
                        Upgrade Your Practice with AI Clinical Superpowers.
                    </h2>
                    <p style={addonSub} data-scroll-reveal>
                        Need to do heavy lifting? Use your MyTracksy Token Wallet to access elite, time-saving AI tools instantly.
                    </p>
                    <div style={addonCards}>
                        <div style={addonCard} data-scroll-reveal>
                            <div style={solutionIcon}>📄</div>
                            <h3 style={solutionTitle}>1-Click Referral Letters</h3>
                            <p style={solutionDescription}>
                                Turn a messy 30-second casual voice note into a beautifully formatted, highly polite PDF Referral Letter to a Consultant in 5 seconds.
                            </p>
                        </div>
                        <div style={addonCard} data-scroll-reveal>
                            <div style={solutionIcon}>📉</div>
                            <h3 style={solutionTitle}>Vision AI Lab Trends</h3>
                            <p style={solutionDescription}>
                                Snap a photo of 4 faded, printed blood reports from the last 6 months. The AI instantly draws a clean trend-graph of the patient's Fasting Blood Sugar right on your screen.
                            </p>
                        </div>
                        <div style={addonCard} data-scroll-reveal>
                            <div style={solutionIcon}>🗣️</div>
                            <h3 style={solutionTitle}>Patient Translator</h3>
                            <p style={solutionDescription}>
                                Dictate dosage instructions in English, and instantly generate a polite Sinhala/Tamil PDF "Take-Home Card" to WhatsApp to your patient.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECURITY SECTION */}
            <section style={securitySection}>
                <div style={securityInner}>
                    <h2 style={{ ...securityTitle, display: 'flex', alignItems: 'center' }} data-scroll-reveal>
                        <span style={securityIcon}>🔒</span>
                        Bank-Grade Security. 100% PDPA Compliant.
                    </h2>
                    <p style={securitySub} data-scroll-reveal>
                        We know medical data is sacred. MyTracksy is engineered to protect you and your patients under Sri Lanka's Personal Data Protection Act (No. 9 of 2022). Your financial and health data is classified as "Special Category Personal Data" — the highest protection class — and we treat it accordingly.
                    </p>
                    <div style={securityBadges}>
                        <div style={securityBadge} data-scroll-reveal>
                            <div style={securityBadgeTitle}>🔒 Local-First Storage</div>
                            <p style={securityBadgeText}>
                                Your data lives instantly on your device for lightning-fast offline access, backed up to our enterprise cloud using AES-256 encryption.
                            </p>
                        </div>
                        <div style={securityBadge} data-scroll-reveal>
                            <div style={securityBadgeTitle}>🛑 Zero-Retention AI Policy</div>
                            <p style={securityBadgeText}>
                                When you use our Voice AI, the original audio file is permanently and irreversibly destroyed the exact millisecond the text note is generated. We use the Enterprise OpenAI API — your voice data and clinical notes are never used to train public AI models. We process your data; we do not keep it.
                            </p>
                        </div>
                        <div style={securityBadge} data-scroll-reveal>
                            <div style={securityBadgeTitle}>🪪 Auto-Redaction</div>
                            <p style={securityBadgeText}>
                                The AI is trained to automatically replace patient full names with initials (e.g., "Kamal Perera" becomes "Patient K.P.") to ensure total clinical anonymity.
                            </p>
                        </div>
                        <div style={securityBadge} data-scroll-reveal>
                            <div style={securityBadgeTitle}>🏦 CBSL-Approved Payments</div>
                            <p style={securityBadgeText}>
                                All payments are processed through Central Bank of Sri Lanka (CBSL) approved Payment Service Providers. We never hold your money — tokens are digital goods, not stored value.
                            </p>
                        </div>
                        <div style={securityBadge} data-scroll-reveal>
                            <div style={securityBadgeTitle}>🤖 Enterprise AI — Your Data Stays Yours</div>
                            <p style={securityBadgeText}>
                                We use the Enterprise OpenAI API with a strict B2B legal clause: your clinical notes are never used to train public AI models. Unlike consumer ChatGPT, your data is processed and discarded — never learned from.
                            </p>
                        </div>
                        <div style={securityBadge} data-scroll-reveal>
                            <div style={securityBadgeTitle}>🌏 Asia-South Servers</div>
                            <p style={securityBadgeText}>
                                Your encrypted data is hosted on enterprise-grade servers in the Asia-South region (Singapore/Mumbai), complying with South Asian data sovereignty expectations under the PDPA.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section style={pricingSection}>
                <div style={ppInner}>
                    <h2 style={pricingTitle} data-scroll-reveal>
                        Costs less than ONE channeling consultation.
                    </h2>
                    <p style={pricingSub} data-scroll-reveal>
                        Why spend LKR 50,000+ on accountant fees and lose hundreds of thousands in forgotten hospital payments? Put your taxes and clinical notes on autopilot.
                    </p>

                    {/* Annual / Monthly Toggle */}
                    <div style={toggleWrap} data-scroll-reveal>
                        <span
                            style={toggleLabel(billingCycle === 'annual')}
                            onClick={() => setBillingCycle('annual')}
                        >Annual</span>
                        <div
                            style={toggleTrack}
                            onClick={() => setBillingCycle(billingCycle === 'annual' ? 'monthly' : 'annual')}
                        >
                            <div style={toggleThumb} />
                        </div>
                        <span
                            style={toggleLabel(billingCycle === 'monthly')}
                            onClick={() => setBillingCycle('monthly')}
                        >Monthly</span>
                        {billingCycle === 'annual' && (
                            <span style={saveBadge}>2 Months Free!</span>
                        )}
                    </div>

                    {/* 3-TIER PRICING GRID */}
                    <div style={pricingGrid}>

                        {/* TIER 1: INTERN / BASIC */}
                        <div style={pricingCardIntern} data-scroll-reveal>
                            <div style={planTierLabel('#6b7280')}>🌱 Tier 1</div>
                            <div style={planName}>Intern / Basic</div>
                            <div style={planPriceFree}>LKR 0</div>
                            <div style={planCycle}>Free Forever — No credit card required</div>
                            <ul style={featureList}>
                                <li style={featureItem}>✅ Basic Dual-Roster Calendar (Manual scheduling)</li>
                                <li style={featureItem}>✅ Manual Ledger — Input Income & Expenses</li>
                                <li style={featureItem}>✅ Basic IRD Tax Estimator (View-only brackets)</li>
                                <li style={featureItem}>✅ PWA — Works Offline on Any Device</li>
                                <li style={featureItemHook}>🎁 5 Free AI Voice Notes / month</li>
                                <li style={featureItemDisabled}>❌ Bank Auto-Sync</li>
                                <li style={featureItemDisabled}>❌ Smart Receipt Scanner</li>
                                <li style={featureItemDisabled}>❌ Auditor Excel Export</li>
                            </ul>
                            <button
                                style={freePlanBtn}
                                onClick={onGetStarted}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                            >
                                Get Started Free
                            </button>
                        </div>

                        {/* TIER 2: PRO / CONSULTANT — 85% of revenue */}
                        <div style={pricingCardPro} data-scroll-reveal>
                            <div style={popularBadge}>Most Popular</div>
                            <div style={planTierLabel('#0891b2')}>🥇 Tier 2</div>
                            <div style={planName}>Pro / Consultant</div>
                            <div style={planPrice}>
                                {billingCycle === 'annual' ? (
                                    <>
                                        <span style={planOldPrice}>LKR 34,800</span>
                                        LKR 29,000
                                    </>
                                ) : (
                                    <>LKR 2,900</>
                                )}
                            </div>
                            <div style={planCycle}>
                                {billingCycle === 'annual'
                                    ? '/ year — That\'s just LKR 2,417/mo (2 Months Free!)'
                                    : '/ month — Switch to annual & save 2 months!'}
                            </div>
                            <ul style={featureList}>
                                <li style={featureItem}>✅ 🎙️ Unlimited Offline AI Voice-to-Text Clinical Notes</li>
                                <li style={featureItem}>✅ 🏦 Zero-Touch Accounting — Bank Email Auto-Sync</li>
                                <li style={featureItem}>✅ ⚖️ Live IRD Tax Estimator (Real-time APIT/PAYE)</li>
                                <li style={featureItem}>✅ 📸 Smart Receipt Scanner for SLMC/fuel deductions</li>
                                <li style={featureItem}>✅ 📑 1-Click Auditor Excel/ZIP Export</li>
                                <li style={featureItem}>✅ 🚗 Smart Commute — Live WhatsApp traffic alerts</li>
                                <li style={featureItemHook}>🎁 50 Free AI Tokens every month for Premium Add-ons!</li>
                            </ul>

                            {/* Jedi Mind Trick #1: Tax Loophole */}
                            <div style={taxShieldBox}>
                                <span style={{ fontSize: '18px', flexShrink: 0 }}>🛡️</span>
                                <span><strong>100% Tax Deductible.</strong> When you subscribe, MyTracksy instantly logs this invoice into your expense tracker as "Professional Medical Software," legally lowering your IRD taxable income.</span>
                            </div>

                            <button
                                style={ppBtnPrimary}
                                onClick={onGetStarted}
                            >
                                Start Your 14-Day Free Trial
                            </button>
                        </div>

                        {/* TIER 3: CLINIC DIRECTOR — Elite B2B */}
                        <div style={pricingCardDirector} data-scroll-reveal>
                            <div style={eliteBadge}>Elite</div>
                            <div style={planTierLabel('#7c3aed')}>💎 Tier 3</div>
                            <div style={planName}>Clinic Director</div>
                            <div style={planPrice}>
                                {billingCycle === 'annual' ? (
                                    <>
                                        <span style={planOldPrice}>LKR 90,000</span>
                                        LKR 75,000
                                    </>
                                ) : (
                                    <>LKR 7,500</>
                                )}
                            </div>
                            <div style={planCycle}>
                                {billingCycle === 'annual'
                                    ? '/ year — That\'s just LKR 6,250/mo'
                                    : '/ month — Switch to annual & save!'}
                            </div>
                            <ul style={featureList}>
                                <li style={featureItem}>✅ Everything in Pro, plus:</li>
                                <li style={featureItem}>✅ 👥 Assistant Sub-Login — Restricted web dashboard for your clinic nurse/dispenser</li>
                                <li style={featureItem}>✅ 📊 Live Cash Dashboard — See front-desk cash totals on your phone during consultations</li>
                                <li style={featureItem}>✅ 🤖 AI WhatsApp Receptionist — Patients WhatsApp your clinic to ask availability & get queue numbers automatically</li>
                                <li style={featureItemHook}>🎁 200 Free AI Tokens every month</li>
                            </ul>
                            <div style={{ ...taxShieldBox, backgroundColor: '#f5f3ff', borderColor: '#c4b5fd', color: '#4c1d95' }}>
                                <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
                                <span><strong>Replace a LKR 35,000/month receptionist</strong> and POS system with one app. The Clinic Director plan pays for itself in week one.</span>
                            </div>
                            <button
                                style={directorBtn}
                                onClick={onGetStarted}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6d28d9'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7c3aed'; }}
                            >
                                Contact Sales
                            </button>
                        </div>
                    </div>

                    {/* Jedi Mind Trick #2: Auditor ROI Pitch */}
                    <div style={auditorROIBox} data-scroll-reveal>
                        📊 <strong>Your Chartered Accountant charges LKR 40,000+</strong> to sort your shoebox of receipts. MyTracksy exports a perfect ISO-standard Excel sheet, cutting your accountant's bill in half. <strong>The app pays for itself every April.</strong>
                    </div>

                    {/* AI TOKEN STORE */}
                    <div style={tokenStoreWrap}>
                        <div style={tokenStoreCard} data-scroll-reveal>
                            <div style={tokenStoreTitle}>🪙 AI Token Store — Pay-As-You-Go</div>
                            <div style={tokenStoreSub}>
                                Run out of your monthly free tokens? Top up instantly. Tokens never expire.
                            </div>
                            <div style={tokenPrice}>LKR 1,500</div>
                            <div style={tokenPriceLabel}>for 100 AI Tokens (LKR 15 each)</div>
                            <div style={tokenGrid}>
                                <div style={tokenItemStyle}>
                                    <span style={tokenCost}>1 Token</span> Generate a PDF Referral Letter to a hospital
                                </div>
                                <div style={tokenItemStyle}>
                                    <span style={tokenCost}>1 Token</span> Generate a printable Sick Leave Medical Certificate
                                </div>
                                <div style={tokenItemStyle}>
                                    <span style={tokenCost}>2 Tokens</span> Translate dosage instructions into Sinhala/Tamil PDF Take-Home Card
                                </div>
                                <div style={tokenItemStyle}>
                                    <span style={tokenCost}>3 Tokens</span> Vision AI reads 4 faded lab reports & draws a trend graph
                                </div>
                                <div style={tokenItemStyle}>
                                    <span style={tokenCost}>15 Tokens</span> Draft a 5-page PGIM Academic Casebook from voice notes
                                </div>
                            </div>
                            <p style={{ marginTop: '16px', fontSize: '13px', color: '#78350f', fontStyle: 'italic' }}>
                                A doctor will happily spend LKR 15 — the price of a piece of chewing gum — to generate a referral letter in 3 seconds rather than writing it by hand while 20 patients wait outside.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* REGULATORY COMPLIANCE TRUST STRIP */}
            <section style={complianceStrip}>
                <div style={complianceInner}>
                    <div style={complianceTitle} data-scroll-reveal>🏛️ Fully Compliant. Legally Ironclad.</div>
                    <p style={complianceSub} data-scroll-reveal>
                        MyTracksy is a registered SaaS platform operating through CBSL-approved payment gateways. We are not a financial institution — we are your intelligent administrative assistant.
                    </p>
                    <div style={complianceBadges} data-scroll-reveal>
                        <div style={complianceBadgeItem}>🛡️ PDPA No. 9 of 2022 Compliant</div>
                        <div style={complianceBadgeItem}>🏦 CBSL-Approved Payment Gateway</div>
                        <div style={complianceBadgeItem}>🔐 AES-256 End-to-End Encryption</div>
                        <div style={complianceBadgeItem}>📜 CA Sri Lanka Verified Tax Algorithms</div>
                        <div style={complianceBadgeItem}>🤖 Enterprise OpenAI API (B2B)</div>
                        <div style={complianceBadgeItem}>🌏 Asia-South Server Hosting</div>
                    </div>
                    <p style={complianceDisclaimer}>
                        Disclaimer: MyTracksy provides tax estimations based on current IRD brackets. It is not a registered tax agent. Final tax liabilities must be verified by your Chartered Accountant prior to RAMIS submission. MyTracksy is an administrative assistant app, not a diagnostic medical device. All clinical notes are generated for the doctor's own reference and are not intended as medical diagnoses.
                    </p>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section style={faqSection}>
                <div style={ppInner}>
                    <h2 style={faqTitle} data-scroll-reveal>
                        Frequently Asked Questions
                    </h2>
                    <div style={faqList}>
                        <div style={faqItem} data-scroll-reveal>
                            <div
                                style={faqQuestion}
                                onClick={() => setExpandedFAQ(expandedFAQ === 0 ? null : 0)}
                            >
                                Do I need to download this from the Apple App Store?
                                <span style={{
                                    ...faqToggleIcon,
                                    transform: expandedFAQ === 0 ? 'rotate(180deg)' : 'rotate(0)'
                                }}>▼</span>
                            </div>
                            {expandedFAQ === 0 && (
                                <div style={faqAnswer}>
                                    No! MyTracksy is an elite Progressive Web App (PWA). This means it takes up zero space on your phone and updates instantly when IRD tax laws change. Simply go to app.mytracksy.lk on Safari or Chrome, tap "Add to Home Screen," and it installs instantly.
                                </div>
                            )}
                        </div>
                        <div style={faqItem} data-scroll-reveal>
                            <div
                                style={faqQuestion}
                                onClick={() => setExpandedFAQ(expandedFAQ === 1 ? null : 1)}
                            >
                                Does the app read my personal emails or steal my bank passwords?
                                <span style={{
                                    ...faqToggleIcon,
                                    transform: expandedFAQ === 1 ? 'rotate(180deg)' : 'rotate(0)'
                                }}>▼</span>
                            </div>
                            {expandedFAQ === 1 && (
                                <div style={faqAnswer}>
                                    Absolutely not. You never give us your email password or bank login. You simply set up a safe "forwarding rule" so your bank's automated alert emails are forwarded to your unique MyTracksy inbox. We only read the math.
                                </div>
                            )}
                        </div>
                        <div style={faqItem} data-scroll-reveal>
                            <div
                                style={faqQuestion}
                                onClick={() => setExpandedFAQ(expandedFAQ === 2 ? null : 2)}
                            >
                                What if the Sri Lankan Tax laws change in the November Budget?
                                <span style={{
                                    ...faqToggleIcon,
                                    transform: expandedFAQ === 2 ? 'rotate(180deg)' : 'rotate(0)'
                                }}>▼</span>
                            </div>
                            {expandedFAQ === 2 && (
                                <div style={faqAnswer}>
                                    Our servers are updated within 24 hours of the Finance Minister's budget speech. Your mobile app will automatically use the new mathematical brackets without you needing to lift a finger.
                                </div>
                            )}
                        </div>
                        <div style={faqItem} data-scroll-reveal>
                            <div
                                style={faqQuestion}
                                onClick={() => setExpandedFAQ(expandedFAQ === 3 ? null : 3)}
                            >
                                Does MyTracksy share my patient data with advertisers or third parties?
                                <span style={{
                                    ...faqToggleIcon,
                                    transform: expandedFAQ === 3 ? 'rotate(180deg)' : 'rotate(0)'
                                }}>▼</span>
                            </div>
                            {expandedFAQ === 3 && (
                                <div style={faqAnswer}>
                                    Absolutely never. MyTracksy uses the Enterprise OpenAI API, which has a strict B2B legal clause ensuring your data is never used to train public AI models. Patient notes are auto-redacted to initials only (e.g., "Patient K.P."), and all voice recordings are irreversibly destroyed in milliseconds. We are fully PDPA (No. 9 of 2022) compliant and have zero advertising in the app.
                                </div>
                            )}
                        </div>
                        <div style={faqItem} data-scroll-reveal>
                            <div
                                style={faqQuestion}
                                onClick={() => setExpandedFAQ(expandedFAQ === 4 ? null : 4)}
                            >
                                Can the IRD fine me if your tax calculations are wrong?
                                <span style={{
                                    ...faqToggleIcon,
                                    transform: expandedFAQ === 4 ? 'rotate(180deg)' : 'rotate(0)'
                                }}>▼</span>
                            </div>
                            {expandedFAQ === 4 && (
                                <div style={faqAnswer}>
                                    MyTracksy is a Tax Estimator — not a tax submitter. Our algorithms are independently verified by CA Sri Lanka professionals to ensure accuracy against current IRD brackets. However, final tax liabilities must always be confirmed by your Chartered Accountant before RAMIS submission. Think of us as the smartest assistant who does 95% of the work, so your CA only needs to verify, not start from scratch.
                                </div>
                            )}
                        </div>
                        <div style={faqItem} data-scroll-reveal>
                            <div
                                style={faqQuestion}
                                onClick={() => setExpandedFAQ(expandedFAQ === 5 ? null : 5)}
                            >
                                Is MyTracksy a registered company? How do I know my payments are safe?
                                <span style={{
                                    ...faqToggleIcon,
                                    transform: expandedFAQ === 5 ? 'rotate(180deg)' : 'rotate(0)'
                                }}>▼</span>
                            </div>
                            {expandedFAQ === 5 && (
                                <div style={faqAnswer}>
                                    MyTracksy is operated by a registered Sri Lankan Private Limited Company. All payments are processed through CBSL (Central Bank of Sri Lanka) approved payment gateways like PayHere, using secure Visa/Mastercard infrastructure. When you buy AI Tokens, you are purchasing a digital software product — not depositing money into a wallet. Your tokens are non-refundable digital goods that never expire, and your payment is fully PCI-DSS compliant.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA SECTION */}
            <section style={ctaSection}>
                <div style={ppInner}>
                    <h2 style={ctaHeading} data-scroll-reveal>
                        Ready to Reclaim 20 Hours a Month?
                    </h2>
                    <button
                        style={ctaButton}
                        onClick={onGetStarted}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        Start Your 14-Day Free Trial
                    </button>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={footer}>
                <div>
                    © 2026 MyTracksy (Pvt) Ltd. Built with ❤️ in Jaffna for Sri Lankan Healthcare Professionals.
                </div>
                <div style={footerLinks}>
                    <a
                        style={footerLink}
                        onClick={() => alert('Terms of Service')}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    >
                        Terms of Service
                    </a>
                    <span style={footerDivider}>|</span>
                    <a
                        style={footerLink}
                        onClick={() => alert('Privacy Policy')}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    >
                        Privacy Policy
                    </a>
                    <span style={footerDivider}>|</span>
                    <a
                        style={footerLink}
                        onClick={() => alert('PDPA Compliance Statement')}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    >
                        PDPA Compliance Statement
                    </a>
                </div>
                <div style={footerAgencyRow}>
                    Designed & Engineered by{' '}
                    <a
                        href="https://www.safenetcreations.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                        SafeNet Creations
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default DoctorLandingPage;
