import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const tarif = z.object({ duree: z.number().int().positive(), prix: z.number().positive() });

const soins = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/soins' }),
  schema: z.object({
    nom: z.string(),
    sousTitre: z.string(),
    description: z.string(),
    tarifs: z.array(tarif).min(1),
    signature: z.boolean(),
    ordre: z.number().int(),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    reponse: z.string(),
    ordre: z.number().int(),
  }),
});

const avis = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/avis' }),
  schema: z.object({
    auteur: z.string(),
    note: z.number().int().min(1).max(5),
    texte: z.string(),
    date: z.string(),
    url: z.url(),
  }),
});

const sections = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/sections' }),
  schema: z.object({
    surtitre: z.string().optional(),
    titre: z.string(),
    paragraphes: z.array(z.string()),
    blocs: z
      .array(z.object({ titre: z.string(), texte: z.string() }))
      .optional(),
    entrees: z
      .array(z.object({ libelle: z.string(), texte: z.string() }))
      .optional(),
  }),
});

export const collections = { soins, faq, avis, sections };
