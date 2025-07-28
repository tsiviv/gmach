const Repayment = require('../models/Repayment');
const Loan = require('../models/Loan');
const { createFundMovement } = require('./fundMovementController')
const FundMovement = require('../models/FundMovement');
const People = require('../models/People');

module.exports = {
    GetAllRepayments: async (req, res) => {
        try {
            const repayments = await Repayment.findAll({
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
            await updateLoanStatus(loanId, Guarantor);
            const loan = await Loan.findByPk(loanId);
            if (!loan) {
                return res.status(404).json({ error: 'Loan not found' });
            }
            const repayment = await Repayment.create({ loanId, Guarantor, amount, paidDate, notes, typeOfPayment:loan.typeOfPayment, currency:loan.currency});
            console.log(loan.typeOfPayment)
            await createFundMovement(
                loan.borrowerId,
                amount,
                'repayment_received',
                loan.currency,
                loan.typeOfPayment,
                `תשלום עבור הלוואה מספר #${loanId}`,
                paidDate,
            );
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
            await updateLoanStatus(loanId, Guarantor);
            if (!loan) {
                return res.status(404).json({ error: 'Loan not found' });
            }
            // צור תנועה כספית (חיוב החזר)

            res.json(repayment);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // מחיקת רשומת פירעון
    DeleteRepayment: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await Repayment.destroy({ where: { id } });
            if (!deleted) return res.status(404).json({ error: 'Repayment not found' });

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

};
const updateLoanStatus = async (loanId, Guarantor) => {
    const loan = await Loan.findByPk(loanId, {
        include: [{ model: Repayment, as: 'repayments' }]
    });

    if (!loan) throw new Error('Loan not found');
    const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
    const dueAmount = loan.amount;
    const now = new Date();
    console.log("totalRepaid", totalRepaid)
    let newStatus = 'pending';
    console.log(loan.repaymentType)
    if (Guarantor) {
        newStatus = 'PaidBy_Gauartantor';
    } else {
        if (loan.repaymentType === 'once') {
            console.log(loan.repaymentType)
            const isLate = loan.singleRepaymentDate && totalRepaid < dueAmount && now > new Date(loan.singleRepaymentDate);
            if (totalRepaid >= dueAmount) {
                newStatus = isLate ? 'late_paid' : 'paid';
            } else if (totalRepaid > 0) {
                console.log("partial")
                newStatus = 'partial';
            } else {
                newStatus = 'pending';
            }
        } else if (loan.repaymentType === 'monthly') {
            console.log("monthly")
            const monthsSinceStart = (now.getFullYear() - loan.startDate.getFullYear()) * 12 + (now.getMonth() - loan.startDate.getMonth()) + 1;
            const expectedRepayments = monthsSinceStart;
            const actualRepayments = loan.repayments.length;

            if (totalRepaid >= dueAmount) {
                newStatus = 'paid';
            } else if (actualRepayments < expectedRepayments) {
                newStatus = 'overdue';
            } else {
                console.log("partial")
                newStatus = 'partial';
            }
        }
    }

    await loan.update({ status: newStatus });

};
