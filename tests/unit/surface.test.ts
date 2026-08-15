import { describe, it, expect } from 'vitest';
import { surfaceCourante } from '../../src/lib/surface';

describe('surfaceCourante', () => {
  it('retourne la surface de la section visible', () => {
    expect(surfaceCourante([
      { surface: 'dark', visible: true },
      { surface: 'light', visible: false },
    ])).toBe('dark');
  });

  it('retourne la dernière visible quand plusieurs le sont', () => {
    expect(surfaceCourante([
      { surface: 'dark', visible: true },
      { surface: 'light', visible: true },
    ])).toBe('light');
  });

  it('retombe sur light quand rien nest visible', () => {
    expect(surfaceCourante([
      { surface: 'dark', visible: false },
    ])).toBe('light');
  });

  it('retombe sur light sur une liste vide', () => {
    expect(surfaceCourante([])).toBe('light');
  });
});
