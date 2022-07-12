const { QueryTypes } = require('sequelize');

const { Board, BoardOrder, sequelize } = require('../models/index');
const { getBoardQuery, getCardQuery } = require('../utils/query');
const { makeBoardCardObject } = require('../utils/service');

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

    const boardCardObj = makeBoardCardObject(getBoards);

    const boardOrder = await BoardOrder.findOne({
      where: {
        projectId,
      },
    });

    res.status(200).json({
      ok: true,
      kanbans: {
        cards: boardCardObj.cardObj,
        board: boardCardObj.boardObj,
        columnOrders: boardOrder.order.split(';'),
      },
    });
    return;
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

    const boardOrder = await BoardOrder.findOne({
      where: {
        projectId,
      },
    });

    if (!boardOrder) {
      await BoardOrder.create({
        order: '',
        projectId,
      });
    }

    if (boardOrder.order === '') {
      boardOrder.order = newBoard.id;
    } else {
      boardOrder.order = `${boardOrder.order};${newBoard.id}`;
    }

    await boardOrder.save();

    res.status(201).json({ ok: true, message: '작성 완료', newBoard });
    return;
  } catch (err) {
    next(err);
  }
};

const updateBoard = async (req, res, next) => {
  try {
    const updateId = req.params.id;

    const findUpdateId = await Board.findOne({
      where: {
        id: updateId,
      },
    });

    const condition = req.body.title === '';
    if (condition === true) {
      res.status(400).json({ ok: false, message: '타이틀을 작성해주세요.' });
      return;
    }
    await Board.update(
      {
        title: req.body.title,
      },
      { where: { id: updateId } }
    );

    const updateBoards = await Board.findOne({
      where: {
        id: updateId,
      },
      attributes: { exclude: ['projectId'] },
    });
    // const userProjectId = findUpdateId.dataValues.projectId;

    // const updatedBoard = await Board.findAll({
    //   where: {
    //     projectId: userProjectId,
    //   },
    // });

    // const updateBoards = updatedBoard.reduce((acc, cur) => {
    //   acc[cur.id] = {
    //     id: cur.id,
    //     title: cur.title,
    //     projectId: cur.projectId,
    //   };
    //   return acc;
    // }, {});

    // const card = await sequelize.query(getCardQuery, {
    //   type: QueryTypes.SELECT,
    //   replacements: [updateId],
    // });

    // const cards = [];

    // for (let i = 0; i < card.length; i += 1) {
    //   cards.push(card[i].cardId);
    // }

    res.status(201).json({ ok: true, message: '수정 완료', updateBoards });
    return;
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

    const boardOrder = await BoardOrder.findOne({
      where: {
        projectId: board.projectId,
      },
    });

    boardOrder.order = boardOrder.order
      .split(';')
      .filter((order) => order !== boardId)
      .join(';');
    await boardOrder.save();

    await Board.destroy({ where: { id: boardId } });

    res.status(200).json({ ok: true, message: '삭제 완료' });
    return;
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

    await BoardOrder.update(
      {
        order: boardOrder.join(';'),
      },
      {
        where: {
          projectId,
        },
      }
    );

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
