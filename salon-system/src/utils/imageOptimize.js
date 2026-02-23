/**
 * Client-side image optimization before upload to Firebase Storage.
 * Limits max dimension and converts to JPEG for faster loading.
 */
export async function createOptimizedImageFile(file, maxSize = 1600, quality = 0.85) {
  if (!file) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Nepodařilo se načíst obrázek.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const optimizedFile = new File(
                [blob],
                file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg'),
                { type: 'image/jpeg' }
              );
              resolve(optimizedFile);
            },
            'image/jpeg',
            quality
          );
        } catch (e) {
          resolve(file);
        }
      };
      img.onerror = () => reject(new Error('Nepodařilo se načíst obrázek pro zmenšení.'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
