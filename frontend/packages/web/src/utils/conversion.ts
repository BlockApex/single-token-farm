import Decimal from "decimal.js";
import Big from 'big.js';
import * as math from 'mathjs';

const baseApiUrl = "https://api.coingecko.com/api/v3/simple/price";

export const fetchNearToUsdRate = async () => {
  const response = await fetch(`${baseApiUrl}?ids=near&vs_currencies=usd`);
  const data = await response.json();
  return data.near.usd;
};

export const convertNearToUsd = (nearAmount: number, nearToUsdRate: number) => {
  return nearAmount * nearToUsdRate;
};

export const formatValueInDecimals = (value: string, decimals: number) => {
  // Convert the value to a string
  const valueStr = value?.toString();

  // If the number of decimals is greater than the length of the value, add leading zeros
  if (decimals >= valueStr.length) {
    const leadingZeros = "0.".padEnd(decimals - valueStr.length + 2, "0");
    return leadingZeros + valueStr;
  }

  // Insert the decimal point at the correct position
  const integerPart = valueStr.slice(0, valueStr.length - decimals);
  const fractionalPart = valueStr.slice(valueStr.length - decimals);

  return integerPart + "." + fractionalPart;
};

export const removeDecimals = (value: string, decimals: number): string => {
  // Split the value into integer and fractional parts
  const [integerPart, fractionalPart = ""] = value.split(".");

  // Combine the integer and fractional parts, removing the decimal point
  const combinedValue = integerPart + fractionalPart;

  // Pad the combined value with zeros if necessary to match the specified decimals
  const paddedValue = combinedValue.padEnd(integerPart.length + decimals, "0");

  return paddedValue;
};

export const exponentialToDecimal = (num: number | string) => {
  // Convert the number to a string
  const numStr = num.toString();

  // Check if the number is in exponential format
  if (!numStr.includes("e")) return numStr;

  // Split the number into its base and exponent parts
  const [base, exponent] = numStr.split("e");
  const expSign = Math.sign(parseInt(exponent));
  const [integerPart, fractionalPart = ""] = base.split(".");

  // Calculate the number of zeros needed to shift the decimal point
  const zeros = "0".repeat(
    Math.max(0, Math.abs(parseInt(exponent)) - (fractionalPart.length || 0))
  );

  // Depending on the exponent sign, handle the conversion
  if (expSign > 0) {
    // Positive exponent, shift the decimal point to the right
    return integerPart + fractionalPart + zeros;
  } else {
    // Negative exponent, shift the decimal point to the left
    return "0." + zeros + integerPart + fractionalPart;
  }
};


// export const calculateValueAfterSlippage = (
//   inputValueStr,
//   slippagePercentage
// ) => {
//   // Create a Decimal instance for the input value
//   const inputValue = new Decimal(inputValueStr);

//   // Calculate the slippage amount as a decimal
//   const slippageAmount = inputValue.mul(slippagePercentage).div(100);

//   // Calculate the final value after subtracting slippage
//   const finalValue = inputValue.minus(slippageAmount);

//   return finalValue.toString();
// };

export const calculateValueAfterSlippage = (
  tokenValueStr,
  slippagePercentage,
  decimals
) => {
  // Convert the user-friendly value to its native decimal representation
  const nativeValue = new Decimal(tokenValueStr).mul(Decimal.pow(10, decimals));

  // Calculate slippage as a decimal
  const slippageAmount = nativeValue.mul(slippagePercentage).div(100);

  // Subtract the slippage amount from the native value
  const valueAfterSlippage = nativeValue.minus(slippageAmount);

  // Return the value after slippage in its native form
  return valueAfterSlippage.toFixed(0); // Convert to a string without decimals
};

export const isInvalid = (v) => {
  if (v === '' || v === undefined || v == null) return true;
  return false;
};


export const formatPercentage = (v: string | number) => {
  if (isInvalid(v)) return '-%';
  const big = Big(v);
  if (big.lte(0)) {
    return '0%';
  } else if (big.lt(0.01)) {
    return '<0.01%';
  } else {
    return big.toFixed(2) + '%';
  }
};

export function formatNumberWithSuffix(num: number): string {
  if(isNaN(num)){
    return "0";
  }
  if (num == 0) {
    return "0";
  }
  if (num < 0.01) {
    return "<0.01";
  }

  if (num < 1000) {
    return num?.toFixed(2);
  }

  const suffixes: string[] = ["", "K", "M", "B", "T", "Q", "Qu", "S", "O", "N", "D", "UD", "DD", "TD", "QD", "QuD", "SD", "OD", "ND"];
  const magnitude: number = Math.floor(Math.log10(num) / 3);

  // Limiting to the length of suffixes array - 1 to avoid undefined access
  const suffix: string = suffixes[Math.min(magnitude, suffixes.length - 1)];

  const scaledNumber: number = num / Math.pow(1000, magnitude);

  return scaledNumber.toFixed(2) + suffix;
}

