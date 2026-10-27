import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {UpChevron} from '@assets/Icons';
import type {ResolvedProduct} from '@store/product/product.types';

/**
 * Data-driven menu node for the drawer PRODUCTS tree (and other sections).
 * `isActive` / styling flags are precomputed by the caller (DrawerContent).
 */
export type DrawerMenuNode = {
  key: string;
  label: string;
  /** Full product name shown via info icon / accessibility when label is compact (e.g. PID). */
  fullLabel?: string;
  /** Only rendered for expandable (parent) nodes, matching existing drawer style. */
  icon?: React.ReactNode;
  route?: string;
  /** Params passed with `route` on navigate. */
  routeParams?: Record<string, unknown>;
  /** Defaults to true — set false to omit the item entirely (permission gating). */
  visible?: boolean;
  /** Renders the item but greyed out / non-interactive. */
  disabled?: boolean;
  /** Leaf item matches the current route (and product context, when relevant). */
  isActive?: boolean;
  /** Expandable node whose product/context is the active one — highlighted when collapsed. */
  highlighted?: boolean;
  /** Top-level product branch is the currently active product. */
  isActiveProductBranch?: boolean;
  /** Top-level product branch is not the active product (multi-product only). */
  isInactiveProductBranch?: boolean;
  /** Render a separator line before this node (between product groups). */
  showSeparatorBefore?: boolean;
  /** Descendant of the active product branch — drives submenu styling. */
  isUnderActiveProduct?: boolean;
  /** Product this leaf/branch belongs to, used by DrawerContent to switch product on tap. */
  productContext?: ResolvedProduct | null;
  /** 'consolidated' = cross-product read-only view; rendered as a distinct card-like leaf. */
  variant?: 'consolidated';
  /** Second line under the label (used by the consolidated variant). */
  caption?: string;
  children?: DrawerMenuNode[];
};

type DrawerTreeMenuProps = {
  nodes: DrawerMenuNode[];
  expandedKeys: Record<string, boolean>;
  onToggle: (key: string) => void;
  onNavigate: (node: DrawerMenuNode) => void;
  /** Active product code from Redux — used for tree styling context. */
  activeProductCode?: string | null;
  depth?: number;
};

const getParentRowStyle = (node: DrawerMenuNode, isOpen: boolean) => {
  if (node.isActiveProductBranch) {
    return [styles.button, styles.productBranchActive, isOpen && styles.productBranchActiveOpen];
  }
  if (node.isInactiveProductBranch) {
    return [styles.button, styles.productBranchInactive];
  }
  if (node.isUnderActiveProduct === false) {
    return [styles.button, isOpen ? styles.inactiveSubParentOpen : styles.inactiveSubParent];
  }
  return [
    styles.button,
    isOpen && styles.parentMenuButton,
    !isOpen && node.highlighted && styles.activeButton,
  ];
};

const getParentTextStyle = (node: DrawerMenuNode, isOpen: boolean) => {
  if (node.isActiveProductBranch) {
    return [styles.productBranchActiveText, isOpen && styles.productBranchActiveTextOpen];
  }
  if (node.isInactiveProductBranch) {
    return styles.productBranchInactiveText;
  }
  if (node.isUnderActiveProduct === false) {
    return styles.inactiveSubParentText;
  }
  return [
    styles.buttonText,
    isOpen && styles.parentMenuText,
    !isOpen && node.highlighted && styles.activeButtonText,
  ];
};

