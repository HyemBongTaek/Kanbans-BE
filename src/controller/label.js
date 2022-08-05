const { CardLabel, Label } = require('../models/index');
const { getBytes, findNumericId } = require('../utils/service');

const addCardLabel = async (req, res, next) => {
  const {
    body: { labelId },
    params: { cardId },
  } = req;

  const numericCardId = findNumericId(cardId, 'card');

  try {
    const labelIdObj = labelId.map((id) => ({
      cardId: numericCardId,
      labelId: id,
    }));

    await CardLabel.bulkCreate(labelIdObj);

    const label = await Label.findAll({
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

  const charBytes = getBytes(title);

  if (charBytes > 10) {
    res.status(400).json({
      ok: false,
      message: `Title is too long (Length: ${charBytes})`,
    });
    return;
  }

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

  try {
    const newLabel = await Label.create({
      title,
      color,
      projectId,
    });

    await CardLabel.create({
      cardId: findNumericId(cardId, 'card'),
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
        cardId: findNumericId(cardId, 'card'),
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
