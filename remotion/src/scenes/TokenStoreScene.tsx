import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { FadeInUp, ScalePop, Badge, StaggerItem } from "../components/Animations";
import { colors, fonts } from "../styles";

const useCases = [
  { icon: '🎤', text: 'AI Voice-to-Expense conversion' },
  { icon: '📸', text: 'Smart Receipt OCR scanning' },
  { icon: '📊', text: 'AI Financial insights & reports' },
  { icon: '💬', text: 'WhatsApp AI Receptionist replies' },
];

export const TokenStoreScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Floating coin animation
  const coinY = 8 * Math.sin(frame * 0.06);
  const coinRotate = interpolate(frame, [0, 210], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        background: colors.bgGradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fonts.heading,
        padding: '60px 120px',
      }}
    >
      {/* Gold glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <FadeInUp delay={5}>
        <Badge text="Add-On" color={colors.tokenGold} textColor="#1a1a2e" />
      </FadeInUp>

      <FadeInUp delay={10}>
        <h2
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: colors.white,
            margin: '24px 0 4px',
            textAlign: 'center',
          }}
        >
          AI Token Store
        </h2>
      </FadeInUp>

      {/* Price card */}
      <ScalePop delay={18}>
        <div
          style={{
            marginTop: 24,
            padding: '40px 64px',
            background: 'rgba(255,215,0,0.06)',
            borderRadius: 28,
            border: '2px solid rgba(255,215,0,0.2)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)' }}>LKR</span>
            <span style={{ fontSize: 80, fontWeight: 900, color: colors.tokenGold }}>1,500</span>
          </div>
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            for <span style={{ color: colors.white, fontWeight: 700 }}>100 AI Tokens</span>
          </div>
          <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
            Just LKR 15 per token · Tokens never expire
          </div>
        </div>
      </ScalePop>

      {/* Use cases */}
      <FadeInUp delay={35}>
        <h3 style={{ fontSize: 28, fontWeight: 700, color: colors.teal, margin: '40px 0 20px', textAlign: 'center' }}>
          What can tokens do?
        </h3>
      </FadeInUp>

      <div
        style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {useCases.map((uc, i) => (
          <StaggerItem key={i} index={i} baseDelay={40} staggerMs={8}>
            <div
              style={{
                padding: '20px 32px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span style={{ fontSize: 32 }}>{uc.icon}</span>
              <span style={{ fontSize: 22, color: colors.white, fontWeight: 500 }}>{uc.text}</span>
            </div>
          </StaggerItem>
        ))}
      </div>
    </AbsoluteFill>
  );
};
