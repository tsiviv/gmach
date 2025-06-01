const express = require('express');
const LoanController = require('../controllers/LoanController');
const router = express.Router();

router.get('/GetUnpaidLoans', LoanController.GetUnpaidLoans);
router.get('/GetOverdueLoans', LoanController.GetOverdueLoans);
router.get('/GetLoanStatusSummary/:personId', LoanController.GetLoanStatusSummary);

router.get('/', LoanController.GetAllLoans);
router.get('/:id', LoanController.GetLoanById);
router.post('/', LoanController.CreateLoan);
router.put('/:id', LoanController.UpdateLoan);
router.delete('/:id', LoanController.DeleteLoan);

module.exports = router;
