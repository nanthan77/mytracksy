import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  Map,
  Receipt,
  Globe,
  Wallet,
  ArrowRight,
  CheckCircle2,
  CarFront,
  Compass,
  Star,
  Zap,
  Clock,
  Users,
} from "lucide-react";
import { getPricingForProfession } from '../config/pricingConfig';

interface TourTracksyLandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onBack: () => void;
}

const tourFaqs = [
  {
    question: 'How does multi-currency tracking work?',
    answer: 'TourTracksy automatically pulls daily CBSL exchange rates and converts all your transactions. Whether you receive USD from an American couple or EUR from a German family, every entry is converted to LKR in real-time for accurate P&L reporting.',
  },
  {
    question: 'Can I use this offline on safari or in remote areas?',
    answer: 'Yes! TourTracksy is a PWA with full offline support. Log expenses via voice or manual entry even in Yala or Sinharaja. Everything syncs automatically when you get back to a signal.',
  },
  {
    question: 'How does the Commission (Kutti) Ledger work?',
    answer: 'Every time you bring guests to a spice garden, gem shop, or activity provider, log it instantly. TourTracksy tracks who owes you what, sends WhatsApp reminders, and marks payments as collected — no more lost commissions.',
  },
  {
    question: 'Is this SLTDA compliant for tax filing?',
    answer: 'Absolutely. TourTracksy generates clean P&L statements that your accountant can use directly for IRD filing. All income and expenses are categorized per SLTDA tourism industry standards.',
  },
  {
    question: 'Can tour agencies manage multiple drivers?',
    answer: 'Yes. With the Agency Plan, you can add unlimited drivers, each with their own trip folios. View real-time cash positions across all active tours from a single master dashboard.',
  },
  {
    question: 'How does the AI Itinerary Generator work?',
    answer: 'Type something like "10 days, couple, culture + beach, mid-range budget" and our AI generates a fully costed, logistics-aware itinerary with hotel suggestions, activity costs, and driving distances — ready to WhatsApp to your client.',
  },
];

const tourTestimonials = [
  {
    name: 'Chaminda Rathnayake',
    title: 'SLTDA Licensed Chauffeur Guide, Colombo',
    text: 'I used to lose track of commissions from spice gardens and gem shops. TourTracksy\'s Kutti Ledger helped me recover Rs. 85,000 in unpaid commissions in the first month alone.',
    rating: 5,
  },
  {
    name: 'Nirosha Perera',
    title: 'Boutique Tour Agency Owner, Galle',
    text: 'Managing 6 drivers across 4 active tours was chaos. Now I see everyone\'s cash position in real-time. The settlement PDF feature alone saves me 2 hours per trip.',
    rating: 5,
  },
  {
    name: 'Stefan & Anya K.',
    title: 'German Tourists (Testimonial for our Driver)',
    text: 'Our driver showed us exactly how each day was budgeted. The transparency made us feel safe and we tipped 200 EUR extra because we could see he was running a tight operation.',
    rating: 5,
  },
];

const tourTrustStats = [
  { value: '580+', label: 'Tour Professionals', icon: Users },
  { value: 'LKR 420M', label: 'Trips Tracked', icon: Globe },
  { value: '99.8%', label: 'Uptime SLA', icon: Zap },
  { value: '< 2 min', label: 'Setup Time', icon: Clock },
];

