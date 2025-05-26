const express = require('express');
const RepaymentController = require('../controllers/RepaymentController');
const router = express.Router();

router.get('/', RepaymentController.GetAllRepayments);
router.get('/loan/:loanId', RepaymentController.GetRepaymentsByLoanId);
router.post('/', RepaymentController.CreateRepayment);
router.put('/:id', RepaymentController.UpdateRepayment);
router.delete('/:id', RepaymentController.DeleteRepayment);

module.exports = router;
