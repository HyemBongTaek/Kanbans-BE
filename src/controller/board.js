const { QueryTypes } = require('sequelize');

const { Board, BoardOrder, sequelize } = require('../models/index');
const { getBoardQuery, getBoardCard } = require('../utils/query');
const {
  getBoardOrderInRedis,
  setBoardOrderInRedis,
} = require('../utils/redis');

const getBoard = async (req, res, next) => {
  try {
    const getBoards = await sequelize.query(getBoardQuery, {
      type: QueryTypes.SELECT,
      replacements: [+req.params.projectId],
    });

    let columnOrders;

    const board = getBoards.reduce((acc, cur) => {
      const cardsId = Object.keys(acc);
      const index = cardsId.indexOf(cur.id.toString());

      if (index === -1) {
        acc[cur.id] = {
          id: cur.id,
          title: cur.title,
          projectId: cur.projectId,
          cardId: [],
        };

        if (cur.cardId !== null) {
          acc[cur.id].cardId.push(cur.cardId);
        }
      } else if (cur.cardId !== null) {
        acc[cur.id].cardId.push(cur.cardId);
      }
      // columnOrders.push(cur.id);
      return acc;
    }, {});

    const boardOrderInRedis = await getBoardOrderInRedis(req.params.projectId);

    if (!boardOrderInRedis) {
      const boardOrder = await BoardOrder.findOne({
        where: {
          projectId: +req.params.projectId,
        },
      });

      if (boardOrder.order === '') {
        columnOrders = [];
      } else {
        await setBoardOrderInRedis(req.params.projectId, boardOrder.order);
        columnOrders = boardOrder.order.split(';');
      }
    } else {
      columnOrders = boardOrderInRedis.split(';');
    }

    // const column = new Set(columnOrders);
    // const columnOrder = [...column];

    const getcards = await sequelize.query(getBoardCard, {
      type: QueryTypes.SELECT,
      replacements: [+req.params.projectId],
    });
    const cards = getcards.reduce((acc, cur) => {
      acc[cur.id] = {
        id: cur.id,
        title: cur.title,
        subtitle: cur.subtitle,
        description: cur.description,
        d_day: cur.d_day,
        status: cur.status,
        check: cur.check,
        created_at: cur.created_at,
        board_id: cur.board_id,
      };
      return acc;
    }, {});

    if (getBoards.length <= 0) {
      res.status(400).json({ ok: false, message: '검색 결과가 없습니다.' });
      return;
    }
    res.status(200).json({ ok: true, kanbans: { cards, board, columnOrders } });
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

    const boardOrderInRedis = await getBoardOrderInRedis(projectId);

    if (!boardOrderInRedis) {
      const boardOrder = await BoardOrder.findOne({
        where: {
          projectId: +projectId,
        },
      });

      if (boardOrder.order === '') {
        await setBoardOrderInRedis(projectId, newBoard.id);
      } else {
        await setBoardOrderInRedis(
          projectId,
          `${boardOrder.order};${newBoard.id}`
        );
      }
    } else {
      await setBoardOrderInRedis(
        projectId,
        `${boardOrderInRedis};${newBoard.id}`
      );
    }

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
    // const findUpdateId = await Board.findOne({
    //   where: { id: updateId },
    // });
    const userProjectId = findUpdateId.dataValues.projectId;
    const updatedBoard = await Board.findAll({
      where: {
        projectId: userProjectId,
      },
    });
    const updateBoard = updatedBoard.reduce((acc, cur) => {
      acc[cur.id] = {
        id: cur.id,
        title: cur.title,
        projectId: cur.projectId,
      };
      return acc;
    }, {});
    res.status(201).json({ ok: true, message: '수정 완료', updateBoard });
    return;
  } catch (err) {
    next(err);
  }
};

const deleteBoard = async (req, res, next) => {
  try {
    const deleteId = req.params.id;
    const board = await Board.findOne({
      where: {
        id: deleteId,
      },
    });
    if (!board) {
      res.status(400).json({ ok: false, message: '보드가 존재하지 않습니다.' });
      return;
    }

    const boardOrderInRedis = await getBoardOrderInRedis(board.projectId);

    if (!boardOrderInRedis) {
      const boardOrder = await BoardOrder.findOne({
        where: {
          projectId: board.projectId,
        },
      });

      const newBoardOrder = boardOrder.order
        .split(';')
        .filter((order) => order !== deleteId);

      await setBoardOrderInRedis(board.projectId, newBoardOrder.join(';'));
    } else {
      const newBoardOrder = boardOrderInRedis
        .split(';')
        .filter((order) => order !== deleteId);

      await setBoardOrderInRedis(board.projectId, newBoardOrder.join(';'));
    }

    await Board.destroy({ where: { id: deleteId } });

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

    await setBoardOrderInRedis(projectId, boardOrder.join(';'));

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
