import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY;
const placeId = process.env.VITE_GOOGLE_PLACE_ID;

if (!apiKey || !placeId) {
  console.error('Missing VITE_GOOGLE_PLACES_API_KEY or VITE_GOOGLE_PLACE_ID.');
  process.exit(1);
}

const endpoint = `https://places.googleapis.com/v1/places/${placeId}?languageCode=cs&regionCode=CZ`;
const response = await fetch(endpoint, {
  headers: {
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'reviews',
  },
});

if (!response.ok) {
  const errorText = await response.text();
  console.error(`Google Places API error ${response.status}: ${errorText}`);
  process.exit(1);
}

const payload = await response.json();
const rawReviews = Array.isArray(payload.reviews) ? payload.reviews : [];

const reviews = rawReviews
  .slice(0, 8)
  .map((review, index) => {
    const textObj = review.originalText || review.text || {};
    const text = typeof textObj.text === 'string' ? textObj.text.trim() : '';
    if (!text) return null;

    return {
      id: `g${index + 1}`,
      name: review?.authorAttribution?.displayName?.trim() || 'Google uživatel',
      roleOrDate: review?.relativePublishTimeDescription?.trim() || '',
      rating: Number.isFinite(review?.rating) ? Math.max(0, Math.min(5, Math.round(review.rating))) : 5,
      text,
    };
  })
  .filter(Boolean);

const outputFile = path.resolve(process.cwd(), 'src/constants/googleReviews.js');
const fileContent = `export const GOOGLE_REVIEWS = ${JSON.stringify(reviews, null, 2)};\n`;

await fs.writeFile(outputFile, fileContent, 'utf8');
console.log(`Updated ${reviews.length} Google reviews in src/constants/googleReviews.js`);
