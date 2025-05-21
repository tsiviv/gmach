const People = require('../models/People');

exports.GetAllPeople = async (req, res) => {
    try {
        const AllOrder = await People.find();
        res.status(201).json(AllOrder);

    } catch (error) {
        console.error('Error getting all Goods:', error);
        res.status(500).json({ status: 'error', message: 'Server error during getting Goods', details: error.message });
    }
};