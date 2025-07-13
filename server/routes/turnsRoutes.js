const express = require('express');
const router = express.Router();
const turnsController = require('../controllers/TurnsControllers');

router.get('/', turnsController.GetAllTurns);
router.get('/:id', turnsController.GetTurnById);
router.post('/', turnsController.CreateTurn);
router.put('/:id', turnsController.UpdateTurn);
router.delete('/:id', turnsController.DeleteTurn);

module.exports = router;
