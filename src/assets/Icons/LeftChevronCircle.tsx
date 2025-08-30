import * as React from 'react';
import Svg, {Rect, Path, SvgProps} from 'react-native-svg';
export const LeftChevronCircle = (props: SvgProps) => (
  <Svg width={26} height={26} viewBox="0 0 26 26" fill="none" {...props}>
    <Rect width={26} height={26} rx={13} fill="#EAECF0" />
    <Path
      d="M15 17L11 13L15 9"
      stroke="black"
      strokeWidth={1.81818}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
