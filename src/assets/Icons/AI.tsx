import * as React from 'react';
import Svg, {Path, Circle, SvgProps} from 'react-native-svg';

export const AI = (props: SvgProps) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
    {/* Sparkle/Star shape for AI */}
    <Path
      d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="10" r="1.5" fill="white" />
  </Svg>
);

