const { Label } = require('../models/index');

const createLabel = async (req, res, next) => {
  const {
    body: { title, color },
    params: { projectId },
  } = req;

  try {
    const colorList = [
      'red',
      'pink',
      'orange',
      'yellow',
      'emerald_green',
      'green',
    ];

    if (!colorList.includes(color)) {
      res.status(400).json({
        ok: false,
        message: 'Color is not correct',
      });
      return;
    }

    await Label.create({
      title,
      color,
      projectId,
    });

    res.status(200).json({
      ok: true,
      message: 'Label created',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLabel,
};
