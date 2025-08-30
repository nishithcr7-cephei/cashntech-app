/* eslint-disable react-native/no-inline-styles */
import * as React from 'react';
import Svg, {Mask, Rect, G, Path, SvgProps} from 'react-native-svg';
export const Logout = (props: SvgProps) => (
  <Svg width={25} height={24} viewBox="0 0 25 24" fill="none" {...props}>
    <Mask
      id="mask0_6542_14890"
      style={{
        maskType: 'alpha',
      }}
      maskUnits="userSpaceOnUse"
      x={0}
      y={0}
      width={25}
      height={24}>
      <Rect x={0.5} width={24} height={24} fill="#191D23" />
    </Mask>
    <G mask="url(#mask0_6542_14890)">
      <Path
        d="M5.5 21C4.95 21 4.47917 20.8042 4.0875 20.4125C3.69583 20.0208 3.5 19.55 3.5 19V5C3.5 4.45 3.69583 3.97917 4.0875 3.5875C4.47917 3.19583 4.95 3 5.5 3H12.5V5H5.5V19H12.5V21H5.5ZM16.5 17L15.125 15.55L17.675 13H9.5V11H17.675L15.125 8.45L16.5 7L21.5 12L16.5 17Z"
        fill="#4E4E55"
      />
    </G>
  </Svg>
);
