const express = require('express');
const LoanController = require('../controllers/LoanController');
const { limitMiddleware } = require('../middleware/auth');
const router = express.Router();

// ספציפיים – קודם
router.get('/GetUnpaidLoans', LoanController.GetUnpaidLoans);
router.get('/GetOverdueLoans', LoanController.GetOverdueLoans);
router.get('/GetLoanStatusSummary/:personId', LoanController.GetLoanStatusSummary);
router.post('/send',limitMiddleware, LoanController.sendEmail);

// פעולה כללית על כולם
router.get('/', LoanController.GetAllLoans);
router.put('/', LoanController.updateLoanStatusApi);
router.post('/', LoanController.CreateLoan);

// פעולות לפי מזהה
router.get('/:id', LoanController.GetLoanById);
router.put('/:id', LoanController.UpdateLoan);
router.delete('/:id', LoanController.DeleteLoan);

module.exports = router;
