const { QueryTypes } = require('sequelize');

const { Board, Card, Image, Project, sequelize } = require('../models/index');
const { getBoardQuery } = require('../utils/query');
const { makeBoardCardObject } = require('../utils/service');
const {
  delCardOrder,
  getBoardOrder,
  getCardOrder,
  setBoardOrder,
} = require('../utils/redis');
const { deleteCardImageFn } = require('../utils/image');

const getBoard = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const getBoards = await sequelize.query(getBoardQuery, {
      type: QueryTypes.SELECT,
      replacements: [+projectId],
    });

    if (getBoards.length <= 0) {
      res.status(200).json({
        ok: true,
        kanbans: {
          cards: {},
          board: {},
        },
        columnOrders: [],
      });
      return;
    }

    const boardCardObj = await makeBoardCardObject(getBoards);

    let boardOrder = await getBoardOrder(projectId);

    if (boardOrder === null) {
      const project = await Project.findOne({
        where: {
          id: projectId,
        },
        attributes: ['boardOrder'],
      });

      boardOrder = project.boardOrder;
      await setBoardOrder(projectId, project.boardOrder);
    }

    res.status(200).json({
      ok: true,
      kanbans: {
        cards: boardCardObj.cardObj,
        board: boardCardObj.boardObj,
        columnOrders: boardOrder.split(';'),
      },
    });
  } catch (err) {
    next(err);
  }
};

const createBoard = async (req, res, next) => {
  const { title, projectId } = req.body;

  if (title.trim() === '' || !title) {
    res.status(400).json({
      ok: false,
      message: `유효하지 않은 제목: ${title}`,
    });
    return;
  }

  if (!projectId) {
    res.status(400).json({
      ok: false,
      message: '빈값이 존재합니다.',
    });
    return;
  }

  try {
    const newBoard = await Board.create({
      title,
      projectId,
    });

    const boardOrder = await getBoardOrder(projectId);

    if (boardOrder === null) {
      const project = await Project.findOne({
        where: {
          id: projectId,
        },
      });
      if (project.boardOrder === '') {
        await setBoardOrder(projectId, `${newBoard.id}`);
      } else {
        await setBoardOrder(projectId, `${project.boardOrder};${newBoard.id}`);
      }
    } else if (boardOrder === '') {
      await setBoardOrder(projectId, `${newBoard.id}`);
    } else {
      await setBoardOrder(projectId, `${boardOrder};${newBoard.id}`);
    }

    res.status(201).json({
      ok: true,
      message: '작성 완료',
      newBoard: {
        id: newBoard.id,
        title: newBoard.title,
        projectId: newBoard.projectId,
        cardId: [],
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateBoard = async (req, res, next) => {
  try {
    const boardId = req.params.id;
    const { title } = req.body;

    const board = await Board.findOne({
      where: {
        id: boardId,
      },
    });

    if (!board) {
      res.status(400).json({ ok: false, message: '보드가 존재하지 않습니다.' });
      return;
    }

    if (title.trim() === '' || !title) {
      res.status(400).json({ ok: false, message: '타이틀을 작성해주세요.' });
      return;
    }

    board.title = title;
    await board.save();

    res.status(201).json({
      ok: true,
      message: '수정 완료',
      updateBoards: { id: board.id, title: board.title },
    });
  } catch (err) {
    next(err);
  }
};

const deleteBoard = async (req, res, next) => {
  const { boardId } = req.params;

  try {
    const board = await Board.findOne({
      where: {
        id: boardId,
      },
    });

    if (!board) {
      res.status(400).json({ ok: false, message: '보드가 존재하지 않습니다.' });
      return;
    }

    const cardOrder = await getCardOrder(board.id);

    if (cardOrder === null) {
      const cards = await Card.findAll({
        where: {
          boardId,
        },
        attributes: ['id'],
      });

      const cardIds = cards.map(({ id }) => id);

      const cardImages = await Image.findAll({
        where: {
          cardId: cardIds,
        },
      });

      await Promise.allSettled(
        cardImages.map(({ url, cardId }) => deleteCardImageFn(cardId, url))
      );
    } else if (cardOrder !== '') {
      const cardImages = await Image.findAll({
        where: {
          cardId: cardOrder.split(';'),
        },
        attributes: ['id'],
      });

      await Promise.allSettled(
        cardImages.map(({ url, cardId }) => deleteCardImageFn(cardId, url))
      );
    }

    const regex = new RegExp(`${boardId};|;${boardId}|${boardId}`, 'g');

    let boardOrder = await getBoardOrder(board.projectId);

    if (!boardOrder) {
      const project = await Project.findOne({
        where: {
          id: board.projectId,
        },
      });
      boardOrder = project.boardOrder;
    }

    await setBoardOrder(board.projectId, boardOrder.replace(regex, ''));
    await delCardOrder(boardId);

    await Board.destroy({ where: { id: boardId } });

    res.status(200).json({ ok: true, message: '삭제 완료' });
  } catch (err) {
    next(err);
  }
};

const updateBoardLocation = async (req, res, next) => {
  const {
    params: { projectId },
    body: { boardOrder },
  } = req;

  try {
    if (!projectId) {
      res.status(400).json({
        ok: false,
        message: 'Project id is not exist',
      });
      return;
    }

    if (!boardOrder) {
      res.status(400).json({
        ok: false,
        message: 'Board order is not exist',
      });
      return;
    }

    await setBoardOrder(projectId, boardOrder.join(';'));

    res.status(200).json({
      ok: true,
      boardOrder,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBoard,
  deleteBoard,
  getBoard,
  updateBoard,
  updateBoardLocation,
};
