import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FadeInUp, ScalePop } from "../components/Animations";
import { colors, fonts } from "../styles";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background pulse
  const pulse = interpolate(frame, [0, 150], [0, 360]);
  const bgOpacity = 0.08 + 0.04 * Math.sin((pulse * Math.PI) / 180);

  // Logo entrance
  const logoScale = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        background: colors.bgGradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fonts.heading,
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          border: `2px solid rgba(0, 191, 165, ${bgOpacity})`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          border: `1px solid rgba(0, 191, 165, ${bgOpacity * 0.5})`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Logo */}
      <ScalePop delay={5}>
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 32,
            background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
            border: '3px solid rgba(0,191,165,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 56,
            fontWeight: 800,
            color: colors.white,
            letterSpacing: -2,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}
        >
          MT
        </div>
      </ScalePop>

      {/* Title */}
      <FadeInUp delay={15} style={{ marginTop: 32, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: colors.white,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          MyTracksy <span style={{ color: colors.teal }}>Doctor</span>
        </h1>
      </FadeInUp>

      {/* Subtitle */}
      <FadeInUp delay={30} style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: 30,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 16,
            fontWeight: 400,
          }}
        >
          Smart Finance Management for Medical Professionals
        </p>
      </FadeInUp>

      {/* "Pricing Plans" pill */}
      <FadeInUp delay={50}>
        <div
          style={{
            marginTop: 40,
            padding: '14px 48px',
            borderRadius: 999,
            background: colors.tealGradient,
            color: colors.white,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          PRICING PLANS EXPLAINED
        </div>
      </FadeInUp>
    </AbsoluteFill>
  );
};
