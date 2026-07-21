import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {UpChevron} from '@assets/Icons';
import type {ResolvedProduct} from '@store/product/product.types';

/**
 * Data-driven menu node for the drawer PRODUCTS tree (and other sections).
 * `isActive` / `highlighted` are precomputed by the caller (DrawerContent),
 * which already has access to the current route, role flags and permissions.
 */
export type DrawerMenuNode = {
  key: string;
  label: string;
  /** Only rendered for expandable (parent) nodes, matching existing drawer style. */
  icon?: React.ReactNode;
  route?: string;
  /** Defaults to true — set false to omit the item entirely (permission gating). */
  visible?: boolean;
  /** Renders the item but greyed out / non-interactive. */
  disabled?: boolean;
  /** Leaf item matches the current route (and product context, when relevant). */
  isActive?: boolean;
  /** Expandable node whose product/context is the active one — highlighted when collapsed. */
  highlighted?: boolean;
  /** Product this leaf/branch belongs to, used by DrawerContent to switch product on tap. */
  productContext?: ResolvedProduct | null;
  children?: DrawerMenuNode[];
};

type DrawerTreeMenuProps = {
  nodes: DrawerMenuNode[];
  expandedKeys: Record<string, boolean>;
  onToggle: (key: string) => void;
  onNavigate: (node: DrawerMenuNode) => void;
  depth?: number;
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
            const isOpen = !!expandedKeys[node.key];
            return (
              <View key={node.key}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    isOpen && styles.parentMenuButton,
                    !isOpen && node.highlighted && styles.activeButton,
                  ]}
                  onPress={() => onToggle(node.key)}>
                  <View style={styles.rowCenter}>
                    {node.icon ? <View style={styles.iconBox}>{node.icon}</View> : null}
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[
                        styles.buttonText,
                        isOpen && styles.parentMenuText,
                        !isOpen && node.highlighted && styles.activeButtonText,
                      ]}>
                      {node.label}
                    </Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <UpChevron rotation={isOpen ? 0 : 180} />
                  </View>
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

          return (
            <TouchableOpacity
              key={node.key}
              disabled={node.disabled}
              activeOpacity={node.disabled ? 1 : 0.7}
              style={[
                styles.button,
                node.isActive && styles.activeButton,
                node.disabled && styles.disabledMenuItem,
              ]}
              onPress={() => onNavigate(node)}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.buttonText,
                  styles.leafText,
                  node.isActive && styles.activeButtonText,
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

const styles = StyleSheet.create({
  rowCenter: {flexDirection: 'row', flex: 1, alignItems: 'center'},
  // Fixed-width icon slot so labels start at the same x regardless of glyph width.
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
