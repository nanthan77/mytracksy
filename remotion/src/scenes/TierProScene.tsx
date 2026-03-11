import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { FadeInUp, ScalePop, Badge, FeatureRow } from "../components/Animations";
import { colors, fonts } from "../styles";

const features = [
  'Unlimited AI Voice Notes',
  'Bank Email Auto-Sync',
  'Live IRD Tax Estimator',
  'Smart Receipt Scanner (OCR)',
  '1-Click Auditor Export',
  'Smart Commute Traffic Alerts',
  '50 Free AI Tokens / month',
];

export const TierProScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Shimmer on "Most Popular" badge
  const shimmer = interpolate(frame, [0, 60, 120], [-100, 200, -100], {
    extrapolateRight: 'extend',
  });

  return (
    <AbsoluteFill
      style={{
        background: colors.bgGradient,
        display: 'flex',
        fontFamily: fonts.heading,
      }}
    >
      {/* Glow accent */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,152,0,0.15) 0%, transparent 70%)',
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
        }}
      >
        <FadeInUp delay={5}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Badge text="Tier 2" color={colors.tierPro} />
            <span
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                background: 'rgba(255,152,0,0.15)',
                border: '1px solid rgba(255,152,0,0.4)',
                color: colors.tierPro,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              ⭐ MOST POPULAR
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
            Pro / Consultant
          </h2>
        </FadeInUp>

        <FadeInUp delay={18}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)' }}>LKR</span>
            <span style={{ fontSize: 72, fontWeight: 900, color: colors.tierPro }}>2,900</span>
            <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)' }}>/month</span>
          </div>
        </FadeInUp>

        <FadeInUp delay={24}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <span
              style={{
                padding: '6px 18px',
                borderRadius: 999,
                background: 'rgba(0,191,165,0.15)',
                border: '1px solid rgba(0,191,165,0.3)',
                color: colors.teal,
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Annual: LKR 29,000/yr — Save 2 Months!
            </span>
          </div>
        </FadeInUp>

        <FadeInUp delay={32}>
          <div
            style={{
              marginTop: 28,
              padding: '16px 28px',
              background: 'rgba(255,152,0,0.1)',
              borderRadius: 16,
              border: '1px solid rgba(255,152,0,0.2)',
            }}
          >
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>
              💡 100% Tax Deductible as a professional expense
            </span>
          </div>
        </FadeInUp>

        <FadeInUp delay={40}>
          <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', marginTop: 20 }}>
            Ideal for consultants & specialists managing private practice income
          </p>
        </FadeInUp>
      </div>

      {/* Right — Features */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 120px 60px 40px',
        }}
      >
        <FadeInUp delay={10}>
          <h3 style={{ fontSize: 28, fontWeight: 700, color: colors.teal, margin: '0 0 20px' }}>
            Everything in Free, plus:
          </h3>
        </FadeInUp>

        {features.map((f, i) => (
          <FeatureRow key={i} text={f} included={true} index={i} baseDelay={20} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
