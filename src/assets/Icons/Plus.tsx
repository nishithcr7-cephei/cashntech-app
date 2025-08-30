import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';
export const Plus = (props: SvgProps) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M12 2V22" stroke="white" strokeWidth={4} strokeLinecap="round" />
    <Path
      d="M2 12L22 12"
      stroke="white"
      strokeWidth={4}
      strokeLinecap="round"
    />
  </Svg>
);
