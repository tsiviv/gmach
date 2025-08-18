const Deposit = require('../models/Deposit');
const People = require('../models/People');
const { createFundMovement, updateMovementByOldAndNewData } = require('./fundMovementController');
const { Op } = require('sequelize');
const FundMovement = require('../models/FundMovement')
module.exports = {

    createDeposit: async (req, res) => {
        try {
            const { PeopleId, amount, date, typeOfPayment, description, currency, method, isDeposit } = req.body;

            const lastDeposit = await Deposit.findOne({
                where: { PeopleId },
                order: [['date', 'DESC'], ['id', 'DESC']]
            });

            // קבלת יתרות קודמות לפי מטבע
            let previousShekel = Number(lastDeposit?.balanceShekel) || 0;
            let previousDollar = Number(lastDeposit?.balanceDollar) || 0;

            const amountNum = Number(amount);

            // חישוב יתרה לפי סוג הפעולה והמטבע
            if (currency === 'shekel') {
                if (isDeposit) previousShekel += amountNum;
                else {
                    if (amountNum > previousShekel) {
                        return res.status(400).json({ error: 'אין מספיק יתרה בשקלים למשיכה' });
                    }
                    previousShekel -= amountNum;
                }
            } else if (currency === 'dollar') {
                if (isDeposit) previousDollar += amountNum;
                else {
                    if (amountNum > previousDollar) {
                        return res.status(400).json({ error: 'אין מספיק יתרה בדולרים למשיכה' });
                    }
                    previousDollar -= amountNum;
                }
            }

            const deposit = await Deposit.create({
                PeopleId,
                isDeposit,
                amount,
                balanceShekel: previousShekel,
                balanceDollar: previousDollar,
                method,
                typeOfPayment,
                currency,
                description,
                date,
            });

            await createFundMovement(PeopleId, amount, method, currency, typeOfPayment, description || '', date);
            res.status(201).json(deposit);

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    // שליפת כל ההפקדות/משיכות
    getAllDeposits: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1; // דף נוכחי
            const limit = parseInt(req.query.limit) || 20; // מספר הרשומות בדף
            const offset = (page - 1) * limit;

            const { count, rows } = await Deposit.findAndCountAll({
                include: [{ model: People, as: 'person' }],
                order: [['date', 'DESC'], ['id', 'DESC']],
                offset,
                limit
            });

            res.json({
                data: rows,
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page
            });
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

            // עדכון תנועת כספים
            try {
                await updateMovementByOldAndNewData(deposit, req.body);
            } catch (e) {
                console.log(e);
                return res.status(404).json({ e: e });
            }

            // השגת ההפקדה הקודמת לפי מטבע
            const previousDeposit = await Deposit.findOne({
                where: {
                    PeopleId,
                    [Op.or]: [
                        { date: { [Op.lt]: date } },
                        { date: date, id: { [Op.lt]: id } }
                    ]
                },
                order: [['date', 'DESC'], ['id', 'DESC']]
            });

            // יתרות נפרדות לשקל ודולר
            let previousShekel = Number(previousDeposit?.balanceShekel) || 0;
            let previousDollar = Number(previousDeposit?.balanceDollar) || 0;
            const amountNum = Number(amount);

            // חישוב יתרה חדשה לפי מטבע
            if (currency === 'shekel') {
                if (isDeposit) previousShekel += amountNum;
                else {
                    if (amountNum > previousShekel) return res.status(400).json({ error: 'אין מספיק יתרה בשקלים למשיכה' });
                    previousShekel -= amountNum;
                }
            } else if (currency === 'dollar') {
                if (isDeposit) previousDollar += amountNum;
                else {
                    if (amountNum > previousDollar) return res.status(400).json({ error: 'אין מספיק יתרה בדולרים למשיכה' });
                    previousDollar -= amountNum;
                }
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
                balanceShekel: previousShekel,
                balanceDollar: previousDollar
            });

            const nextDeposits = await Deposit.findAll({
                where: {
                    PeopleId,
                    [Op.or]: [
                        { date: { [Op.gt]: date } },
                        { date: date, id: { [Op.gt]: id } }
                    ]
                },
                order: [['date', 'ASC'], ['id', 'ASC']]
            });

            let runningShekel = previousShekel;
            let runningDollar = previousDollar;

            for (const d of nextDeposits) {
                const amt = Number(d.amount);
                if (d.currency === 'shekel') {
                    runningShekel = d.isDeposit ? runningShekel + amt : runningShekel - amt;
                } else if (d.currency === 'dollar') {
                    runningDollar = d.isDeposit ? runningDollar + amt : runningDollar - amt;
                }
                await d.update({
                    balanceShekel: runningShekel,
                    balanceDollar: runningDollar
                });
            }

            res.json(deposit);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

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
        if (!depositToDelete) return res.status(404).json({ error: 'הפקדה לא נמצאה' });

        const { PeopleId, currency, isDeposit } = depositToDelete;

        // אם מדובר בהפקדה, נבדוק שהמחיקה לא תגרום ליתרה שלילית במטבע הרלוונטי
        if (isDeposit) {
            const allDeposits = await Deposit.findAll({
                where: { PeopleId },
                order: [['date', 'ASC'], ['id', 'ASC']]
            });

            let runningBalance = 0;
            for (const d of allDeposits) {
                if (d.id === depositToDelete.id) continue;

                if (d.currency === currency) {
                    const amt = Number(d.amount);
                    runningBalance = d.isDeposit ? runningBalance + amt : runningBalance - amt;
                }
            }

            if (runningBalance < 0) {
                return res.status(400).json({ 
                    error: `לא ניתן למחוק – פעולה תגרום ליתרה שלילית ב${currency === 'shekel' ? 'שקלים' : 'דולרים'}` 
                });
            }
        }

        // מוחקים את תנועות הקרדיט הקשורות
        await FundMovement.destroy({
            where: {
                personId: PeopleId,
                amount: depositToDelete.amount,
                type: depositToDelete.method,
                date: depositToDelete.date
            }
        });

        // מוחקים את ההפקדה
        await depositToDelete.destroy();

        // מחשבים מחדש את יתרות ההפקדות הבאות
        const remainingDeposits = await Deposit.findAll({
            where: { PeopleId },
            order: [['date', 'ASC'], ['id', 'ASC']]
        });

        let runningShekel = 0;
        let runningDollar = 0;

        for (const d of remainingDeposits) {
            const amt = Number(d.amount);
            if (d.currency === 'shekel') runningShekel = d.isDeposit ? runningShekel + amt : runningShekel - amt;
            else if (d.currency === 'dollar') runningDollar = d.isDeposit ? runningDollar + amt : runningDollar - amt;

            await d.update({
                balanceShekel: runningShekel,
                balanceDollar: runningDollar
            });
        }

        res.json({ message: 'הפקדה נמחקה בהצלחה' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

    ,
    getCurrentBalance: async (req, res) => {
        try {
            const { PeopleId } = req.params;

            const lastDeposit = await Deposit.findOne({
                where: { PeopleId },
                order: [['date', 'DESC'], ['id', 'DESC']],
            });

            const balanceDollar = lastDeposit?.balanceDollar || 0;
            const balanceShekel = lastDeposit?.balanceShekel || 0;

            res.json({ PeopleId, balanceDollar, balanceShekel });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
};
