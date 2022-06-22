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

    const newLabel = await Label.create({
      title,
      color,
      projectId,
    });

    res.status(200).json({
      ok: true,
      label: newLabel,
    });
  } catch (err) {
    next(err);
  }
};

const deleteLabel = async (req, res, next) => {
  const { projectId, labelId } = req.params;

  try {
    const deletedLabelCount = await Label.destroy({
      where: {
        id: labelId,
        projectId,
      },
    });

    if (deletedLabelCount === 0) {
      res.status(400).json({
        ok: false,
        message: 'Label not deleted',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      message: 'Label deleted',
    });
  } catch (err) {
    next(err);
  }
};

const getLabels = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const labels = await Label.findAll({
      where: {
        projectId,
      },
      attributes: ['id', 'title', 'color'],
    });

    res.status(200).json({
      ok: true,
      labels,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLabel,
  deleteLabel,
  getLabels,
};