export const DrawerTreeMenu: React.FC<DrawerTreeMenuProps> = ({
  nodes,
  expandedKeys,
  onToggle,
  onNavigate,
  depth = 0,
}) => {
  return (
    <>
      {nodes
        .filter(node => node.visible !== false)
        .map(node => {
          const hasChildren = !!node.children && node.children.length > 0;

          if (hasChildren) {
            const isOpen = !!expandedKeys[node.key] && !node.disabled;
            return (
              <View
                key={node.key}
                style={node.showSeparatorBefore ? styles.productBranchWrapper : undefined}>
                {node.showSeparatorBefore ? <View style={styles.productSeparator} /> : null}
                <TouchableOpacity
                  style={[
                    getParentRowStyle(node, isOpen),
                    node.disabled && styles.disabledMenuItem,
                  ]}
                  disabled={node.disabled}
                  activeOpacity={node.disabled ? 1 : 0.7}
                  onPress={() => {
                    if (!node.disabled) {
                      onToggle(node.key);
                    }
                  }}>
                  <View style={styles.rowCenter}>
                    {node.icon ? <View style={styles.iconBox}>{node.icon}</View> : null}
                    <Text
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      accessibilityLabel={node.fullLabel ?? node.label}
                      style={[
                        getParentTextStyle(node, isOpen),
                        node.disabled && styles.disabledMenuItemText,
                      ]}>
                      {node.label}
                    </Text>
                    {node.fullLabel && !node.disabled ? (
                      <TouchableOpacity
                        style={styles.infoButton}
                        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                        accessibilityRole="button"
                        accessibilityLabel={`Show full product name: ${node.fullLabel}`}
                        onPress={() => Alert.alert('Product', node.fullLabel)}>
                        <FontAwesome6
                          name="circle-info"
                          iconStyle="solid"
                          size={scaleFont(14)}
                          color="#84919A"
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {!node.disabled ? (
                    <View style={styles.arrowContainer}>
                      <UpChevron rotation={isOpen ? 0 : 180} />
                    </View>
                  ) : null}
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.childIndent}>
                    <DrawerTreeMenu
                      nodes={node.children!}
                      expandedKeys={expandedKeys}
                      onToggle={onToggle}
                      onNavigate={onNavigate}
                      depth={depth + 1}
                    />
                  </View>
                )}
              </View>
            );
          }

          const showLeafActive = node.isActive && node.isUnderActiveProduct !== false;

          if (node.variant === 'consolidated') {
            return (
              <TouchableOpacity
                key={node.key}
                disabled={node.disabled}
                activeOpacity={node.disabled ? 1 : 0.7}
                style={[
                  styles.consolidatedLeaf,
                  node.isActive && styles.consolidatedLeafActive,
                  node.disabled && styles.disabledMenuItem,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${node.label}${node.caption ? `, ${node.caption}` : ''}`}
                onPress={() => onNavigate(node)}>
                <View
                  style={[
                    styles.consolidatedIcon,
                    node.isActive && styles.consolidatedIconActive,
                  ]}>
                  <FontAwesome6
                    name="layer-group"
                    iconStyle="solid"
                    size={scaleFont(12)}
                    color={node.isActive ? Colors.white : CONSOLIDATED_ACCENT}
                  />
                </View>
                <View style={styles.consolidatedTextBox}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.consolidatedLabel,
                      node.isActive && styles.activeButtonText,
                      node.disabled && styles.disabledMenuItemText,
                    ]}>
                    {node.label}
                  </Text>
                  {node.caption ? (
                    <Text numberOfLines={2} style={styles.consolidatedCaption}>
                      {node.caption}
                    </Text>
                  ) : null}
                </View>
                <FontAwesome6
                  name="eye"
                  iconStyle="solid"
                  size={scaleFont(11)}
                  color={node.isActive ? Colors.primaryColor : '#8A9BB8'}
                />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={node.key}
              disabled={node.disabled}
              activeOpacity={node.disabled ? 1 : 0.7}
              style={[
                styles.button,
                styles.leafButton,
                showLeafActive && styles.activeButton,
                node.isUnderActiveProduct === false && styles.inactiveLeaf,
                node.disabled && styles.disabledMenuItem,
              ]}
              onPress={() => onNavigate(node)}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.buttonText,
                  styles.leafText,
                  showLeafActive && styles.activeButtonText,
                  node.isUnderActiveProduct === false && styles.inactiveLeafText,
                  node.disabled && styles.disabledMenuItemText,
                ]}>
                {node.label}
              </Text>
            </TouchableOpacity>
          );
        })}
    </>
  );
};

const CONSOLIDATED_ACCENT = '#2F5BB7';

const styles = StyleSheet.create({
  rowCenter: {flexDirection: 'row', flex: 1, alignItems: 'center', minWidth: 0},
  consolidatedLeaf: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(8),
    paddingHorizontal: scaleWidth(10),
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(6),
    borderRadius: scaleWidth(8),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#AFC3EA',
    backgroundColor: '#F2F6FF',
  },
  consolidatedLeafActive: {
    borderStyle: 'solid',
    borderColor: Colors.primaryColor,
    backgroundColor: '#FFE9E9',
  },
  consolidatedIcon: {
    width: scaleWidth(24),
    height: scaleWidth(24),
    borderRadius: scaleWidth(6),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCE6FA',
  },
  consolidatedIconActive: {
    backgroundColor: Colors.primaryColor,
  },
  consolidatedTextBox: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: scaleWidth(10),
  },
  consolidatedLabel: {
    color: '#1F3B73',
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(13),
  },
  consolidatedCaption: {
    marginTop: scaleHeight(1),
    color: '#6B7A90',
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(10),
  },
  infoButton: {
    marginLeft: scaleWidth(6),
    padding: scaleWidth(2),
  },
  iconBox: {
    width: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(8),
    marginBottom: scaleHeight(4),
    borderRadius: scaleWidth(6),
  },
  leafButton: {
    paddingVertical: scaleHeight(8),
    marginBottom: scaleHeight(2),
  },
  productBranchWrapper: {
    marginTop: scaleHeight(6),
  },
  productSeparator: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: scaleHeight(8),
    marginHorizontal: scaleWidth(8),
  },
  productBranchActive: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: scaleWidth(3),
    borderLeftColor: Colors.primaryColor,
  },
  productBranchActiveOpen: {
    backgroundColor: '#FFF5F5',
  },
  productBranchActiveText: {
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroySemiBold,
    fontSize: scaleFont(15),
    marginStart: scaleWidth(12),
    flexShrink: 1,
  },
  productBranchActiveTextOpen: {
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroySemiBold,
  },
  productBranchInactive: {
    backgroundColor: '#FAFAFA',
  },
  productBranchInactiveText: {
    color: '#757575',
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(15),
    marginStart: scaleWidth(12),
    flexShrink: 1,
  },
  inactiveSubParent: {
    backgroundColor: Colors.white,
  },
  inactiveSubParentOpen: {
    backgroundColor: '#FAFAFA',
  },
  inactiveSubParentText: {
    color: '#757575',
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(15),
    marginStart: scaleWidth(12),
    flexShrink: 1,
  },
  inactiveLeaf: {
    backgroundColor: Colors.white,
  },
  inactiveLeafText: {
    color: '#757575',
    fontFamily: Fonts.GilroyMedium,
  },
  activeButton: {
    backgroundColor: '#FFE9E9',
    borderLeftWidth: scaleWidth(3),
    borderLeftColor: Colors.primaryColor,
  },
  parentMenuButton: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: scaleWidth(2),
    borderLeftColor: 'rgba(227, 6, 19, 0.3)',
  },
  arrowContainer: {
    paddingLeft: scaleWidth(16),
    paddingRight: scaleWidth(8),
  },
  buttonText: {
    color: '#252C32',
    fontFamily: Fonts.GilroyMedium,
    fontSize: scaleFont(15),
    marginStart: scaleWidth(12),
    flexShrink: 1,
  },
  leafText: {
    fontSize: scaleFont(13),
    marginStart: scaleWidth(4),
  },
  activeButtonText: {
    color: Colors.primaryColor,
    fontFamily: Fonts.GilroySemiBold,
  },
  disabledMenuItem: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  disabledMenuItemText: {
    color: '#9E9E9E',
  },
  parentMenuText: {
    color: '#E30613',
    fontFamily: Fonts.GilroySemiBold,
  },
  childIndent: {
    marginLeft: scaleWidth(16),
  },
});
