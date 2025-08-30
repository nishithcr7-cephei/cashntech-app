import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';
export const LeftChevron = (props: SvgProps) => (
  <Svg
    width={6}
    height={10}
    viewBox="0 0 6 10"
    fill="none"
    {...props}>
    <Path
      d="M5 9 1 5l4-4"
      stroke="#000"
      strokeWidth={1.818}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
