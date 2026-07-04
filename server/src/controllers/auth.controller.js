const authService = require('../services/auth.service');

const login = async (req, res) => {
  const { email, password, deviceFingerprint } = req.body;
  const result = await authService.loginUser(email, password, deviceFingerprint);
  
  res.status(200).json({
    success: true,
    data: result
  });
};

module.exports = { login };
