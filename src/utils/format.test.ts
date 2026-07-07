import { describe, it, expect } from 'vitest';
import { formatPrice, formatWeight, formatWeightDetail } from './format';

describe('formatPrice', () => {
  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0');
  });

  it('formats thousands with locale separator', () => {
    expect(formatPrice(1500)).toBe('$1.500');
  });

  it('formats large numbers', () => {
    expect(formatPrice(1234567)).toBe('$1.234.567');
  });

  it('formats small integers correctly', () => {
    expect(formatPrice(99)).toBe('$99');
  });

  it('formats fractional cents', () => {
    expect(formatPrice(3712.5)).toBe('$3.712,5');
  });
});

describe('formatWeight', () => {
  describe('Por 500g', () => {
    it('1 = 500g', () => {
      expect(formatWeight(1, 'Por 500g')).toBe('500g');
    });

    it('2 = 1 kg', () => {
      expect(formatWeight(2, 'Por 500g')).toBe('1 kg');
    });

    it('3 = 1.5 kg', () => {
      expect(formatWeight(3, 'Por 500g')).toBe('1.5 kg');
    });

    it('4 = 2 kg', () => {
      expect(formatWeight(4, 'Por 500g')).toBe('2 kg');
    });

    it('5 = 2.5 kg', () => {
      expect(formatWeight(5, 'Por 500g')).toBe('2.5 kg');
    });
  });

  describe('Por Pack / Unidad', () => {
    it('1 = 1 unidad', () => {
      expect(formatWeight(1, 'Por Pack / Unidad')).toBe('1 unidad');
    });

    it('3 = 3 unidades', () => {
      expect(formatWeight(3, 'Por Pack / Unidad')).toBe('3 unidades');
    });
  });

  it('returns plain quantity when no presentacion', () => {
    expect(formatWeight(2)).toBe('2');
  });
});

describe('formatWeightDetail', () => {
  describe('Por 500g', () => {
    it('1 = Llevás: 500g (1 porción de 500g)', () => {
      expect(formatWeightDetail(1, 'Por 500g')).toBe('Llevás: 500g (1 porción de 500g)');
    });

    it('2 = Llevás: 1 kg (2 porciones de 500g)', () => {
      expect(formatWeightDetail(2, 'Por 500g')).toBe('Llevás: 1 kg (2 porciones de 500g)');
    });

    it('3 = Llevás: 1.5 kg (3 porciones de 500g)', () => {
      expect(formatWeightDetail(3, 'Por 500g')).toBe('Llevás: 1.5 kg (3 porciones de 500g)');
    });

    it('4 = Llevás: 2 kg (4 porciones de 500g)', () => {
      expect(formatWeightDetail(4, 'Por 500g')).toBe('Llevás: 2 kg (4 porciones de 500g)');
    });
  });

  describe('Por Pack / Unidad', () => {
    it('1 = Llevás: 1 unidad', () => {
      expect(formatWeightDetail(1, 'Por Pack / Unidad')).toBe('Llevás: 1 unidad');
    });

    it('3 = Llevás: 3 unidades', () => {
      expect(formatWeightDetail(3, 'Por Pack / Unidad')).toBe('Llevás: 3 unidades');
    });
  });

  it('returns empty when no presentacion', () => {
    expect(formatWeightDetail(2)).toBe('');
  });
});
