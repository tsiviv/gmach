const Turns = require('../models/Turns');
const People = require('../models/People');

module.exports = {
  // שליפת כל הפקדות/משיכות
  GetAllTurns: async (req, res) => {
    try {
      const turns = await Turns.findAll({
        include: [
          {
            model: People,
            as: 'person',
            attributes: ['id', 'fullName'] 
          }
        ]
      });
      res.json(turns);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // שליפת פעולה לפי מזהה
  GetTurnById: async (req, res) => {
    try {
      const { id } = req.params;
      const turn = await Turns.findByPk(id, {
        include: [
          {
            model: People,
            as: 'person',
            attributes: ['id', 'fullName']
          }
        ]
      });

      if (!turn) return res.status(404).json({ error: 'Turn not found' });
      res.json(turn);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // יצירת פעולה חדשה
  CreateTurn: async (req, res) => {
    try {
      const { personId, amount, repaymentType, description, date } = req.body;
      const newTurn = await Turns.create({
        personId,
        amount,
        repaymentType,
        description,
        date,
      });
      res.status(201).json(newTurn);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // עדכון פעולה קיימת
  UpdateTurn: async (req, res) => {
    try {
      const { id } = req.params;
      const { personId, amount, repaymentType, description, date } = req.body;

      const turn = await Turns.findByPk(id);
      if (!turn) return res.status(404).json({ error: 'Turn not found' });

      await turn.update({ personId, amount, repaymentType, description, date });
      res.json(turn);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // מחיקת פעולה
  DeleteTurn: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Turns.destroy({ where: { id } });

      if (!deleted) return res.status(404).json({ error: 'Turn not found' });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
