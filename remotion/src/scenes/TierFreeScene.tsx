import React from "react";
import { AbsoluteFill } from "remotion";
import { FadeInUp, ScalePop, Badge, FeatureRow, CountUp } from "../components/Animations";
import { colors, fonts } from "../styles";

const included = [
  'Basic Dual-Roster Calendar',
  'Manual Income & Expense Ledger',
  'Basic IRD Tax Estimator',
  'PWA Offline Support',
  '5 Free AI Voice Notes / month',
];

const locked = [
  'Bank Auto-Sync',
  'Smart Receipt Scanner',
  'Auditor Export',
];

export const TierFreeScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: colors.bgGradient,
        display: 'flex',
        fontFamily: fonts.heading,
      }}
    >
      {/* Left — Tier info */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 80px 80px 120px',
        }}
      >
        <FadeInUp delay={5}>
          <Badge text="Tier 1" color={colors.tierFree} />
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
            Intern / Basic
          </h2>
        </FadeInUp>

        <FadeInUp delay={18}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 72, fontWeight: 900, color: colors.tierFree }}>
              LKR 0
            </span>
          </div>
          <p style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Free Forever — No credit card needed
          </p>
        </FadeInUp>

        <FadeInUp delay={25}>
          <div
            style={{
              marginTop: 32,
              padding: '16px 28px',
              background: 'rgba(76,175,80,0.12)',
              borderRadius: 16,
              border: '1px solid rgba(76,175,80,0.25)',
              display: 'inline-block',
            }}
          >
            <span style={{ fontSize: 22, color: colors.tierFree, fontWeight: 600 }}>
              🎓 Perfect for medical interns & residents starting out
            </span>
          </div>
        </FadeInUp>
      </div>

      {/* Right — Features */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 120px 80px 40px',
        }}
      >
        <FadeInUp delay={10}>
          <h3 style={{ fontSize: 28, fontWeight: 700, color: colors.teal, marginBottom: 20, margin: '0 0 20px' }}>
            What's Included
          </h3>
        </FadeInUp>

        {included.map((f, i) => (
          <FeatureRow key={i} text={f} included={true} index={i} baseDelay={20} />
        ))}

        <div style={{ marginTop: 28 }}>
          <FadeInUp delay={65}>
            <h3 style={{ fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 12, margin: '0 0 12px' }}>
              Not Included
            </h3>
          </FadeInUp>
          {locked.map((f, i) => (
            <FeatureRow key={i} text={f} included={false} index={i} baseDelay={70} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
