import React from "react";
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";

// ─── Fade In from bottom ───
export const FadeInUp: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, duration = 20, distance = 40, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 15 } });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [distance, 0]);

  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)`, ...style }}>
      {children}
    </div>
  );
};

// ─── Scale pop ───
export const ScalePop: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 10, mass: 0.8 } });
  const scale = interpolate(progress, [0, 1], [0.5, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div style={{ opacity, transform: `scale(${scale})`, ...style }}>
      {children}
    </div>
  );
};

// ─── Stagger list items ───
export const StaggerItem: React.FC<{
  children: React.ReactNode;
  index: number;
  baseDelay?: number;
  staggerMs?: number;
}> = ({ children, index, baseDelay = 10, staggerMs = 8 }) => {
  return (
    <FadeInUp delay={baseDelay + index * staggerMs} distance={25}>
      {children}
    </FadeInUp>
  );
};

// ─── Counting number ───
export const CountUp: React.FC<{
  target: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}> = ({ target, prefix = '', suffix = '', delay = 0, duration = 30, style }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const value = Math.round(target * progress);

  return (
    <span style={style}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
};

// ─── Pill badge ───
export const Badge: React.FC<{
  text: string;
  color: string;
  textColor?: string;
  style?: React.CSSProperties;
}> = ({ text, color, textColor = '#fff', style }) => {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '8px 24px',
        borderRadius: '999px',
        background: color,
        color: textColor,
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {text}
    </span>
  );
};

// ─── Feature row with check/cross icon ───
export const FeatureRow: React.FC<{
  text: string;
  included: boolean;
  index: number;
  baseDelay?: number;
}> = ({ text, included, index, baseDelay = 15 }) => {
  return (
    <StaggerItem index={index} baseDelay={baseDelay}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 0',
          fontSize: 26,
          fontFamily: 'Inter, sans-serif',
          color: included ? '#fff' : 'rgba(255,255,255,0.35)',
        }}
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: included ? '#00bfa5' : 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {included ? '✓' : '✗'}
        </span>
        <span style={{ textDecoration: included ? 'none' : 'line-through' }}>{text}</span>
      </div>
    </StaggerItem>
  );
};
