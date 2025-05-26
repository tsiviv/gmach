const express = require('express');
const PeopleController = require('../controllers/PeopleController');
const router = express.Router();

router.get('/', PeopleController.GetAllPeople);
router.get('/:id', PeopleController.GetPersonById);
router.get('/GetLoansByPerson/:id', PeopleController.GetLoansByPerson);
router.post('/', PeopleController.CreatePerson);
router.put('/:id', PeopleController.UpdatePerson);
router.delete('/:id', PeopleController.DeletePerson);
router.get('/GetLoansByGuarantor/:id', PeopleController.GetLoansByGuarantor);

module.exports = router;

