const { Card, CardOrder } = require('../models/index');

const createCard = async (req, res, next) => {
  const {
    params: { boardId },
    body: { title, subtitle, description, dDay },
  } = req;

  try {
    if (title.trim() === '' || !title) {
      res.status(400).json({
        ok: false,
        message: `Invalid title ${title}`,
      });
      return;
    }

    const newCard = await Card.create({
      title,
      subtitle: subtitle || null,
      description: description || null,
      dDay: dDay || null,
      boardId: +boardId,
    });

    const cardOrder = await CardOrder.findOne({
      where: {
        boardId,
      },
    });

    if (!cardOrder) {
      await CardOrder.create({
        order: newCard.id,
        boardId,
      });
    } else {
      if (cardOrder.order === '') {
        cardOrder.order = newCard.id;
      } else {
        cardOrder.order = `${cardOrder.order};${newCard.id}`;
      }
      await cardOrder.save();
    }

    const newCardRes = {
      id: newCard.id,
      title: newCard.title,
      dDay: newCard.dDay,
      status: newCard.status,
      check: newCard.check,
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

    const cardOrder = await CardOrder.findOne({
      where: {
        boardId,
      },
    });

    cardOrder.order = cardOrder.order
      .split(';')
      .filter((order) => order !== cardId)
      .join(';');
    await cardOrder.save();

    res.status(200).json({
      ok: true,
      message: 'Card deleted',
    });
  } catch (err) {
    next(err);
  }
};

const deleteAllCards = async (req, res, next) => {
  const { boardId } = req.params;

  try {
    const cards = await Card.findAll({
      where: {
        boardId,
      },
    });

    if (cards.length === 0) {
      res.status(400).json({
        ok: false,
        message: 'No cards to delete',
      });
      return;
    }

    await Card.destroy({
      where: {
        boardId,
      },
    });

    await CardOrder.update(
      {
        order: '',
      },
      {
        where: {
          boardId,
        },
      }
    );

    res.status(200).json({
      ok: true,
      message: 'Cards deleted',
    });
  } catch (err) {
    next(err);
  }
};

const modifyCardCheck = async (req, res, next) => {
  const { boardId, cardId } = req.params;

  try {
    const card = await Card.findOne({
      where: {
        id: cardId,
        boardId,
      },
    });

    if (!card) {
      res.status(404).json({
        ok: false,
        message: 'Card not found',
      });
      return;
    }

    card.check = !card.check;

    if (card.check) {
      card.status = 'finish';
    } else if (!card.check) {
      card.status = 'progress';
    }

    await card.save();

    res.status(200).json({
      ok: true,
      check: card.check,
    });
  } catch (err) {
    next(err);
  }
};

const modifyCardStatus = async (req, res, next) => {
  const {
    body: { status: cardStatus },
    params: { boardId, cardId },
  } = req;

  const statusArr = ['progress', 'hold', 'finish'];

  if (!statusArr.includes(cardStatus)) {
    res.status(400).json({
      ok: false,
      message: `Invalid input value: ${cardStatus}`,
    });
    return;
  }

  try {
    const card = await Card.findOne({
      where: {
        id: cardId,
        boardId,
      },
    });

    if (!card) {
      res.status(404).json({
        ok: false,
        message: 'Card not found',
      });
      return;
    }

    if (card.status === cardStatus) {
      res.status(400).json({
        ok: false,
        message: 'Status values are same',
      });
      return;
    }

    card.status = cardStatus;

    if (card.status === 'finish') {
      card.check = true;
    } else if (card.status === 'progress') {
      card.check = false;
    }

    await card.save();

    res.status(200).json({
      ok: true,
      changedStatus: card.status,
    });
  } catch (err) {
    next(err);
  }
};

const updateCardLocation = async (req, res, next) => {
  const {
    body: { start, end },
  } = req;

  try {
    if (start.boardId === end.boardId) {
      await CardOrder.update(
        {
          order: end.cards.join(';'),
        },
        {
          where: {
            boardId: end.boardId,
          },
        }
      );
    } else {
      await Promise.all([
        CardOrder.update(
          {
            order: start.cards.join(';'),
          },
          {
            where: {
              boardId: start.boardId,
            },
          }
        ),
        CardOrder.update(
          {
            order: end.cards.join(';'),
          },
          {
            where: {
              boardId: end.boardId,
            },
          }
        ),
        Card.update(
          {
            boardId: end.boardId,
          },
          {
            where: {
              id: end.cards,
            },
          }
        ),
      ]);
    }

    res.status(200).json({
      ok: true,
      start: start.cards,
      end: end.cards,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCard,
  deleteCard,
  deleteAllCards,
  modifyCardCheck,
  modifyCardStatus,
  updateCardLocation,
};
