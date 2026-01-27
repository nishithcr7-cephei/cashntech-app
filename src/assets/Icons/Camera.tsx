import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';

export const Camera = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke="#707179"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
      stroke="#707179"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

