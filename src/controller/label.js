const { CardLabel, Label } = require('../models/index');

const addCardLabel = async (req, res, next) => {
  const {
    body: { labelId },
    params: { cardId },
  } = req;

  try {
    await CardLabel.create({
      cardId,
      labelId,
    });

    const label = await Label.findOne({
      where: {
        id: labelId,
      },
      attributes: ['id', 'title', 'color'],
    });

    res.status(200).json({
      ok: true,
      label,
    });
  } catch (err) {
    next(err);
  }
};

const createCommonLabel = async (req, res, next) => {
  const {
    body: { title, color },
    params: { projectId, cardId },
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

    await CardLabel.create({
      cardId,
      labelId: newLabel.id,
    });

    res.status(200).json({
      ok: true,
      label: newLabel,
    });
  } catch (err) {
    next(err);
  }
};

const deleteCommonLabel = async (req, res, next) => {
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

const deleteCardLabel = async (req, res, next) => {
  const { cardId, labelId } = req.params;

  try {
    const deletedCardLabelCount = await CardLabel.destroy({
      where: {
        cardId,
        labelId,
      },
    });

    if (deletedCardLabelCount === 0) {
      res.status(400).json({
        ok: false,
        message: 'Card label not deleted',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      message: 'Card label deleted',
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
  addCardLabel,
  createCommonLabel,
  deleteCommonLabel,
  deleteCardLabel,
  getLabels,
};
