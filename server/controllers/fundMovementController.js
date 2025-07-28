const FundMovement = require('../models/FundMovement');
const People = require('../models/People');

module.exports = {
  createMovement: async (req, res) => {
    try {
      const { personId, amount, type, description, date, typeOfPayment, currency } = req.body;
      console.log(typeOfPayment)
      const movement = await FundMovement.create({ personId, amount, type, description, date, typeOfPayment, currency });
      res.status(201).json(movement);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateMovements: async (req, res) => {
    try {
      const { id } = req.params;
      const movement = await FundMovement.findByPk(id);
      const { personId, amount, type, description, date, typeOfPayment, currency } = req.body;
      console.log(typeOfPayment)
      await movement.update({ personId, amount, type, description, date, typeOfPayment, currency })
      res.status(201).json(movement);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteMovement: async (req, res) => {
    try {
      const { id } = req.params;
      const movement = await FundMovement.findByPk(id);
      if (!movement) return res.status(404).json({ error: 'Movement not found' });

      await movement.destroy();
      res.json({ message: 'Movement deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  getAllMovements: async (req, res) => {
    try {
      const movements = await FundMovement.findAll({
        include: [
          {
            model: People,
            as: 'person',
            attributes: ['id', 'fullName']
          }
        ],
        order: [['date', 'DESC']]
      });

      res.json(movements);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  createFundMovement: async function (personId, amount, type, currency, typeOfPayment, description = '', date = new Date()) {
    console.log("create", personId, amount, type, typeOfPayment)
    if (!personId || !amount || !type) {
      console.log(personId, amount, type, description)
      throw new Error('Missing required fields');
    }

    const movement = await FundMovement.create({
      personId,
      amount,
      type,
      description,
      date, typeOfPayment, currency
    });

    return movement;
  },

  updateMovementByOldAndNewData: async function (oldData, newData) {
    console.log(oldData)
    const whereConditions = {
      personId: oldData.PeopleId,
      amount: oldData.amount,
      type: oldData.method,
      date: oldData.date,
      currency: oldData.currency
    };

    const movement = await FundMovement.findOne({
      where: whereConditions,
    });

    if (!movement) {
      throw new Error('תנועה לא נמצאה עם הנתונים שסופקו');
    }

    await movement.update({
      personId: newData.PeopleId,
      amount: newData.amount,
      type: newData.method,
      description: newData.description,
      date: newData.date,
      currency: newData.currency,
    });

    return movement;
  }

};
