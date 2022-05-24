const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models/board');
const { Board } = require('../models/index');
const { getBoardQuery } = require('../utils/query');

exports.getBoard = async (req, res, next) => {
  try {
    const getBoard = await sequelize.query(getBoardQuery, {
      type: QueryTypes.SELECT,
      replacements: [+req.params.project_id],
    });

    let columnOrders = [];

    const board = getBoard.reduce(function (acc, cur) {
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
      columnOrders.push(cur.id);
      return acc;
    }, {});

    const column = new Set(columnOrders);
    const columnOrder = [...column];

    let cards = [];

    if (getBoard.length <= 0) {
      return res
        .status(400)
        .json({ ok: false, message: '검색 결과가 없습니다.' });
    }
    return res.status(200).json({ ok: true, cards, board, columnOrder });
  } catch (err) {
    next(err);
  }
};

exports.createBoard = async (req, res, next) => {
  try {
    const newBoard = await Board.create({
      title: req.body.title,
      project_id: req.body.project_id,
    });
    if (
      newBoard.dataValues.title === '' ||
      newBoard.dataValues.project_id === undefined
    ) {
      return res.status(400).json({ ok: false, message: '빈값이 존재합니다.' });
    }
    return res.status(201).json({ ok: true, message: '작성 완료', newBoard });
  } catch (err) {
    next(err);
  }
};

exports.updateBoard = async (req, res, next) => {
  try {
    const updateId = req.params.id;
    await Board.findOne({
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
    const updatedBoard = await Board.findOne({
      where: { id: updateId },
    });
    return res
      .status(201)
      .json({ ok: true, message: '수정 완료', updatedBoard });
  } catch (err) {
    next(err);
  }
};

exports.deleteBoard = async (req, res, next) => {
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
