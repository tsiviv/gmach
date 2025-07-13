const express = require('express');
const router = express.Router();
const DepositController = require('../controllers/DepositController');

router.post('/', DepositController.createDeposit);
router.put('/:id', DepositController.updateDeposit);
router.get('/', DepositController.getAllDeposits);
router.delete('/:id', DepositController.deleteDeposit);
router.get('/:PeopleId', DepositController.getDepositsByPerson);
router.get('/balance/:PeopleId', DepositController.getCurrentBalance);

module.exports = router;
