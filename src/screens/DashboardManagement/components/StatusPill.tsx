import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeText as Text} from '@components/index';
import {Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

type Tone = {bg: string; fg: string; border: string};

const TONES: Record<'green' | 'yellow' | 'orange' | 'red' | 'darkRed' | 'grey', Tone> = {
  green: {bg: '#EAF7EE', fg: '#1E7A3C', border: '#B9E2C6'},
  yellow: {bg: '#FFF7E0', fg: '#8A6400', border: '#F2DC9B'},
  orange: {bg: '#FFF0E3', fg: '#B0561A', border: '#F5C9A3'},
  red: {bg: '#FDECEC', fg: '#B42318', border: '#F4B9B4'},
  darkRed: {bg: '#F6E1DE', fg: '#8A2A1E', border: '#E2AFA8'},
  grey: {bg: '#F1F3F5', fg: '#5B6470', border: '#DDE1E6'},
};

/**
 * Every status string the risk dashboards render:
 * health (Stable/Watch/Elevated), SMA (Standard…NPA), risk category
 * (None…Critical) and case resolution (No case/Open/Closed).
 */
const STATUS_TONE: Record<string, Tone> = {
  Stable: TONES.green,
  Watch: TONES.yellow,
  Elevated: TONES.red,

  Standard: TONES.green,
  'SMA-0': TONES.yellow,
  'SMA-1': TONES.orange,
  'SMA-2': TONES.red,
  NPA: TONES.darkRed,

  None: TONES.grey,
  Low: TONES.green,
  Medium: TONES.yellow,
  High: TONES.orange,
  Critical: TONES.red,

  'No case': TONES.grey,
  Open: TONES.orange,
  Closed: TONES.green,

  Sent: TONES.green,
  'Partially Sent': TONES.yellow,
  Failed: TONES.red,
  Pending: TONES.grey,
  Skipped: TONES.grey,

  Accepted: TONES.green,
  Rejected: TONES.red,
  'Under Review': TONES.yellow,
};

export const StatusPill: React.FC<{label: string}> = ({label}) => {
  const tone = STATUS_TONE[label] ?? TONES.grey;
  return (
    <View style={[styles.pill, {backgroundColor: tone.bg, borderColor: tone.border}]}>
      <Text style={[styles.text, {color: tone.fg}]} numberOfLines={1}>
        {label || '-'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(10),
    borderWidth: 1,
  },
  text: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
  },
});
