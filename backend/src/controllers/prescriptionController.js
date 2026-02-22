const Prescription = require('../models/Prescription');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');

// @route  POST /api/prescriptions
exports.uploadPrescription = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 400, 'Prescription image is required.');

  const prescription = await Prescription.create({
    user: req.user._id,
    doctorName: req.body.doctorName,
    hospitalClinic: req.body.hospitalClinic,
    issueDate: req.body.issueDate,
    expiryDate: req.body.expiryDate,
    image: `/uploads/prescriptions/${req.file.filename}`,
    medications: req.body.medications ? JSON.parse(req.body.medications) : [],
    notes: req.body.notes
  });

  sendSuccess(res, 201, 'Prescription uploaded and pending verification.', { prescription });
});

// @route  GET /api/prescriptions/my
exports.getMyPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ user: req.user._id }).sort('-createdAt');
  sendSuccess(res, 200, 'Prescriptions fetched.', { prescriptions });
});

// @route  GET /api/prescriptions/:id
exports.getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOne({ _id: req.params.id, user: req.user._id });
  if (!prescription) return sendError(res, 404, 'Prescription not found.');
  sendSuccess(res, 200, 'Prescription fetched.', { prescription });
});

// @route  PUT /api/prescriptions/:id/verify  (pharmacist only)
exports.verifyPrescription = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) return sendError(res, 404, 'Prescription not found.');

  prescription.status = status;
  if (status === 'rejected') prescription.rejectionReason = reason;
  if (status === 'verified') {
    prescription.verifiedBy = req.user._id;
    prescription.verifiedAt = Date.now();
  }
  await prescription.save();
  sendSuccess(res, 200, `Prescription ${status}.`, { prescription });
});
