const { success, error } = require('../utils/response');
const settingsService = require('../services/settingsService');

const getSettings = async (req, res) => {
  try {
    const data = await settingsService.getSettings();
    return success(res, data);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const updateSettings = async (req, res) => {
  try {
    const data = await settingsService.updateSettings(req.body);
    return success(res, data, 'Paramètres enregistrés');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getSettings, updateSettings };
