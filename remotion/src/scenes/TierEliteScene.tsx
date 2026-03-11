import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { FadeInUp, ScalePop, Badge, FeatureRow } from "../components/Animations";
import { colors, fonts } from "../styles";

const proFeatures = [
  'Everything in Pro Plan',
];

const eliteFeatures = [
  'Assistant Sub-Login',
  'Live Cash Dashboard',
  'AI WhatsApp Receptionist',
  '200 Free AI Tokens / month',
];

export const TierEliteScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Subtle radial glow animation
  const glowScale = 1 + 0.05 * Math.sin(frame * 0.05);

  return (
    <AbsoluteFill
      style={{
        background: colors.bgGradient,
        display: 'flex',
        fontFamily: fonts.heading,
      }}
    >
      {/* Purple glow background */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(156,39,176,0.12) 0%, transparent 70%)',
          transform: `translate(-50%, -50%) scale(${glowScale})`,
        }}
      />

      {/* Left — Tier info */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 60px 60px 120px',
          zIndex: 1,
        }}
      >
        <FadeInUp delay={5}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Badge text="Tier 3" color={colors.tierElite} />
            <span
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                background: 'rgba(156,39,176,0.15)',
                border: '1px solid rgba(156,39,176,0.4)',
                color: '#ce93d8',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              👑 ELITE
            </span>
          </div>
        </FadeInUp>

        <FadeInUp delay={12}>
          <h2
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: colors.white,
              margin: '20px 0 4px',
            }}
          >
            Clinic Director
          </h2>
        </FadeInUp>

        <FadeInUp delay={18}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)' }}>LKR</span>
            <span style={{ fontSize: 72, fontWeight: 900, color: '#ce93d8' }}>7,500</span>
            <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)' }}>/month</span>
          </div>
        </FadeInUp>

        <FadeInUp delay={24}>
          <span
            style={{
              display: 'inline-block',
              padding: '6px 18px',
              borderRadius: 999,
              background: 'rgba(0,191,165,0.15)',
              border: '1px solid rgba(0,191,165,0.3)',
              color: colors.teal,
              fontSize: 18,
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            Annual: LKR 75,000/yr — Save 2 Months!
          </span>
        </FadeInUp>

        {/* Value proposition callout */}
        <ScalePop delay={35}>
          <div
            style={{
              marginTop: 36,
              padding: '24px 32px',
              background: 'linear-gradient(135deg, rgba(156,39,176,0.15) 0%, rgba(103,58,183,0.1) 100%)',
              borderRadius: 20,
              border: '1px solid rgba(156,39,176,0.3)',
            }}
          >
            <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              💡 Replace a
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#ce93d8' }}>
              LKR 35,000/month
            </div>
            <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              receptionist with AI for just LKR 7,500
            </div>
          </div>
        </ScalePop>
      </div>

      {/* Right — Features */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 120px 60px 40px',
          zIndex: 1,
        }}
      >
        <FadeInUp delay={10}>
          <h3 style={{ fontSize: 28, fontWeight: 700, color: '#ce93d8', margin: '0 0 16px' }}>
            Everything in Pro, plus:
          </h3>
        </FadeInUp>

        <FadeInUp delay={15}>
          <div
            style={{
              padding: '12px 20px',
              background: 'rgba(255,152,0,0.08)',
              borderRadius: 12,
              border: '1px solid rgba(255,152,0,0.15)',
              marginBottom: 20,
              fontSize: 22,
              color: colors.tierPro,
              fontWeight: 600,
            }}
          >
            ✓ All 7 Pro features included
          </div>
        </FadeInUp>

        <FadeInUp delay={22}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: colors.teal, margin: '0 0 16px' }}>
            Exclusive Elite Features:
          </h3>
        </FadeInUp>

        {eliteFeatures.map((f, i) => (
          <FeatureRow key={i} text={f} included={true} index={i} baseDelay={28} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
