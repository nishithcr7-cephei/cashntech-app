import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';
export const CircleCheck = (props: SvgProps) => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      d="M14.2507 8.75005C13.7507 11.25 11.8657 13.604 9.22071 14.13C7.9307 14.387 6.59252 14.2303 5.39672 13.6824C4.20091 13.1346 3.20843 12.2234 2.56061 11.0786C1.91278 9.93389 1.64263 8.61394 1.78862 7.30672C1.93461 5.99951 2.4893 4.77167 3.37371 3.79805C5.18771 1.80005 8.25071 1.25005 10.7507 2.25005"
      stroke={props.color || '#028D3E'}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.75 7.75L8.25 10.25L14.25 3.75"
      stroke={props.color || '#028D3E'}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
