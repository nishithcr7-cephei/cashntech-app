import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';

// Simple folder icon (SVG) to match other icons
export const Folder = (props: SvgProps) => {
  const color = (props.color as string) || '#7A7C82';
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M3.5 6.8C3.5 6.05 4.11 5.44 4.86 5.44H10.1c.36 0 .7.14.96.4l1.12 1.12c.26.26.6.4.96.4h5.94c.75 0 1.36.61 1.36 1.36v9.84c0 .75-.61 1.36-1.36 1.36H4.86c-.75 0-1.36-.61-1.36-1.36V6.8Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M3.5 9h17"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
};

