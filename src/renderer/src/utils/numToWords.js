export function numberToWords(n) {
    if (n < 0) return "Minus " + numberToWords(-n);
    if (n === 0) return "Zero";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const scales = ["", "Thousand", "Million", "Billion"];

    function convertChunk(num) {
        let result = "";

        if (num >= 100) {
            result += ones[Math.floor(num / 100)] + " Hundred ";
            num %= 100;
        }

        if (num >= 20) {
            result += tens[Math.floor(num / 10)] + " ";
            num %= 10;
        }

        if (num > 0) {
            result += ones[num] + " ";
        }

        return result.trim();
    }

    let words = "";
    let scaleIndex = 0;

    const integerPart = Math.floor(n);
    const decimalPart = Math.round((n - integerPart) * 100);

    let tempInt = integerPart;

    while (tempInt > 0) {
        const chunk = tempInt % 1000;
        if (chunk > 0) {
            const chunkWords = convertChunk(chunk);
            words = chunkWords + (scales[scaleIndex] ? " " + scales[scaleIndex] : "") + (words ? " " + words : "");
        }
        tempInt = Math.floor(tempInt / 1000);
        scaleIndex++;
    }

    words = words.trim();

    if (decimalPart > 0) {
        words += " and " + convertChunk(decimalPart) + "/100 Only";
    } else {
        words += " Only";
    }

    return words;
}
