const Deposit = require('../models/Deposit');
const People = require('../models/People');
const { createFundMovement } = require('./fundMovementController');
const { Op } = require('sequelize');
const FundMovement=require('../models/FundMovement')
module.exports = {

    createDeposit: async (req, res) => {
        try {
            const { PeopleId, amount, date, typeOfPayment, description, currency, method, isDeposit } = req.body;

            const lastDeposit = await Deposit.findOne({
                where: { PeopleId },
                order: [['date', 'DESC'], ['id', 'DESC']]
            });
            let newBalance = 0
            if (isDeposit) {
                const previousBalance = Number(lastDeposit?.balanceAfter) || 0;
                const amountNum = Number(amount);
                newBalance = previousBalance + amountNum;
            }
            else {
                const previousBalance = Number(lastDeposit?.balanceAfter) || 0;
                const amountNum = Number(amount);
                if (amountNum > previousBalance) {
                    return res.status(400).json({ error: 'אין מספיק יתרה למשיכה' });
                }
                newBalance = previousBalance - amountNum;

            }
            const deposit = await Deposit.create({
                PeopleId,
                isDeposit: isDeposit,
                amount,
                balanceAfter: newBalance,
                method,
                typeOfPayment,
                currency,
                description,
                date,
            });

            await createFundMovement(PeopleId, amount, method, description || '', date);
            res.status(201).json(deposit);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },


    // שליפת כל ההפקדות/משיכות
    getAllDeposits: async (req, res) => {
        try {
            const deposits = await Deposit.findAll({
                include: [{ model: People, as: 'person' }],
                order: [['date', 'DESC'], ['id', 'DESC']]
            });
            res.json(deposits);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    updateDeposit: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                PeopleId,
                amount,
                date,
                typeOfPayment,
                description,
                currency,
                method,
                isDeposit
            } = req.body;

            const deposit = await Deposit.findByPk(id);

            if (!deposit) {
                return res.status(404).json({ error: 'הפקדה לא נמצאה' });
            }

            // נשלוף את ההפקדה האחרונה לפני ההפקדה הזו (כדי לחשב יתרה מחדש)
            const previousDeposit = await Deposit.findOne({
                where: {
                    PeopleId,
                    [Op.or]: [
                        { date: { [Op.lt]: date } },
                        {
                            date: date,
                            id: { [Op.lt]: id }
                        }
                    ]
                },
                order: [['date', 'DESC'], ['id', 'DESC']]
            });

            const previousBalance = Number(previousDeposit?.balanceAfter) || 0;
            const amountNum = Number(amount);

            let newBalance;
            if (isDeposit) {
                newBalance = previousBalance + amountNum;
            } else {
                if (amountNum > previousBalance) {
                    return res.status(400).json({ error: 'אין מספיק יתרה למשיכה' });
                }
                newBalance = previousBalance - amountNum;
            }

            // עדכון ההפקדה
            await deposit.update({
                PeopleId,
                amount,
                date,
                typeOfPayment,
                description,
                currency,
                method,
                isDeposit,
                balanceAfter: newBalance
            });

            // עדכון כל ההפקדות שאחריה לפי הסדר – חישוב מחודש ליתרה
            const nextDeposits = await Deposit.findAll({
                where: {
                    PeopleId,
                    [Op.or]: [
                        { date: { [Op.gt]: date } },
                        {
                            date: date,
                            id: { [Op.gt]: id }
                        }
                    ]
                },
                order: [['date', 'ASC'], ['id', 'ASC']]
            });

            let runningBalance = newBalance;
            for (const d of nextDeposits) {
                const amt = Number(d.amount);
                if (d.isDeposit) {
                    runningBalance += amt;
                } else {
                    runningBalance -= amt;
                }

                await d.update({ balanceAfter: runningBalance });
            }

            res.json(deposit);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // שליפת הפקדות/משיכות לפי אדם
    getDepositsByPerson: async (req, res) => {
        try {
            const { PeopleId } = req.params;

            const deposits = await Deposit.findAll({
                where: { PeopleId },
                order: [['date', 'DESC'], ['id', 'DESC']]
            });

            res.json(deposits);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    deleteDeposit: async (req, res) => {
        try {
            const { id } = req.params;

            const depositToDelete = await Deposit.findByPk(id);

            if (!depositToDelete) {
                return res.status(404).json({ error: 'הפקדה לא נמצאה' });
            }

            const { PeopleId, date } = depositToDelete;

            await FundMovement.destroy({
                where: {
                    personId: PeopleId,
                    amount: depositToDelete.amount,
                    type: depositToDelete.method,
                    description: depositToDelete.description || '',
                    date
                }
            }); const previousDeposit = await Deposit.findOne({
                where: {
                    PeopleId,
                    [Op.or]: [
                        { date: { [Op.lt]: date } },
                        {
                            date: date,
                            id: { [Op.lt]: id }
                        }
                    ]
                },
                order: [['date', 'DESC'], ['id', 'DESC']]
            });

            const previousBalance = Number(previousDeposit?.balanceAfter) || 0;

            await depositToDelete.destroy();

            const nextDeposits = await Deposit.findAll({
                where: {
                    PeopleId,
                    [Op.or]: [
                        { date: { [Op.gt]: date } },
                        {
                            date: date,
                            id: { [Op.gt]: id }
                        }
                    ]
                },
                order: [['date', 'ASC'], ['id', 'ASC']]
            });

            let runningBalance = previousBalance;
            for (const d of nextDeposits) {
                const amt = Number(d.amount);
                if (d.isDeposit) {
                    runningBalance += amt;
                } else {
                    runningBalance -= amt;
                }

                await d.update({ balanceAfter: runningBalance });
            }

            res.json({ message: 'הפקדה נמחקה בהצלחה' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    getCurrentBalance: async (req, res) => {
        try {
            const { PeopleId } = req.params;

            const lastDeposit = await Deposit.findOne({
                where: { PeopleId },
                order: [['date', 'DESC'], ['id', 'DESC']],
            });

            const balance = lastDeposit?.balanceAfter || 0;

            res.json({ PeopleId, balance });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};
