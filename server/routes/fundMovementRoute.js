const express = require('express');
const router = express.Router();
const fundMovementController = require('../controllers/fundMovementController');

router.post('/', fundMovementController.createMovement);
router.delete('/:id', fundMovementController.deleteMovement);
router.get('/', fundMovementController.getAllMovements);
router.put('/:id', fundMovementController.updateMovements);

module.exports = router;
// // 