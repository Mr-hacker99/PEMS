const Tesseract = require('tesseract.js');
const path = require('path');

// Smart amount extraction from OCR text
const extractAmount = (text) => {
  // Priority keywords to look for
  const priorityKeywords = ['grand total', 'total amount', 'final amount', 'payable', 'net total', 'total'];
  const currencyPatterns = [
    /(?:rs\.?|npr|रु)\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
    /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|npr|रु)/gi,
    /(?:total|amount|payable)[^\d]*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
  ];

  const lines = text.toLowerCase().split('\n');
  let amounts = [];

  // Search near priority keywords first
  for (const keyword of priorityKeywords) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(keyword)) {
        // Look at current line and next 2 lines
        const searchLines = lines.slice(i, i + 3).join(' ');
        for (const pattern of currencyPatterns) {
          const matches = [...searchLines.matchAll(pattern)];
          matches.forEach(m => {
            const val = parseFloat(m[1].replace(/,/g, ''));
            if (!isNaN(val) && val > 0 && val < 10000000) {
              amounts.push({ value: val, priority: true });
            }
          });
        }
      }
    }
  }

  // If no priority amounts found, extract all numbers
  if (amounts.filter(a => a.priority).length === 0) {
    for (const pattern of currencyPatterns) {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(m => {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0 && val < 10000000) {
          amounts.push({ value: val, priority: false });
        }
      });
    }
  }

  // Filter out likely non-amounts (phone numbers, IDs, etc.)
  const validAmounts = amounts.filter(a => {
    const v = a.value;
    return v > 1 && v < 1000000 && !String(a.value).includes('98') && String(a.value).length < 8;
  });

  if (validAmounts.length === 0) return null;

  // Return highest priority or highest value
  const priorityAmounts = validAmounts.filter(a => a.priority);
  if (priorityAmounts.length > 0) {
    return Math.max(...priorityAmounts.map(a => a.value));
  }
  return Math.max(...validAmounts.map(a => a.value));
};

// Detect shop/vendor name
const extractShopName = (text) => {
  const lines = text.split('\n').filter(l => l.trim().length > 2);
  // Usually first non-empty line is the shop name
  for (const line of lines.slice(0, 3)) {
    const trimmed = line.trim();
    if (trimmed.length > 2 && trimmed.length < 60 && !/^\d+$/.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
};

// Detect date from text
const extractDate = (text) => {
  const datePatterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/g,
    /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g,
  ];
  for (const pattern of datePatterns) {
    const match = pattern.exec(text);
    if (match) {
      return match[0];
    }
  }
  return null;
};

// AI-powered category detection
const detectCategory = (text) => {
  const lowerText = text.toLowerCase();
  const categoryKeywords = {
    Food: ['restaurant', 'cafe', 'food', 'hotel', 'dining', 'pizza', 'burger', 'meal', 'lunch', 'dinner', 'breakfast', 'khana', 'dine', 'eatery', 'kitchen', 'bakery'],
    Healthcare: ['pharmacy', 'medical', 'hospital', 'clinic', 'health', 'drug', 'medicine', 'doctor', 'lab', 'diagnostic', 'aushadhi'],
    Transportation: ['fuel', 'petrol', 'diesel', 'taxi', 'bus', 'transport', 'vehicle', 'parking', 'toll', 'metro'],
    Shopping: ['supermarket', 'mart', 'store', 'shop', 'mall', 'bazar', 'department', 'retail', 'grocery', 'market'],
    Bills: ['electric', 'electricity', 'nea ', 'water', 'internet', 'phone', 'broadband', 'bill', 'utility', 'telecom'],
    Entertainment: ['cinema', 'movie', 'theatre', 'game', 'entertainment', 'club', 'subscription', 'netflix', 'gym'],
    Education: ['school', 'college', 'university', 'book', 'stationery', 'course', 'tuition', 'fee', 'library'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return category;
    }
  }
  return 'Others';
};

// @desc    Scan receipt using OCR
// @route   POST /api/ocr/scan
exports.scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a receipt image.' });
    }

    const imagePath = path.join(__dirname, '..', 'uploads', 'receipts', req.file.filename);
    console.log('🔍 Starting OCR scan...');

    // Run Tesseract OCR
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng+nep', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    console.log('📄 Raw OCR text:', text);

    // Parse extracted data
    const extractedAmount = extractAmount(text);
    const shopName = extractShopName(text);
    const detectedDate = extractDate(text);
    const detectedCategory = detectCategory(text);

    // Extract tax amount
    const taxMatch = text.match(/(?:tax|vat|cgst|sgst)[^\d]*([0-9,]+(?:\.[0-9]{1,2})?)/i);
    const taxAmount = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : 0;

    // Extract payment method
    const paymentMethod = /cash/i.test(text) ? 'Cash' :
      /card|visa|master/i.test(text) ? 'Card' :
      /esewa/i.test(text) ? 'eSewa' : 'Cash';

    const result = {
      rawText: text,
      extracted: {
        shopName: shopName || 'Unknown Vendor',
        amount: extractedAmount || 0,
        taxAmount,
        date: detectedDate || new Date().toISOString().split('T')[0],
        category: detectedCategory,
        paymentMethod,
        confidence: extractedAmount ? 'high' : 'low',
      },
    };

    res.json({
      success: true,
      message: 'Receipt scanned successfully!',
      data: result,
    });
  } catch (error) {
    console.error('OCR scan error:', error);
    res.status(500).json({ success: false, message: 'OCR scanning failed. Please try again with a clearer image.' });
  }
};
