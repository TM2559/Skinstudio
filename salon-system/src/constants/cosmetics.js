/**
 * Gallery & Transformations – collections and category (Cosmetics vs PMU).
 *
 * Firestore schema (Firebase only):
 *
 * gallery_items: { id, imageUrl, caption, category: 'COSMETICS' | 'PMU', createdAt? }
 * transformation_items: { id, imageBeforeUrl, imageAfterUrl, title, description?, category: 'COSMETICS' | 'PMU', createdAt? }
 *
 * Default category: COSMETICS.
 *
 * Services (Firestore `services`): each document should have category: 'STANDARD' (cosmetics)
 * or 'PMU'. STANDARD = Laminace, Lash Lifting, Peeling, Úprava obočí, Me time, Clear skin, etc.
 * PMU = Meziřasová linka, Rty - Soft Lips, Pudrové obočí. Used to filter the Light (cosmetics)
 * booking list so PMU services do not appear there.
 */
export const COSMETICS_CATEGORY = 'COSMETICS';
export const PMU_CATEGORY = 'PMU';

export const PHOTO_CATEGORIES = [
  { value: COSMETICS_CATEGORY, label: 'Kosmetika' },
  { value: PMU_CATEGORY, label: 'PMU' },
];

export const GALLERY_COLLECTION = 'gallery_items';
export const TRANSFORMATIONS_COLLECTION = 'transformation_items';
export const STORAGE_GALLERY_PREFIX = 'cosmetics/gallery';
export const STORAGE_TRANSFORMATIONS_PREFIX = 'cosmetics/transformations';
