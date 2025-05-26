const Guarantor = require('../models/Guarantor');
const Loan = require('../models/Loan');
const People = require('../models/People');

module.exports = {
  // שליפת כל הערבים
  GetAllGuarantors: async (req, res) => {
    try {
        const guarantors = await Guarantor.findAll({
            include: [
              { model: Loan },
              { model: People, as: 'guarantor' }
            ]
          });
      res.json(guarantors);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // שליפת ערב לפי מזהה
  GetGuarantorById: async (req, res) => {
    try {
      const { id } = req.params;
      const guarantor = await Guarantor.findByPk(id, {
        include: [
          { model: Loan },
          { model: People, as: 'guarantor' }
        ]
      });
      if (!guarantor) return res.status(404).json({ error: 'Guarantor not found' });
      res.json(guarantor);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // יצירת ערב חדש
  CreateGuarantor: async (req, res) => {
    try {
      const { loanId, PeopleId } = req.body;
      const newGuarantor = await Guarantor.create({ loanId, PeopleId });
      res.status(201).json(newGuarantor);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // עדכון ערב קיים
  UpdateGuarantor: async (req, res) => {
    try {
      const { id } = req.params;
      const { loanId, PeopleId } = req.body;
      const guarantor = await Guarantor.findByPk(id);
      if (!guarantor) return res.status(404).json({ error: 'Guarantor not found' });

      await guarantor.update({ loanId, PeopleId });
      res.json(guarantor);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // מחיקת ערב
  DeleteGuarantor: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Guarantor.destroy({ where: { id } });
      if (!deleted) return res.status(404).json({ error: 'Guarantor not found' });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