export function convertTokenAmountWithDecimal(amount: string, decimal: number): number {
  const factor = Math.pow(10, decimal);
  const value = parseFloat(amount) / factor;

  // Convert back to string, ensuring we handle large numbers correctly
  return value;
}



export function convertToFlatNumber(num: any) {
  let numStr = num.toString();
  // If the number is in scientific notation
  if (numStr.includes('e')) {
    let [base, exponent] = numStr.split('e');
    exponent = parseInt(exponent, 10);
    let decimalIndex = base.indexOf('.');

    if (decimalIndex !== -1) {
      base = base.replace('.', '');
    }

    let result = base.padEnd(exponent + 1, '0');
    return result;
  } else {
    return numStr;
  }
}


export const toNonDivisibleNumber = (
  decimals: number,
  number: string
): string => {
  if (decimals === null || decimals === undefined) return number;
  const [wholePart, fracPart = ''] = number.split('.');

  return `${wholePart}${fracPart.padEnd(decimals, '0').slice(0, decimals)}`
    .replace(/^0+/, '')
    .padStart(1, '0');
};

export const toReadableNumber = (
  decimals: number,
  number: string = '0'
): string => {
  if (!decimals) return number;

  const wholeStr = number.substring(0, number.length - decimals) || '0';
  const fractionStr = number
    .substring(number.length - decimals)
    .padStart(decimals, '0')
    .substring(0, decimals);

  return `${wholeStr}.${fractionStr}`.replace(/\.?0+$/, '');
};


export const toLowestDenomination = (decimals: number, number: string = '0'): string => {
  if (!decimals) return number;

  // Split the number into whole and fractional parts
  const [wholePart, fractionalPart = ''] = number.split('.');

  // Combine the whole part and fractional part, then pad the fractional part to the required decimals
  const paddedFractionalPart = fractionalPart.padEnd(decimals, '0');
  const result = `${wholePart}${paddedFractionalPart}`;

  // Remove leading zeros from the result to avoid issues with BigNumbers
  return result.replace(/^0+/, '') || '0';
};


export const calculateFairShare = ({
  shareOf,
  contribution,
  totalContribution,
}: {
  shareOf: string;
  contribution: string;
  totalContribution: string;
}) => {
  return math.format(
    math.evaluate(`(${shareOf} * ${contribution}) / ${totalContribution}`),
    {
      notation: 'fixed',
      precision: 0,
    }
  );
};



export const percent = (numerator: string, denominator: string) => {
  if (new Big(denominator || '0').eq(0)) {
    return 0;
  }
  return math.evaluate(`(${numerator} / ${denominator}) * 100`);
};



export function scientificNotationToString(strParam: string) {
  const matchExponent = strParam.match(/\d+$/);
  const matchBasis = strParam.match(/[\d\.]+/);

  if (!matchExponent || !matchBasis) {
    // Handle cases where the regex does not match
    throw new Error("Invalid input string for scientific notation conversion");
  }

  let flag = /e/.test(strParam);
  if (!flag) return strParam;

  let sysbol = true;
  if (/e-/.test(strParam)) {
    sysbol = false;
  }

  const negative = Number(strParam) < 0 ? '-' : '';

  let index = Number(matchExponent[0]);
  let basis = matchBasis[0];

  const ifFraction = basis.includes('.');

  let wholeStr;
  let fractionStr;

  if (ifFraction) {
    wholeStr = basis.split('.')[0];
    fractionStr = basis.split('.')[1];
  } else {
    wholeStr = basis;
    fractionStr = '';
  }

  if (sysbol) {
    if (!ifFraction) {
      return negative + wholeStr.padEnd(index + wholeStr.length, '0');
    } else {
      if (fractionStr.length <= index) {
        return negative + wholeStr + fractionStr.padEnd(index, '0');
      } else {
        return (
          negative +
          wholeStr +
          fractionStr.substring(0, index) +
          '.' +
          fractionStr.substring(index)
        );
      }
    }
  } else {
    if (!ifFraction)
      return (
        negative +
        wholeStr.padStart(index + wholeStr.length, '0').replace(/^0/, '0.')
      );
    else {
      return (
        negative +
        wholeStr.padStart(index + wholeStr.length, '0').replace(/^0/, '0.') +
        fractionStr
      );
    }
  }
}





export function formatWithCommas(value: string): string {
  const pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(value)) {
    value = value.replace(pattern, '$1,$2');
  }
  return value;
}


export const toPrecision = (
  number: string,
  precision: number,
  withCommas: boolean = false,
  atLeastOne: boolean = true
): string => {
  if (typeof number === 'undefined') return '0';

  const [whole, decimal = ''] = number.split('.');

  let str = `${withCommas ? formatWithCommas(whole) : whole}.${decimal.slice(
    0,
    precision
  )}`.replace(/\.$/, '');
  if (atLeastOne && Number(str) === 0 && str.length > 1) {
    var n = str.lastIndexOf('0');
    str = str.slice(0, n) + str.slice(n).replace('0', '1');
  }

  return str;
};



