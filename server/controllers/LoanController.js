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
const Turn = require('../models/Turns')
const Deposit = require('../models/Deposit')
const { app } = require('electron');

const baseUploadPath = path.join(app.getPath('userData'), 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(baseUploadPath)) {
            fs.mkdirSync(baseUploadPath, { recursive: true });
        }
        cb(null, baseUploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });
const controller = {
    UpdateLoan: async (req, res) => {
        upload.any()(req, res, async (err) => {
            if (err) return res.status(400).json({ error: 'File upload error', details: err.message });

            const oldPathsToDelete = [];

            try {
                const { id } = req.params;
                const {
                    borrowerId, amount, startDate, notes, repaymentType,
                    repaymentDay, singleRepaymentDate, amountInMonth,
                    numOfLoan, typeOfPayment, currency, amountOfPament
                } = req.body;

                const guarantors = JSON.parse(req.body.guarantors || '[]');

                const loan = await Loan.findByPk(id);
                if (!loan) return res.status(404).json({ error: 'Loan not found' });

                // עדכון תנועת קרן במידה והסכום השתנה
                if (loan.amount != amount) {
                    const existingMovement = await FundMovement.findOne({
                        where: { personId: loan.borrowerId, date: loan.startDate },
                    });
                    if (existingMovement) await existingMovement.update({ amount, typeOfPayment, currency });
                }

                if (loan.documentPath) oldPathsToDelete.push(path.join(baseUploadPath, loan.documentPath));

                await loan.update({
                    borrowerId, amount, startDate, notes,
                    repaymentType, repaymentDay, singleRepaymentDate,
                    amountInMonth, numOfLoan, typeOfPayment, currency, amountOfPament
                });

                // עדכון קובץ הלוואה
                const loanFile = req.files.find(f => f.fieldname === 'loanDocument');
                if (loanFile) {
                    const loanPath = path.join(baseUploadPath, 'loans', `${loan.id}`);
                    if (!fs.existsSync(loanPath)) fs.mkdirSync(loanPath, { recursive: true });

                    const newPath = path.join(loanPath, path.basename(loanFile.path));
                    fs.renameSync(loanFile.path, newPath);

                    // שמירה ב-DB כנתיב יחסי
                    const relativePath = path.join('loans', `${loan.id}`, path.basename(loanFile.path)).replace(/\\/g, '/');
                    await loan.update({ documentPath: relativePath });
                } else if (!req.body.documentPath || req.body.documentPath === 'null') {
                    await loan.update({ documentPath: null });
                }

                // מחיקת הערבים הקיימים והוספתם מחדש
                const oldGuarantors = await Guarantor.findAll({ where: { loanId: loan.id } });
                for (const g of oldGuarantors) {
                    if (g.documentPath) oldPathsToDelete.push(path.join(baseUploadPath, g.documentPath));
                }
                await Guarantor.destroy({ where: { loanId: loan.id } });

                for (let i = 0; i < guarantors.length; i++) {
                    const g = guarantors[i];
                    const file = req.files.find(f => f.fieldname === `document${i}`);
                    let finalDocumentPath = null;

                    if (file) {
                        const guarantorPath = path.join(baseUploadPath, 'loans', `${loan.id}`, 'guarantors', `${i}`);
                        if (!fs.existsSync(guarantorPath)) fs.mkdirSync(guarantorPath, { recursive: true });

                        const newPath = path.join(guarantorPath, path.basename(file.path));
                        fs.renameSync(file.path, newPath);

                        // שמירה ב-DB כנתיב יחסי
                        finalDocumentPath = path.join('loans', `${loan.id}`, 'guarantors', `${i}`, path.basename(file.path)).replace(/\\/g, '/');
                    }

                    await Guarantor.create({ loanId: loan.id, PeopleId: g.PeopleId, documentPath: finalDocumentPath });
                }

                // מחיקת קבצים ישנים
                for (const oldPath of oldPathsToDelete) {
                    try { fs.unlinkSync(oldPath); } catch (unlinkErr) { console.warn(`Unable to delete old file: ${oldPath}`, unlinkErr.message); }
                }

                res.json({ loan, message: 'Loan updated successfully with new documents and guarantors' });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error', details: err.message });
            }
        });
    },
    CreateLoan: async (req, res) => {
        upload.any()(req, res, async (err) => {
            if (err) return res.status(400).json({ error: 'File upload error', details: err.message });

            try {
                const {
                    borrowerId, amount, startDate, notes, repaymentType,
                    repaymentDay, singleRepaymentDate, amountInMonth,
                    numOfLoan, typeOfPayment, currency, amountOfPament
                } = req.body;

                const guarantors = JSON.parse(req.body.guarantors || '[]');

                // יצירת הלוואה חדשה
                const newLoan = await Loan.create({
                    borrowerId,
                    status: 'pending',
                    notes,
                    amount,
                    startDate,
                    repaymentType,
                    repaymentDay,
                    singleRepaymentDate,
                    amountInMonth,
                    numOfLoan,
                    typeOfPayment,
                    currency,
                    amountOfPament
                });

                // מחיקת Turns קיימים אם יש
                await Turn.destroy({ where: { id: newLoan.id } });

                // שמירת קובץ ההלוואה
                const loanFile = req.files.find(f => f.fieldname === 'loanDocument');
                if (loanFile) {
                    const loanFolder = path.join(baseUploadPath, 'loans', `${newLoan.id}`);
                    if (!fs.existsSync(loanFolder)) fs.mkdirSync(loanFolder, { recursive: true });

                    const newFileName = path.basename(loanFile.path);
                    const newPath = path.join(loanFolder, newFileName);
                    fs.renameSync(loanFile.path, newPath);

                    // שמירה ב-DB כנתיב יחסי
                    const relativePath = path.join('loans', `${newLoan.id}`, newFileName);
                    await Loan.update({ documentPath: relativePath }, { where: { id: newLoan.id } });
                }

                // שמירת קבצי הערבים
                for (let i = 0; i < guarantors.length; i++) {
                    const file = req.files.find(f => f.fieldname === `document${i}`);
                    if (file) {
                        const guarantorFolder = path.join(baseUploadPath, 'loans', `${newLoan.id}`, 'guarantors', `${i}`);
                        if (!fs.existsSync(guarantorFolder)) fs.mkdirSync(guarantorFolder, { recursive: true });

                        const newFileName = path.basename(file.path);
                        const newPath = path.join(guarantorFolder, newFileName);
                        fs.renameSync(file.path, newPath);

                        // שמירה ב-DB כנתיב יחסי
                        const relativePath = path.join('loans', `${newLoan.id}`, 'guarantors', `${i}`, newFileName);
                        await Guarantor.update({ documentPath: relativePath }, { where: { id: guarantors[i].id } });
                    }
                }

                res.json({ message: 'Loan created successfully', loanId: newLoan.id });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    },
    GetAllLoans: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1; // מספר הדף הנוכחי
            const limit = parseInt(req.query.limit) || 20; // מספר הרשומות בדף
            const offset = (page - 1) * limit;

            const { count, rows } = await Loan.findAndCountAll({
  include: [{ model: People, as: 'borrower' }],
  offset,
  limit,
  order: [['startDate', 'DESC']],
  raw: true,
  nest: true
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



    GetLoanById: async (req, res) => {
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
    getMonthlyChecks: async (req, res) => {
        try {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            const startOfMonth = new Date(currentYear, currentMonth, 1);
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

            const results = [];

            // === חלק 1: הלוואות ===
            const loans = await Loan.findAll({
                where: {
                    typeOfPayment: 'check',
                    status: { [Op.not]: 'paid' },
                    [Op.or]: [
                        {
                            repaymentType: 'once',
                            singleRepaymentDate: { [Op.between]: [startOfMonth, endOfMonth] },
                        },
                        {
                            repaymentType: 'monthly',
                            repaymentDay: { [Op.ne]: null },
                        },
                    ],
                },
                include: [
                    {
                        model: People,
                        as: 'borrower',
                        attributes: ['id', 'fullName'],
                    },
                ],
            });

            for (const loan of loans) {
                let repaymentDate;

                if (loan.repaymentType === 'monthly') {
                    repaymentDate = new Date(currentYear, currentMonth, loan.repaymentDay || 1);
                } else if (loan.repaymentType === 'once') {
                    repaymentDate = new Date(loan.singleRepaymentDate);
                }

                const isDue =
                    repaymentDate.getMonth() === currentMonth &&
                    repaymentDate.getFullYear() === currentYear;
                if (isDue) {
                    results.push({
                        source: 'loan',
                        loanId: loan.id,
                        amount: loan.amountInMonth,
                        repaymentDate: repaymentDate.toISOString().split('T')[0],
                        personId: loan.borrower?.id,
                        fullName: loan.borrower?.fullName,
                    });
                }
            }

            const deposits = await Deposit.findAll({
                where: {
                    typeOfPayment: 'check',
                    date: { [Op.between]: [startOfMonth, endOfMonth] },
                },
                include: [
                    {
                        model: People,
                        as: 'person',
                        attributes: ['id', 'fullName'],
                    },
                ],
            });

            for (const dep of deposits) {
                results.push({
                    source: 'deposit',
                    depositId: dep.id,
                    amount: dep.amount,
                    repaymentDate: dep.date,
                    personId: dep.PeopleId,
                    fullName: dep.person?.fullName,
                });
            }

            // === חלק 3: תרומות עם צ'ק ===
            const donations = await FundMovement.findAll({
                where: {
                    type: {
                        [Op.in]: ['donation', 'manual_adjustment'],
                    },
                    typeOfPayment: 'check',
                    date: {
                        [Op.between]: [startOfMonth, endOfMonth],
                    },
                },
                include: [
                    {
                        model: People,
                        as: 'person',
                        attributes: ['id', 'fullName'],
                    },
                ],
            });

            for (const don of donations) {
                results.push({
                    source: 'donation',
                    donationId: don.id,
                    amount: don.amount,
                    repaymentDate: don.date,
                    type: don.type,
                    personId: don.personId,
                    fullName: don.person?.fullName,
                });
            }

            results.sort((a, b) => new Date(a.repaymentDate) - new Date(b.repaymentDate));

            return res.json({ checksThisMonth: results });
        } catch (error) {
            console.error('Error in getMonthlyChecks:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
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

            const borrowerLoans = await Loan.findAll({
                where: { borrowerId: personId }
            });

            const borrowerLoansByStatus = {
                pendingOrPartial: [],
                paid: [],
                overdue: [],
                late_paid: [],
                PaidBy_Gauartantor: [],
            };

            borrowerLoans.forEach(loan => {
                const status = loan.status;
                if (status === 'pending') {
                    borrowerLoansByStatus.pendingOrPartial.push(loan);
                }
                else if (status === 'partial') {
                    borrowerLoansByStatus['overdue'].push(loan);
                } else if (borrowerLoansByStatus[status]) {
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

                if (loan.status === 'overdue' || loan.status === 'partial') {
                    guarantorLoansByStatus.overdue.push(loan);
                } else if (loan.status === 'late_paid') {
                    guarantorLoansByStatus.late_paid.push(loan);
                }
            });

            res.json({
                borrower: borrowerLoansByStatus,
                guarantor: guarantorLoansByStatus,
                guarantorCount: guarantorLinks.length
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
            res.json("אימייל נשלח");
        } catch (e) {
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

                const sortedRepayments = [...repayments].sort((a, b) =>
                    new Date(a.paidDate) - new Date(b.paidDate)
                );

                let lateMonths = 0;

                while (dueDate.isSameOrBefore(today, 'day')) {
                    const payment = sortedRepayments.find(r =>
                        moment(r.paidDate).isSameOrBefore(dueDate, 'day')
                    );

                    if (payment) {
                        const index = sortedRepayments.indexOf(payment);
                        if (index !== -1) sortedRepayments.splice(index, 1);
                    } else {
                        lateMonths++;
                    }

                    dueDate.add(1, 'month');
                }

                const monthsDue = dueDate.diff(firstDueDate, 'months');
                const expectedAmount = monthsDue * loan.amountInMonth;
                const unpaidAmount = expectedAmount - totalPaid;

                const shouldUpdateLateCount = lateMonths !== loan.lateCount;
                if (shouldUpdateLateCount) {
                    loan.lateCount = lateMonths;
                }
                let newStatus;
                if (lateMonths > 0 && totalPaid === 0) {
                    newStatus = 'overdue';
                } else if (totalPaid > 0 && totalPaid < expectedAmount && lateMonths > 0) {
                    newStatus = 'partial';
                }
                else if (totalPaid >= expectedAmount && loan.amount > totalPaid) {
                    newStatus = 'pending';
                }
                else if (totalPaid >= expectedAmount && loan.status !== 'PaidBy_Gauartantor' && lateMonths > 0) {
                    newStatus = 'late_paid';
                }
                else if (totalPaid >= expectedAmount && loan.status !== 'PaidBy_Gauartantor' && lateMonths == 0 && loan.amount == totalPaid) {
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

            } else {
                const isOverdue = today.isAfter(loan.singleRepaymentDate);
                if (isOverdue && totalPaid === 0) {
                    newStatus = 'overdue';
                } else if (totalPaid > 0 && totalPaid < loan.amount && isOverdue) {
                    newStatus = 'partial';
                }
                else if (!isOverdue && totalPaid >= loan.amount && loan.status !== 'PaidBy_Gauartantor') {
                    newStatus = 'paid';
                }
                else if (isOverdue && totalPaid >= loan.amount && loan.status !== 'PaidBy_Gauartantor') {
                    newStatus = 'late_paid';
                }
                else if (!isOverdue && totalPaid !== loan.amount) {
                    newStatus = 'pending';
                }

                else {
                    newStatus = loan.status;
                }

                loan.lateCount = (newStatus == 'overdue' || newStatus == 'partial' || newStatus == 'late_paid') ? 1 : 0;
                loan.status = newStatus;
                await loan.save();
            }
        }
    }

    ,


}
module.exports = controller;
