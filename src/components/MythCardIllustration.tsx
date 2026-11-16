import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface MythCardIllustrationProps {
  topicSlug?: string | null;
  size?: number;
}

export const MythCardIllustration: React.FC<MythCardIllustrationProps> = ({
  topicSlug,
  size = 96,
}) => {
  const iconColor = Colors.primary; // #B8234D
  const badgeBg = '#FFEBF1';

  // Render sneaker/running shoe for periods & movement, or general movement
  const renderSneaker = () => (
    <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 64 64" fill="none">
      {/* Sparkle top right */}
      <Path
        d="M50 14 C50 17, 53 20, 56 20 C53 20, 50 23, 50 26 C50 23, 47 20, 44 20 C47 20, 50 17, 50 14 Z"
        fill={iconColor}
      />
      {/* Sneaker sole */}
      <Path
        d="M10 44 C12 47 16 48 24 48 L46 48 C51 48 55 46 56 42 L52 42 C49 44 45 44 42 44 L22 44 C16 44 12 43 10 44 Z"
        fill={iconColor}
      />
      {/* Sole detail line */}
      <Path
        d="M12 44 L54 44"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Sneaker upper body */}
      <Path
        d="M14 42 C13 36 15 32 18 30 C20 28 23 27 25 24 C26 22 28 22 30 24 L34 29 C38 31 44 33 52 38 C54 39 55 41 55 42 L14 42 Z"
        stroke={iconColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Heel collar / ankle cutout */}
      <Path
        d="M18 30 C20 31 23 30 25 24"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Laces / eyelets */}
      <Path
        d="M27 27 L31 29 M30 25 L34 27 M33 23 L37 25"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Dynamic movement lines behind heel */}
      <Path
        d="M8 34 L12 34 M6 38 L10 38"
        stroke={iconColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );

  const renderHygiene = () => (
    <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 64 64" fill="none">
      {/* Sparkle */}
      <Path
        d="M48 12 C48 15, 51 18, 54 18 C51 18, 48 21, 48 24 C48 21, 45 18, 42 18 C45 18, 48 15, 48 12 Z"
        fill={iconColor}
      />
      {/* Clean droplet */}
      <Path
        d="M32 16 C32 16 18 32 18 41 C18 48.7 24.3 55 32 55 C39.7 55 46 48.7 46 41 C46 32 32 16 32 16 Z"
        stroke={iconColor}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Ripple accent */}
      <Path
        d="M26 42 C26 45 28.5 48 32 48"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );

  const renderCycleChanges = () => (
    <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 64 64" fill="none">
      {/* Sparkle */}
      <Path
        d="M46 12 C46 15, 49 18, 52 18 C49 18, 46 21, 46 24 C46 21, 43 18, 40 18 C43 18, 46 15, 46 12 Z"
        fill={iconColor}
      />
      {/* Crescent moon */}
      <Path
        d="M34 18 C23 18 16 27 16 38 C16 48 24 55 34 55 C38 55 42 53.5 45 51 C37 49 31 43 31 35 C31 27 36 21 44 19 C41 18.3 37.5 18 34 18 Z"
        stroke={iconColor}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Small star */}
      <Circle cx="20" cy="22" r="1.8" fill={iconColor} />
    </Svg>
  );

  const renderFirstPeriods = () => (
    <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 64 64" fill="none">
      {/* Sparkle */}
      <Path
        d="M48 14 C48 17, 51 20, 54 20 C51 20, 48 23, 48 26 C48 23, 45 20, 42 20 C45 20, 48 17, 48 14 Z"
        fill={iconColor}
      />
      {/* Heart */}
      <Path
        d="M32 49 L18 35 C13 30 13 22 19 17 C25 12 30 16 32 20 C34 16 39 12 45 17 C51 22 51 30 46 35 L32 49 Z"
        stroke={iconColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const renderContent = () => {
    switch (topicSlug) {
      case 'hygiene':
        return renderHygiene();
      case 'cycle-changes':
        return renderCycleChanges();
      case 'first-period':
      case 'first-periods':
        return renderFirstPeriods();
      case 'periods-movement':
      default:
        return renderSneaker();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: badgeBg,
        },
      ]}
      accessibilityElementsHidden
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 10,
  },
});
