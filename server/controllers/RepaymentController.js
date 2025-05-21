const Repayment = require('../models/Repayment');

exports.GetAllRepayments = async (req, res) => {
    try {
        const AllOrder = await Repayment.find();
        res.status(201).json(AllOrder);

    } catch (error) {
        console.error('Error getting all Goods:', error);
        res.status(500).json({ status: 'error', message: 'Server error during getting Goods', details: error.message });
    }
};