import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {AppBar, Container, SafeText as Text} from '@components/index';
import {LeftChevron} from '@assets/Icons';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {DashboardSkeleton} from './DashboardSkeleton';

type ShellList = {
  data: readonly any[];
  renderItem: ListRenderItem<any>;
  keyExtractor: (item: any) => string;
};

type Props = {
  navigation: any;
  title: string;
  /** Header count badge (hidden when undefined). */
  count?: number;
  /** First load — shows skeletons instead of content. */
  loading: boolean;
  refreshing: boolean;
  /** Background refetch — content stays, a small "Updating…" bar shows. */
  updating?: boolean;
  error: string | null;
  isEmpty: boolean;
  emptyText?: string;
  emptyAction?: {label: string; onPress: () => void};
  onRefresh: () => void;
  onRetry: () => void;
  /** Renders a back chevron instead of the drawer hamburger. */
  onBack?: () => void;
  /** Fixed content under the title (search, filter button); does not scroll. */
  toolbar?: React.ReactNode;
  /** Virtualised list for long result sets; used instead of `children`. */
  list?: ShellList;
  children?: React.ReactNode;
};

/** AppBar + page header + loading / error / empty states for Dashboard Management screens. */
export const DashboardShell: React.FC<Props> = ({
  navigation,
  title,
  count,
  loading,
  refreshing,
  updating = false,
  error,
  isEmpty,
  emptyText = 'No data',
  emptyAction,
  onRefresh,
  onRetry,
  onBack,
  toolbar,
  list,
  children,
}) => {
  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[Colors.primaryColor]}
    />
  );

  const renderState = () => {
    if (loading) {
      return <DashboardSkeleton variant={list ? 'list' : 'dashboard'} />;
    }
    if (error) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Could not load data</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (isEmpty) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>{emptyText}</Text>
          {emptyAction ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={emptyAction.onPress}>
              <Text style={styles.primaryButtonText}>{emptyAction.label}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }
    return null;
  };

  const state = renderState();

  return (
    <Container>
      <AppBar
        title="Dashboard Management"
        navigation={navigation}
        renderLeftIcon={
          onBack ? (
            <LeftChevron width={scaleWidth(18)} height={scaleHeight(18)} />
          ) : undefined
        }
        onPressLeftIcon={onBack}
      />
      <View style={styles.header}>
        <Text style={styles.pageTitle} numberOfLines={2}>
          {title}
        </Text>
        {count !== undefined && !loading ? (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        ) : null}
      </View>
      {updating && !loading ? (
        <View
          style={styles.updatingBar}
          accessibilityLiveRegion="polite"
          accessibilityLabel="Updating data">
          <ActivityIndicator size="small" color={Colors.primaryColor} />
          <Text style={styles.updatingText}>Updating…</Text>
        </View>
      ) : null}
      {toolbar ? <View style={styles.toolbar}>{toolbar}</View> : null}
      {list && !state ? (
        <FlatList
          data={list.data}
          renderItem={list.renderItem}
          keyExtractor={list.keyExtractor}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          windowSize={7}
          refreshControl={refreshControl}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}>
          {state ?? children}
        </ScrollView>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingTop: scaleHeight(12),
    paddingBottom: scaleHeight(8),
  },
  pageTitle: {
    flexShrink: 1,
    fontSize: scaleFont(18),
    fontFamily: Fonts.GilroyBold,
    color: Colors.darkblack,
  },
  countBadge: {
    marginLeft: scaleWidth(8),
    paddingHorizontal: scaleWidth(8),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(10),
    backgroundColor: '#FFE5E5',
  },
  countText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  toolbar: {
    paddingHorizontal: scaleWidth(16),
  },
  updatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: scaleWidth(16),
    marginBottom: scaleHeight(8),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(4),
    borderRadius: scaleWidth(12),
    backgroundColor: '#F1F5F9',
  },
  updatingText: {
    marginLeft: scaleWidth(6),
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(24),
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(48),
  },
  emptyTitle: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
    marginBottom: scaleHeight(6),
  },
  emptyText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: scaleHeight(14),
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(8),
    borderRadius: scaleWidth(6),
    backgroundColor: Colors.primaryColor,
  },
  primaryButtonText: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
