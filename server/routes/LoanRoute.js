const express = require('express');
const LoanController=require('../controllers/LoanController');
const router = express.Router();

router.get('/', LoanController.GetAllLoans);


module.exports = router;
