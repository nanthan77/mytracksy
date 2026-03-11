import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { PROFESSION_ROUTES, ProfessionRouteConfig } from '../config/professionRoutes';
import DoctorLandingPage from './DoctorLandingPage';
import CreatorLandingPage from './CreatorLandingPage';
import LawyerLandingPage from './LawyerLandingPage';

interface ProfessionLandingPageProps {
    slug: string;
    onGetStarted: () => void;
    onLogin: () => void;
    onBack: () => void;
}

// Profession-specific content data
const professionContent: Record<string, {
    headline: string; subline: string; features: { icon: string; title: string; desc: string }[];
    demoDesc: string; useCases: string[]; testimonialQuote: string; testimonialAuthor: string;
}> = {
    dr: {
        headline: 'Financial Management Built for Doctors',
        subline: 'Track patient billing, manage clinic expenses, handle EPF/ETF for staff, and stay tax compliant — all from your phone. Your medical practice finances, simplified.',
        features: [
            { icon: '🏥', title: 'Clinic Revenue Tracking', desc: 'Track OPD, channeling, surgeries, and lab income separately. Real-time revenue dashboards.' },
            { icon: '💊', title: 'Prescription & Billing', desc: 'Digital prescription pad with integrated billing. Track pharmacy commissions and referral income.' },
            { icon: '📋', title: 'Staff Payroll & EPF', desc: 'Automated EPF/ETF calculations for clinic staff. APIT compliance built in.' },
            { icon: '📊', title: 'Tax Intelligence', desc: 'Auto-categorize medical expenses. Generate IRD-ready tax returns. Withholding tax tracking.' },
            { icon: '🗓️', title: 'Appointment Economics', desc: 'See revenue per time slot. Optimize your schedule for maximum earnings.' },
            { icon: '🔒', title: 'Patient Data Safe', desc: 'Zero patient data stored. Only your financial records — on your device only.' },
        ],
        demoDesc: 'See how Dr. Perera manages 3 clinic locations, tracks Rs. 2.5M monthly revenue, and files taxes in minutes.',
        useCases: ['Private Practice', 'Hospital Channeling', 'Multi-Clinic Management', 'Specialist Practice', 'Medical Lab Owners'],
        testimonialQuote: 'MyTracksy replaced my Excel sheets and my accountant\'s monthly headaches. Everything is on my phone now.',
        testimonialAuthor: 'Dr. K. Perera, Cardiologist — Colombo',
    }, legal: {
        headline: 'Financial Management Built for Lawyers',
        subline: 'Track case billing, retainer fees, court expenses, and client payments. Stay compliant with Bar Association and IRD requirements.',
        features: [
            { icon: '⚖️', title: 'Case-Based Billing', desc: 'Track billable hours, retainers, and case expenses. Generate client invoices instantly.' },
            { icon: '📁', title: 'Client Ledger', desc: 'Per-client financial tracking. See outstanding payments, advances, and settlements at a glance.' },
            { icon: '🏛️', title: 'Court Fee Tracking', desc: 'Track court filing fees, stamp duties, and disbursements. Auto-categorize legal expenses.' },
            { icon: '📊', title: 'Tax & Compliance', desc: 'Automated APIT, WHT tracking. Generate IRD-ready reports for legal practice income.' },
            { icon: '👥', title: 'Staff & Associates', desc: 'Manage junior lawyer payments, clerk salaries, and office expenses.' },
            { icon: '🔒', title: 'Client Confidentiality', desc: 'All data on your device. No client financial data ever leaves your phone.' },
        ],
        demoDesc: 'See how Attorney Silva manages 45 active cases, tracks LKR 1.8M in retainers, and generates monthly billing reports.',
        useCases: ['Private Practice', 'Law Firm Partner', 'Corporate Counsel', 'Notary Public', 'Legal Consultant'],
        testimonialQuote: 'Finally, a finance app that understands legal billing. Case-based tracking changed everything for my practice.',
        testimonialAuthor: 'Attorney M. Silva, Civil Law — Kandy',
    },
    engineering: {
        headline: 'Financial Management Built for Engineers',
        subline: 'Track project budgets, site expenses, material costs, and consultant payments. Engineering project finances made crystal clear.',
        features: [
            { icon: '🏗️', title: 'Project Cost Tracking', desc: 'Track budgets per project/site. Material, labor, and overhead cost breakdowns.' },
            { icon: '📐', title: 'BOQ & Estimates', desc: 'Compare estimated vs actual costs in real-time. Never go over budget again.' },
            { icon: '🚜', title: 'Material & Equipment', desc: 'Track material purchases, equipment rentals, and supplier payments per project.' },
            { icon: '👷', title: 'Labor & Subcontractor', desc: 'Manage worker payments, subcontractor invoices, and daily wage calculations.' },
            { icon: '📊', title: 'Project P&L', desc: 'See profit/loss per project. Compare margins across multiple sites.' },
            { icon: '🔒', title: 'Project Data Safe', desc: 'Sensitive project financials stay on your device. Client data never exposed.' },
        ],
        demoDesc: 'See how Eng. Fernando tracks 5 concurrent projects, manages LKR 15M in budgets, and monitors profit margins live.',
        useCases: ['Civil Engineer', 'Structural Consultant', 'Quantity Surveyor', 'MEP Engineer', 'Project Manager'],
        testimonialQuote: 'Tracking 5 sites used to be chaos. Now I see every project\'s P&L on my phone before the morning meeting.',
        testimonialAuthor: 'Eng. R. Fernando, Civil — Gampaha',
    }, business: {
        headline: 'Financial Management Built for Business Owners',
        subline: 'Multi-company accounting, invoicing, inventory, and cash flow management. Run your entire business from one dashboard.',
        features: [
            { icon: '💼', title: 'Multi-Company', desc: 'Manage multiple businesses from one account. Consolidated and individual financial views.' },
            { icon: '🧾', title: 'Invoicing & Receipts', desc: 'Create professional invoices, track receivables, and manage payment follow-ups.' },
            { icon: '📦', title: 'Inventory Management', desc: 'Track stock levels, purchase orders, and supplier payments across all locations.' },
            { icon: '💰', title: 'Cash Flow Forecasting', desc: 'AI-powered cash flow predictions. Know your runway and plan ahead with confidence.' },
            { icon: '📊', title: 'Business Intelligence', desc: 'Revenue trends, expense patterns, and profitability dashboards for smarter decisions.' },
            { icon: '🔒', title: 'Business Data Safe', desc: 'Sensitive business financials on your device only. Competitor-proof data security.' },
        ],
        demoDesc: 'See how a Colombo retailer manages 3 shops, tracks LKR 8M monthly turnover, and automates supplier payments.',
        useCases: ['SME Owner', 'Franchise Operator', 'Import/Export', 'Restaurant Owner', 'Service Provider'],
        testimonialQuote: 'Managing 3 companies used to need 3 accountants. MyTracksy gives me one dashboard for everything.',
        testimonialAuthor: 'Amal J., Business Owner — Colombo',
    },
    trading: {
        headline: 'Financial Management Built for Traders',
        subline: 'Track buy/sell transactions, calculate profit margins, manage inventory, and monitor market positions in real-time.',
        features: [
            { icon: '📈', title: 'Trade Tracking', desc: 'Log buy/sell with instant P&L calculation. Track margins per product and per deal.' },
            { icon: '📦', title: 'Inventory & Stock', desc: 'Real-time stock levels, FIFO/LIFO costing, and reorder alerts.' },
            { icon: '💱', title: 'Multi-Currency', desc: 'Handle LKR, USD, EUR transactions. Auto forex conversion at daily rates.' },
            { icon: '🧾', title: 'Supplier Ledger', desc: 'Track supplier credits, advance payments, and outstanding balances per vendor.' },
            { icon: '📊', title: 'Margin Analytics', desc: 'See which products earn the most. Optimize your trading strategy with data.' },
            { icon: '🔒', title: 'Trade Secrets Safe', desc: 'Your pricing, margins, and supplier details never leave your device.' },
        ],
        demoDesc: 'See how a Pettah wholesaler tracks 500+ SKUs, manages 30 suppliers, and calculates margins instantly.',
        useCases: ['Wholesale Trader', 'Import Dealer', 'Commodity Trader', 'Online Reseller', 'Distributor'],
        testimonialQuote: 'I know my margin on every item in seconds. No more guessing on pricing during negotiations.',
        testimonialAuthor: 'Nimal S., Wholesale Trader — Pettah',
    }, automotive: {
        headline: 'Financial Management Built for Automotive',
        subline: 'Track service jobs, parts inventory, mechanic wages, and customer billing. Workshop management made effortless.',
        features: [
            { icon: '🔧', title: 'Job Card Billing', desc: 'Create digital job cards with labor, parts, and service charges. Instant customer invoicing.' },
            { icon: '🚗', title: 'Vehicle History', desc: 'Track service history per vehicle/customer. Build loyalty with data-driven service reminders.' },
            { icon: '📦', title: 'Parts Inventory', desc: 'Track spare parts stock, supplier orders, and reorder points. Never run out of critical parts.' },
            { icon: '👨‍🔧', title: 'Mechanic Payroll', desc: 'Track mechanic hours, job-based commissions, and overtime. Fair pay calculations.' },
            { icon: '📊', title: 'Workshop P&L', desc: 'See daily/weekly/monthly revenue. Track which services are most profitable.' },
            { icon: '🔒', title: 'Customer Data Safe', desc: 'Vehicle and customer data stays on your device. Privacy guaranteed.' },
        ],
        demoDesc: 'See how a Nugegoda garage manages 20 daily jobs, tracks parts inventory, and calculates mechanic commissions.',
        useCases: ['Garage Owner', 'Auto Electrician', 'Body Shop', 'Tire & Service Center', 'Fleet Maintenance'],
        testimonialQuote: 'Parts inventory tracking alone saved me LKR 50,000 a month in waste. The job card billing is a bonus.',
        testimonialAuthor: 'Chaminda R., Garage Owner — Nugegoda',
    },
    marketing: {
        headline: 'Financial Management Built for Marketing',
        subline: 'Track campaign budgets, client retainers, freelancer payments, and ROI. Creative agency finances under control.',
        features: [
            { icon: '📣', title: 'Campaign Budgeting', desc: 'Track spending per campaign and client. Compare budget vs actual in real-time.' },
            { icon: '💼', title: 'Client Retainers', desc: 'Manage monthly retainers, project fees, and milestone payments. Auto-invoicing.' },
            { icon: '🎨', title: 'Freelancer Payments', desc: 'Track freelancer/contractor invoices, WHT deductions, and payment schedules.' },
            { icon: '📊', title: 'ROI Dashboard', desc: 'See return on ad spend, client profitability, and campaign performance metrics.' },
            { icon: '🧾', title: 'Expense Claims', desc: 'Digital expense claims for shoots, events, and client entertainment. Photo receipts.' },
            { icon: '🔒', title: 'Client Data Protected', desc: 'Client budgets and campaign data stay on your device. NDA-level security.' },
        ],
        demoDesc: 'See how a Colombo agency manages 15 clients, tracks LKR 3M monthly ad spend, and calculates campaign ROI.',
        useCases: ['Digital Agency', 'Creative Studio', 'Social Media Manager', 'PR Firm', 'Freelance Marketer'],
        testimonialQuote: 'Client profitability reports used to take days. Now I see them live on my dashboard between meetings.',
        testimonialAuthor: 'Dilani P., Agency Director — Colombo',
    }, travel: {
        headline: 'Financial Management Built for Travel Agencies',
        subline: 'Track bookings, commissions, tour package costs, and agent payouts. Travel business finances on autopilot.',
        features: [
            { icon: '✈️', title: 'Booking Revenue', desc: 'Track flight, hotel, and tour booking revenue. Commission and markup calculations.' },
            { icon: '🏖️', title: 'Tour Package Costing', desc: 'Cost per tour package with hotel, transport, guide, and meal breakdowns.' },
            { icon: '💰', title: 'Commission Tracking', desc: 'Track airline, hotel, and supplier commissions. See net revenue per booking.' },
            { icon: '👥', title: 'Agent Payouts', desc: 'Manage agent/sub-agent commissions, incentives, and performance bonuses.' },
            { icon: '📊', title: 'Seasonal Analytics', desc: 'Revenue by season, destination, and package type. Plan your peak strategy.' },
            { icon: '🔒', title: 'Client Privacy', desc: 'Traveler details and booking data stay on your device. GDPR-ready privacy.' },
        ],
        demoDesc: 'See how a Kandy travel agency tracks 200 monthly bookings, manages 50 suppliers, and calculates per-tour profit.',
        useCases: ['Travel Agency', 'Tour Operator', 'DMC', 'Online Travel Agent', 'Corporate Travel Manager'],
        testimonialQuote: 'Seasonal revenue planning became so much easier. I can see which tours actually make money now.',
        testimonialAuthor: 'Ruwan K., Travel Agency Owner — Kandy',
    },
    transportation: {
        headline: 'Financial Management Built for Transport & Fleet',
        subline: 'Track trip revenue, fuel costs, driver wages, and vehicle maintenance. Fleet profitability at your fingertips.',
        features: [
            { icon: '🚚', title: 'Trip Revenue', desc: 'Track income per trip, route, and vehicle. See which routes are most profitable.' },
            { icon: '⛽', title: 'Fuel Management', desc: 'Track fuel costs per vehicle and per km. Identify fuel efficiency patterns.' },
            { icon: '👨‍✈️', title: 'Driver Management', desc: 'Track driver wages, advances, trip allowances, and performance bonuses.' },
            { icon: '🔧', title: 'Vehicle Maintenance', desc: 'Service schedules, repair costs, and insurance tracking per vehicle.' },
            { icon: '📊', title: 'Fleet P&L', desc: 'Profit/loss per vehicle. Know which trucks earn and which ones drain money.' },
            { icon: '🔒', title: 'Business Data Safe', desc: 'Route and revenue data on your device only. Competitor-proof information.' },
        ],
        demoDesc: 'See how a Kaduwela fleet owner manages 15 vehicles, tracks fuel for 50,000km/month, and calculates per-trip profit.',
        useCases: ['Fleet Owner', 'Logistics Company', 'Courier Service', 'School Transport', 'Rental Service'],
        testimonialQuote: 'I found 2 vehicles losing money every month. Fixed my routes and now the whole fleet is profitable.',
        testimonialAuthor: 'Pradeep M., Fleet Owner — Kaduwela',
    }, retail: {
        headline: 'Financial Management Built for Retail',
        subline: 'Track daily sales, manage inventory, handle supplier payments, and monitor shop profitability across locations.',
        features: [
            { icon: '🏪', title: 'Daily Sales Tracking', desc: 'Track POS sales, cash vs card, and daily totals. End-of-day reconciliation made easy.' },
            { icon: '📦', title: 'Inventory Control', desc: 'Stock levels, reorder points, and supplier order tracking. Never overstock or understock.' },
            { icon: '🧾', title: 'Supplier Payments', desc: 'Track credit purchases, payment schedules, and outstanding supplier balances.' },
            { icon: '👥', title: 'Staff & Payroll', desc: 'Employee attendance, salary calculations, and commission tracking for sales staff.' },
            { icon: '📊', title: 'Shop Analytics', desc: 'Best-selling products, peak hours, and customer spending patterns.' },
            { icon: '🔒', title: 'Sales Data Private', desc: 'Revenue and supplier pricing data stays on your device. No cloud exposure.' },
        ],
        demoDesc: 'See how a Galle shopkeeper manages daily sales of LKR 200K, tracks 500 products, and handles 10 suppliers.',
        useCases: ['Grocery Store', 'Clothing Shop', 'Electronics Retailer', 'Pharmacy', 'Multi-Branch Retail'],
        testimonialQuote: 'Daily reconciliation used to take an hour. Now it takes 5 minutes. My accountant is actually happy.',
        testimonialAuthor: 'Saman L., Retail Shop Owner — Galle',
    },
    aquaculture: {
        headline: 'Financial Management Built for Aquaculture',
        subline: 'Track pond costs, feed expenses, harvest revenue, and farm profitability. Aquaculture finance made simple.',
        features: [
            { icon: '🐟', title: 'Pond Economics', desc: 'Track costs and revenue per pond. Feed, seed, medication, and labor cost tracking.' },
            { icon: '🌊', title: 'Feed Management', desc: 'Track feed consumption, costs per kg, and FCR (Feed Conversion Ratio) analytics.' },
            { icon: '📈', title: 'Harvest Revenue', desc: 'Log harvest quantities, market prices, and buyer payments. Per-batch profit tracking.' },
            { icon: '🔬', title: 'Input Cost Tracking', desc: 'Seed/fry costs, probiotics, chemicals, and equipment maintenance expenses.' },
            { icon: '📊', title: 'Farm P&L', desc: 'See profitability per pond, per cycle, and per species. Optimize your farming strategy.' },
            { icon: '🔒', title: 'Farm Data Private', desc: 'Production data and buyer pricing stays on your device. Protect your trade knowledge.' },
        ],
        demoDesc: 'See how a Chilaw farmer tracks 8 ponds, monitors feed costs, and calculates harvest profits per cycle.',
        useCases: ['Shrimp Farming', 'Fish Farming', 'Crab Fattening', 'Ornamental Fish', 'Hatchery Operation'],
        testimonialQuote: 'Feed cost tracking per pond helped me reduce waste by 20%. That\'s real money saved every cycle.',
        testimonialAuthor: 'Dinesh W., Shrimp Farmer — Chilaw',
    },
    creator: {
        headline: 'Financial Management Built for Creators',
        subline: 'Track AdSense, sponsorships, equipment costs, and calculate the new 5% Sri Lankan tax on foreign income automatically.',
        features: [
            { icon: '🎥', title: 'AdSense & Platform Revenue', desc: 'Track income from YouTube, TikTok, Patreon, and Twitch.' },
            { icon: '💵', title: 'Foreign Income Tax', desc: 'Auto-calculate the 5% Sri Lankan tax on USD/foreign earnings.' },
            { icon: '🤝', title: 'Sponsorship Tracking', desc: 'Manage branded deals, deliverables, and outstanding invoices.' },
            { icon: '📸', title: 'Equipment Depreciation', desc: 'Track cameras, PCs, and gear expenses for tax deductions.' },
            { icon: '🌍', title: 'Multi-Currency', desc: 'Handle USD/EUR income with daily LKR conversion rates.' },
            { icon: '🔒', title: 'Creator Privacy', desc: 'Your analytics and revenue data stay strictly on your device.' },
        ],
        demoDesc: 'See how a Colombo YouTuber tracks $4,500 monthly AdSense, manages 5 sponsorships, and calculates their 5% foreign income tax.',
        useCases: ['YouTubers', 'Streamers', 'Influencers', 'Freelance Editors', 'Podcasters'],
        testimonialQuote: 'The 5% foreign income tax calculation alone saved me hours of accountant fees. It\'s perfectly built for SL creators.',
        testimonialAuthor: 'Kaveesha M., Tech YouTuber — Colombo',
    },
    individual: {
        headline: 'Personal Finance Made Simple',
        subline: 'Track your income, expenses, savings goals, and investments. Your complete personal financial dashboard.',
        features: [
            { icon: '💰', title: 'Income & Expense', desc: 'Track salary, freelance income, and all expenses. Auto-categorization with AI.' },
            { icon: '🎯', title: 'Savings Goals', desc: 'Set and track savings goals. Visualize your progress toward financial milestones.' },
            { icon: '💳', title: 'Bank Integration', desc: 'SMS banking alerts auto-captured. No manual entry for bank transactions.' },
            { icon: '📊', title: 'Budget Planning', desc: 'Monthly budgets with smart alerts. Know when you\'re close to overspending.' },
            { icon: '🏦', title: 'Investment Tracking', desc: 'Track FDs, savings accounts, stocks, and other investments in one place.' },
            { icon: '🔒', title: 'Personal Data Safe', desc: 'Your financial life stays on your device. No one else can see your money.' },
        ],
        demoDesc: 'See how a young professional tracks LKR 150K salary, manages 5 savings goals, and plans for their first home.',
        useCases: ['Salaried Employee', 'Freelancer', 'Student', 'Homemaker', 'Retiree'],
        testimonialQuote: 'I finally know where my salary goes every month. The savings goal tracker keeps me motivated.',
        testimonialAuthor: 'Nadeesha F., Software Engineer — Colombo',
    },
};
const ProfessionLandingPage: React.FC<ProfessionLandingPageProps> = ({ slug, onGetStarted, onLogin, onBack }) => {
    // Doctor gets a fully custom landing page
    if (slug === 'medical') {
        return <DoctorLandingPage onGetStarted={onGetStarted} onLogin={onLogin} onBack={onBack} />;
    }

    // Creator gets a fully custom landing page
    if (slug === 'creator') {
        return <CreatorLandingPage onGetStarted={onGetStarted} onLogin={onLogin} onBack={onBack} />;
    }

    // Lawyer gets a fully custom landing page (LexTracksy)
    if (slug === 'legal') {
        return <LawyerLandingPage onGetStarted={onGetStarted} onLogin={onLogin} onBack={onBack} />;
    }

    const [mounted, setMounted] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [navSolid, setNavSolid] = useState(false);

    useEffect(() => {
        setMounted(true);
        window.scrollTo(0, 0);
        const handleScroll = () => setNavSolid(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll-reveal observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).style.opacity = '1'; (e.target as HTMLElement).style.transform = 'translateY(0)'; } }),
            { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
        );
        document.querySelectorAll('.pp-sr').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [mounted]);

    const route = PROFESSION_ROUTES.find(r => r.slug === slug);
    const content = professionContent[slug];
    if (slug !== 'medical' && (!route || !content)) return <div style={{ padding: 100, textAlign: 'center' }}>Profession not found. <button onClick={onBack}>Go Back</button></div>;

    const color = route?.themeColor || '#10b981';
    const routeName = route?.name || 'MyTracksy';
    const routeShortName = route?.shortName || 'Professional';
    const routeIcon = route?.icon || '💼';
    const plans = [
        { name: 'Free', price: 'LKR 0', period: 'forever', desc: 'Get started with essentials', features: ['50 transactions/month', 'Basic reports', 'Single device', 'Offline access', 'Email support'], cta: 'Start Free', popular: false },
        { name: 'Professional', price: 'LKR 999', period: '/month', desc: 'Everything for serious professionals', features: ['Unlimited transactions', 'Advanced analytics & AI', 'Multi-device sync', 'Tax reports & compliance', 'Priority support', 'Data export (PDF/Excel)', 'Voice commands'], cta: 'Get Professional', popular: true },
        { name: 'Business', price: 'LKR 1,999', period: '/month', desc: 'For teams and growing businesses', features: ['Everything in Professional', 'Multi-user access (5 users)', 'Multi-entity management', 'Custom branding', 'API access', 'Dedicated account manager', 'SLA guarantee', 'Onboarding support'], cta: 'Get Business', popular: false },
    ];

    const addons = [
        { name: 'Extra Users', price: 'LKR 299/user/mo', desc: 'Add team members beyond plan limit' },
        { name: 'AI Assistant Pro', price: 'LKR 499/mo', desc: 'Advanced AI categorization & voice in 3 languages' },
        { name: 'WhatsApp Reports', price: 'LKR 199/mo', desc: 'Automated daily/weekly reports via WhatsApp' },
        { name: 'Accountant Access', price: 'LKR 399/mo', desc: 'Read-only portal for your accountant or auditor' },
    ];

    const faqItems = [
        { q: 'Is the Free plan really free forever?', a: 'Yes. No credit card required. Sign up with Google and start using immediately. Upgrade only when you need more features.' },
        { q: 'Where is my financial data stored?', a: `All your ${routeName} data stays 100% on your device. We comply with Sri Lankan PDPA regulations. No personal or financial data is ever stored on our servers.` },
        { q: 'Can I switch plans anytime?', a: 'Yes. Upgrade, downgrade, or cancel anytime. No lock-in contracts. Your data remains safe regardless of plan changes.' },
        { q: 'Does it work without internet?', a: 'Absolutely. MyTracksy works fully offline as a PWA. Your data syncs automatically when you reconnect.' },
        { q: `Is it built specifically for ${routeShortName}?`, a: `Yes. Every feature, category, report, and tax calculation is tailored for the ${slug === 'personal' ? 'personal finance' : routeName.replace('MyTracksy ', '')} profession in Sri Lanka.` },
    ];
    return (
        <>
            <Helmet>
                <title>MyTracksy {routeShortName} | Best Financial Software for {routeName}s in Sri Lanka</title>
                <meta name="description" content={`AI-powered tracking and financial management software specifically designed for ${routeShortName} professionals in Sri Lanka. Manage expenses, billing, and taxes effortlessly.`} />
                <meta name="keywords" content={`${slug} software sri lanka, ${routeShortName} management app, professional billing software, sri lanka tax tracker`} />
                <link rel="canonical" href={`https://mytracksy.lk/${slug}`} />

                {/* Open Graph / Social */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`https://mytracksy.lk/${slug}`} />
                <meta property="og:title" content={`MyTracksy ${routeShortName} | Financial Software for Sri Lankan Professionals`} />
                <meta property="og:description" content={`Automate tracking, expenses, and tax compliance seamlessly for ${routeName}s.`} />
                <meta property="og:image" content={`https://mytracksy.lk/assets/hero-${slug}.png`} />

                {/* JSON-LD Schema Markup */}
                <script type="application/ld+json">
                    {`
                        {
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "MyTracksy ${routeShortName}",
                            "applicationCategory": "BusinessApplication",
                            "operatingSystem": "Web, Android, iOS",
                            "description": "AI-powered financial tracking and management software for ${routeShortName} professionals in Sri Lanka.",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "LKR"
                            },
                            "author": {
                                "@type": "Organization",
                                "name": "SafeNetCreations"
                            }
                        }
                    `}
                </script>
            </Helmet>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                * { box-sizing:border-box; margin:0; padding:0; }
                @keyframes fadeUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
                @keyframes gradientShift { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
                @keyframes orbFloat1 { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(30px,-20px) scale(1.05); } 66% { transform:translate(-15px,15px) scale(0.97); } }
                @keyframes orbFloat2 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(-25px,20px) scale(1.08); } }
                @keyframes borderSpin { from { transform:rotate(0); } to { transform:rotate(360deg); } }
                @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
                @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
                .pp-container { font-family:'Inter',-apple-system,sans-serif; color:#0f172a; line-height:1.6; -webkit-font-smoothing:antialiased; }
                .pp-section { padding:100px 24px; }
                .pp-inner { max-width:1200px; margin:0 auto; }
                .pp-sr { opacity:0; transform:translateY(30px); transition:all 0.8s cubic-bezier(0.16,1,0.3,1); }
                .pp-btn { padding:14px 32px; border:none; border-radius:14px; font-size:15px; font-weight:700; cursor:pointer; transition:all .4s cubic-bezier(0.16,1,0.3,1); font-family:inherit; display:inline-flex; align-items:center; gap:8px; letter-spacing:-0.01em; }
                .pp-btn:hover { transform:translateY(-3px); box-shadow:0 12px 24px -8px rgba(0,0,0,0.15); }
                .pp-heading { font-weight:900; letter-spacing:-0.04em; line-height:1.05; }
                .pp-badge { display:inline-flex; align-items:center; gap:6px; padding:8px 18px; border-radius:50px; font-size:13px; font-weight:700; backdrop-filter:blur(8px); }
                .pp-card { background:rgba(255,255,255,0.85); backdrop-filter:blur(12px); border-radius:22px; padding:34px; border:1px solid rgba(0,0,0,0.04); transition:all .4s cubic-bezier(0.16,1,0.3,1); }
                .pp-card:hover { transform:translateY(-8px) scale(1.01); box-shadow:0 24px 48px -12px rgba(0,0,0,0.08); }
                .pp-price-card { background:rgba(255,255,255,0.9); backdrop-filter:blur(12px); border-radius:24px; padding:40px 34px; border:2px solid rgba(0,0,0,0.04); transition:all .4s cubic-bezier(0.16,1,0.3,1); position:relative; overflow:hidden; }
                .pp-price-card:hover { transform:translateY(-8px); box-shadow:0 30px 60px -16px rgba(0,0,0,0.1); }
                .pp-price-card.popular { border-color:${color}; box-shadow:0 24px 48px ${color}18; }
                .pp-faq-item { border:1px solid rgba(0,0,0,0.04); border-radius:18px; overflow:hidden; background:rgba(255,255,255,0.9); backdrop-filter:blur(8px); transition:all .3s; }
                .pp-faq-item:hover { box-shadow:0 8px 24px -8px rgba(0,0,0,0.06); }
                .pp-faq-q { padding:22px 28px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; font-weight:700; font-size:15px; background:none; border:none; width:100%; text-align:left; font-family:inherit; color:#0f172a; letter-spacing:-0.01em; }
                .pp-faq-a { padding:0 28px 22px; color:#64748b; font-size:14px; line-height:1.7; }
                @media(max-width:768px) {
                    .pp-hero-grid { grid-template-columns:1fr !important; text-align:center; }
                    .pp-features-grid { grid-template-columns:1fr !important; }
                    .pp-price-grid { grid-template-columns:1fr !important; }
                    .pp-addon-grid { grid-template-columns:1fr 1fr !important; }
                    .pp-hero-title { font-size:2.4rem !important; }
                    .pp-section { padding:70px 20px; }
                    .pp-sec-g { grid-template-columns:1fr !important; }
                    .pp-foot-g { grid-template-columns:1fr !important; }
                }
            `}</style>

            <div className="pp-container">
                {/* ===== NAVBAR ===== */}
                <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '14px 0', background: navSolid ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderBottom: navSolid ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent', transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)', boxShadow: navSolid ? '0 4px 30px -8px rgba(0,0,0,0.06)' : 'none' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748b', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>← All Professions</button>
                            <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 9, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{routeIcon}</div>
                                <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{routeShortName}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={onLogin} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: color, fontFamily: 'inherit', padding: '8px 16px' }}>Log in</button>
                            <button onClick={onGetStarted} className="pp-btn" style={{ background: color, color: '#fff', padding: '10px 22px', fontSize: 13, boxShadow: `0 4px 15px ${color}40` }}>Start Free</button>
                        </div>
                    </div>
                </nav>
                {/* ===== HERO + DEMO VIDEO ===== */}
                <section style={{ paddingTop: 110, paddingBottom: 80, background: `linear-gradient(180deg,${color}06 0%,#fff 60%)`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', width: 600, height: 600, top: '-15%', right: '-10%', background: `radial-gradient(circle,${color}08 0%,transparent 70%)`, borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat1 14s ease-in-out infinite', filter: 'blur(40px)' }} />
                    <div style={{ position: 'absolute', width: 400, height: 400, bottom: '-10%', left: '-5%', background: `radial-gradient(circle,${color}05 0%,transparent 70%)`, borderRadius: '50%', pointerEvents: 'none', animation: 'orbFloat2 18s ease-in-out infinite', filter: 'blur(30px)' }} />
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(0,0,0,0.02) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', opacity: 0.5 }} />
                    <div className="pp-inner">
                        <div className="pp-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
                            <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)', transition: 'all .8s cubic-bezier(0.16,1,0.3,1)' }}>
                                <div className="pp-badge" style={{ background: `${color}12`, color: color, marginBottom: 20, border: `1px solid ${color}25` }}>
                                    {routeIcon} {routeName}
                                </div>
                                <h1 className="pp-heading pp-hero-title" style={{ fontSize: '3.2rem', marginBottom: 20 }}>
                                    {content?.headline?.replace(/Built for .*$/, '')}
                                    <span style={{ background: `linear-gradient(135deg,${color} 0%,${color}cc 50%,${color} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '300% 300%', animation: 'gradientShift 6s ease infinite' }}>
                                        {content?.headline?.match(/Built for (.*)$/)?.[0] || ''}
                                    </span>
                                </h1>
                                <p style={{ color: '#64748b', fontSize: 17, lineHeight: 1.8, marginBottom: 28, maxWidth: 520 }}>{content?.subline}</p>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                                    <button onClick={onGetStarted} className="pp-btn" style={{ background: color, color: '#fff', fontSize: 16, padding: '16px 32px', boxShadow: `0 4px 20px ${color}40` }}>
                                        Start Free — No Credit Card →
                                    </button>
                                    <button onClick={() => document.getElementById('pp-pricing')?.scrollIntoView({ behavior: 'smooth' })} className="pp-btn" style={{ background: 'transparent', color: '#0f172a', border: '2px solid #e2e8f0' }}>
                                        View Pricing
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    {['🔒 Data on your device', '🇱🇰 PDPA Compliant', '⚡ Works offline'].map((t, i) => (
                                        <span key={i} style={{ fontSize: 12, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.06)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.1)' }}>{t}</span>
                                    ))}
                                </div>
                            </div>
                            {/* Demo Video Embed */}
                            <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(40px)', transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.2s' }}>
                                <div style={{ borderRadius: 24, overflow: 'hidden', background: '#000', aspectRatio: '16/10', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 40px 80px -20px ${color}35, 0 0 0 1px ${color}15`, border: 'none', position: 'relative', transition: 'all 0.4s' }}>
                                    <iframe
                                        src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ&controls=0&showinfo=0&rel=0&modestbranding=1"
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                        allow="autoplay; encrypted-media"
                                        allowFullScreen
                                        title={`MyTracksy ${routeShortName} Demo`}
                                    />
                                    {/* The absolute overlay ensures it looks integrated and blocks unwanted interactions if needed, but for a real video we might want controls enabled later. 
                                        For this visual demo showing a "sleek clean frame" without UI, playing automatically is perfect. */}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* ===== USE CASES BAR ===== */}
                <section style={{ padding: '32px 24px', background: '#fff', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                    <div className="pp-inner" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                        {content.useCases.map((uc, i) => (
                            <span key={i} style={{ padding: '8px 18px', borderRadius: 50, background: `${color}08`, border: `1px solid ${color}15`, fontSize: 13, fontWeight: 600, color: color }}>{uc}</span>
                        ))}
                    </div>
                </section>

                {/* ===== FEATURES GRID ===== */}
                <section className="pp-section" style={{ background: '#fafafa' }}>
                    <div className="pp-inner">
                        <div className="pp-sr" style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div className="pp-badge" style={{ background: `${color}08`, color: color, marginBottom: 16, border: `1px solid ${color}15` }}>Features</div>
                            <h2 className="pp-heading" style={{ fontSize: '2.8rem', marginBottom: 16 }}>Everything {routeShortName} Needs</h2>
                            <p style={{ color: '#64748b', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>Purpose-built tools designed specifically for your profession.</p>
                        </div>
                        <div className="pp-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
                            {content?.features?.map((f, i) => (
                                <div key={i} className="pp-card pp-sr" style={{ transitionDelay: `${i * 80}ms` }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 16, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 18, boxShadow: `0 8px 20px -8px ${color}20` }}>{f.icon}</div>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>{f.title}</h3>
                                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                {/* ===== TESTIMONIAL ===== */}
                <section style={{ padding: '80px 24px', background: '#fff', position: 'relative' }}>
                    <div className="pp-inner pp-sr" style={{ maxWidth: 720, textAlign: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: 24, background: `${color}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px', border: `1px solid ${color}10` }}>{routeIcon}</div>
                        <p style={{ fontSize: 22, fontWeight: 600, fontStyle: 'italic', color: '#1e293b', lineHeight: 1.7, marginBottom: 24, letterSpacing: '-0.02em' }}>"{content?.testimonialQuote}"</p>
                        <div style={{ width: 48, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)`, margin: '0 auto 16px' }} />
                        <p style={{ fontSize: 15, fontWeight: 700, color: color }}>{content?.testimonialAuthor}</p>
                    </div>
                </section>

                {/* ===== PRICING ===== */}
                <section id="pp-pricing" className="pp-section" style={{ background: '#f8fafc' }}>
                    <div className="pp-inner">
                        <div className="pp-sr" style={{ textAlign: 'center', marginBottom: 48 }}>
                            <div className="pp-badge" style={{ background: `${color}10`, color: color, marginBottom: 14, border: `1px solid ${color}20` }}>Simple Pricing</div>
                            <h2 className="pp-heading" style={{ fontSize: '2.5rem', marginBottom: 14 }}>Start Free. Upgrade When Ready.</h2>
                            <p style={{ color: '#64748b', fontSize: 16, maxWidth: 450, margin: '0 auto' }}>No credit card required. No hidden fees. Cancel anytime.</p>
                        </div>
                        <div className="pp-price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, alignItems: 'start' }}>
                            {plans.map((plan, i) => (
                                <div key={i} className={`pp-price-card pp-sr ${plan.popular ? 'popular' : ''}`} style={{ transitionDelay: `${i * 120}ms` }}>
                                    {plan.popular && <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50)', padding: '4px 16px', borderRadius: '0 0 10px 10px', background: color, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Most Popular</div>}
                                    <div style={{ marginBottom: 24 }}>
                                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                            <span style={{ fontSize: 36, fontWeight: 800, color: plan.popular ? color : '#0f172a' }}>{plan.price}</span>
                                            <span style={{ fontSize: 14, color: '#94a3b8' }}>{plan.period}</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{plan.desc}</p>
                                    </div>
                                    <button onClick={onGetStarted} className="pp-btn" style={{ width: '100%', justifyContent: 'center', background: plan.popular ? color : '#f1f5f9', color: plan.popular ? '#fff' : '#0f172a', fontSize: 14, padding: '14px', marginBottom: 24, boxShadow: plan.popular ? `0 4px 15px ${color}40` : 'none' }}>
                                        {plan.cta} →
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {plan.features.map((f, j) => (
                                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569' }}>
                                                <span style={{ color: color, fontSize: 16 }}>✓</span> {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                {/* ===== ADD-ONS ===== */}
                <section style={{ padding: '60px 24px', background: '#fff' }}>
                    <div className="pp-inner">
                        <div className="pp-sr" style={{ textAlign: 'center', marginBottom: 36 }}>
                            <h3 className="pp-heading" style={{ fontSize: '1.8rem', marginBottom: 10 }}>Power-Up Add-Ons</h3>
                            <p style={{ color: '#64748b', fontSize: 14 }}>Enhance your plan with optional add-ons</p>
                        </div>
                        <div className="pp-addon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                            {addons.map((a, i) => (
                                <div key={i} className="pp-sr" style={{ padding: '24px 20px', borderRadius: 16, border: '1px solid #f1f5f9', background: '#fff', transition: 'all .3s', transitionDelay: `${i * 80}ms` }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{a.name}</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: color, marginBottom: 8 }}>{a.price}</div>
                                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{a.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== DATA SECURITY BANNER ===== */}
                <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg,#065f46 0%,#059669 50%,#047857 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
                    <div className="pp-inner pp-sr" style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ fontSize: 56, marginBottom: 20, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))' }}>🛡️</div>
                        <h2 className="pp-heading" style={{ fontSize: '2rem', color: '#fff', marginBottom: 12 }}>Your Data Never Leaves Your Device</h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, maxWidth: 550, margin: '0 auto 24px', lineHeight: 1.7 }}>
                            MyTracksy follows Sri Lankan government data protection regulations. No personal data, financial records, or client information is stored on any server. Everything stays encrypted on your own device.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                            {['🔐 Zero Server Storage', '🇱🇰 PDPA Compliant', '🛡️ 256-bit Encryption', '📱 Device-Level Security'].map((t, i) => (
                                <span key={i} style={{ padding: '10px 18px', borderRadius: 50, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, fontWeight: 600 }}>{t}</span>
                            ))}
                        </div>
                    </div>
                </section>
                {/* ===== FAQ ===== */}
                <section className="pp-section" style={{ background: '#f8fafc' }}>
                    <div className="pp-inner" style={{ maxWidth: 750 }}>
                        <div className="pp-sr" style={{ textAlign: 'center', marginBottom: 40 }}>
                            <div className="pp-badge" style={{ background: `${color}08`, color: color, marginBottom: 14, border: `1px solid ${color}15` }}>FAQ</div>
                            <h2 className="pp-heading" style={{ fontSize: '2rem', marginBottom: 10 }}>Frequently Asked Questions</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {faqItems.map((faq, i) => (
                                <div key={i} className="pp-faq-item" style={{ borderColor: openFaq === i ? color : undefined }}>
                                    <button className="pp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                        {faq.q}
                                        <span style={{ fontSize: 20, color: color, transition: 'transform .3s', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                                    </button>
                                    {openFaq === i && <div className="pp-faq-a">{faq.a}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== FAQ & SEO SECTION ===== */}
                <section id="faq" style={{ padding: '80px 24px', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
                    <div className="pp-inner pp-sr" style={{ maxWidth: 800, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 60 }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 16 }}>Frequently Asked Questions</h2>
                            <p style={{ fontSize: 17, color: '#475569' }}>Common questions from {routeShortName} professionals in Sri Lanka.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Is MyTracksy suitable for Sri Lankan {routeShortName} tax calculations?</h3>
                                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>Yes. MyTracksy categorizes all your professional income and localized business expenses into a clean format directly aligned with Inland Revenue Department (IRD) requirements for seamless APIT/PAYE processing.</p>
                            </div>

                            <div style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Does the app work offline?</h3>
                                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>Absolutely. MyTracksy is a PWA built with an offline-first architecture. You can log all your data without an active internet connection, and the system will automatically sync when you reconnect.</p>
                            </div>

                            <div style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Is my financial data secure?</h3>
                                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>Yes. We adhere strictly to the Sri Lanka PDPA No. 9 of 2022. Your sensitive financial data utilizes bank-grade encryption and remains strictly confidential.</p>
                            </div>
                        </div>
                    </div>
                    {/* Dynamic FAQ JSON-LD Schema */}
                    <Helmet>
                        <script type="application/ld+json">
                            {`
                                {
                                  "@context": "https://schema.org",
                                  "@type": "FAQPage",
                                  "mainEntity": [{
                                    "@type": "Question",
                                    "name": "Is MyTracksy suitable for Sri Lankan ${routeShortName} tax calculations?",
                                    "acceptedAnswer": {
                                      "@type": "Answer",
                                      "text": "Yes. MyTracksy categorizes all your professional income and localized business expenses into a clean format directly aligned with Inland Revenue Department (IRD) requirements for seamless APIT/PAYE processing."
                                    }
                                  }, {
                                    "@type": "Question",
                                    "name": "Does the app work offline?",
                                    "acceptedAnswer": {
                                      "@type": "Answer",
                                      "text": "Absolutely. MyTracksy is a PWA built with an offline-first architecture. You can log all your data without an active internet connection, and the system will automatically sync when you reconnect."
                                    }
                                  }, {
                                    "@type": "Question",
                                    "name": "Is my financial data secure?",
                                    "acceptedAnswer": {
                                      "@type": "Answer",
                                      "text": "Yes. We adhere strictly to the Sri Lanka PDPA No. 9 of 2022. Your sensitive financial data utilizes bank-grade encryption and remains strictly confidential."
                                    }
                                  }]
                                }
                            `}
                        </script>
                    </Helmet>
                </section>

                {/* ===== CTA ===== */}
                <section style={{ padding: '100px 24px', background: `linear-gradient(135deg,${color} 0%,${color}dd 50%,${color}bb 100%)`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px,transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: 500, height: 500, top: '-20%', right: '-10%', background: 'radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: 400, height: 400, bottom: '-15%', left: '-8%', background: 'radial-gradient(circle,rgba(255,255,255,0.06) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                    <div className="pp-inner pp-sr" style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ fontSize: 56, marginBottom: 20, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))' }}>{routeIcon}</div>
                        <h2 className="pp-heading" style={{ fontSize: '2.8rem', color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>Ready to Transform Your<br />{routeName.replace('MyTracksy ', '')} Finances?</h2>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>Join with your Google account. Free forever tier. No credit card needed.</p>
                        <button onClick={onGetStarted} className="pp-btn" style={{ background: '#fff', color: color, fontSize: 17, padding: '18px 44px', fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,0.2)', borderRadius: 14 }}>
                            Sign Up Free with Google →
                        </button>
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
                            {['No credit card', 'Free forever tier', 'Setup in 30 seconds'].map((t, i) => (
                                <span key={i} style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>✓ {t}</span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== FOOTER ===== */}
                <footer style={{ padding: '48px 24px', background: '#0f172a', color: 'rgba(255,255,255,0.5)', fontSize: 13, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="pp-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', boxShadow: `0 4px 12px ${color}30` }}>{routeIcon}</div>
                            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14, letterSpacing: '-0.01em' }}>{routeShortName}</span>
                        </div>
                        <div>© 2026 MyTracksy. Designed & Built in Sri Lanka by <a href="https://safenetcreations.com/" target="_blank" rel="noopener noreferrer" style={{ color: color, textDecoration: 'none', fontWeight: 700 }}>SafeNetCreations</a></div>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>All Professions</button>
                            <a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Privacy</a>
                            <a href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Terms</a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default ProfessionLandingPage;