import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';
export const Dots = (props: SvgProps) => (
  <Svg width={36} height={32} viewBox="0 0 36 32" fill="none" {...props}>
    <Path
      d="M18 16H18.01V16.01H18V16ZM18 9H18.01V9.01H18V9ZM18 23H18.01V23.01H18V23Z"
      stroke="#95969C"
      strokeWidth={4}
      strokeLinejoin="round"
    />
  </Svg>
);
