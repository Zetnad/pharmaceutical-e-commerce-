const express = require('express');
const hospitalCtrl = require('../controllers/hospitalController');

const router = express.Router();

router.get('/overview', hospitalCtrl.getOverview);
router.get('/facilities', hospitalCtrl.getFacilities);
router.get('/patients', hospitalCtrl.getPatients);
router.post('/patients', hospitalCtrl.createPatient);
router.get('/encounters', hospitalCtrl.getEncounters);
router.post('/encounters', hospitalCtrl.createEncounter);
router.get('/staff', hospitalCtrl.getStaff);
router.get('/claims', hospitalCtrl.getClaims);
router.post('/claims', hospitalCtrl.createClaim);
router.get('/pharmacy', hospitalCtrl.getPharmacyOverview);
router.get('/staffing', hospitalCtrl.getStaffingOverview);

module.exports = router;
