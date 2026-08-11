import React from 'react';
import {ScrollView, ScrollViewProps} from 'react-native';

export type PersistentScrollViewProps = ScrollViewProps;

/**
 * Modal scroll wrapper — native thin scroll thumb (iOS-style) on both platforms.
 * No persistent track bar; indicator appears while scrolling only.
 */
export const PersistentScrollView: React.FC<PersistentScrollViewProps> = ({
  showsVerticalScrollIndicator = true,
  persistentScrollbar: _persistentScrollbar,
  ...rest
}) => (
  <ScrollView
    showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    {...rest}
  />
);
