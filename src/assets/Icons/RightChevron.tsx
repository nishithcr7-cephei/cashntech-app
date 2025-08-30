import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';
export const RightChevron = (props: SvgProps) => (
  <Svg width={17} height={20} viewBox="0 0 17 20" fill="none" {...props}>
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.19915 14.7071C5.86721 14.3166 5.86721 13.6834 6.19915 13.2929L8.99811 10L6.19915 6.70711C5.86721 6.31658 5.86721 5.68342 6.19915 5.29289C6.5311 4.90237 7.06929 4.90237 7.40124 5.29289L10.8012 9.29289C11.1332 9.68342 11.1332 10.3166 10.8012 10.7071L7.40124 14.7071C7.06929 15.0976 6.5311 15.0976 6.19915 14.7071Z"
      fill="#4E4E55"
    />
  </Svg>
);
