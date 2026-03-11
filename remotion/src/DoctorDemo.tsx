import { AbsoluteFill, Sequence } from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { AppOverviewScene } from "./scenes/AppOverviewScene";
import { TierFreeScene } from "./scenes/TierFreeScene";
import { TierProScene } from "./scenes/TierProScene";
import { TierEliteScene } from "./scenes/TierEliteScene";
import { TokenStoreScene } from "./scenes/TokenStoreScene";
import { ComparisonScene } from "./scenes/ComparisonScene";
import { CTAScene } from "./scenes/CTAScene";

// Scene durations in frames (30fps)
const INTRO = 0;
const INTRO_DUR = 150;          // 5s

const OVERVIEW = 150;
const OVERVIEW_DUR = 240;       // 8s

const TIER_FREE = 390;
const TIER_FREE_DUR = 270;      // 9s

const TIER_PRO = 660;
const TIER_PRO_DUR = 330;       // 11s

const TIER_ELITE = 990;
const TIER_ELITE_DUR = 300;     // 10s

const TOKEN_STORE = 1290;
const TOKEN_STORE_DUR = 210;    // 7s

const COMPARISON = 1500;
const COMPARISON_DUR = 270;     // 9s

const CTA = 1770;
const CTA_DUR = 180;            // 6s — last scene before total 75s (extends to 2250)

export const DoctorDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a1a' }}>
      <Sequence from={INTRO} durationInFrames={INTRO_DUR} name="Intro">
        <IntroScene />
      </Sequence>

      <Sequence from={OVERVIEW} durationInFrames={OVERVIEW_DUR} name="App Overview">
        <AppOverviewScene />
      </Sequence>

      <Sequence from={TIER_FREE} durationInFrames={TIER_FREE_DUR} name="Tier 1 — Free">
        <TierFreeScene />
      </Sequence>

      <Sequence from={TIER_PRO} durationInFrames={TIER_PRO_DUR} name="Tier 2 — Pro">
        <TierProScene />
      </Sequence>

      <Sequence from={TIER_ELITE} durationInFrames={TIER_ELITE_DUR} name="Tier 3 — Elite">
        <TierEliteScene />
      </Sequence>

      <Sequence from={TOKEN_STORE} durationInFrames={TOKEN_STORE_DUR} name="AI Token Store">
        <TokenStoreScene />
      </Sequence>

      <Sequence from={COMPARISON} durationInFrames={COMPARISON_DUR} name="Tier Comparison">
        <ComparisonScene />
      </Sequence>

      <Sequence from={CTA} durationInFrames={CTA_DUR} name="Call to Action">
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
