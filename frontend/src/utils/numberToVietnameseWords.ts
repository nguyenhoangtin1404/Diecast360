const UNITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const SCALES = ['', 'nghìn', 'triệu', 'tỷ'];

const readTwoDigits = (n: number, fullTen: boolean): string => {
  if (n < 10) {
    return UNITS[n];
  }
  if (n < 20) {
    return n === 10 ? 'mười' : `mười ${UNITS[n % 10]}`;
  }
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tensWord = fullTen && tens === 1 ? 'mười' : `${UNITS[tens]} mươi`;
  if (ones === 0) {
    return tensWord;
  }
  if (ones === 1) {
    return `${tensWord} mốt`;
  }
  if (ones === 5) {
    return `${tensWord} lăm`;
  }
  return `${tensWord} ${UNITS[ones]}`;
};

const readThreeDigits = (n: number, fullHundred: boolean): string => {
  if (n === 0) {
    return '';
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds > 0) {
    parts.push(`${UNITS[hundreds]} trăm`);
  } else if (fullHundred && rest > 0) {
    parts.push('không trăm');
  }
  if (rest > 0) {
    if (rest < 10 && hundreds > 0) {
      parts.push('lẻ', UNITS[rest]);
    } else {
      parts.push(readTwoDigits(rest, hundreds > 0));
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
};

const readNumber = (n: number): string => {
  if (n === 0) {
    return UNITS[0];
  }
  const chunks: string[] = [];
  let value = n;
  let scaleIndex = 0;
  while (value > 0) {
    const chunk = value % 1000;
    if (chunk > 0) {
      const chunkWords = readThreeDigits(chunk, value >= 1000);
      const scale = SCALES[scaleIndex];
      chunks.unshift(scale ? `${chunkWords} ${scale}`.trim() : chunkWords);
    }
    value = Math.floor(value / 1000);
    scaleIndex += 1;
  }
  return chunks.join(' ').replace(/\s+/g, ' ').trim();
};

/** Whole VND amount in Vietnamese words (e.g. "ba trăm tám mươi lăm nghìn đồng chẵn"). */
export const formatVndAmountInWords = (amount: number): string => {
  if (!Number.isFinite(amount) || amount < 0) {
    return '';
  }
  const rounded = Math.round(amount);
  if (rounded === 0) {
    return 'Không đồng chẵn';
  }
  const words = readNumber(rounded);
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} đồng chẵn`;
};
