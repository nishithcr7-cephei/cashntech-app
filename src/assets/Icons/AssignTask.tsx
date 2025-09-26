import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';

export const AssignTask = (props: SvgProps) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
    {/* Calendar outline */}
    <Path
      d="M16 2H15V1C15 0.45 14.55 0 14 0C13.45 0 13 0.45 13 1V2H7V1C7 0.45 6.55 0 6 0C5.45 0 5 0.45 5 1V2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H16C17.1 18 18 17.1 18 16V4C18 2.9 17.1 2 16 2ZM16 16H4V8H16V16ZM4 6V4H5V5C5 5.55 5.45 6 6 6C6.55 6 7 5.55 7 5V4H13V5C13 5.55 13.45 6 14 6C14.55 6 15 5.55 15 5V4H16V6H4Z"
      stroke="#2196F3"
      strokeWidth="1.5"
      fill="none"
    />
    {/* White checkmark inside */}
    <Path
      d="M8.5 12.5L7.5 11.5L6 13L8.5 15.5L14 10L13 9L8.5 12.5Z"
      fill="white"
    />
  </Svg>
);
