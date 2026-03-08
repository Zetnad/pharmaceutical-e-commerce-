const express = require('express');
const hospitalCtrl = require('../controllers/hospitalController');
const { protectHospitalWrite, authorizeHospitalRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', hospitalCtrl.getOverview);
router.get('/facilities', hospitalCtrl.getFacilities);
router.get('/patients', hospitalCtrl.getPatients);
router.post('/patients', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), hospitalCtrl.createPatient);
router.put('/patients/:id', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), hospitalCtrl.updatePatient);
router.get('/encounters', hospitalCtrl.getEncounters);
router.post('/encounters', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), hospitalCtrl.createEncounter);
router.put('/encounters/:id', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), hospitalCtrl.updateEncounter);
router.get('/staff', hospitalCtrl.getStaff);
router.get('/claims', hospitalCtrl.getClaims);
router.post('/claims', protectHospitalWrite, authorizeHospitalRoles('admin', 'finance'), hospitalCtrl.createClaim);
router.put('/claims/:id', protectHospitalWrite, authorizeHospitalRoles('admin', 'finance'), hospitalCtrl.updateClaim);
router.get('/pharmacy', hospitalCtrl.getPharmacyOverview);
router.get('/staffing', hospitalCtrl.getStaffingOverview);

module.exports = router;
