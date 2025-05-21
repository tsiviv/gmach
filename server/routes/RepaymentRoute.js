const express = require('express');
const RepaymentController=require('../controllers/RepaymentController');
const router = express.Router();

router.get('/', RepaymentController.GetAllRepayments);


module.exports = router;
