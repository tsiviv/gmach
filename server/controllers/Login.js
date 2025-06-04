const { generateToken } = require('../middleware/GenerateToken')

module.exports = {
  login:async (req, res) => {
    const token = await generateToken({ id: 123 });
    res.send({ token });
  }
}
