import imageCompression from 'browser-image-compression';

export const compressImageToBase64 = async (file) => {
  const options = {
    maxSizeMB: 0.095,
    maxWidthOrHeight: 800,
    useWebWorker: true
  };

  let compressedFile = await imageCompression(file, options);

  if (compressedFile.size > 100 * 1024) {
    const aggressiveOptions = {
      maxSizeMB: 0.05,
      maxWidthOrHeight: 600,
      useWebWorker: true
    };
    compressedFile = await imageCompression(file, aggressiveOptions);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(compressedFile);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
