export const format = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return 'לא מספר תקין';
  return num.toLocaleString('he-IL');
};
export const formatAmount=(amount, currency)=> {
  if (amount == null) return '—';
  const symbol = currency === 'shekel' ? '₪' : '$';
  return `${format(amount)} ${symbol}`;
}
