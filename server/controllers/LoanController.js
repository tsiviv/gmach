const { Op } = require('sequelize');
const Loan = require('../models/Loan');
const People = require('../models/People');
const Repayment = require('../models/Repayment');
const Guarantor = require('../models/Guarantor')
const { createFundMovement } = require('./fundMovementController')
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FundMovement = require('../models/FundMovement');
const moment = require('moment');
const { sendEmail } = require('../controllers/emailer')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tmpPath = 'uploads/tmp';
        if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath, { recursive: true });
        cb(null, tmpPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });
const controller = {
    // שליפת כל ההלוואות
    GetAllLoans: async (req, res) => {
        try {
            const loans = await Loan.findAll({
                include: [
                    {
                        model: People,
                        as: 'borrower'
                    },
                ]
            });
            res.json(loans);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },


    // שליפת הלוואה לפי מזהה
    GetLoanById: async (req, res) => {
        console.log('GetLoanById')
        try {
            const { id } = req.params;
            const loan = await Loan.findByPk(id, {
                include: [
                    {
                        model: Repayment,
                        as: 'repayments'
                    },
                    {
                        model: People,
                        as: 'borrower'
                    },
                    {
                        model: Guarantor,
                        as: 'guarantors',
                        include: [
                            {
                                model: People,
                                as: 'guarantor'
                            }
                        ]
                    }
                ]
            });
            if (!loan) return res.status(404).json({ error: 'Loan not found' });
            res.json(loan);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // יצירת הלוואה חדשה
    CreateLoan: async (req, res) => {
        upload.any()(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: 'File upload error', details: err.message });
            }

            try {
                const { borrowerId, amount, startDate, notes, repaymentType, repaymentDay, singleRepaymentDate, amountInMonth, numOfLoan } = req.body;
                const guarantors = JSON.parse(req.body.guarantors || '[]');

                const newLoan = await Loan.create({
                    borrowerId,
                    status: 'pending',
                    notes,
                    amount,
                    startDate,
                    repaymentType,
                    repaymentDay,
                    singleRepaymentDate, amountInMonth, numOfLoan
                });

                const loanFile = req.files.find(f => f.fieldname === 'loanDocument');
                if (loanFile) {
                    const loanPath = `uploads/loans/${newLoan.id}`;
                    if (!fs.existsSync(loanPath)) fs.mkdirSync(loanPath, { recursive: true });

                    const newPath = `${loanPath}/${path.basename(loanFile.path)}`;
                    fs.renameSync(loanFile.path, newPath);

                    await Loan.update({ documentPath: newPath }, { where: { id: newLoan.id } });
                }
                console.log("guarantors", guarantors)

                for (let i = 0; i < guarantors.length; i++) {
                    const g = guarantors[i];
                    const file = req.files.find(f => f.fieldname === `document${i}`);
                    let finalDocumentPath = null;
                    console.log("file", file)
                    if (file) {
                        const guarantorPath = `uploads/loans/${newLoan.id}/guarantors/${i}`;
                        if (!fs.existsSync(guarantorPath)) fs.mkdirSync(guarantorPath, { recursive: true });

                        finalDocumentPath = `${guarantorPath}/${path.basename(file.path)}`;
                        fs.renameSync(file.path, finalDocumentPath);
                    }
                    console.log(finalDocumentPath)
                    await Guarantor.create({
                        loanId: newLoan.id,
                        PeopleId: borrowerId,
                        documentPath: finalDocumentPath
                    });
                }
                await createFundMovement(borrowerId, amount, 'loan_given', notes, startDate);

                res.status(201).json({ loan: newLoan, message: 'Loan and guarantors created successfully' });

            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error', details: err.message });
            }
        });
    },

    UpdateLoan: async (req, res) => {
        console.log('')
        upload.any()(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: 'File upload error', details: err.message });
            }

            const oldPathsToDelete = [];

            try {
                const { id } = req.params;
                const {
                    borrowerId,
                    amount,
                    startDate,
                    notes,
                    repaymentType,
                    repaymentDay,
                    singleRepaymentDate, amountInMonth, numOfLoan
                } = req.body;

                const guarantors = JSON.parse(req.body.guarantors || '[]');

                const loan = await Loan.findByPk(id);
                if (!loan) return res.status(404).json({ error: 'Loan not found' });

                if (loan.amount != amount) {
                    const existingMovement = await FundMovement.findOne({
                        where: {
                            personId: loan.borrowerId,
                            type: 'loan_given',
                            date: loan.startDate, // שים לב שהפורמט חייב להיות תואם ל-YYYY-MM-DD
                        },
                    });

                    if (existingMovement) {
                        await existingMovement.update({ amount });
                        console.log('עודכנה תנועת קרן קיימת');
                    } else {
                        console.log('לא נמצאה תנועת קרן מתאימה לעדכון');
                    }
                }
                if (loan.documentPath && fs.existsSync(loan.documentPath)) {
                    oldPathsToDelete.push(loan.documentPath);
                }


                await loan.update({
                    borrowerId,
                    amount,
                    startDate,
                    notes,
                    repaymentType,
                    repaymentDay,
                    singleRepaymentDate, amountInMonth, numOfLoan
                });

                // מסמך הלוואה חדש
                const loanFile = req.files.find(f => f.fieldname === 'loanDocument');
                if (loanFile) {
                    // יש קובץ חדש => מחליפים את הישן
                    if (loan.documentPath && fs.existsSync(loan.documentPath)) {
                        oldPathsToDelete.push(loan.documentPath);
                    }

                    const loanPath = `uploads/loans/${loan.id}`;
                    if (!fs.existsSync(loanPath)) fs.mkdirSync(loanPath, { recursive: true });

                    const newPath = `${loanPath}/${path.basename(loanFile.path)}`;
                    fs.renameSync(loanFile.path, newPath);
                    await loan.update({ documentPath: newPath });
                }
                else if (req.body.documentPath == null || req.body.documentPath === 'null') {
                    console.log("SDfg");
                    await loan.update({ documentPath: null });
                }


                const oldGuarantors = await Guarantor.findAll({ where: { loanId: loan.id } });
                for (const g of oldGuarantors) {
                    if (g.documentPath && fs.existsSync(g.documentPath)) {
                        oldPathsToDelete.push(g.documentPath);
                    }
                }

                await Guarantor.destroy({ where: { loanId: loan.id } });

                // הכנסת ערבים חדשים
                for (let i = 0; i < guarantors.length; i++) {
                    const g = guarantors[i];
                    const file = req.files.find(f => f.fieldname === `document${i}`);
                    let finalDocumentPath = null;

                    if (file) {
                        const guarantorPath = `uploads/loans/${loan.id}/guarantors/${i}`;
                        if (!fs.existsSync(guarantorPath)) fs.mkdirSync(guarantorPath, { recursive: true });

                        finalDocumentPath = `${guarantorPath}/${path.basename(file.path)}`;
                        fs.renameSync(file.path, finalDocumentPath);
                    }

                    await Guarantor.create({
                        loanId: loan.id,
                        PeopleId: borrowerId,
                        documentPath: finalDocumentPath
                    });
                }

                // ✅ כל העדכון הצליח – עכשיו מוחקים את הקבצים הישנים
                for (const oldPath of oldPathsToDelete) {
                    try {
                        fs.unlinkSync(oldPath);
                    } catch (unlinkErr) {
                        console.warn(`Unable to delete old file: ${oldPath}`, unlinkErr.message);
                    }
                }

                res.json({ loan, message: 'Loan updated successfully with new documents and guarantors' });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error', details: err.message });
            }
        });
    },


    // מחיקת הלוואה
    DeleteLoan: async (req, res) => {
        try {
            const { id } = req.params;

            const loan = await Loan.findByPk(id);
            const existingMovement = await FundMovement.findOne({
                where: {
                    personId: loan.borrowerId,
                    type: 'loan_given',
                    date: loan.startDate, // שים לב שהפורמט חייב להיות תואם ל-YYYY-MM-DD
                },
            });

            if (existingMovement) {
                await FundMovement.destroy({ where: { id: existingMovement.id } });
                console.log('עודכנה תנועת קרן קיימת');
            } else {
                console.log('לא נמצאה תנועת קרן מתאימה לעדכון');
            }
            if (!loan) return res.status(404).json({ error: 'Loan not found' });
            const guarantors = await Guarantor.findAll({ where: { loanId: id } });
            for (const g of guarantors) {
                if (g.documentPath && fs.existsSync(g.documentPath)) {
                    try {
                        fs.unlinkSync(g.documentPath);
                    } catch (e) {
                        console.warn(`Failed to delete guarantor document: ${g.documentPath}`, e.message);
                    }
                }
            }
            if (loan.documentPath && fs.existsSync(loan.documentPath)) {
                try {
                    fs.unlinkSync(loan.documentPath);
                } catch (e) {
                    console.warn(`Failed to delete loan document: ${loan.documentPath}`, e.message);
                }
            }
            const loanFolderPath = `uploads/loans/${loan.id}`;
            if (fs.existsSync(loanFolderPath)) {
                fs.rmSync(loanFolderPath, { recursive: true, force: true });
            }
            await Guarantor.destroy({ where: { loanId: id } });
            await Loan.destroy({ where: { id } });

            res.json({ success: true });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // הלוואות שלא שולמו במלואן
    GetUnpaidLoans: async (req, res) => {
        try {
            const loans = await Loan.findAll({
                include: [
                    {
                        model: Repayment,
                        as: 'repayments'
                    },
                    {
                        model: People,
                        as: 'borrower'
                    },
                    {
                        model: Guarantor,
                        as: 'guarantors',
                        include: [
                            {
                                model: People,
                                as: 'guarantor'
                            }
                        ]
                    }
                ]
            });


            res.json(unpaidLoans);
        } catch (err) {
            res.status(500).json({ error: 'שגיאה בשליפת הלוואות שלא שולמו' });
        }
    },

    // הלוואות שפג תוקפן
    GetOverdueLoans: async (req, res) => {
        try {
            // שולפים גם הלוואות עם סטטוס 'overdue' וגם 'partial'
            const loans = await Loan.findAll({
                where: {
                    status: { [Op.in]: ['partial', 'overdue'] }
                },
                include: [
                    {
                        model: Repayment,
                        as: 'repayments'
                    },
                    {
                        model: People,
                        as: 'borrower'
                    },
                    {
                        model: Guarantor,
                        as: 'guarantors',
                        include: [
                            {
                                model: People,
                                as: 'guarantor'
                            }
                        ]
                    }
                ]
            });

            res.json(loans);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'שגיאה בשליפת הלוואות בפיגור' });
        }
    },

    GetLoanStatusSummary: async (req, res) => {
        try {
            const { personId } = req.params;

            // כל ההלוואות של האדם כלווה
            const borrowerLoans = await Loan.findAll({
                where: { borrowerId: personId }
            });

            // מחלקים לפי סטטוס, עם איחוד של 'pending' ו-'partial'
            const borrowerLoansByStatus = {
                pendingOrPartial: [],
                paid: [],
                overdue: [],
                late_paid: [],
                PaidBy_Gauartantor: [],
            };

            borrowerLoans.forEach(loan => {
                const status = loan.status;
                if (status === 'pending' ) {
                    borrowerLoansByStatus.pendingOrPartial.push(loan);
                } 
                else if(status === 'partial'){
                    borrowerLoansByStatus['overdue'].push(loan);
                }else if (borrowerLoansByStatus[status]) {
                    borrowerLoansByStatus[status].push(loan);
                }
            });

            // כל ההלוואות שהאדם ערב להן
            const guarantorLinks = await Guarantor.findAll({
                where: { PeopleId: personId },
                include: [{
                    model: Loan,
                    required: true
                }]
            });

            const guarantorLoansByStatus = {
                overdue: [],
                late_paid: [],
            };

            guarantorLinks.forEach(link => {
                const loan = link.Loan;
                if (!loan) return;

                if (loan.status === 'overdue'||loan.status === 'partial') {
                    guarantorLoansByStatus.overdue.push(loan);
                } else if (loan.status === 'late_paid') {
                    guarantorLoansByStatus.late_paid.push(loan);
                }
            });

            res.json({
                borrower: borrowerLoansByStatus,
                guarantor: guarantorLoansByStatus
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },
    updateLoanStatusApi: async function (req, res) {
        try {
            const result = await controller.updateLoanStatuses();
            res.json(result);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },
    sendEmail: async function (req, res) {
        try {
            await sendEmail()
            console.log("Dsf")
            res.json("אימייל נשלח");
        } catch (e) {
            console.log("ert4", e)
            res.status(500).json({ error: e });
        }
    },
    updateLoanStatuses: async function () {
        const loans = await Loan.findAll({
            where: {
                status: { [Op.notIn]: ['paid'] },
            }
        });

        const today = moment();

        for (const loan of loans) {
            const repayments = await Repayment.findAll({
                where: { loanId: loan.id }
            });
            const totalPaid = repayments.reduce((sum, r) => sum + r.amount, 0);

            if (loan.repaymentType === 'monthly') {
                const startDate = moment(loan.startDate);
                const expectedDay = loan.repaymentDay || startDate.date();
                const firstDueDate = startDate.clone().add(1, 'month').date(expectedDay);
                let dueDate = firstDueDate.clone();

                // חישוב איחורים אמיתיים לפי תאריך
                const sortedRepayments = [...repayments].sort((a, b) =>
                    new Date(a.paidDate) - new Date(b.paidDate)
                );

                let lateMonths = 0;

                while (dueDate.isSameOrBefore(today, 'day')) {
                    const payment = sortedRepayments.find(r =>
                        moment(r.paidDate).isSameOrBefore(dueDate, 'day')
                    );

                    if (payment) {
                        // להסיר את התשלום הזה כדי שלא ייחשב שוב
                        const index = sortedRepayments.indexOf(payment);
                        if (index !== -1) sortedRepayments.splice(index, 1);
                    } else {
                        lateMonths++;
                    }

                    dueDate.add(1, 'month');
                }

                // חישוב סכום שהיה אמור להישלם
                const monthsDue = dueDate.diff(firstDueDate, 'months');
                const expectedAmount = monthsDue * loan.amountInMonth;
                const unpaidAmount = expectedAmount - totalPaid;

                // עדכון כמות איחורים רק אם השתנתה
                const shouldUpdateLateCount = lateMonths !== loan.lateCount;
                if (shouldUpdateLateCount) {
                    loan.lateCount = lateMonths;
                }

                let newStatus;
                if (lateMonths > 0 && totalPaid === 0) {
                    newStatus = 'overdue';
                } else if (totalPaid > 0 && totalPaid < expectedAmount) {
                    newStatus = 'partial';
                }
                else if (totalPaid == expectedAmount && loan.status !== 'PaidBy_Gauartantor' && lateMonths > 0) {
                    newStatus = 'late_paid';
                }
                else if (totalPaid == expectedAmount && loan.status !== 'PaidBy_Gauartantor' && lateMonths == 0 && loan.amount > totalPaid) {
                    newStatus = 'pending';
                }
                else if (totalPaid == expectedAmount && loan.status !== 'PaidBy_Gauartantor' && lateMonths == 0 && loan.amount == totalPaid) {
                    newStatus = 'paid';
                }
                else {
                    newStatus = loan.status;
                }

                const shouldUpdateStatus = loan.status !== newStatus;
                if (shouldUpdateLateCount || shouldUpdateStatus) {
                    loan.status = newStatus;
                    await loan.save();
                }

            } else if (loan.repaymentType === 'once') {
                const isOverdue = today.isAfter(loan.singleRepaymentDate);
                if (isOverdue && totalPaid === 0) {
                    newStatus = 'overdue';
                } else if (totalPaid > 0 && totalPaid < loan.amount && isOverdue) {
                    newStatus = 'partial';
                }
                else if (!isOverdue && totalPaid == loan.amount && loan.status !== 'PaidBy_Gauartantor') {
                    newStatus = 'paid';
                }
                else if (isOverdue && totalPaid == loan.amount && loan.status !== 'PaidBy_Gauartantor') {
                    newStatus = 'late_paid';
                }
                else if (!isOverdue && totalPaid !== loan.amount) {
                    newStatus = 'pending';
                }

                else {
                    newStatus = loan.status;
                }

                loan.lateCount = (newStatus == 'overdue' || newStatus == 'partial') ? 1 : 0;
                loan.status = newStatus;
                await loan.save();
            }
        }
    }




}
module.exports = controller;
