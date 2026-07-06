export const generateBarcode = () => {
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
};
