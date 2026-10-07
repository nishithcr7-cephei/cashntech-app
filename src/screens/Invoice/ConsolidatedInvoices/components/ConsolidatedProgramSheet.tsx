import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {FontAwesome6} from '@react-native-vector-icons/fontawesome6';
import {SafeText as Text} from '@components/index';
import {Colors, Fonts} from '@constants/index';
import {scaleFont, scaleHeight, scaleWidth} from '@utils/Scale';
import type {ConsolidatedProgramGroup} from '@utils/consolidatedProgramOptions';

type Props = {
  visible: boolean;
  groups: ConsolidatedProgramGroup[];
  loading: boolean;
  selectedIds: string[];
  onClose: () => void;
  onApply: (programIds: string[]) => void;
};

export const ConsolidatedProgramSheet: React.FC<Props> = ({
  visible,
  groups,
  loading,
  selectedIds,
  onClose,
  onApply,
}) => {
  const [draft, setDraft] = useState<string[]>(selectedIds);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setDraft(selectedIds);
      setQuery('');
    }
  }, [visible, selectedIds]);

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return groups;
    }
    return groups
      .map(group => ({
        ...group,
        programs: group.programs.filter(program =>
          program.name.toLowerCase().includes(q),
        ),
      }))
      .filter(group => group.programs.length > 0);
  }, [groups, query]);

  const toggle = (id: string) =>
    setDraft(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id],
    );

  const allPrograms = draft.length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Select Programs</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <FontAwesome6
              name="magnifying-glass"
              iconStyle="solid"
              size={scaleFont(12)}
              color={Colors.graybase}
            />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search program"
              placeholderTextColor={Colors.graybase}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => setDraft([])}
              accessibilityRole="radio"
              accessibilityState={{checked: allPrograms}}>
              <View style={[styles.radio, allPrograms && styles.radioOn]}>
                {allPrograms ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={[styles.rowText, styles.allText]}>All Programs</Text>
            </TouchableOpacity>

            {loading && !groups.length ? (
              <ActivityIndicator
                style={styles.loader}
                size="small"
                color={Colors.primaryColor}
              />
            ) : null}

            {!loading && !visibleGroups.length ? (
              <Text style={styles.emptyText}>No programs found</Text>
            ) : null}

            {visibleGroups.map(group => (
              <View key={group.bankId} style={styles.group}>
                <Text style={styles.bankName}>{group.bankName}</Text>
                {group.programs.map(program => {
                  const isOn = draft.includes(program.id);
                  return (
                    <TouchableOpacity
                      key={program.id}
                      style={styles.row}
                      activeOpacity={0.7}
                      onPress={() => toggle(program.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{checked: isOn}}>
                      <View style={[styles.checkbox, isOn && styles.checkboxOn]}>
                        {isOn ? (
                          <FontAwesome6
                            name="check"
                            iconStyle="solid"
                            size={scaleFont(10)}
                            color={Colors.white}
                          />
                        ) : null}
                      </View>
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.programName}>{program.name}</Text>
                        <Text style={styles.productName}>{program.productName}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.linkButton} onPress={() => setDraft([])}>
              <Text style={styles.linkText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              activeOpacity={0.7}
              onPress={() => onApply(draft)}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: scaleWidth(16),
    borderTopRightRadius: scaleWidth(16),
    paddingTop: scaleHeight(10),
    paddingHorizontal: scaleWidth(16),
    paddingBottom: scaleHeight(20),
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: scaleWidth(40),
    height: scaleHeight(4),
    borderRadius: scaleWidth(2),
    backgroundColor: '#E0E0E0',
    marginBottom: scaleHeight(12),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleHeight(10),
  },
  title: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.darkblack,
  },
  close: {
    fontSize: scaleFont(16),
    color: Colors.graybase,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleHeight(40),
    paddingHorizontal: scaleWidth(12),
    borderRadius: scaleWidth(10),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.white,
    marginBottom: scaleHeight(4),
  },
  searchInput: {
    flex: 1,
    marginLeft: scaleWidth(8),
    paddingVertical: 0,
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  group: {
    marginTop: scaleHeight(10),
  },
  bankName: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    marginBottom: scaleHeight(2),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleHeight(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  rowText: {
    flex: 1,
    marginLeft: scaleWidth(12),
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  allText: {
    fontFamily: Fonts.GilroySemiBold,
  },
  rowTextWrap: {
    flex: 1,
    marginLeft: scaleWidth(12),
  },
  programName: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.darkblack,
  },
  productName: {
    marginTop: scaleHeight(2),
    fontSize: scaleFont(11),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  radio: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(10),
    borderWidth: 1.5,
    borderColor: '#9AA0A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: Colors.primaryColor,
  },
  radioDot: {
    width: scaleWidth(10),
    height: scaleWidth(10),
    borderRadius: scaleWidth(5),
    backgroundColor: Colors.primaryColor,
  },
  checkbox: {
    width: scaleWidth(20),
    height: scaleWidth(20),
    borderRadius: scaleWidth(4),
    borderWidth: 1.5,
    borderColor: '#9AA0A6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxOn: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  loader: {
    marginVertical: scaleHeight(16),
  },
  emptyText: {
    paddingVertical: scaleHeight(16),
    textAlign: 'center',
    fontSize: scaleFont(13),
    fontFamily: Fonts.GilroyMedium,
    color: Colors.graybase,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleHeight(14),
  },
  linkButton: {
    paddingVertical: scaleHeight(10),
    paddingRight: scaleWidth(16),
  },
  linkText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.primaryColor,
    textDecorationLine: 'underline',
  },
  applyButton: {
    minWidth: scaleWidth(120),
    paddingVertical: scaleHeight(12),
    paddingHorizontal: scaleWidth(24),
    borderRadius: scaleWidth(10),
    backgroundColor: '#1E7B34',
    alignItems: 'center',
  },
  applyText: {
    fontSize: scaleFont(14),
    fontFamily: Fonts.GilroySemiBold,
    color: Colors.white,
  },
});
