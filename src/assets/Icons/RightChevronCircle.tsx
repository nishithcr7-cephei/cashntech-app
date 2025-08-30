import * as React from 'react';
import Svg, {Rect, Path, SvgProps} from 'react-native-svg';
export const RightChevronCircle = (props: SvgProps) => (
  <Svg width={24} height={25} viewBox="0 0 24 25" fill="none" {...props}>
    <Rect
      x={24}
      y={24.5}
      width={24}
      height={24}
      rx={12}
      transform="rotate(180 24 24.5)"
      fill="#EAECF0"
    />
    <Path
      d="M10 8.5L14 12.5L10 16.5"
      stroke="black"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
