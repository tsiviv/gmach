const Repayment = require('../models/Repayment');
const Loan = require('../models/Loan');
const { createFundMovement } = require('./fundMovementController')
const FundMovement = require('../models/FundMovement');
const People = require('../models/People');
const LoanController = require('../controllers/LoanController');
module.exports = {
    GetAllRepayments: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1; // דף נוכחי
            const limit = parseInt(req.query.limit) || 20; // מספר הרשומות בדף
            const offset = (page - 1) * limit;

            const { count, rows } = await Repayment.findAndCountAll({
                include: [
                    {
                        model: Loan,
                        as: 'loan',
                        include: [
                            {
                                model: People,
                                as: 'borrower'
                            }
                        ]
                    }
                ],
                order: [['paidDate', 'DESC']], // או כל שדה אחר שאתה רוצה למיין לפי
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


    GetRepaymentsByLoanId: async (req, res) => {
        try {
            const { loanId } = req.params;
            const repayments = await Repayment.findAll({
                where: { loanId },
                include: [
                    {
                        model: Loan,
                        as: 'loan', include: [{
                            model: People,
                            as: 'borrower'
                        }],
                    }
                ]
            });
            res.json(repayments);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    CreateRepayment: async (req, res) => {
        try {
            const { loanId, Guarantor, amount, paidDate, notes } = req.body;
            const loan = await Loan.findByPk(loanId);
            if (!loan) {
                return res.status(404).json({ error: 'Loan not found' });
            }
            const repayment = await Repayment.create({ loanId, Guarantor, amount, paidDate, notes, typeOfPayment: loan.typeOfPayment, currency: loan.currency });
            await createFundMovement(
                loan.borrowerId,
                amount,
                'repayment_received',
                loan.currency,
                loan.typeOfPayment,
                `תשלום עבור הלוואה מספר #${loanId}`,
                paidDate,
            );
            await LoanController.updateLoanStatuses();
            res.status(201).json(repayment);
        } catch (err) {
            console.log(err)
            res.status(500).json({ error: err.message });
        }
    },

    UpdateRepayment: async (req, res) => {
        try {
            const { id } = req.params;
            const { loanId, Guarantor, amount, paidDate, notes, typeOfPayment, currency } = req.body;
            const repayment = await Repayment.findByPk(id);
            if (!repayment) return res.status(404).json({ error: 'Repayment not found' });
            const loan = await Loan.findByPk(loanId);
            const existingMovement = await FundMovement.findOne({
                where: {
                    personId: loan.borrowerId,
                    type: 'repayment_received',
                    date: repayment.paidDate, // שים לב שהפורמט חייב להיות תואם ל-YYYY-MM-DD
                },
            });

            if (existingMovement) {
                await existingMovement.update({ amount, typeOfPayment, currency });
            } else {
                console.log('לא נמצאה תנועת קרן מתאימה לעדכון');
            }
            await repayment.update({ loanId, Guarantor, amount, paidDate, notes, typeOfPayment, currency });
            if (!loan) {
                return res.status(404).json({ error: 'Loan not found' });
            }
            // צור תנועה כספית (חיוב החזר)
            await LoanController.updateLoanStatuses();

            res.json(repayment);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    DeleteRepayment: async (req, res) => {
        try {
            const { id } = req.params;
            const repayment = await Repayment.findByPk(id);
            const deleted = await Repayment.destroy({ where: { id } });
            const loan = await Loan.findByPk(repayment.loanId);
            const existingMovement = await FundMovement.findOne({
                where: {
                    personId: loan.borrowerId,
                    type: 'repayment_received',
                    date: repayment.paidDate, // שים לב שהפורמט חייב להיות תואם ל-YYYY-MM-DD
                    amount: repayment.amount
                },
            });

            if (existingMovement) {
                await existingMovement.destroy();
            } else {
                console.log('לא נמצאה תנועת קרן מתאימה לעדכון');
            }
            if (!deleted) return res.status(404).json({ error: 'Repayment not found' });
            await LoanController.updateLoanStatuses();

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

};

