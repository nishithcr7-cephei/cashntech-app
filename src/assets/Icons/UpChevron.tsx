import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';
export const UpChevron = (props: SvgProps) => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.7071 10.7071C12.3166 11.0976 11.6834 11.0976 11.2929 10.7071L8 7.41421L4.70711 10.7071C4.31658 11.0976 3.68342 11.0976 3.29289 10.7071C2.90237 10.3166 2.90237 9.68342 3.29289 9.29289L7.29289 5.29289C7.68342 4.90237 8.31658 4.90237 8.70711 5.29289L12.7071 9.29289C13.0976 9.68342 13.0976 10.3166 12.7071 10.7071Z"
      fill="#003761"
    />
  </Svg>
);