export function TourTracksyLanding({
  onGetStarted,
  onLogin,
  onBack,
}: TourTracksyLandingProps) {
  const [navSolid, setNavSolid] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "annual",
  );
  const pricing = getPricingForProfession('tourism');

  useEffect(() => {
    const handleScroll = () => {
      setNavSolid(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    setTimeout(() => {
      document.querySelectorAll(".sr").forEach((el) => observer.observe(el));
    }, 100);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Helmet>
        <title>TourTracksy | Elite Financial OS for Sri Lankan Tourism</title>
        <meta
          name="description"
          content="The first financial OS built specifically for Sri Lankan Chauffeur Guides, Activity Providers, and Boutique Agencies."
        />
      </Helmet>

      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                
                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                body { 
                    background: #f8fafc; /* Sleek, bright light mode */
                    color: #0f172a;
                }
                
                .lt-c { 
                    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; 
                    line-height: 1.6; 
                    overflow-x: hidden; 
                    -webkit-font-smoothing: antialiased; 
                }
                
                .lt-i { max-width: 1300px; margin: 0 auto; padding: 0 5%; }
                
                .sr { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                
                @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                @keyframes float-medium { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                @keyframes pulse-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }

                .lt-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; padding: 20px 0; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                .lt-nav-s { 
                    padding: 16px 0; 
                    background: rgba(255, 255, 255, 0.9); 
                    backdrop-filter: blur(24px) saturate(180%); 
                    -webkit-backdrop-filter: blur(24px) saturate(180%); 
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05); 
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05); 
                }
                
                /* Core Premium Buttons */
                .btn-primary { 
                    background: linear-gradient(135deg, #0ea5e9, #6366f1); 
                    color: #fff; 
                    border: none; 
                    padding: 14px 32px; 
                    border-radius: 99px; 
                    font-weight: 700; 
                    font-size: 16px; 
                    cursor: pointer; 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                    box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255,255,255,0.2); 
                    font-family: inherit; 
                    letter-spacing: -0.01em; 
                    display: inline-flex; 
                    align-items: center; 
                    justify-content: center; 
                    gap: 8px;
                    position: relative;
                    overflow: hidden;
                }
                .btn-primary::after {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%; width: 50%; height: 100%;
                    background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
                    transform: skewX(-20deg);
                    transition: left 0.5s ease;
                }
                .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 35px -5px rgba(99, 102, 241, 0.5), inset 0 1px 1px rgba(255,255,255,0.3); }
                .btn-primary:hover::after { left: 150%; }
                
                .btn-secondary {
                    background: #ffffff; 
                    color: #0f172a; 
                    border: 1px solid rgba(0,0,0,0.1); 
                    padding: 14px 32px; 
                    border-radius: 99px; 
                    font-weight: 700; 
                    font-size: 16px; 
                    cursor: pointer; 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                    font-family: inherit; 
                    display: inline-flex; 
                    align-items: center; 
                    justify-content: center; 
                    gap: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                }
                .btn-secondary:hover { 
                    background: #f8fafc; 
                    border-color: rgba(0,0,0,0.15); 
                    transform: translateY(-3px); 
                    box-shadow: 0 8px 20px rgba(0,0,0,0.06); 
                }
                
                /* Light Premium Glass Cards */
                .glass-card {
                    background: rgba(255, 255, 255, 0.8); 
                    backdrop-filter: blur(24px); 
                    -webkit-backdrop-filter: blur(24px); 
                    border-radius: 24px; 
                    border: 1px solid rgba(255, 255, 255, 1); 
                    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,1); 
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    overflow: hidden;
                }
                .glass-card:hover { 
                    transform: translateY(-8px); 
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1); 
                    border-color: rgba(99,102,241,0.2); 
                    background: rgba(255, 255, 255, 0.95);
                }

                /* Text Gradients */
                .text-gradient { 
                    background: linear-gradient(135deg, #0284c7, #4f46e5); 
                    -webkit-background-clip: text; 
                    -webkit-text-fill-color: transparent; 
                }
                .text-gradient-gold { 
                    background: linear-gradient(135deg, #d97706, #b45309); 
                    -webkit-background-clip: text; 
                    -webkit-text-fill-color: transparent; 
                }

                @media (max-width: 900px) {
                    .lt-h1 { font-size: 3rem !important; }
                    .hero-btns { flex-direction: column; }
                    .glass-card { padding: 24px !important; }
                    .nav-links { display: none !important; }
                    .tour-back-btn { display: none !important; }
                }

                /* App Mockup Styles - Light Mode */
                .mockup-container {
                    background: #ffffff;
                    border-radius: 24px;
                    border: 1px solid rgba(0,0,0,0.05);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    position: relative;
                }
                .mockup-header {
                    background: #f8fafc;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .mockup-body {
                    padding: 24px;
                    background: #ffffff;
                }
                .mockup-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 16px;
                    margin-bottom: 16px;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }

                /* Custom Pricing Cards - Light Mode */
                .pricing-card {
                    padding: 48px 32px; 
                    background: #ffffff; 
                    border-radius: 32px; 
                    border: 1px solid rgba(0,0,0,0.05); 
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                }
                .pricing-card.premium {
                    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
                    border: 1px solid rgba(96,165,250,0.4);
                    box-shadow: 0 30px 60px -15px rgba(37,99,235,0.1), inset 0 1px 0 rgba(255,255,255,1);
                    transform: scale(1.05);
                    z-index: 2;
                }
            `}</style>

      <div className="lt-c">
        {/* Navbar */}
        <nav className={`lt-nav ${navSolid ? "lt-nav-s" : ""}`}>
          <div
            className="lt-i"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <button
                onClick={onBack}
                className="btn-secondary tour-back-btn"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  background: navSolid ? "#ffffff" : "rgba(255,255,255,0.8)",
                  borderColor: navSolid ? "rgba(0,0,0,0.1)" : "transparent",
                }}
              >
                ← Back to Platform
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <Compass size={28} color="#0ea5e9" strokeWidth={2.5} />
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "#0f172a",
                  }}
                >
                  TourTracksy
                </span>
              </div>
            </div>
            <div
              className="nav-links"
              style={{ display: "flex", alignItems: "center", gap: 32 }}
            >
              {["The Problem", "Engine", "Pricing"].map((link) => {
                const sectionMap: Record<string, string> = {
                  "The Problem": "solutions",
                  Engine: "features",
                  Pricing: "pricing",
                };
                return (
                  <span
                    key={link}
                    onClick={() =>
                      document
                        .getElementById(sectionMap[link])
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#475569",
                      cursor: "pointer",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLSpanElement).style.color = "#0ea5e9")
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLSpanElement).style.color = "#475569")
                    }
                  >
                    {link}
                  </span>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span
                onClick={onLogin}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#0f172a",
                  cursor: "pointer",
                }}
              >
                Sign In
              </span>
              <button
                onClick={onGetStarted}
                className="btn-primary"
                style={{ padding: "10px 24px", fontSize: 14 }}
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 120,
            paddingBottom: 80,
            position: "relative",
            overflow: "hidden",
            // Using the new Gemini 3 Flash generated tourism background image with a light overlay
            backgroundImage:
              'linear-gradient(180deg, rgba(248, 250, 252, 0.4) 0%, rgba(248, 250, 252, 0.7) 100%), url("/assets/images/sri_lanka_tourism_hero.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            textAlign: "center",
          }}
        >
          {/* Glowing Orbs */}
          <div
            style={{
              position: "absolute",
              top: "20%",
              left: "10%",
              width: 300,
              height: 300,
              background: "#0ea5e9",
              borderRadius: "50%",
              filter: "blur(150px)",
              opacity: 0.2,
              animation: "float-slow 20s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "20%",
              right: "10%",
              width: 400,
              height: 400,
              background: "#6366f1",
              borderRadius: "50%",
              filter: "blur(150px)",
              opacity: 0.2,
              animation: "float-slow 25s ease-in-out infinite reverse",
            }}
          />

          <div
            className="lt-i"
            style={{
              position: "relative",
              zIndex: 2,
              background: "rgba(255, 255, 255, 0.75)",
              padding: "60px 40px",
              borderRadius: "32px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            <div
              className="sr"
              style={{
                display: "inline-block",
                background: "#e0f2fe",
                color: "#0369a1",
                padding: "6px 20px",
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 800,
                border: "1px solid #bae6fd",
                marginBottom: 32,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                backdropFilter: "blur(10px)",
              }}
            >
              Built specifically for Sri Lanka
            </div>

            <h1
              className="sr lt-h1"
              style={{
                fontSize: "5rem",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                marginBottom: 24,
                color: "#0f172a",
              }}
            >
              Stop Losing Money in the <br />
              <span className="text-gradient">Multi-Currency Jungle.</span>
            </h1>

            <p
              className="sr"
              style={{
                fontSize: 20,
                color: "#475569",
                lineHeight: 1.7,
                marginBottom: 48,
                maxWidth: 750,
                margin: "0 auto 48px",
              }}
            >
              The definitive financial operating system built for Sri Lankan
              Chauffeur Guides, Activity Providers, and Boutique Tour Agencies.
            </p>

            <div
              className="sr hero-btns"
              style={{
                display: "flex",
                gap: 20,
                justifyContent: "center",
                transitionDelay: "0.1s",
              }}
            >
              <button
                onClick={onGetStarted}
                className="btn-primary"
                style={{ padding: "18px 40px", fontSize: 18 }}
              >
                Deploy Your Engine <ArrowRight size={20} />
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="btn-secondary"
                style={{ padding: "18px 40px", fontSize: 18 }}
              >
                View Capabilities
              </button>
            </div>

            {/* PWA Install Button */}
            <button
              className="sr"
              onClick={() => {
                const w = window as any;
                if (w.deferredPrompt) {
                  w.deferredPrompt.prompt();
                  w.deferredPrompt.userChoice.then(() => {
                    w.deferredPrompt = null;
                  });
                } else {
                  window.open('https://www.mytracksy.com/tourism', '_blank');
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 16,
                padding: '12px 28px',
                borderRadius: 99,
                border: '1px solid #bae6fd',
                background: '#e0f2fe',
                color: '#0369a1',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.3s ease',
                transitionDelay: '0.15s',
              }}
            >
              <span style={{ fontSize: 18 }}>📲</span> Free App — Install Now
            </button>
          </div>
        </header>

        {/* Trust Stats Banner */}
        <section style={{ padding: '32px 0', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
          <div className="lt-i">
            <div className="sr" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 24, textAlign: 'center' }}>
              {tourTrustStats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Icon size={22} color="#0ea5e9" />
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{stat.value}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Agitate & Solve Grid */}
        <section
          id="solutions"
          style={{
            padding: "140px 0",
            background: "#f8fafc",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "80%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)",
            }}
          />

          <div className="lt-i">
            <div
              className="sr"
              style={{ textAlign: "center", marginBottom: 80 }}
            >
              <h2
                style={{
                  fontSize: "3rem",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  marginBottom: 16,
                  color: "#0f172a",
                }}
              >
                The struggle is real. The solution is here.
              </h2>
              <p style={{ fontSize: 18, color: "#475569" }}>
                We know exactly why your notebook accounting is failing.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 32,
              }}
            >
              {[
                {
                  q: `"I quoted in USD, got padded in Euros, and bought diesel in LKR. Did I make a profit?"`,
                  ans: "Auto-Sync Multi-Currency Wallet converting daily CBSL rates instantly.",
                },
                {
                  q: `"The Spice Garden owes me 15% commission, but I lost the receipt and forgot to collect it."`,
                  ans: "Digital 'Kutti' Ledger tracking unpaid commissions so nothing slips through.",
                },
                {
                  q: `"Tax season is here and my accountant needs to know my exact income and fuel expenses for the year."`,
                  ans: "One-Click Tax Exports. Instantly generate accountant-ready P&L reports for your tourism business.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="glass-card sr"
                  style={{ padding: 40, transitionDelay: `${idx * 100}ms` }}
                >
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#ef4444",
                      marginBottom: 16,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    The Chaos
                  </h3>
                  <p
                    style={{
                      fontSize: 18,
                      color: "#334155",
                      fontStyle: "italic",
                      marginBottom: 32,
                      minHeight: 80,
                      lineHeight: 1.6,
                    }}
                  >
                    {item.q}
                  </p>

                  <div
                    style={{
                      height: 1,
                      background: "rgba(0,0,0,0.05)",
                      width: "100%",
                      marginBottom: 32,
                    }}
                  ></div>

                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#059669",
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <CheckCircle2 size={18} /> The Solution
                  </h3>
                  <p
                    style={{
                      fontSize: 16,
                      color: "#0f172a",
                      fontWeight: 600,
                      lineHeight: 1.6,
                    }}
                  >
                    {item.ans}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section
          id="features"
          style={{
            padding: "140px 0",
            background: "#ffffff",
            position: "relative",
          }}
        >
          {/* Light subtle background glow */}
          <div
            style={{
              position: "absolute",
              top: "30%",
              left: "-10%",
              width: 500,
              height: 500,
              background:
                "radial-gradient(circle, rgba(14, 165, 233, 0.05) 0%, transparent 70%)",
              filter: "blur(80px)",
              zIndex: 0,
            }}
          />

          <div className="lt-i" style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
                gap: 80,
                alignItems: "center",
              }}
            >
              <div className="sr">
                <h2
                  style={{
                    fontSize: "3rem",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    marginBottom: 40,
                    lineHeight: 1.1,
                    color: "#0f172a",
                  }}
                >
                  More Than a Ledger.
                  <br />
                  <span className="text-gradient">A Tour Engine.</span>
                </h2>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 40 }}
                >
                  <div style={{ display: "flex", gap: 24 }}>
                    <div
                      style={{
                        background: "#e0f2fe",
                        color: "#0284c7",
                        padding: 16,
                        borderRadius: 16,
                        height: "fit-content",
                        border: "1px solid #bae6fd",
                      }}
                    >
                      <Globe size={28} />
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#0f172a",
                          marginBottom: 10,
                        }}
                      >
                        Trip-Based Contextual Accounting
                      </h4>
                      <p
                        style={{
                          fontSize: 16,
                          color: "#475569",
                          lineHeight: 1.6,
                        }}
                      >
                        Don't mix personal grocery money with your Russian
                        14-day tour money. Keep folios separated.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 24 }}>
                    <div
                      style={{
                        background: "#e0e7ff",
                        color: "#4f46e5",
                        padding: 16,
                        borderRadius: 16,
                        height: "fit-content",
                        border: "1px solid #c7d2fe",
                      }}
                    >
                      <Receipt size={28} />
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#0f172a",
                          marginBottom: 10,
                        }}
                      >
                        Driver Settlement PDF Engine
                      </h4>
                      <p
                        style={{
                          fontSize: 16,
                          color: "#475569",
                          lineHeight: 1.6,
                        }}
                      >
                        Agencies: Automatically calculate advances vs. actual
                        expenses and generate instant PDF settlements.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 24 }}>
                    <div
                      style={{
                        background: "#dcfce7",
                        color: "#059669",
                        padding: 16,
                        borderRadius: 16,
                        height: "fit-content",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <Map size={28} />
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#0f172a",
                          marginBottom: 10,
                        }}
                      >
                        AI Route & Itinerary Generator
                      </h4>
                      <p
                        style={{
                          fontSize: 16,
                          color: "#475569",
                          lineHeight: 1.6,
                        }}
                      >
                        Type "7 days culture/beach for a family of 4". Get a
                        fully costed, logistics-aware itinerary ready to
                        WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* App Mockup UI - Light Mode */}
              <div className="mockup-container sr">
                <div className="mockup-header">
                  <span
                    style={{ fontWeight: 600, color: "#475569", fontSize: 14 }}
                  >
                    Folio: German Couple - 14 Days
                  </span>
                  <span
                    style={{
                      color: "#059669",
                      fontWeight: 800,
                      fontSize: 12,
                      backgroundColor: "#dcfce7",
                      padding: "4px 8px",
                      borderRadius: 4,
                    }}
                  >
                    ● ON TOUR
                  </span>
                </div>
                <div className="mockup-body">
                  <div className="mockup-row">
                    <div
                      style={{ display: "flex", gap: 16, alignItems: "center" }}
                    >
                      <div
                        style={{
                          background: "#e0f2fe",
                          border: "1px solid #bae6fd",
                          color: "#0284c7",
                          padding: 12,
                          borderRadius: 12,
                        }}
                      >
                        <Wallet size={20} />
                      </div>
                      <div>
                        <p
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                            fontSize: 16,
                          }}
                        >
                          Agency Initial Advance
                        </p>
                        <p style={{ fontSize: 13, color: "#64748b" }}>
                          Transfer from HQ
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#059669",
                        fontSize: 18,
                      }}
                    >
                      + LKR 150,000
                    </span>
                  </div>

                  <div className="mockup-row">
                    <div
                      style={{ display: "flex", gap: 16, alignItems: "center" }}
                    >
                      <div
                        style={{
                          background: "#fee2e2",
                          border: "1px solid #fecaca",
                          color: "#ef4444",
                          padding: 12,
                          borderRadius: 12,
                        }}
                      >
                        <CarFront size={20} />
                      </div>
                      <div>
                        <p
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                            fontSize: 16,
                          }}
                        >
                          Diesel Log - Kandy
                        </p>
                        <p style={{ fontSize: 13, color: "#64748b" }}>
                          Logged via Offline Voice
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#ef4444",
                        fontSize: 18,
                      }}
                    >
                      - LKR 12,500
                    </span>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid rgba(0,0,0,0.05)",
                      borderRadius: 16,
                      padding: 24,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 32,
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <span style={{ color: "#475569", fontWeight: 600 }}>
                      Live Cash Balance On Hand
                    </span>
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      LKR 137,500
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

                {/* ===== DYNAMIC PRICING FROM pricingConfig ===== */}
                <section id="pricing" style={{ padding: '120px 0', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                    <div className="lt-i sr" style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <div style={{ display: 'inline-block', background: '#dcfce7', color: '#059669', padding: '6px 20px', borderRadius: 99, fontSize: 13, fontWeight: 800, border: '1px solid #bbf7d0', marginBottom: 24, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Transparent SaaS Economics</div>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16 }}>
                                Pricing anchored to reality.
                            </h2>
                            <p style={{ fontSize: 18, color: '#475569', maxWidth: 600, margin: '0 auto' }}>
                                Cheaper than the fuel you waste looking for an ATM on a Sunday in Nuwara Eliya.
                            </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
                            <div style={{ background: '#fff', padding: 6, borderRadius: 99, display: 'inline-flex', border: '1px solid #e2e8f0' }}>
                                <button onClick={() => setBillingCycle('monthly')} style={{ padding: '12px 28px', borderRadius: 99, border: 'none', background: billingCycle === 'monthly' ? '#0f172a' : 'transparent', color: billingCycle === 'monthly' ? '#fff' : '#64748b', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit' }}>Monthly</button>
                                <button onClick={() => setBillingCycle('annual')} style={{ padding: '12px 28px', borderRadius: 99, border: 'none', background: billingCycle === 'annual' ? '#0f172a' : 'transparent', color: billingCycle === 'annual' ? '#fff' : '#64748b', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit' }}>
                                    Annual <span style={{ background: billingCycle === 'annual' ? 'rgba(14,165,233,0.3)' : '#e0f2fe', color: billingCycle === 'annual' ? '#7dd3fc' : '#0284c7', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 800, marginLeft: 6 }}>Save 28%</span>
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pricing.tiers.length}, 1fr)`, gap: 24, position: 'relative', zIndex: 1 }}>
                            {pricing.tiers.map((tier) => (
                                <div key={tier.id} style={{
                                    background: tier.highlighted ? 'linear-gradient(135deg, #0f172a, #1e293b)' : '#fff',
                                    border: tier.highlighted ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                                    borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column' as const,
                                    transform: tier.highlighted ? 'scale(1.05)' : 'none',
                                    boxShadow: tier.highlighted ? '0 20px 40px rgba(14,165,233,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                                    position: 'relative' as const, zIndex: tier.highlighted ? 2 : 1,
                                }}>
                                    {tier.highlighted && (
                                        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', padding: '5px 20px', borderRadius: 99, fontSize: 12, fontWeight: 800, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>MOST POPULAR</div>
                                    )}
                                    <h3 style={{ fontSize: 20, fontWeight: 700, color: tier.highlighted ? '#fff' : '#0f172a', marginBottom: 4 }}>{tier.name}</h3>
                                    <p style={{ fontSize: 13, color: tier.highlighted ? '#94a3b8' : '#64748b', marginBottom: 16 }}>
                                        {tier.monthlyPrice === 0 ? 'For single drivers & freelance guides' : tier.highlighted ? 'For growing guides who want to earn more' : 'For agencies managing multiple drivers'}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24, justifyContent: 'center' }}>
                                        {tier.monthlyPrice === 0 ? (
                                            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: tier.highlighted ? '#fff' : '#0f172a' }}>Free Forever</span>
                                        ) : (
                                            <>
                                                <span style={{ fontSize: 14, color: tier.highlighted ? '#94a3b8' : '#64748b' }}>Rs.</span>
                                                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: tier.highlighted ? '#fff' : '#0f172a' }}>
                                                    {billingCycle === 'annual' ? Math.round(tier.annualPrice / 12).toLocaleString() : tier.monthlyPrice.toLocaleString()}
                                                </span>
                                                <span style={{ fontSize: 14, color: tier.highlighted ? '#94a3b8' : '#64748b' }}>/mo</span>
                                            </>
                                        )}
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' as const, gap: 12, marginBottom: 32, flex: 1, textAlign: 'left' as const }}>
                                        {tier.features.map((f, fi) => (
                                            <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10, color: tier.highlighted ? '#cbd5e1' : '#334155', fontSize: 14 }}>
                                                <CheckCircle2 style={{ width: 16, height: 16, color: '#0ea5e9', flexShrink: 0 }} /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={onGetStarted} style={{
                                        width: '100%', padding: '14px', fontSize: 16, borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit',
                                        background: tier.highlighted ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : '#f1f5f9',
                                        color: tier.highlighted ? '#fff' : '#0f172a',
                                        boxShadow: tier.highlighted ? '0 8px 20px rgba(14,165,233,0.3)' : 'none',
                                    }}>
                                        {tier.monthlyPrice === 0 ? 'Start Free — No Card Needed' : 'Start 14-Day Trial'}
                                    </button>
                                    {tier.monthlyPrice === 0 && (
                                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 12, textAlign: 'center' as const, lineHeight: 1.5 }}>
                                            ⚡ Upgrade anytime to unlock Kutti Ledger, AI Itineraries & Tax Export
                                        </p>
                                    )}
                                    {tier.badge && <p style={{ fontSize: 12, color: tier.highlighted ? '#94a3b8' : '#64748b', marginTop: 12, textAlign: 'center' as const }}>{tier.badge}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== TESTIMONIALS SECTION ===== */}
                <section style={{ padding: '100px 0', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
                    <div className="lt-i">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 64 }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16 }}>
                                Trusted by <span className="text-gradient">Tourism Professionals</span>
                            </h2>
                            <p style={{ fontSize: 18, color: '#475569' }}>Hear from guides, agencies, and even their guests.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
                            {tourTestimonials.map((t, idx) => (
                                <div key={idx} className="glass-card sr" style={{ padding: 32, transitionDelay: `${idx * 100}ms` }}>
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                                        {Array.from({ length: t.rating }).map((_, si) => <Star key={si} size={16} fill="#f59e0b" color="#f59e0b" />)}
                                    </div>
                                    <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic' }}>"{t.text}"</p>
                                    <div>
                                        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{t.name}</p>
                                        <p style={{ fontSize: 13, color: '#64748b' }}>{t.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== FAQ SECTION ===== */}
                <section style={{ padding: '100px 0', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                    <div className="lt-i" style={{ maxWidth: 800, margin: '0 auto' }}>
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 64 }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16 }}>Frequently Asked Questions</h2>
                            <p style={{ fontSize: 18, color: '#475569' }}>Common questions about TourTracksy for tourism professionals.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 24 }}>
                            {tourFaqs.map((faq, idx) => (
                                <div key={idx} className="glass-card sr" style={{ padding: 32, transitionDelay: `${idx * 60}ms` }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{faq.question}</h3>
                                    <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7 }}>{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

        {/* Final CTA */}
        <section
          style={{
            padding: "140px 0",
            background: "#ffffff",
            textAlign: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)",
            }}
          />
          <div className="lt-i">
            <div
              className="sr"
              style={{
                background: "linear-gradient(135deg, #0ea5e9, #4f46e5)",
                borderRadius: 40,
                padding: "80px 40px",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(14,165,233,0.3)",
                boxShadow: "0 30px 60px -15px rgba(14,165,233,0.3)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: "-10%",
                  top: "-20%",
                  width: 500,
                  height: 500,
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%)",
                  borderRadius: "50%",
                  filter: "blur(60px)",
                }}
              />

              <h2
                style={{
                  fontSize: "3.5rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.03em",
                  marginBottom: 24,
                  position: "relative",
                  zIndex: 1,
                  lineHeight: 1.1,
                }}
              >
                Digitize Your Operations Today.
              </h2>
              <p
                style={{
                  fontSize: 18,
                  color: "#e0f2fe",
                  maxWidth: 600,
                  margin: "0 auto 48px",
                  lineHeight: 1.7,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Join the elite tier of Sri Lankan tourism professionals managing
                their finances with military precision.
              </p>

              <div style={{ position: "relative", zIndex: 1 }}>
                <button
                  onClick={onGetStarted}
                  className="btn-secondary"
                  style={{
                    padding: "20px 48px",
                    fontSize: 18,
                    background: "#ffffff",
                    color: "#0f172a",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  }}
                >
                  Deploy Free Trial Engine
                </button>
                <div
                  style={{
                    marginTop: 24,
                    fontSize: 14,
                    color: "#bae6fd",
                    fontWeight: 600,
                  }}
                >
                  100% Tax Deductible Business Expense.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            background: "#f8fafc",
            padding: "60px 0",
            textAlign: "center",
            borderTop: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div className="lt-i">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <Compass size={28} color="#0ea5e9" strokeWidth={2.5} />
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#0f172a",
                }}
              >
                TourTracksy
              </span>
            </div>
            <p style={{ fontSize: 15, color: "#64748b" }}>
              © {new Date().getFullYear()} TourTracksy. Designed & Built in Sri
              Lanka.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

export default TourTracksyLanding;
