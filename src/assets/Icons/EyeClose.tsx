import React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';
export const EyeClose = (props: SvgProps) => (
  <Svg width={20} height={21} viewBox="0 0 20 21" fill="none" {...props}>
    <Path
      d="M12.1021 12.8125C11.4888 13.3699 10.6792 13.6609 9.85143 13.6214C9.02361 13.582 8.24536 13.2153 7.68788 12.6021C7.1304 11.9888 6.83933 11.1793 6.87872 10.3514C6.9181 9.52362 7.2847 8.74534 7.89788 8.18781M5.78082 5.85901C2.59572 7.47194 1.25 10.5001 1.25 10.5001C1.25 10.5001 3.75 16.1245 10 16.1245C11.4644 16.1362 12.9105 15.7989 14.2186 15.1406M16.2976 13.711C18.0009 12.1855 18.75 10.5001 18.75 10.5001C18.75 10.5001 16.25 4.87452 10 4.87452C9.45869 4.87364 8.91824 4.91765 8.3842 5.0061M10.5881 7.43043C11.2523 7.55797 11.8572 7.89743 12.3122 8.39788C12.7671 8.89833 13.0475 9.5328 13.1113 10.2061"
      stroke="black"
      strokeOpacity={0.5}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.75 3.625L16.25 17.375"
      stroke="#7A7A7A"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
