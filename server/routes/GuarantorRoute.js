const express = require('express');
const GuarantorContoller=require('../controllers/GuarantorContoller');
const router = express.Router();

router.get('/', GuarantorContoller.GetAllGuarantors);


module.exports = router;
