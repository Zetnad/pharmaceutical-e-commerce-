const express = require('express');
const hospitalCtrl = require('../controllers/hospitalController');
const { protectHospitalWrite, authorizeHospitalRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', hospitalCtrl.getOverview);
router.get('/facilities', hospitalCtrl.getFacilities);
router.get('/facilities/:id', hospitalCtrl.getFacility);
router.post('/facilities', protectHospitalWrite, authorizeHospitalRoles('admin'), hospitalCtrl.createFacility);
router.put('/facilities/:id', protectHospitalWrite, authorizeHospitalRoles('admin'), hospitalCtrl.updateFacility);
router.get('/patients', hospitalCtrl.getPatients);
router.get('/patients/:id', hospitalCtrl.getPatient);
router.post('/patients', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), hospitalCtrl.createPatient);
router.put('/patients/:id', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), hospitalCtrl.updatePatient);
router.get('/encounters', hospitalCtrl.getEncounters);
router.get('/encounters/:id', hospitalCtrl.getEncounter);
router.post('/encounters', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), hospitalCtrl.createEncounter);
router.put('/encounters/:id', protectHospitalWrite, authorizeHospitalRoles('admin', 'doctor', 'nurse', 'clinical_officer'), hospitalCtrl.updateEncounter);
router.get('/staff', hospitalCtrl.getStaff);
router.get('/staff/:id', hospitalCtrl.getStaffMember);
router.post('/staff', protectHospitalWrite, authorizeHospitalRoles('admin'), hospitalCtrl.createStaffMember);
router.put('/staff/:id', protectHospitalWrite, authorizeHospitalRoles('admin'), hospitalCtrl.updateStaffMember);
router.get('/claims', hospitalCtrl.getClaims);
router.post('/claims', protectHospitalWrite, authorizeHospitalRoles('admin', 'finance'), hospitalCtrl.createClaim);
router.put('/claims/:id', protectHospitalWrite, authorizeHospitalRoles('admin', 'finance'), hospitalCtrl.updateClaim);
router.get('/pharmacy', hospitalCtrl.getPharmacyOverview);
router.get('/staffing', hospitalCtrl.getStaffingOverview);

module.exports = router;
