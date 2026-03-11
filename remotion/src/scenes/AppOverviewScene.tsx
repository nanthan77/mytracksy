import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { FadeInUp, StaggerItem, ScalePop } from "../components/Animations";
import { colors, fonts } from "../styles";

const features = [
  { icon: '🩺', title: 'Dual-Roster Calendar', desc: 'Manage hospital & private clinic schedules' },
  { icon: '💰', title: 'Income & Expense Tracking', desc: 'Track all medical income sources' },
  { icon: '🧾', title: 'IRD Tax Estimator', desc: 'Sri Lankan tax compliance built-in' },
  { icon: '🤖', title: 'AI Voice Notes', desc: 'Dictate expenses on the go' },
  { icon: '📱', title: 'PWA + Offline', desc: 'Works without internet' },
  { icon: '📊', title: 'Smart Analytics', desc: 'Revenue insights & growth tracking' },
];

export const AppOverviewScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: colors.bgGradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 120px',
        fontFamily: fonts.heading,
      }}
    >
      {/* Section title */}
      <FadeInUp delay={5}>
        <h2
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: colors.white,
            textAlign: 'center',
            margin: 0,
          }}
        >
          Built for <span style={{ color: colors.teal }}>Sri Lankan Doctors</span>
        </h2>
      </FadeInUp>

      <FadeInUp delay={12}>
        <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', marginTop: 8, marginBottom: 48 }}>
          Everything you need to manage your medical practice finances
        </p>
      </FadeInUp>

      {/* Feature grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 28,
          width: '100%',
          maxWidth: 1400,
        }}
      >
        {features.map((f, i) => (
          <StaggerItem key={i} index={i} baseDelay={20} staggerMs={10}>
            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 20,
                padding: '32px 28px',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: colors.white, marginBottom: 6 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                {f.desc}
              </div>
            </div>
          </StaggerItem>
        ))}
      </div>
    </AbsoluteFill>
  );
};
