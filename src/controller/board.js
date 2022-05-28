const { QueryTypes } = require('sequelize');

const { Board, BoardOrder, sequelize } = require('../models/index');
const { getBoardQuery } = require('../utils/query');
const { redisClient } = require('../redis');

const getBoard = async (req, res, next) => {
  try {
    const getBoard = await sequelize.query(getBoardQuery, {
      type: QueryTypes.SELECT,
      replacements: [+req.params.project_id],
    });

    let columnOrders;

    const board = getBoard.reduce((acc, cur) => {
      const cardsId = Object.keys(acc);
      const index = cardsId.indexOf(cur.id.toString());

      if (index === -1) {
        acc[cur.id] = {
          id: cur.id,
          title: cur.title,
          project_id: cur.project_id,
          card_id: [],
        };

        if (cur.card_id !== null) {
          acc[cur.id].card_id.push(cur.card_id);
        }
      } else if (cur.card_id !== null) {
        acc[cur.id].card_id.push(cur.card_id);
      }
      // columnOrders.push(cur.id);
      return acc;
    }, {});

    const boardOrderInRedis = await redisClient.get(
      `p_${req.params.project_id}`
    );

    if (!boardOrderInRedis) {
      const boardOrder = await BoardOrder.findOne({
        where: {
          projectId: +req.params.project_id,
        },
      });

      if (!boardOrder.order) {
        columnOrders = [];
      } else {
        await redisClient.set(`p_${req.params.project_id}`, boardOrder.order);
        columnOrders = boardOrder.order.split(';');
      }
    } else {
      columnOrders = boardOrderInRedis.split(';');
    }

    // const column = new Set(columnOrders);
    // const columnOrder = [...column];

    const cards = [];

    if (getBoard.length <= 0) {
      return res
        .status(400)
        .json({ ok: false, message: '검색 결과가 없습니다.' });
    }
    return res
      .status(200)
      .json({ ok: true, kanbans: { cards, board, columnOrders } });
  } catch (err) {
    next(err);
  }
};

const createBoard = async (req, res, next) => {
  try {
    if (req.body.title === '' || req.body.project_id === undefined) {
      return res.status(400).json({ ok: false, message: '빈값이 존재합니다.' });
    }
    const newBoard = await Board.create({
      title: req.body.title,
      project_id: req.body.project_id,
    });

    const boardOrderInRedis = await redisClient.get(`p_${req.body.project_id}`);

    if (!boardOrderInRedis) {
      const boardOrder = await BoardOrder.findOne({
        where: {
          projectId: +req.body.project_id,
        },
      });

      if (!boardOrder.order) {
        await redisClient.set(`p_${req.body.project_id}`, newBoard.id);
      } else {
        await redisClient.set(
          `p_${req.body.project_id}`,
          `${boardOrder.order};${newBoard.id}`
        );
      }
    } else {
      const newBoardOrder = `${boardOrderInRedis};${newBoard.id}`;
      await redisClient.set(`p_${req.body.project_id}`, newBoardOrder);
    }
    return res.status(201).json({ ok: true, message: '작성 완료', newBoard });
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
      return res
        .status(400)
        .json({ ok: false, message: '타이틀을 작성해주세요.' });
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
    const userProjectId = findUpdateId.dataValues.project_id;
    const updatedBoard = await Board.findAll({
      where: {
        project_id: userProjectId,
      },
    });
    const updateBoard = updatedBoard.reduce((acc, cur) => {
      acc[cur.id] = {
        id: cur.id,
        title: cur.title,
        project_id: cur.project_id,
      };
      return acc;
    }, {});
    return res
      .status(201)
      .json({ ok: true, message: '수정 완료', updateBoard });
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
      return res
        .status(400)
        .json({ ok: false, message: '보드가 존재하지 않습니다.' });
    }
    await Board.destroy({ where: { id: deleteId } });
    return res.status(200).json({ ok: true, message: '삭제 완료' });
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

    await redisClient.set(`p_${projectId}`, boardOrder.join(';'));

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
