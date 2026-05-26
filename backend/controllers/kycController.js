const KYC = require('../models/KYC');
const User = require('../models/User');
const { Notification } = require('../models/index');
const emailService = require('../services/emailService');

// @desc    Submit KYC
// @route   POST /api/kyc
exports.submitKYC = async (req, res) => {
  try {
    const { fullName, phone, address, citizenshipNumber } = req.body;
    const userId = req.user._id;

    if (!req.files || !req.files.profileImage || !req.files.citizenshipFrontImage || !req.files.citizenshipBackImage) {
      return res.status(400).json({ success: false, message: 'Please upload all required images.' });
    }

    const existingKYC = await KYC.findOne({ userId });
    const kycData = {
      userId,
      fullName,
      phone,
      address,
      citizenshipNumber,
      profileImage: `/uploads/kyc/${req.files.profileImage[0].filename}`,
      citizenshipFrontImage: `/uploads/kyc/${req.files.citizenshipFrontImage[0].filename}`,
      citizenshipBackImage: `/uploads/kyc/${req.files.citizenshipBackImage[0].filename}`,
      verificationStatus: 'pending',
      rejectionReason: null,
    };

    let kyc;
    if (existingKYC) {
      kyc = await KYC.findByIdAndUpdate(existingKYC._id, kycData, { new: true });
    } else {
      kyc = await KYC.create(kycData);
    }

    await User.findByIdAndUpdate(userId, { kycStatus: 'pending' });

    res.status(201).json({ success: true, message: 'KYC submitted successfully! Pending admin review.', kyc });
  } catch (error) {
    console.error('KYC submit error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get my KYC status
// @route   GET /api/kyc/my
exports.getMyKYC = async (req, res) => {
  try {
    const kyc = await KYC.findOne({ userId: req.user._id });
    if (!kyc) {
      return res.json({ success: true, kyc: null, message: 'No KYC submitted yet.' });
    }
    res.json({ success: true, kyc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Get all KYC (admin)
// @route   GET /api/admin/kyc
exports.getAllKYC = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.verificationStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [kycs, total] = await Promise.all([
      KYC.find(query)
        .populate('userId', 'name email subscriptionPlan createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      KYC.countDocuments(query),
    ]);

    res.json({ success: true, kycs, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Approve KYC (admin)
// @route   PUT /api/admin/kyc/:id/approve
exports.approveKYC = async (req, res) => {
  try {
    const kyc = await KYC.findById(req.params.id).populate('userId');
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found.' });

    kyc.verificationStatus = 'approved';
    kyc.reviewedBy = req.user._id;
    kyc.reviewedAt = new Date();
    kyc.rejectionReason = null;
    await kyc.save();

    await User.findByIdAndUpdate(kyc.userId._id, { kycStatus: 'approved' });

    // Notification
    await Notification.create({
      userId: kyc.userId._id,
      title: 'KYC Approved! ✅',
      message: 'Your KYC verification has been approved. You now have a verified badge.',
      type: 'kyc',
    });

    // Email
    emailService.sendKYCApprovedEmail(kyc.userId).catch(console.error);

    // Socket notification
    const io = req.app.get('io');
    if (io) {
      io.to(kyc.userId._id.toString()).emit('kyc_approved', { message: 'Your KYC has been approved!' });
    }

    res.json({ success: true, message: 'KYC approved!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Reject KYC (admin)
// @route   PUT /api/admin/kyc/:id/reject
exports.rejectKYC = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required.' });

    const kyc = await KYC.findById(req.params.id).populate('userId');
    if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found.' });

    kyc.verificationStatus = 'rejected';
    kyc.rejectionReason = reason;
    kyc.reviewedBy = req.user._id;
    kyc.reviewedAt = new Date();
    await kyc.save();

    await User.findByIdAndUpdate(kyc.userId._id, { kycStatus: 'rejected' });

    await Notification.create({
      userId: kyc.userId._id,
      title: 'KYC Rejected ❌',
      message: `Your KYC verification was rejected. Reason: ${reason}. Please resubmit.`,
      type: 'kyc',
    });

    emailService.sendKYCRejectedEmail(kyc.userId, reason).catch(console.error);

    const io = req.app.get('io');
    if (io) {
      io.to(kyc.userId._id.toString()).emit('kyc_rejected', { message: 'Your KYC was rejected.', reason });
    }

    res.json({ success: true, message: 'KYC rejected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
