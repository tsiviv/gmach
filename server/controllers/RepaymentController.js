const Repayment = require('../models/Repayment');
const Loan = require('../models/Loan');
const { createFundMovement } = require('./fundMovementController')
module.exports = {
    GetAllRepayments: async (req, res) => {
        try {
            const repayments = await Repayment.findAll({
                include: [{ model: Loan }],
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
                include: [{ model: Loan }],
            });
            res.json(repayments);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    CreateRepayment: async (req, res) => {
        try {
            const { loanId, amount, paidDate, notes } = req.body;
            const repayment = await Repayment.create({ loanId, amount, paidDate, notes });
            await updateLoanStatus(loanId);
            const loan = await Loan.findByPk(loanId);
            if (!loan) {
                return res.status(404).json({ error: 'Loan not found' });
            }
            await createFundMovement({
                personId: loan.personId,
                amount: amount,
                type: 'repayment',
                description: `Repayment for loan #${loanId}`,
                date: paidDate,
            });
            res.status(201).json(repayment);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    UpdateRepayment: async (req, res) => {
        try {
            const { id } = req.params;
            const { loanId, amount, paidDate, notes } = req.body;
            const repayment = await Repayment.findByPk(id);
            if (!repayment) return res.status(404).json({ error: 'Repayment not found' });

            await repayment.update({ loanId, amount, paidDate, notes });
            await updateLoanStatus(loanId);
            const loan = await Loan.findByPk(loanId);
            if (!loan) {
                return res.status(404).json({ error: 'Loan not found' });
            }
            // צור תנועה כספית (חיוב החזר)
            await createFundMovement({
                personId: loan.personId,
                amount: amount,
                type: 'repayment',
                description: `Repayment for loan #${loanId}`,
                date: paidDate,
            });
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
const updateLoanStatus = async (loanId) => {
    const loan = await Loan.findByPk(loanId, {
      include: [Repayment],
    });
  
    const totalRepaid = loan.Repayments.reduce((sum, r) => sum + r.amount, 0);
    const dueAmount = loan.amount;
    const now = new Date();
  
    let newStatus = 'pending';
  
    if (loan.repaymentType === 'single') {
      const isLate = loan.singleRepaymentDate && totalRepaid < dueAmount && now > new Date(loan.singleRepaymentDate);
      if (totalRepaid >= dueAmount) {
        newStatus = isLate ? 'late_paid' : 'paid';
      } else if (totalRepaid > 0) {
        newStatus = 'partial';
      } else {
        newStatus = 'pending';
      }
    } else if (loan.repaymentType === 'monthly') {
      const monthsSinceStart = (now.getFullYear() - loan.startDate.getFullYear()) * 12 + (now.getMonth() - loan.startDate.getMonth()) + 1;
      const expectedRepayments = monthsSinceStart;
      const actualRepayments = loan.Repayments.length;
  
      if (totalRepaid >= dueAmount) {
        newStatus = 'paid';
      } else if (actualRepayments < expectedRepayments) {
        newStatus = 'overdue'; 
      } else {
        newStatus = 'partial';
      }
    }
  
    await loan.update({ status: newStatus });
  };
  