import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  GALLERY_COLLECTION,
  TRANSFORMATIONS_COLLECTION,
} from './constants/cosmetics';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(__dirname);

describe('Public content path (galerie a proměny nesmí z webu zmizet)', () => {
  it('galerie a proměny používají konzistentní názvy kolekcí', () => {
    expect(GALLERY_COLLECTION).toBe('gallery_items');
    expect(TRANSFORMATIONS_COLLECTION).toBe('transformation_items');
  });

  it('firebaseConfig definuje getPublicContentCollectionPath a getPublicContentCollectionPathsForRead', () => {
    const configSrc = readFileSync(join(srcRoot, 'firebaseConfig.js'), 'utf-8');
    expect(configSrc).toContain('getPublicContentCollectionPath');
    expect(configSrc).toContain('getPublicContentDocPath');
    expect(configSrc).toContain('getPublicContentCollectionPathsForRead');
    expect(configSrc).toContain('collection(db, colName)');
  });

  it('admin i veřejné stránky používají getPublicContentCollectionPath (ne getCollectionPath) pro galerii a proměny', () => {
    const files = [
      join(srcRoot, 'components/admin/AdminGallerySubTab.jsx'),
      join(srcRoot, 'components/admin/AdminTransformationsSubTab.jsx'),
      join(srcRoot, 'components/EditorialGallery.jsx'),
      join(srcRoot, 'components/CosmeticsPage.jsx'),
      join(srcRoot, 'components/PMUPage.jsx'),
      join(srcRoot, 'components/PMUSpotlightSection.jsx'),
    ];
    for (const file of files) {
      const src = readFileSync(file, 'utf-8');
      const usesPublicContent =
        src.includes('getPublicContentCollectionPath') || src.includes('getPublicContentCollectionPathsForRead');
      expect(usesPublicContent, `Soubor ${file} musí používat getPublicContentCollectionPath nebo getPublicContentCollectionPathsForRead`).toBe(true);
      const forbidden = new RegExp(
        'getCollectionPath\\s*\\(\\s*(GALLERY_COLLECTION|TRANSFORMATIONS_COLLECTION|[\'"]gallery_items[\'"]|[\'"]transformation_items[\'"])'
      );
      expect(src, `Soubor ${file} nesmí používat getCollectionPath pro galerii/proměny`).not.toMatch(forbidden);
    }
  });
});
