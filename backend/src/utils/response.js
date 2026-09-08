const success = (res, data, message = 'Succès', status = 200) => {
  res.status(status).json({ success: true, message, data });
};

const error = (res, message = 'Erreur', status = 400, data = null) => {
  const body = { success: false, message };
  if (data) body.data = data;
  res.status(status).json(body);
};

module.exports = { success, error };
