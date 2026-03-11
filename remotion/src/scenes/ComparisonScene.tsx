import React from "react";
import { AbsoluteFill } from "remotion";
import { FadeInUp, StaggerItem } from "../components/Animations";
import { colors, fonts } from "../styles";

const rows = [
  { feature: 'Price',                    free: 'LKR 0',        pro: 'LKR 2,900/mo',   elite: 'LKR 7,500/mo' },
  { feature: 'AI Voice Notes',           free: '5/month',       pro: 'Unlimited',       elite: 'Unlimited' },
  { feature: 'Bank Auto-Sync',           free: '✗',             pro: '✓',               elite: '✓' },
  { feature: 'Receipt Scanner',          free: '✗',             pro: '✓',               elite: '✓' },
  { feature: 'IRD Tax Estimator',        free: 'Basic',         pro: 'Live',            elite: 'Live' },
  { feature: 'Auditor Export',           free: '✗',             pro: '✓',               elite: '✓' },
  { feature: 'AI Tokens / month',        free: '0',             pro: '50',              elite: '200' },
  { feature: 'Assistant Sub-Login',      free: '✗',             pro: '✗',               elite: '✓' },
  { feature: 'Live Cash Dashboard',      free: '✗',             pro: '✗',               elite: '✓' },
  { feature: 'AI WhatsApp Receptionist', free: '✗',             pro: '✗',               elite: '✓' },
];

const colColors = [
  'transparent',
  colors.tierFree,
  colors.tierPro,
  colors.tierElite,
];

const headers = ['Feature', 'Free', 'Pro', 'Elite'];

export const ComparisonScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: colors.bgGradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fonts.heading,
        padding: '40px 100px',
      }}
    >
      <FadeInUp delay={5}>
        <h2
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: colors.white,
            margin: '0 0 36px',
            textAlign: 'center',
          }}
        >
          Compare All <span style={{ color: colors.teal }}>Plans</span>
        </h2>
      </FadeInUp>

      {/* Table */}
      <div
        style={{
          width: '100%',
          maxWidth: 1500,
          borderRadius: 24,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header row */}
        <FadeInUp delay={10}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2.5fr 1fr 1fr 1fr',
              background: 'rgba(255,255,255,0.06)',
            }}
          >
            {headers.map((h, i) => (
              <div
                key={i}
                style={{
                  padding: '18px 24px',
                  fontSize: 22,
                  fontWeight: 700,
                  color: i === 0 ? 'rgba(255,255,255,0.6)' : colColors[i],
                  textAlign: i === 0 ? 'left' : 'center',
                  borderBottom: `3px solid ${i === 0 ? 'transparent' : colColors[i]}`,
                }}
              >
                {h}
              </div>
            ))}
          </div>
        </FadeInUp>

        {/* Data rows */}
        {rows.map((row, i) => (
          <StaggerItem key={i} index={i} baseDelay={15} staggerMs={5}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2.5fr 1fr 1fr 1fr',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
              }}
            >
              <div style={{ padding: '14px 24px', fontSize: 20, color: colors.white, fontWeight: 500 }}>
                {row.feature}
              </div>
              {([row.free, row.pro, row.elite] as string[]).map((val, j) => (
                <div
                  key={j}
                  style={{
                    padding: '14px 24px',
                    fontSize: 20,
                    fontWeight: val === '✓' || val === 'Unlimited' ? 700 : 400,
                    color: val === '✗' ? 'rgba(255,255,255,0.2)' : val === '✓' || val === 'Unlimited' ? colColors[j + 1] : 'rgba(255,255,255,0.7)',
                    textAlign: 'center',
                  }}
                >
                  {val}
                </div>
              ))}
            </div>
          </StaggerItem>
        ))}
      </div>
    </AbsoluteFill>
  );
};
