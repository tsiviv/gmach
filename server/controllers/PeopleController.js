const People = require('../models/People');
const Guarantor = require('../models/Guarantor');
const Loan = require('../models/Loan');
const FundMovement = require('../models/FundMovement');
const Repayment =require('../models/Repayment')
module.exports = {
  // קבלת כל האנשים
  GetAllPeople: async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const { rows, count } = await People.findAndCountAll({
            offset,
            limit,
            order: [['createdAt', 'DESC']], 
        });

        res.json({
            data: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
},


  // קבלת אדם לפי ID
  GetPersonById: async (req, res) => {
    try {
      const { id } = req.params;
      const person = await People.findByPk(id);
      res.json(person);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // קבלת הלוואות של אדם מסוים כולל ערבויות
  GetLoansByPerson: async (req, res) => {
    try {
      const { id } = req.params;
      const loans = await Loan.findAll({
        where: { borrowerId: id },
        include: [
          {
            model: People,
            as: 'borrower',
            attributes: ['fullName']
          },
          {
            model: Repayment,
            as: 'repayments'
        },
          {
            model: Guarantor,
            as: 'guarantors',
            include: [
              {
                model: People,
                as: 'guarantor',
                attributes: ['fullName']
              }
            ]
          }
        ]
      });
      res.json(loans);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // יצירת אדם חדש
  CreatePerson: async (req, res) => {
    try {
      const { id, fullName, phone, address, email, notes } = req.body;
      const IsPerson = await People.findByPk(id);
      if (IsPerson)
        res.status(404).json("איש כבר קיים");
      const person = await People.create({ id, fullName, phone, address, email, notes });
      res.status(201).json(person);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  GetLoansByGuarantor: async (req, res) => {
    try {
      const { id } = req.params;
      const guarantorLoans = await Guarantor.findAll({
        where: { PeopleId: id },
        include: [
          {
            model: Loan, 
            include: [
              {
                model: People,
                as: 'borrower',
                attributes: ['fullName']
              }
            ]
          }
        ]
      });



      res.json(guarantorLoans);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  
  // עדכון פרטי אדם
  UpdatePerson: async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, phone, address, email, notes } = req.body;
      const [updated] = await People.update(
        { fullName, phone, address, email, notes },
        { where: { id } }
      );
      if (!updated) return res.status(404).json({ error: 'לקוח אינו קיים' });
      const updatedPerson = await People.findByPk(id);
      res.json(updatedPerson);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // מחיקת אדם
  DeletePerson: async (req, res) => {
    try {
      const { id } = req.params;

      // מציאת כל הערבים כדי למחוק את הקבצים שלהם
      const guarantors = await Guarantor.findAll({ where: { PeopleId: id } });
      for (const g of guarantors) {
        if (g.documentPath && fs.existsSync(g.documentPath)) {
          try {
            fs.unlinkSync(g.documentPath);
          } catch (e) {
            console.warn(`Failed to delete guarantor document: ${g.documentPath}`, e.message);
          }
        }
      }

      // מחיקת הערבים מה־DB
      await Guarantor.destroy({ where: { PeopleId: id } });

      // מחיקת כל ההלוואות של אותו אדם כולל המסמכים שלהן
      const loans = await Loan.findAll({ where: { borrowerId: id } });
      for (const loan of loans) {
        // מחיקת מסמכים
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
        const existingMovement = await FundMovement.findOne({
          where: {
              personId: loan.personId,
              type: 'loan_given',
              date: loan.date, // שים לב שהפורמט חייב להיות תואם ל-YYYY-MM-DD
          },
      });
  
      if (existingMovement) {
          await FundMovement.destroy({ where: { id: existingMovement.id } });
          console.log('עודכנה תנועת קרן קיימת');
      } else {
          console.log('לא נמצאה תנועת קרן מתאימה לעדכון');
      }
      }

      await Loan.destroy({ where: { borrowerId: id } });

      const deleted = await People.destroy({ where: { id } });
      if (!deleted) return res.status(404).json({ error: 'Person not found' });

      res.json({ success: true });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  }
};
