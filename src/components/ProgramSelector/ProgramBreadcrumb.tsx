import React, {useMemo, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import {AuthNavigatorType} from '@type/NavigatorTypes';
import {BankBuilding, Folder, File, RightChevron, EditIcon, UpChevron} from '@assets/Icons';
import {
  selectProgramSelection,
  selectSelectedPrograms,
} from '@store/programSelection/programSelection.selector';
import {userSelector} from '@store/user';
import {AppRole} from '@constants/roles';

export const ProgramBreadcrumb: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const selection = useSelector(selectProgramSelection);
  const selectedPrograms = useSelector(selectSelectedPrograms);
  const userRole = useSelector(userSelector.getUserRole) as AppRole | null;
  const isAnchorMaker = userRole === 'anchor_maker';
  const isDealerMaker = userRole === 'dealer_maker';
  const isAnchorChecker = userRole === 'anchor_checker';
  const isDealerChecker = userRole === 'dealer_checker';
  const isCashnTechUser = userRole === 'cashntech_user';
  // All roles can use "All Program" scope when Dealer Finance Program is selected
  const canUseAllProgramScope = 
    isAnchorMaker || 
    isDealerMaker || 
    isAnchorChecker || 
    isDealerChecker || 
    isCashnTechUser;
  // isExpanded state - Commented for single selection, uncomment for multiple selection
  // const [isExpanded, setIsExpanded] = useState(false);

  // ============================================================================
  // SINGLE SELECTION MODE (Current Implementation)
  // ============================================================================
  // Currently displays only one selected program.
  //
  // TO REVERT TO MULTIPLE SELECTION IN THE FUTURE:
  // 1. Uncomment isExpanded state (line 20)
  // 2. Change programToDisplay to return array (programsToDisplay)
  // 3. Uncomment renderProgramChip function
  // 4. Uncomment expand/collapse button logic
  // 5. Uncomment badge (+X More) display
  // ============================================================================
  
  // Get single program to display
  const programToDisplay = useMemo(() => {
    if (selectedPrograms && selectedPrograms.length > 0) {
      return selectedPrograms[0]; // Only first program for single selection
    }
    // Fallback to old single selection
    if (selection.programId && selection.bankName && selection.productName && selection.programName) {
      return {
        bankId: selection.bankId || '',
        bankName: selection.bankName,
        productId: selection.productId || '',
        productName: selection.productName,
        programId: selection.programId,
        programName: selection.programName,
        userType: selection.userType || 'dealer',
      };
    }
    return null;
  }, [selectedPrograms, selection]);

  // Anchor/Dealer Maker can be in "All Program" scope even without a selected program
  if (!programToDisplay && !(canUseAllProgramScope && selection.programScope === 'all')) return null;

  const getBankLabel = (bankName: string) => {
    return bankName.toLowerCase().includes('tata capital') ? 'TCL' : bankName;
  };

  const getProductLabel = (productName: string) => {
    return productName.toLowerCase().includes('dealer finance') ? 'DF' : productName;
  };

  // MULTIPLE SELECTION CODE - Commented for single selection, uncomment for multiple selection
  // Collapsed: show first program, Expanded: show all
  // const displayPrograms = isExpanded 
  //   ? programsToDisplay 
  //   : programsToDisplay.slice(0, 1);
  // 
  // const hasMultiplePrograms = programsToDisplay.length > 1;
  // const remainingCount = programsToDisplay.length - 1;

  // Render compact chip format for each program (for multiple selection)
  // const renderProgramChip = (program: typeof programsToDisplay[0], index: number) => {
  //   const bankLabel = getBankLabel(program.bankName);
  //   const productLabel = getProductLabel(program.productName);
  //   const chipText = `${bankLabel}-${productLabel}-${program.programName}`;
  //
  //   return (
  //     <View key={index} style={styles.chipContainer}>
  //       <View style={styles.chip}>
  //         <View style={styles.chipContent}>
  //           <BankBuilding
  //             width={scaleWidth(12)}
  //             height={scaleWidth(12)}
  //             color={Colors.primaryColor}
  //           />
  //           <Text style={styles.chipText} numberOfLines={1} ellipsizeMode="tail">
  //             {chipText}
  //           </Text>
  //         </View>
  //         <TouchableOpacity
  //           style={styles.chipChangeButton}
  //           onPress={() => navigation.navigate('SelectProgramScreen')}
  //           hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
  //           <EditIcon />
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   );
  // };

  // Render full breadcrumb format (two-row layout)
  // Row 1: Bank › Product
  // Row 2: Program name  [Change]
  const renderFullBreadcrumb = (program: any) => {
    if (!program) return null;
    return (
      <View style={styles.fullBreadcrumb}>
        {/* Row 1: Bank › Product */}
        <View style={styles.breadcrumbRow}>
          <View style={styles.itemFixed}>
            <BankBuilding
              width={scaleWidth(13)}
              height={scaleWidth(13)}
              color={Colors.primaryColor}
            />
            <Text style={styles.breadcrumbText} numberOfLines={1} ellipsizeMode="tail">
              {getBankLabel(program.bankName)}
            </Text>
          </View>

          <RightChevron
            height={scaleHeight(10)}
            width={scaleWidth(10)}
            style={styles.chev}
          />

          <View style={styles.itemFixed}>
            <Folder
              width={scaleWidth(13)}
              height={scaleWidth(13)}
              color={Colors.primaryColor}
            />
            <Text style={styles.breadcrumbText} numberOfLines={1} ellipsizeMode="tail">
              {getProductLabel(program.productName)}
            </Text>
          </View>
        </View>

        {/* Row 2: Program name + Change button */}
        <View style={styles.breadcrumbRow2}>
          <View style={styles.itemGrow}>
            <File
              width={scaleWidth(13)}
              height={scaleWidth(13)}
              color={Colors.primaryColor}
            />
            <Text style={styles.breadcrumbTextGrow} numberOfLines={1} ellipsizeMode="tail">
              {program.programName}
            </Text>
          </View>

          {/* BADGE CODE - Commented for single selection, uncomment for multiple selection */}
          {/* 
          {hasMultiplePrograms && !isExpanded && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>+{remainingCount}</Text>
            </View>
          )}
          */}

          <TouchableOpacity
            style={styles.changePill}
            onPress={() => navigation.navigate('SelectProgramScreen', {fromScreen: route.name})}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <EditIcon />
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAllProgramBreadcrumb = () => {
    return (
      <View style={styles.fullBreadcrumb}>
        <View style={styles.breadcrumbRow}>
          <View style={styles.itemGrow}>
            <File
              width={scaleWidth(13)}
              height={scaleWidth(13)}
              color={Colors.primaryColor}
            />
            <Text style={styles.breadcrumbTextGrow} numberOfLines={1} ellipsizeMode="tail">
              All Program
            </Text>
          </View>

            <TouchableOpacity
            style={styles.changePill}
            onPress={() => navigation.navigate('SelectProgramScreen', {fromScreen: route.name})}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <EditIcon />
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.breadcrumbContainer}>
      <View style={styles.cardWrapper}>
        {/* Single program display */}
        {canUseAllProgramScope && selection.programScope === 'all'
          ? renderAllProgramBreadcrumb()
          : renderFullBreadcrumb(programToDisplay)}

        {/* EXPAND/COLLAPSE BUTTON - Commented for single selection, uncomment for multiple selection */}
        {/* 
        {hasMultiplePrograms && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Text style={styles.expandText}>
              {isExpanded ? 'Show Less' : `+${remainingCount} More`}
            </Text>
            {isExpanded ? (
              <UpChevron height={scaleHeight(14)} width={scaleWidth(14)} />
            ) : (
              <RightChevron height={scaleHeight(14)} width={scaleWidth(14)} />
            )}
          </TouchableOpacity>
        )}
        */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  breadcrumbContainer: {
    paddingHorizontal: scaleWidth(12),
    paddingVertical: scaleHeight(8),
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  cardWrapper: {
    backgroundColor: '#FFF9F9',
    borderWidth: 1,
    borderColor: '#FFD9D9',
    borderRadius: scaleWidth(10),
    overflow: 'hidden',
  },
  fullBreadcrumb: {
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: scaleWidth(4),
    width: '100%',
  },
  breadcrumbRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: scaleWidth(4),
    width: '100%',
    marginTop: scaleHeight(4),
  },
  itemFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    flexShrink: 0,
  },
  itemGrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  chev: {
    opacity: 0.8,
  },
  breadcrumbText: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  breadcrumbTextGrow: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    minWidth: 0,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: Colors.primaryColor,
    borderRadius: scaleWidth(10),
    paddingHorizontal: scaleWidth(6),
    paddingVertical: scaleHeight(2),
    marginLeft: scaleWidth(4),
    minWidth: scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroyBold,
    color: Colors.white,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(4),
    paddingHorizontal: scaleWidth(6),
    paddingVertical: scaleHeight(2),
    borderRadius: scaleWidth(999),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD9D9',
    marginLeft: scaleWidth(4),
    flexShrink: 0,
  },
  changeText: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
  chipsContainer: {
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
    gap: scaleHeight(8),
  },
  chipContainer: {
    width: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD9D9',
    borderRadius: scaleWidth(8),
    paddingHorizontal: scaleWidth(10),
    paddingVertical: scaleHeight(8),
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleWidth(6),
    flex: 1,
    minWidth: 0,
  },
  chipText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.primaryColor,
    flex: 1,
  },
  chipChangeButton: {
    padding: scaleWidth(4),
    marginLeft: scaleWidth(8),
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleHeight(10),
    paddingHorizontal: scaleWidth(10),
    borderTopWidth: 1,
    borderTopColor: '#FFD9D9',
    gap: scaleWidth(6),
    backgroundColor: '#FFFFFF',
  },
  expandText: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
  },
});
