import React from "react";
import {
  Composition,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface SubtitleWord {
  word: string;
  startFrame: number;
  endFrame: number;
}

interface SubtitleProps {
  words: SubtitleWord[];
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

// Show 4-6 words at a time in a "karaoke" style
const WORDS_PER_GROUP = 5;

function SubtitleRenderer({ words }: { words: SubtitleWord[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Group words into chunks for display
  const groups: SubtitleWord[][] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_GROUP) {
    groups.push(words.slice(i, i + WORDS_PER_GROUP));
  }

  // Find current group based on frame
  const currentGroup = groups.find((group) => {
    const groupStart = group[0].startFrame;
    const groupEnd = group[group.length - 1].endFrame;
    return frame >= groupStart - 5 && frame <= groupEnd + 10;
  });

  if (!currentGroup) return null;

  const groupStart = currentGroup[0].startFrame;

  // Pop-in animation for the group
  const groupScale = spring({
    frame: frame - groupStart,
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 200,
        left: 40,
        right: 40,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "8px 12px",
        transform: `scale(${groupScale})`,
      }}
    >
      {currentGroup.map((w, i) => {
        const isActive = frame >= w.startFrame && frame <= w.endFrame;
        const isPast = frame > w.endFrame;

        // Highlight animation for active word
        const highlightProgress = isActive
          ? interpolate(
              frame,
              [w.startFrame, w.startFrame + 3],
              [0, 1],
              { extrapolateRight: "clamp" }
            )
          : isPast
            ? 1
            : 0;

        const wordScale = isActive
          ? spring({
              frame: frame - w.startFrame,
              fps,
              config: { damping: 12, stiffness: 300 },
            })
          : 1;

        return (
          <span
            key={i}
            style={{
              fontFamily: "Inter, Arial, sans-serif",
              fontSize: 64,
              fontWeight: 900,
              color: isActive ? "#FFD700" : isPast ? "#FFFFFF" : "#FFFFFF99",
              textShadow: "0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9)",
              textTransform: "uppercase",
              transform: `scale(${isActive ? wordScale * 1.15 : 1})`,
              transition: "color 0.1s",
              WebkitTextStroke: isActive ? "2px #FF8C00" : "none",
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
}

export function SubtitlesComposition() {
  return (
    <>
      <Composition
        id="Subtitles"
        component={SubtitleRenderer as React.FC}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={300} // overridden by props
        defaultProps={{
          words: [],
        }}
        calculateMetadata={({ props }: { props: Record<string, unknown> }) => {
          const inputProps = props as unknown as SubtitleProps;
          return {
            durationInFrames: inputProps.durationInFrames || 300,
            fps: inputProps.fps || 30,
            width: inputProps.width || 1080,
            height: inputProps.height || 1920,
          };
        }}
      />
    </>
  );
}
