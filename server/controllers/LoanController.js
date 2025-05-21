const  Loan  = require('../models/Loan');

exports.GetAllLoans = async (req, res) => {
    try {
        const AllOrder = await Loan.find();
        res.status(201).json(  AllOrder );

    } catch (error) {
        console.error('Error getting all Goods:', error);
        res.status(500).json({ status: 'error', message: 'Server error during getting Goods', details: error.message });
    }
};