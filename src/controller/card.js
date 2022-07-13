const { QueryTypes } = require('sequelize');
const {
  Board,
  Card,
  CardLabel,
  CardOrder,
  Comment,
  Image,
  Label,
  User,
  UserCard,
  Task,
  sequelize,
} = require('../models/index');
const { cardImageUploadFn, deleteCardImageFn } = require('../utils/image');
const { uninvitedMembersQuery } = require('../utils/query');

const createCard = async (req, res, next) => {
  const {
    userId,
    params: { boardId },
    body: { title },
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
      boardId: +boardId,
    });

    await UserCard.create({
      userId,
      cardId: newCard.id,
    });

    const board = await Board.findOne({
      where: {
        id: boardId,
      },
    });

    if (board.cardOrder === '') {
      board.cardOrder = newCard.id;
    } else {
      board.cardOrder = `${board.cardOrder};${newCard.id}`;
    }
    await board.save();

    res.status(201).json({
      ok: true,
      newCard: {
        id: newCard.id,
        title: newCard.title,
        status: newCard.status,
        check: newCard.check,
        createdAt: newCard.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

const deleteCard = async (req, res, next) => {
  const { boardId, cardId } = req.params;

  try {
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

    const board = await Board.findOne({
      where: {
        id: boardId,
      },
    });

    const regex = new RegExp(`${cardId};|;${cardId}`, 'g');
    board.cardOrder = board.cardOrder.replace(regex, '');
    await board.save();

    res.status(200).json({
      ok: true,
      message: 'Card deleted',
      newCardOrder: board.cardOrder.split(';'),
    });
  } catch (err) {
    next(err);
  }
};

const deleteCardImage = async (req, res, next) => {
  const { cardId, imgId } = req.params;

  try {
    const image = await Image.findOne({
      where: {
        id: imgId,
        cardId,
      },
    });

    if (!image) {
      res.status(400).json({
        ok: false,
        message: 'Image not found',
      });
      return;
    }

    const deletedCardImageCount = await Image.destroy({
      where: {
        id: imgId,
        cardId,
      },
    });

    if (deletedCardImageCount === 0) {
      res.status(400).json({
        ok: false,
        message: 'Card image not deleted',
      });
      return;
    }

    await deleteCardImageFn(cardId, image.url);

    res.status(200).json({
      ok: true,
      message: 'Card image deleted',
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

const deleteUserInCard = async (req, res, next) => {
  const { cardId, userId } = req.params;

  try {
    const deletedCount = await UserCard.destroy({
      where: {
        userId,
        cardId,
      },
    });

    if (deletedCount === 0) {
      res.status(400).json({
        ok: false,
        message: 'Cannot delete user in card',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      message: 'Delete user from card complete',
    });
  } catch (err) {
    next(err);
  }
};

const getUninvitedMembers = async (req, res, next) => {
  const { projectId, cardId } = req.params;

  try {
    const uninvitedMembers = await sequelize.query(uninvitedMembersQuery, {
      type: QueryTypes.SELECT,
      replacements: [projectId, cardId],
    });

    res.status(200).json({
      ok: true,
      members: uninvitedMembers,
    });
  } catch (err) {
    next(err);
  }
};

const inputCardDetails = async (req, res, next) => {
  const {
    body: { title, subtitle, description, dDay },
    params: { cardId },
  } = req;

  try {
    const card = await Card.findOne({
      where: {
        id: cardId,
      },
    });

    if (!card) {
      res.status(404).json({
        ok: false,
        message: 'Card not found',
      });
      return;
    }

    card.title = title || card.title;
    card.subtitle = subtitle || card.subtitle;
    card.description = description || card.description;
    card.dDay = dDay || card.dDay;
    await card.save();

    res.status(200).json({
      ok: true,
      cardDetail: {
        title: card.title,
        subtitle: card.subtitle,
        description: card.description,
        dDay: card.dDay,
      },
    });
  } catch (err) {
    next(err);
  }
};

const inputCardImages = async (req, res, next) => {
  const {
    files,
    params: { cardId },
  } = req;

  try {
    const fileUrl = await Promise.all(
      files.map((file) => cardImageUploadFn(cardId, file))
    );

    const images = await Image.bulkCreate(fileUrl);

    res.status(200).json({
      ok: true,
      images,
    });
  } catch (err) {
    next(err);
  }
};

const inviteUser = async (req, res, next) => {
  const {
    body: { members },
    params: { cardId },
  } = req;

  try {
    const newMemberArray = [];

    members.forEach((memberId) => {
      newMemberArray.push({
        userId: memberId,
        cardId,
      });
    });

    await UserCard.bulkCreate(newMemberArray);

    res.status(200).json({
      ok: true,
      message: 'Add members',
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
      status: card.status,
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
    } else if (card.status === 'progress' || card.status === 'hold') {
      card.check = false;
    }

    await card.save();

    res.status(200).json({
      ok: true,
      changedStatus: card.status,
      check: card.check,
    });
  } catch (err) {
    next(err);
  }
};

const loadCardData = async (req, res, next) => {
  const { cardId } = req.params;

  try {
    const card = await Card.findOne({
      include: [
        {
          model: UserCard,
          as: 'users',
          attributes: ['userId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'profileImage'],
            },
          ],
        },
        {
          model: CardLabel,
          as: 'cardLabels',
          include: [
            {
              model: Label,
              as: 'label',
              attributes: ['id', 'title', 'color'],
            },
          ],
        },
        {
          model: Image,
          as: 'images',
          attributes: ['id', 'url'],
        },
        {
          model: Task,
          as: 'tasks',
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id', 'content', 'createdAt'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'profileImage', 'name'],
            },
          ],
        },
      ],
      where: {
        id: cardId,
      },
      order: [
        [
          {
            model: Image,
            as: 'images',
          },
          'id',
          'DESC',
        ],
      ],
    });

    if (!card) {
      res.status(404).json({
        ok: false,
        message: 'Card not found',
      });
    }

    const cardInfo = {
      id: card.id,
      title: card.title,
      subtitle: card.subtitle,
      description: card.description,
      dDay: card.dDay,
      status: card.status,
      check: card.check,
      createdAt: card.createdAt,
      boardId: card.boardId,
    };

    res.status(200).json({
      ok: true,
      card: cardInfo,
      labels: card.cardLabels.map((cardLabel) => cardLabel.label),
      users: card.users.map((value) => value.user),
      images: card.images,
      tasks: card.tasks,
      comment: card.comments,
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
  deleteCardImage,
  deleteAllCards,
  deleteUserInCard,
  getUninvitedMembers,
  inputCardDetails,
  inputCardImages,
  inviteUser,
  modifyCardCheck,
  modifyCardStatus,
  loadCardData,
  updateCardLocation,
};
