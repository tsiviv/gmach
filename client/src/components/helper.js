import { HDate } from "@hebcal/core";

/**
 * מקבלת תאריך לועזי ומחזירה מחרוזת של התאריך העברי בגימטריה
 * @param {Date} gregDate - תאריך לועזי מסוג Date
 * @returns {string} - תאריך עברי בגימטריה (למשל: ג' באב תשפ"ה)
 */
export function convertToHebrewDate(gregDate) {
  const hdate = new HDate(gregDate);
  return hdate.renderGematriya(); // ג' באב תשפ"ה
}


export const format = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return 'לא מספר תקין';
  return num.toLocaleString('he-IL');
};

export const formatAmount=(amount, currency,flag)=> {
  if (amount == null) return '—';
  const symbol = currency === 'shekel' ? '₪' : '$';
  return flag ? `${symbol} ${format(amount)} `:`${format(amount)} ${symbol}`;
}

export const formatAmountPdf=(amount, currency,flag)=> {
  if (amount == null) return '—';
  const symbol = currency === 'shekel' ? 'ש"ח' : 'דולר';
  return flag ? `${symbol} ${format(amount)} `:`${format(amount)} ${symbol}`;
}
