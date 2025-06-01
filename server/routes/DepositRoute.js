const express = require('express');
const router = express.Router();
const DepositController = require('../controllers/DepositController');

router.post('/', DepositController.createDeposit);
router.delete('/:id', DepositController.deleteDeposit);
router.get('/', DepositController.getAllDeposit);
router.get('/:PeopleId', DepositController.getDepositByPersonId);

module.exports = router;
