export const formatIndianNumber = (value: string) => {
  if (!value) return '';
  const num = Number(value.replace(/,/g, ''));
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-IN').format(num);
};
