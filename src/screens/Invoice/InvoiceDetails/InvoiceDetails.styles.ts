import {StyleSheet} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';

export const styles = StyleSheet.create({
  scroll: {
    backgroundColor: Colors.white,
  },
  pageTitleBar: {
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(12),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  pageTitleText: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  content: {
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  summaryCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleWidth(12),
    marginTop: scaleHeight(8),
    marginBottom: scaleHeight(16),
  },
  summaryCard: {
    flexBasis: '47%',
    backgroundColor: '#FFF5F5',
    borderRadius: scaleWidth(12),
    padding: scaleWidth(16),
    borderWidth: 1,
    borderColor: '#FFD9D9',
    minWidth: 0,
  },
  summaryCardLabel: {
    fontSize: scaleFont(13),
    color: Colors.graybase,
    marginBottom: scaleHeight(6),
  },
  summaryCardValue: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  listTopSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E6E6E6',
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(12),
  },
  verticalList: {
    marginTop: scaleHeight(8),
    gap: scaleHeight(12),
  },
  loadingContainer: {
    paddingVertical: scaleHeight(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: scaleHeight(12),
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
  },
  emptyState: {
    paddingVertical: scaleHeight(40),
    paddingHorizontal: scaleWidth(16),
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: scaleFont(14),
    color: Colors.graybase,
    fontFamily: Fonts.GilroyMedium,
    textAlign: 'center',
  },
  errorStateText: {
    fontSize: scaleFont(14),
    color: Colors.red,
    fontFamily: Fonts.GilroyMedium,
    textAlign: 'center',
  },
});
