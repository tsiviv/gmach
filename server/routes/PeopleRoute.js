const express = require('express');
const PeopleController=require('../controllers/PeopleController');
const router = express.Router();

router.get('/', PeopleController.GetAllPeople);


module.exports = router;
