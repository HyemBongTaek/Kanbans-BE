const { Card } = require('../models/index');

const createCard = async (req, res, next) => {
  const {
    params: { boardId },
    body: { title, subtitle, description, dDay },
  } = req;

  try {
    const newCard = await Card.create({
      title,
      subtitle: subtitle || null,
      description: description || null,
      dDay: dDay || null,
      boardId: +boardId,
    });

    const newCardRes = {
      cardId: newCard.id,
      title: newCard.title,
      subtitle: newCard.subtitle,
      description: newCard.description,
      dDay: newCard.dDay,
      boardId: newCard.boardId,
      createdAt: newCard.createdAt.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
      }),
    };

    res.status(201).json({
      ok: true,
      newCard: newCardRes,
    });
  } catch (err) {
    next(err);
  }
};

const deleteCard = async (req, res, next) => {
  const { boardId, cardId } = req.params;

  try {
    const card = await Card.findOne({
      where: {
        id: +cardId,
        boardId: +boardId,
      },
    });

    if (!card) {
      res.status(404).json({
        ok: false,
        message: 'Card not found',
      });
      return;
    }

    const deleteCardCount = await Card.destroy({
      where: {
        id: +cardId,
        boardId: +boardId,
      },
    });

    if (deleteCardCount === 0) {
      res.status(400).json({
        ok: false,
        message: 'Card not deleted',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      message: 'Card deleted',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCard,
  deleteCard,
};
