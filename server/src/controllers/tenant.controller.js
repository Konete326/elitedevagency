const Tenant = require('../models/Tenant');

const getTenantSettings = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const tenant = await Tenant.findById(tenantId)
      .select('easyPaisaName easyPaisaNumber jazzCashName jazzCashNumber bankName bankIban businessName')
      .lean();
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
};

const updateTenantSettings = async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { easyPaisaName, easyPaisaNumber, jazzCashName, jazzCashNumber, bankName, bankIban } = req.body;

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        easyPaisaName: easyPaisaName || "",
        easyPaisaNumber: easyPaisaNumber || "",
        jazzCashName: jazzCashName || "",
        jazzCashNumber: jazzCashNumber || "",
        bankName: bankName || "",
        bankIban: bankIban || ""
      },
      { new: true, runValidators: true }
    );

    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTenantSettings,
  updateTenantSettings
};
