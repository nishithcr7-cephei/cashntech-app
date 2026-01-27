import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';

// Simple bank/building icon (SVG) to avoid font-glyph '?' issues
export const BankBuilding = (props: SvgProps) => {
  const color = (props.color as string) || '#7A7C82';
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
      {/* roof */}
      <Path
        d="M3 9.5L12 4l9 5.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* base line */}
      <Path
        d="M4.5 19.5h15"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* pillars */}
      <Path
        d="M6.5 10.5v8M10 10.5v8M14 10.5v8M17.5 10.5v8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* top beam */}
      <Path
        d="M5.5 10.5h13"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

