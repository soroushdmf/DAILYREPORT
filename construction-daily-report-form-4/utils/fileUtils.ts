// Helper function to convert a File object to a base64 data URL
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Helper function to convert a base64 data URL back to a File object
export const base64ToFile = async (
  dataUrl: string,
  filename: string,
): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
};

// Helper function to resize an image file with progress reporting
export const resizeImage = (file: File, maxSize: number, onProgress: (percent: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        // File reading is ~80% of the perceived work
        const percentComplete = Math.round((event.loaded / event.total) * 80);
        onProgress(percentComplete);
      }
    };

    reader.onload = (e) => {
      onProgress(90); // File read, now resizing
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;

    img.onload = () => {
      let { width, height } = img;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round(width * (maxSize / height));
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onProgress(100); // Done
      resolve(dataUrl);
    };
    img.onerror = reject;

    reader.readAsDataURL(file);
  });
};