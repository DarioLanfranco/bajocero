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
  describe('500g aprox. (unidad)', () => {
    it('1 = 500g aprox.', () => {
      expect(formatWeight(1, '500g aprox.')).toBe('500g aprox.');
    });
    it('2 = 1 kg aprox.', () => {
      expect(formatWeight(2, '500g aprox.')).toBe('1 kg aprox.');
    });
    it('3 = 1,5 kg aprox.', () => {
      expect(formatWeight(3, '500g aprox.')).toBe('1,5 kg aprox.');
    });
    it('4 = 2 kg aprox.', () => {
      expect(formatWeight(4, '500g aprox.')).toBe('2 kg aprox.');
    });
    it('5 = 2,5 kg aprox.', () => {
      expect(formatWeight(5, '500g aprox.')).toBe('2,5 kg aprox.');
    });
  });

  describe('400g aprox. (unidad400)', () => {
    it('1 = 400g aprox.', () => {
      expect(formatWeight(1, '400g aprox.')).toBe('400g aprox.');
    });
    it('2 = 800g aprox.', () => {
      expect(formatWeight(2, '400g aprox.')).toBe('800g aprox.');
    });
    it('3 = 1,2 kg aprox.', () => {
      expect(formatWeight(3, '400g aprox.')).toBe('1,2 kg aprox.');
    });
  });

  describe('Por 1 kg (kg)', () => {
    it('0.5 = 500g aprox.', () => {
      expect(formatWeight(0.5, 'Por 1 kg')).toBe('500g aprox.');
    });
    it('1 = 1 kg aprox.', () => {
      expect(formatWeight(1, 'Por 1 kg')).toBe('1 kg aprox.');
    });
    it('1.5 = 1,5 kg aprox.', () => {
      expect(formatWeight(1.5, 'Por 1 kg')).toBe('1,5 kg aprox.');
    });
    it('2 = 2 kg aprox.', () => {
      expect(formatWeight(2, 'Por 1 kg')).toBe('2 kg aprox.');
    });
  });

  describe('Por Pack (pack)', () => {
    it('1 = 1', () => {
      expect(formatWeight(1, 'Por Pack')).toBe('1');
    });
    it('3 = 3', () => {
      expect(formatWeight(3, 'Por Pack')).toBe('3');
    });
  });

  it('returns plain quantity when no presentacion', () => {
    expect(formatWeight(2)).toBe('2');
  });
});

describe('formatWeightDetail', () => {
  describe('500g aprox. (unidad)', () => {
    it('1 = Llevás: 500g aprox. (1 porción de 500g)', () => {
      expect(formatWeightDetail(1, '500g aprox.')).toBe('Llevás: 500g aprox. (1 porción de 500g)');
    });
    it('2 = Llevás: 1 kg aprox. (2 porciones de 500g)', () => {
      expect(formatWeightDetail(2, '500g aprox.')).toBe('Llevás: 1 kg aprox. (2 porciones de 500g)');
    });
    it('3 = Llevás: 1,5 kg aprox. (3 porciones de 500g)', () => {
      expect(formatWeightDetail(3, '500g aprox.')).toBe('Llevás: 1,5 kg aprox. (3 porciones de 500g)');
    });
  });

  describe('400g aprox. (unidad400)', () => {
    it('1 = Llevás: 400g aprox.', () => {
      expect(formatWeightDetail(1, '400g aprox.')).toBe('Llevás: 400g aprox.');
    });
    it('2 = Llevás: 800g aprox.', () => {
      expect(formatWeightDetail(2, '400g aprox.')).toBe('Llevás: 800g aprox.');
    });
  });

  describe('Por 1 kg (kg)', () => {
    it('1 = Llevás: 1 kg aprox.', () => {
      expect(formatWeightDetail(1, 'Por 1 kg')).toBe('Llevás: 1 kg aprox.');
    });
    it('1.5 = Llevás: 1,5 kg aprox.', () => {
      expect(formatWeightDetail(1.5, 'Por 1 kg')).toBe('Llevás: 1,5 kg aprox.');
    });
  });

  describe('Por Pack (pack)', () => {
    it('1 = Llevás: 1 unidad', () => {
      expect(formatWeightDetail(1, 'Por Pack')).toBe('Llevás: 1 unidad');
    });
    it('3 = Llevás: 3 unidades', () => {
      expect(formatWeightDetail(3, 'Por Pack')).toBe('Llevás: 3 unidades');
    });
  });

  it('returns empty when no presentacion', () => {
    expect(formatWeightDetail(2)).toBe('');
  });
});
