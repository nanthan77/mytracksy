import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FadeInUp, ScalePop } from "../components/Animations";
import { colors, fonts } from "../styles";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pulsing glow on CTA button
  const pulseScale = 1 + 0.03 * Math.sin(frame * 0.12);
  const glowOpacity = 0.4 + 0.2 * Math.sin(frame * 0.08);

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
      {/* Teal radial glow */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(0,191,165,${glowOpacity * 0.15}) 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <ScalePop delay={5}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
            border: '2px solid rgba(0,191,165,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            fontWeight: 800,
            color: colors.white,
            letterSpacing: -1,
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          }}
        >
          MT
        </div>
      </ScalePop>

      <FadeInUp delay={12} style={{ textAlign: 'center' }}>
        <h2
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: colors.white,
            margin: '28px 0 12px',
            lineHeight: 1.15,
          }}
        >
          Start Free.<br />
          <span style={{ color: colors.teal }}>Upgrade When Ready.</span>
        </h2>
      </FadeInUp>

      <FadeInUp delay={22}>
        <p
          style={{
            fontSize: 26,
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 700,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Join thousands of Sri Lankan doctors managing their finances smarter with MyTracksy.
        </p>
      </FadeInUp>

      {/* CTA Button */}
      <ScalePop delay={32}>
        <div
          style={{
            marginTop: 40,
            transform: `scale(${pulseScale})`,
          }}
        >
          <div
            style={{
              padding: '22px 72px',
              borderRadius: 999,
              background: colors.tealGradient,
              color: colors.white,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 0.5,
              boxShadow: `0 8px 32px rgba(0,191,165,${glowOpacity})`,
            }}
          >
            Get Started — It's Free
          </div>
        </div>
      </ScalePop>

      <FadeInUp delay={42}>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)', marginTop: 20 }}>
          mytracksy.web.app · No credit card required
        </p>
      </FadeInUp>
    </AbsoluteFill>
  );
};
