import * as React from 'react';
import Svg, {Polyline, SvgProps} from 'react-native-svg';
export const Tick = (props: SvgProps) => (
  <Svg
    width="800px"
    height="800px"
    viewBox="0 0 16 16"
    fill="none"
    stroke="#000000"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.5}
    {...props}>
    <Polyline points="2.75 8.75,6.25 12.25,13.25 4.75" />
  </Svg>
);
