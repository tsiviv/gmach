const Deposit = require('../models/Deposit');
const People = require('../models/People');
const { createFundMovement } = require('./fundMovementController')
const FundMovement = require('../models/FundMovement');

module.exports = {
    createDeposit: async (req, res) => {
        try {
            const { PeopleId, pull_amount, deposit_amount, date } = req.body;
            if(pull_amount>deposit_amount)
                res.status(404).json("סכום המשיכה גבוה מסכום ההפקדה");

            let deposit = await Deposit.findOne({ where: { PeopleId } });
    
            if (!deposit) {
                // אם אין שורה בטבלת deposit – יוצרים חדשה
                deposit = await Deposit.create({ PeopleId, pull_amount, deposit_amount });
    
                // יוצרים תנועות חדשות
                if (deposit_amount && deposit_amount > 0)
                    await createFundMovement(PeopleId, deposit_amount, 'deposit', '', date);
    
                if (pull_amount && pull_amount > 0)
                    await createFundMovement(PeopleId, pull_amount, 'pull_deposit', '', date);
            } else {
                // אם כבר קיים – מעדכנים
    
                // בדיקה אם יש שינוי בהפקדה
                if (deposit.deposit_amount != deposit_amount) {
                    let existingDepositMovement = await FundMovement.findOne({
                        where: {
                            personId: PeopleId,
                            type: 'deposit',
                        },
                    });
    
                    if (existingDepositMovement) {
                        await existingDepositMovement.update({ amount: deposit_amount, date });
                    } else if (deposit_amount && deposit_amount > 0) {
                        await createFundMovement(PeopleId, deposit_amount, 'deposit', '', date);
                    }
                }
    
                // בדיקה אם יש שינוי במשיכה
                if (deposit.pull_amount != pull_amount) {
                    let existingPullMovement = await FundMovement.findOne({
                        where: {
                            personId: PeopleId,
                            type: 'pull_deposit',
                        },
                    });
    
                    if (existingPullMovement) {
                        await existingPullMovement.update({ amount: pull_amount, date });
                    } else if (pull_amount && pull_amount > 0) {
                        await createFundMovement(PeopleId, pull_amount, 'pull_deposit', '', date);
                    }
                }
    
                // עדכון ההפקדה בטבלת Deposit
                deposit.deposit_amount = deposit_amount;
                deposit.pull_amount = pull_amount;
                await deposit.save();
            }
    
            res.status(201).json(deposit);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },    

    deleteDeposit: async (req, res) => {
        try {
            const { id } = req.params;
            const movement = await Deposit.findByPk(id);
            if (!movement) return res.status(404).json({ error: 'Movement not found' });

            await movement.destroy();
            res.json({ message: 'Movement deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    getAllDeposit: async (req, res) => {
        try {
            const deposit = await Deposit.findAll({
                include: [
                    {
                        model: People,
                        as: 'person',
                    }
                ],
            });
            console.log(Deposit.associations);

            res.json(deposit);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    , getDepositByPersonId: async (req, res) => {
        try {
            const { PeopleId } = req.params; // או req.query, תלוי איך אתה מעביר את הפרמטר
            const deposit = await Deposit.findOne({ where: { PeopleId } });

            if (!deposit) {
                res.status(200).json(deposit);
            }

            res.status(200).json({
                pull_amount: deposit.pull_amount,
                deposit_amount: deposit.deposit_amount,
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },


};
