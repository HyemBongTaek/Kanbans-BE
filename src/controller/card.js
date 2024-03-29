const { QueryTypes } = require('sequelize');
const {
  Board,
  Card,
  CardLabel,
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
const { findNumericId } = require('../utils/service');
const { protectDuplicatedSubmit } = require('../utils/redis');

const createCard = async (req, res, next) => {
  const {
    user: { id: userId },
    params: { boardId },
    body: { title },
  } = req;

  const numericBoardId = findNumericId(boardId, 'board');

  try {
    if (title.trim() === '' || !title) {
      res.status(400).json({
        ok: false,
        message: `유효하지 않는 값입니다. 현재입력값: ${title}`,
      });
      return;
    }

    const newCard = await Card.create({
      title,
      boardId: numericBoardId,
    });

    await UserCard.create({
      userId,
      cardId: newCard.id,
    });

    const board = await Board.findOne({
      where: {
        id: numericBoardId,
      },
    });

    if (board.cardOrder === '') {
      board.cardOrder = `C${newCard.id}`;
    } else {
      board.cardOrder = `${board.cardOrder};C${newCard.id}`;
    }
    await board.save();

    const { profileImage } = await User.findOne({
      where: {
        id: userId,
      },
      attributes: ['profileImage'],
    });

    // const cardOrder = await getCardOrder(boardId);
    //
    // if (cardOrder === null) {
    //   const board = await Board.findOne({
    //     where: {
    //       id: boardId,
    //     },
    //   });
    //   if (board.cardOrder === '') {
    //     await setCardOrder(boardId, `${newCard.id}`);
    //   } else {
    //     await setCardOrder(boardId, `${board.cardOrder};${newCard.id}`);
    //   }
    // } else if (cardOrder === '') {
    //   await setCardOrder(boardId, `${newCard.id}`);
    // } else {
    //   await setCardOrder(boardId, `${cardOrder};${newCard.id}`);
    // }

    res.status(201).json({
      ok: true,
      newCard: {
        id: `C${newCard.id}`,
        boardId: `B${newCard.boardId}`,
        title: newCard.title,
        status: newCard.status,
        check: newCard.check,
        createdAt: newCard.createdAt,
        user: {
          id: userId,
          profileImage,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const deleteCard = async (req, res, next) => {
  const { boardId, cardId } = req.params;

  const numericCardId = findNumericId(cardId, 'card');
  const numericBoardId = findNumericId(boardId, 'board');

  try {
    // 카드 이미지 URL 검색
    const cardImages = await Image.findAll({
      where: {
        cardId: numericCardId,
      },
    });

    if (cardImages.length >= 1) {
      await Promise.allSettled(
        cardImages.map(({ url }) => deleteCardImageFn(cardId, url))
      );
    }

    const deleteCardCount = await Card.destroy({
      where: {
        id: numericCardId,
      },
    });

    if (deleteCardCount === 0) {
      res.status(400).json({
        ok: false,
        message: '삭제된 카드가 없습니다.',
      });
      return;
    }

    const regex = new RegExp(`${cardId};|;${cardId}|${cardId}`, 'g');

    const board = await Board.findOne({
      where: {
        id: numericBoardId,
      },
    });
    board.cardOrder = board.cardOrder.replace(regex, '');
    await board.save();

    // const cardOrder = await getCardOrder(boardId);
    //
    // if (!cardOrder) {
    //   const board = await Board.findOne({
    //     where: {
    //       id: boardId,
    //     },
    //   });
    //   await setCardOrder(boardId, board.cardOrder.replace(regex, ''));
    // } else {
    //   await setCardOrder(boardId, cardOrder.replace(regex, ''));
    // }

    res.status(200).json({
      ok: true,
      message: '카드가 정상적으로 삭제되었습니다.',
      cardId,
    });
  } catch (err) {
    next(err);
  }
};

const deleteCardImage = async (req, res, next) => {
  const { cardId, imgId } = req.params;

  const numericCardId = findNumericId(cardId, 'card');

  try {
    const image = await Image.findOne({
      where: {
        id: imgId,
        cardId: numericCardId,
      },
    });

    if (!image) {
      res.status(400).json({
        ok: false,
        message: '이미지가 없습니다.',
      });
      return;
    }

    const deletedCardImageCount = await Image.destroy({
      where: {
        id: imgId,
        cardId: numericCardId,
      },
    });

    if (deletedCardImageCount === 0) {
      res.status(400).json({
        ok: false,
        message: '삭제할 이미지가 없습니다.',
      });
      return;
    }

    await deleteCardImageFn(cardId, image.url);

    res.status(200).json({
      ok: true,
      message: '이미지가 정상적으로 삭제되었습니다.',
    });
  } catch (err) {
    next(err);
  }
};

const deleteAllCards = async (req, res, next) => {
  const {
    body: { cardIds: deletedCardIds },
    params: { boardId },
  } = req;

  if (deletedCardIds.length === 0) {
    res.status(400).json({
      ok: false,
      message: '삭제할 카드가 없습니다.',
    });
    return;
  }

  try {
    // 레디스에 카드 순서 삭제
    // await setCardOrder(boardId, '');

    await Board.update(
      {
        cardOrder: '',
      },
      {
        where: {
          id: findNumericId(boardId, 'board'),
        },
      }
    );

    if (deletedCardIds.length > 0) {
      // 카드 이미지 삭제
      const cardImages = await Image.findAll({
        where: {
          cardId: deletedCardIds,
        },
      });

      if (cardImages.length > 0) {
        await Promise.allSettled(
          cardImages.map(({ url, cardId }) =>
            deleteCardImageFn(findNumericId(cardId, 'card'), url)
          )
        );
      }
    }

    // 카드 삭제
    await Card.destroy({
      where: {
        id: deletedCardIds,
      },
    });

    res.status(200).json({
      ok: true,
      message: '카드가 정상적으로 삭제되었습니다.',
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
        cardId: findNumericId(cardId, 'card'),
      },
    });

    if (deletedCount === 0) {
      res.status(400).json({
        ok: false,
        message: '삭제된 유저가 없습니다.',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      message: '카드에서 유저가 정상적으로 삭제되었습니다.',
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
      replacements: [projectId, findNumericId(cardId, 'card')],
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
        id: findNumericId(cardId, 'card'),
      },
    });

    if (!card) {
      res.status(404).json({
        ok: false,
        message: '존재하지 않는 카드입니다.',
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
    query: { projectId },
  } = req;

  try {
    const card = await Card.findOne({
      where: {
        id: cardId,
      },
      attributes: ['boardId'],
    });

    if (!card) {
      res.status(404).json({
        ok: false,
        message: '카드를 찾을 수 없습니다.',
      });
      return;
    }

    const fileUrl = await Promise.allSettled(
      files.map((file) =>
        cardImageUploadFn(findNumericId(cardId, 'card'), file)
      )
    );

    const images = await Image.bulkCreate(
      fileUrl.map((url) => ({ ...url.value, projectId }))
    );

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
        cardId: findNumericId(cardId, 'card'),
      });
    });

    await UserCard.bulkCreate(newMemberArray);

    const users = await User.findAll({
      where: {
        id: members,
      },
      attributes: ['id', 'name', 'profileImage'],
    });

    res.status(200).json({
      ok: true,
      message: '정상적으로 추가되었습니다.',
      users,
    });
  } catch (err) {
    next(err);
  }
};

const modifyCardCheck = async (req, res, next) => {
  const { boardId, cardId } = req.params;

  try {
    const { duplicatedSubmit, remainTime } = await protectDuplicatedSubmit(
      'check',
      req.user.id
    );

    if (duplicatedSubmit) {
      res.status(400).json({
        ok: false,
        message: `2초 내에 같은 요청이 감지되었습니다. ${remainTime}ms 후 다시 요청해주세요.`,
        remainTime,
      });
      return;
    }

    const card = await Card.findOne({
      where: {
        id: findNumericId(cardId, 'card'),
      },
    });

    if (!card) {
      res.status(404).json({
        ok: false,
        message: '존재하지 않는 카드입니다.',
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
      message: `유효하지 않는 값입니다. 현재값: ${cardStatus}`,
    });
    return;
  }

  try {
    const card = await Card.findOne({
      where: {
        id: findNumericId(cardId, 'card'),
      },
    });

    if (!card) {
      res.status(404).json({
        ok: false,
        message: '존재하지 않는 카드입니다.',
      });
      return;
    }

    if (card.status === cardStatus) {
      res.status(400).json({
        ok: false,
        message: '이전 상태값과 일치합니다. 다시 시도해주세요.',
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
        id: findNumericId(cardId, 'card'),
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
        [
          {
            model: Task,
            as: 'tasks',
          },
          'id',
          'desc',
        ],
      ],
    });

    if (!card) {
      res.status(404).json({
        ok: false,
        message: '존재하지 않는 카드입니다.',
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
      await Board.update(
        {
          cardOrder: end.cards.join(';'),
        },
        {
          where: {
            id: findNumericId(end.boardId, 'board'),
          },
        }
      );
    } else {
      await Promise.all([
        Board.update(
          {
            cardOrder: start.cards.join(';'),
          },
          {
            where: {
              id: findNumericId(start.boardId, 'board'),
            },
          }
        ),
        Board.update(
          {
            cardOrder: end.cards.join(';'),
          },
          {
            where: {
              id: findNumericId(end.boardId, 'board'),
            },
          }
        ),
        Card.update(
          {
            boardId: findNumericId(end.boardId, 'board'),
          },
          {
            where: {
              id: end.cards,
            },
          }
        ),
      ]);
    }

    // if (start.boardId === end.boardId) {
    //   await setCardOrder(end.boardId, end.cards.join(';'));
    // } else {
    //   await Promise.all([
    //     setCardOrder(start.boardId, start.cards.join(';')),
    //     setCardOrder(end.boardId, end.cards.join(';')),
    //   ]);
    // }

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
