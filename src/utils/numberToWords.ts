/**
 * Converts a number to Indian Currency Words Format.
 * Example: 34450 -> "INR Thirty-Four Thousand Four Hundred and Fifty Only"
 */

const units = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertLessThanThousand(num: number): string {
  if (num === 0) return "";
  
  let result = "";
  
  if (num >= 100) {
    result += units[Math.floor(num / 100)] + " Hundred";
    num %= 100;
    if (num > 0) result += " and ";
  }
  
  if (num >= 20) {
    const tenVal = tens[Math.floor(num / 10)];
    const unitVal = units[num % 10];
    if (unitVal) {
      result += `${tenVal}-${unitVal.toLowerCase()}`;
    } else {
      result += tenVal;
    }
  } else if (num > 0) {
    result += units[num];
  }
  
  return result;
}

export function numberToWordsINR(amount: number): string {
  if (amount === 0) return "INR Zero Only";
  
  const rounded = Math.round(amount);
  let num = Math.abs(rounded);
  let words = "";
  
  // Crores (1,00,00,000)
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  
  // Lakhs (1,00,000)
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  
  // Thousands (1,000)
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  
  // Remaining hundreds, tens, units
  const remaining = num;
  
  if (crore > 0) {
    words += convertLessThanThousand(crore) + " Crore ";
  }
  
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + " Lakh ";
  }
  
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + " Thousand ";
  }
  
  if (remaining > 0) {
    words += convertLessThanThousand(remaining);
  }
  
  words = words.trim();
  
  // Standardize capitalization (e.g. "Thirty-Four" capitalized correctly)
  const formattedWords = words
    .split(' ')
    .map(word => {
      if (word.includes('-')) {
        const parts = word.split('-');
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + '-' +
               parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  return `INR ${formattedWords} Only`;
}
