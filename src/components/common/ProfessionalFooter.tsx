import React from 'react';
import { ArrowRight, ExternalLink, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { MYTRACKSY_CONTACT, mytracksyWhatsApp } from '../../config/contact';

interface FooterLink {
    label: string;
    href?: string;
    onClick?: () => void;
}

interface ProfessionalFooterProps {
    productName: string;
    professionLabel: string;
    description: string;
    accentColor: string;
    variant?: 'light' | 'dark';
    statusText?: string;
    primaryCta?: string;
    whatsappMessage?: string;
    links?: FooterLink[];
    onGetStarted: () => void;
    onLogin: () => void;
    onBack?: () => void;
}

const DEFAULT_LINKS: FooterLink[] = [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
];

const ProfessionalFooter: React.FC<ProfessionalFooterProps> = ({
    productName,
    professionLabel,
    description,
    accentColor,
    variant = 'dark',
    statusText = 'Professional landing page ready',
    primaryCta = 'Start free',
    whatsappMessage,
    links = DEFAULT_LINKS,
    onGetStarted,
    onLogin,
    onBack,
}) => {
    const isDark = variant === 'dark';
    const bg = isDark ? '#07111f' : '#f8fafc';
    const panelBg = isDark ? 'rgba(255,255,255,0.055)' : '#ffffff';
    const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)';
    const text = isDark ? '#f8fafc' : '#0f172a';
    const muted = isDark ? '#94a3b8' : '#64748b';

    const footerLinks = onBack
        ? [{ label: 'All professions', onClick: onBack }, ...links]
        : links;

    const safeMessage = whatsappMessage ?? `Hi MyTracksy, I want to discuss ${productName}.`;

    const cssVars = {
        '--pf-accent': accentColor,
        '--pf-bg': bg,
        '--pf-panel': panelBg,
        '--pf-border': border,
        '--pf-text': text,
        '--pf-muted': muted,
    } as React.CSSProperties;

    return (
        <footer className="professional-footer" role="contentinfo" style={cssVars}>
            <style>{`
                .professional-footer {
                    background:
                        radial-gradient(circle at 12% 12%, color-mix(in srgb, var(--pf-accent) 20%, transparent), transparent 34%),
                        radial-gradient(circle at 88% 20%, color-mix(in srgb, var(--pf-accent) 16%, transparent), transparent 30%),
                        var(--pf-bg);
                    color: var(--pf-text);
                    padding: 88px 24px 36px;
                    border-top: 1px solid var(--pf-border);
                    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }
                .professional-footer__shell {
                    max-width: 1180px;
                    margin: 0 auto;
                }
                .professional-footer__hero {
                    display: grid;
                    grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
                    gap: 36px;
                    align-items: stretch;
                    margin-bottom: 42px;
                }
                .professional-footer__brand {
                    display: grid;
                    grid-template-columns: 108px minmax(0, 1fr);
                    gap: 24px;
                    align-items: start;
                }
                .professional-footer__logo {
                    width: 108px;
                    height: 108px;
                    border-radius: 26px;
                    background: #ffffff;
                    display: grid;
                    place-items: center;
                    box-shadow: 0 24px 60px -24px color-mix(in srgb, var(--pf-accent) 72%, #000);
                    border: 1px solid rgba(255,255,255,0.5);
                }
                .professional-footer__logo img {
                    width: 76px;
                    height: 76px;
                    object-fit: contain;
                }
                .professional-footer__eyebrow {
                    color: var(--pf-accent);
                    font-size: 12px;
                    font-weight: 900;
                    letter-spacing: 0.11em;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                }
                .professional-footer__title {
                    font-size: clamp(2.5rem, 5vw, 5rem);
                    line-height: 0.96;
                    letter-spacing: -0.06em;
                    font-weight: 900;
                    margin: 0 0 18px;
                    color: var(--pf-text);
                }
                .professional-footer__desc {
                    color: var(--pf-muted);
                    font-size: 17px;
                    line-height: 1.75;
                    max-width: 650px;
                    margin: 0;
                }
                .professional-footer__panel {
                    background: var(--pf-panel);
                    border: 1px solid var(--pf-border);
                    border-radius: 28px;
                    padding: 28px;
                    box-shadow: 0 24px 70px -36px rgba(0,0,0,0.45);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    gap: 26px;
                }
                .professional-footer__status {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: var(--pf-muted);
                    font-size: 14px;
                    font-weight: 700;
                }
                .professional-footer__status svg {
                    color: #22c55e;
                    flex: 0 0 auto;
                }
                .professional-footer__actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .professional-footer__btn,
                .professional-footer__link-btn {
                    min-height: 48px;
                    border-radius: 14px;
                    border: 1px solid var(--pf-border);
                    font: inherit;
                    font-weight: 800;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    text-decoration: none;
                    transition: transform .2s ease, border-color .2s ease, background .2s ease;
                }
                .professional-footer__btn:hover,
                .professional-footer__link-btn:hover {
                    transform: translateY(-2px);
                    border-color: color-mix(in srgb, var(--pf-accent) 52%, var(--pf-border));
                }
                .professional-footer__btn--primary {
                    background: var(--pf-accent);
                    color: #ffffff;
                    border-color: transparent;
                    box-shadow: 0 18px 34px -22px var(--pf-accent);
                }
                .professional-footer__link-btn {
                    color: var(--pf-text);
                    background: transparent;
                }
                .professional-footer__grid {
                    display: grid;
                    grid-template-columns: 1.1fr 1fr 1fr;
                    gap: 28px;
                    padding: 34px 0;
                    border-top: 1px solid var(--pf-border);
                    border-bottom: 1px solid var(--pf-border);
                }
                .professional-footer__heading {
                    color: var(--pf-text);
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: .08em;
                    font-weight: 900;
                    margin: 0 0 16px;
                }
                .professional-footer__text,
                .professional-footer__nav {
                    color: var(--pf-muted);
                    font-size: 14px;
                    line-height: 1.7;
                }
                .professional-footer__nav {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px 16px;
                }
                .professional-footer__nav a,
                .professional-footer__nav button {
                    color: var(--pf-muted);
                    background: none;
                    border: none;
                    padding: 0;
                    font: inherit;
                    font-weight: 700;
                    cursor: pointer;
                    text-decoration: none;
                }
                .professional-footer__nav a:hover,
                .professional-footer__nav button:hover {
                    color: var(--pf-accent);
                }
                .professional-footer__contact {
                    display: grid;
                    gap: 10px;
                }
                .professional-footer__contact a {
                    color: var(--pf-muted);
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 9px;
                    font-size: 14px;
                    font-weight: 700;
                }
                .professional-footer__contact a:hover {
                    color: var(--pf-accent);
                }
                .professional-footer__bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 18px;
                    flex-wrap: wrap;
                    padding-top: 28px;
                    color: var(--pf-muted);
                    font-size: 13px;
                    font-weight: 650;
                }
                .professional-footer__bottom a {
                    color: var(--pf-accent);
                    text-decoration: none;
                    font-weight: 850;
                }
                @media (max-width: 820px) {
                    .professional-footer {
                        padding: 72px 20px 32px;
                    }
                    .professional-footer__hero,
                    .professional-footer__grid {
                        grid-template-columns: 1fr;
                    }
                    .professional-footer__brand {
                        grid-template-columns: 1fr;
                        text-align: center;
                    }
                    .professional-footer__logo {
                        margin: 0 auto;
                    }
                    .professional-footer__desc {
                        margin: 0 auto;
                    }
                    .professional-footer__panel {
                        padding: 22px;
                    }
                    .professional-footer__bottom {
                        justify-content: center;
                        text-align: center;
                    }
                    .professional-footer__nav {
                        justify-content: center;
                    }
                }
            `}</style>

            <div className="professional-footer__shell">
                <div className="professional-footer__hero">
                    <div className="professional-footer__brand">
                        <div className="professional-footer__logo" aria-hidden="true">
                            <img src="/logos/mytracksy-logo.png" alt="" />
                        </div>
                        <div>
                            <div className="professional-footer__eyebrow">{professionLabel}</div>
                            <h2 className="professional-footer__title">{productName}</h2>
                            <p className="professional-footer__desc">{description}</p>
                        </div>
                    </div>

                    <div className="professional-footer__panel">
                        <div className="professional-footer__status">
                            <ShieldCheck size={20} />
                            <span>{statusText}</span>
                        </div>
                        <div className="professional-footer__actions">
                            <button className="professional-footer__btn professional-footer__btn--primary" onClick={onGetStarted}>
                                {primaryCta}
                                <ArrowRight size={18} />
                            </button>
                            <a
                                className="professional-footer__link-btn"
                                href={mytracksyWhatsApp(safeMessage)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MessageCircle size={18} />
                                WhatsApp MyTracksy
                            </a>
                            <button className="professional-footer__link-btn" onClick={onLogin}>
                                Sign in
                            </button>
                        </div>
                    </div>
                </div>

                <div className="professional-footer__grid">
                    <div>
                        <h3 className="professional-footer__heading">Built For</h3>
                        <p className="professional-footer__text">
                            A dedicated MyTracksy professional landing page with local demos, installable PWA flows,
                            privacy-first records, and Sri Lanka-ready business support.
                        </p>
                    </div>
                    <div>
                        <h3 className="professional-footer__heading">Explore</h3>
                        <nav className="professional-footer__nav" aria-label={`${productName} footer links`}>
                            {footerLinks.map((link) => link.href ? (
                                <a key={link.label} href={link.href}>{link.label}</a>
                            ) : (
                                <button key={link.label} type="button" onClick={link.onClick}>{link.label}</button>
                            ))}
                            <a href="https://safenetcreations.com/" target="_blank" rel="noopener noreferrer">
                                SafeNet <ExternalLink size={12} />
                            </a>
                        </nav>
                    </div>
                    <div>
                        <h3 className="professional-footer__heading">Contact</h3>
                        <div className="professional-footer__contact">
                            <a href={`mailto:${MYTRACKSY_CONTACT.email}`}><Mail size={16} /> {MYTRACKSY_CONTACT.email}</a>
                            <a href={MYTRACKSY_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> WhatsApp {MYTRACKSY_CONTACT.phoneDisplay}</a>
                            <a href={MYTRACKSY_CONTACT.phoneHref}><Phone size={16} /> Call {MYTRACKSY_CONTACT.phoneDisplay}</a>
                        </div>
                    </div>
                </div>

                <div className="professional-footer__bottom">
                    <span>© 2026 {productName}. A MyTracksy professional product.</span>
                    <span>
                        Designed and engineered in Sri Lanka by{' '}
                        <a href="https://safenetcreations.com/" target="_blank" rel="noopener noreferrer">
                            SafeNet Creations
                        </a>.
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default ProfessionalFooter;
