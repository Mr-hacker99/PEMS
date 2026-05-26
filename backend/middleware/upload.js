const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

createDirIfNotExists('./uploads/receipts');
createDirIfNotExists('./uploads/kyc');
createDirIfNotExists('./uploads/profiles');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'receiptImage') {
      cb(null, './uploads/receipts');
    } else if (['citizenshipFrontImage', 'citizenshipBackImage', 'profileImage'].includes(file.fieldname)) {
      cb(null, './uploads/kyc');
    } else {
      cb(null, './uploads/profiles');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
};

// Upload instances
exports.uploadReceipt = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
}).single('receiptImage');

exports.uploadKYC = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'citizenshipFrontImage', maxCount: 1 },
  { name: 'citizenshipBackImage', maxCount: 1 },
]);

exports.uploadProfile = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter,
}).single('profileImage');
