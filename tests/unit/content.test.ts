import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';

const lire = (chemin: string) => parse(readFileSync(chemin, 'utf8'));

describe('cabinet', () => {
  const cabinet = lire('src/content/cabinet.yaml');

  it('expose un téléphone au format E.164', () => {
    expect(cabinet.telephone).toMatch(/^\+33\d{9}$/);
  });

  it('borne les prix dans un intervalle cohérent', () => {
    expect(cabinet.prixMin).toBeLessThan(cabinet.prixMax);
  });
});

describe('soins', () => {
  const soins = readdirSync('src/content/soins').map((f) =>
    lire(`src/content/soins/${f}`),
  );

  it('en compte cinq', () => {
    expect(soins).toHaveLength(5);
  });

  it("n'en désigne qu'un seul comme signature", () => {
    expect(soins.filter((s) => s.signature)).toHaveLength(1);
  });

  it('donne des ordres uniques', () => {
    const ordres = soins.map((s) => s.ordre);
    expect(new Set(ordres).size).toBe(ordres.length);
  });

  it('respecte la fourchette de prix annoncée par le cabinet', () => {
    const cabinet = lire('src/content/cabinet.yaml');
    const prix = soins.flatMap((s) => s.tarifs.map((t: { prix: number }) => t.prix));
    expect(Math.min(...prix)).toBe(cabinet.prixMin);
    expect(Math.max(...prix)).toBe(cabinet.prixMax);
  });
});

describe('faq', () => {
  const questions = readdirSync('src/content/faq').map((f) =>
    lire(`src/content/faq/${f}`),
  );

  it('en compte sept', () => {
    expect(questions).toHaveLength(7);
  });

  it('donne des ordres uniques', () => {
    const ordres = questions.map((q) => q.ordre);
    expect(new Set(ordres).size).toBe(ordres.length);
  });

  it("garde la réponse « où se situe le cabinet » cohérente avec cabinet.yaml", () => {
    const cabinet = lire('src/content/cabinet.yaml');
    const reponse = lire('src/content/faq/lieu.yaml').reponse as string;
    const chiffreHeure = (heure: string) => {
      const [h, m] = heure.split(':');
      return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
    };

    expect(
      reponse.includes(cabinet.ville),
      `src/content/faq/lieu.yaml ne mentionne pas « ${cabinet.ville} » : corriger la réponse pour reprendre cabinet.yaml#ville, ou l'inverse si la ville a changé`,
    ).toBe(true);
    expect(
      reponse.includes(chiffreHeure(cabinet.heureOuverture)),
      `src/content/faq/lieu.yaml ne mentionne pas « ${chiffreHeure(cabinet.heureOuverture)} » : corriger la réponse pour reprendre cabinet.yaml#heureOuverture, ou l'inverse`,
    ).toBe(true);
    expect(
      reponse.includes(chiffreHeure(cabinet.heureFermeture)),
      `src/content/faq/lieu.yaml ne mentionne pas « ${chiffreHeure(cabinet.heureFermeture)} » : corriger la réponse pour reprendre cabinet.yaml#heureFermeture, ou l'inverse`,
    ).toBe(true);
  });
});

describe('cabinet.yaml de sections', () => {
  const cabinet = lire('src/content/cabinet.yaml');
  const section = lire('src/content/sections/cabinet.yaml');
  const chiffreHeure = (heure: string) => {
    const [h, m] = heure.split(':');
    return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
  };

  it("garde l'amorce cohérente avec cabinet.yaml", () => {
    const amorce = section.paragraphes[0] as string;

    expect(
      amorce.includes(cabinet.ville),
      `src/content/sections/cabinet.yaml ne mentionne pas « ${cabinet.ville} » dans son amorce : corriger pour reprendre cabinet.yaml#ville, ou l'inverse si la ville a changé`,
    ).toBe(true);
    expect(
      amorce.includes(chiffreHeure(cabinet.heureOuverture)),
      `src/content/sections/cabinet.yaml ne mentionne pas « ${chiffreHeure(cabinet.heureOuverture)} » dans son amorce : corriger pour reprendre cabinet.yaml#heureOuverture, ou l'inverse`,
    ).toBe(true);
    expect(
      amorce.includes(chiffreHeure(cabinet.heureFermeture)),
      `src/content/sections/cabinet.yaml ne mentionne pas « ${chiffreHeure(cabinet.heureFermeture)} » dans son amorce : corriger pour reprendre cabinet.yaml#heureFermeture, ou l'inverse`,
    ).toBe(true);
  });
});

describe('sections', () => {
  const attendues = [
    'hero', 'soins', 'tarifs', 'parcours',
    'cabinet', 'avis', 'faq', 'contact',
  ];

  it('couvre les huit sections ancrées de la page', () => {
    const presentes = readdirSync('src/content/sections')
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace('.yaml', ''))
      .sort();
    expect(presentes).toEqual([...attendues].sort());
  });

  it('donne un titre non vide à chacune', () => {
    for (const id of attendues) {
      const section = lire(`src/content/sections/${id}.yaml`);
      expect(section.titre, `section ${id}`).toBeTruthy();
    }
  });
});
