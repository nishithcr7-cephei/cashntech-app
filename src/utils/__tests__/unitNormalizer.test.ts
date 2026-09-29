import {
  INVOICE_UNITS_HINT,
  isValidUnit,
  normalizeUnit,
  tidyUnitInput,
  unitCodeToLabel,
  unitLabelToCode,
} from '@utils/unitNormalizer';

describe('unitNormalizer', () => {
  it('accepts all 13 valid units as-is', () => {
    expect(INVOICE_UNITS_HINT).toBe(
      'PCS, KG, LTR, MTR, BOX, CARTON, BAG, BOTTLE, DOZEN, PAIR, SET, PACK, STRIP',
    );
    ['PCS', 'CARTON', 'BOTTLE', 'DOZEN', 'PAIR', 'PACK', 'STRIP'].forEach(unit => {
      expect(isValidUnit(unit)).toBe(true);
      expect(normalizeUnit(unit)).toBe(unit);
    });
  });

  it('normalizes case, spaces and dots', () => {
    expect(normalizeUnit(' pcs ')).toBe('PCS');
    expect(normalizeUnit('Box')).toBe('BOX');
    expect(normalizeUnit('Nos.')).toBe('PCS');
    expect(normalizeUnit('Kg.')).toBe('KG');
  });

  it('maps common invoice synonyms', () => {
    expect(normalizeUnit('NOS')).toBe('PCS');
    expect(normalizeUnit('kgs')).toBe('KG');
    expect(normalizeUnit('Litre')).toBe('LTR');
    expect(normalizeUnit('ctn')).toBe('CARTON');
    expect(normalizeUnit('btl')).toBe('BOTTLE');
    expect(normalizeUnit('doz')).toBe('DOZEN');
    expect(normalizeUnit('pkt')).toBe('PACK');
    expect(normalizeUnit('strips')).toBe('STRIP');
  });

  it('returns empty for unknown, empty or numeric text', () => {
    expect(normalizeUnit('xyz')).toBe('');
    expect(normalizeUnit('TON')).toBe('');
    expect(normalizeUnit('MT')).toBe('');
    expect(normalizeUnit('')).toBe('');
    expect(normalizeUnit(null)).toBe('');
    expect(normalizeUnit('2')).toBe('');
    expect(isValidUnit('pcs')).toBe(false);
  });

  it('tidyUnitInput keeps unknown text visible for validation', () => {
    expect(tidyUnitInput('nos')).toBe('PCS');
    expect(tidyUnitInput(' xyz ')).toBe('XYZ');
    expect(tidyUnitInput('')).toBe('');
  });

  it('unitCodeToLabel maps backend codes and labels', () => {
    expect(unitCodeToLabel('1')).toBe('PCS');
    expect(unitCodeToLabel(2)).toBe('KG');
    expect(unitCodeToLabel('13')).toBe('STRIP');
    expect(unitCodeToLabel('KG')).toBe('KG');
    expect(unitCodeToLabel('kgs')).toBe('KG');
    expect(unitCodeToLabel('TON')).toBe('TON');
    expect(unitCodeToLabel('99')).toBe('99');
    expect(unitCodeToLabel(undefined)).toBe('');
  });

  it('unitLabelToCode returns code or null (no silent PCS fallback)', () => {
    expect(unitLabelToCode('PCS')).toBe('1');
    expect(unitLabelToCode('kgs')).toBe('2');
    expect(unitLabelToCode('STRIP')).toBe('13');
    expect(unitLabelToCode('xyz')).toBeNull();
    expect(unitLabelToCode('')).toBeNull();
  });
});
