const express = require('express');
const GuarantorController = require('../controllers/GuarantorContoller');
const router = express.Router();

router.get('/', GuarantorController.GetAllGuarantors);
router.get('/:id', GuarantorController.GetGuarantorById);
router.post('/', GuarantorController.CreateGuarantor);
router.put('/:id', GuarantorController.UpdateGuarantor);
router.delete('/:id', GuarantorController.DeleteGuarantor);

module.exports = router;
