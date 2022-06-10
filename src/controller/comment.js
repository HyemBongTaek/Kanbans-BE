const { QueryTypes } = require('sequelize');

const { Comment, Card, sequelize } = require('../models/index');
const { getCommentQuery } = require('../utils/query');

const getComment = async (req, res, next) => {
  const { cardId } = req.params;
  try {
    const card = await Comment.findOne({
      where: {
        cardId,
      },
    });
    if (!card) {
      res
        .status(400)
        .json({ ok: false, message: 'cardId가 존재하지 않습니다.' });
      return;
    }
    const comment = await sequelize.query(getCommentQuery, {
      type: QueryTypes.SELECT,
      replacements: [+cardId],
    });
    // const comment = await Comment.findAll({
    //   where: {
    //     cardId,
    //   },
    // });
    // const comment = comments.reduce((acc, cur) => {
    //   acc[cur.id] = {
    //     id: cur.id,
    //     content: cur.content,
    //     createdAt: cur.createdAt,
    //     userId: cur.userId,
    //     cardId: cur.cardId,
    //   };
    //   return acc;
    // }, {});
    res.status(200).json({ ok: true, comment });
    return;
  } catch (err) {
    next(err);
  }
};

const createComment = async (req, res, next) => {
  const {
    userId,
    body: { content, cardId },
  } = req;
  try {
    const card = await Card.findOne({
      where: {
        id: cardId,
      },
    });
    if (!card) {
      res
        .status(400)
        .json({ ok: false, message: 'cardId가 존재하지 않습니다.' });
      return;
    }
    if (content.trim() === '' || !content) {
      res.status(400).json({ ok: false, message: '빈값이 존재합니다.' });
      return;
    }
    const newComment = await Comment.create({
      content,
      userId,
      cardId,
    });
    const comment = {
      id: newComment.id,
      content: newComment.content,
      createdAt: newComment.createdAt.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
      }),
      userId: newComment.userId,
      cardId: newComment.cardId,
    };
    res.status(201).json({ ok: true, message: '작성 완료', comment });
    return;
  } catch (err) {
    next(err);
  }
};

const updateComment = async (req, res, next) => {
  const { content } = req.body;
  try {
    const updateId = req.params.id;
    const findComment = await Comment.findOne({
      where: {
        id: updateId,
      },
    });
    if (!findComment) {
      res.status(400).json({ ok: false, message: '댓글이 존재하지 않습니다.' });
      return;
    }
    if (content.trim() === '' || !content) {
      res.status(400).json({ ok: false, message: '빈값이 존재합니다.' });
      return;
    }
    await Comment.update(
      {
        content,
      },
      { where: { id: updateId } }
    );
    const newComment = await Comment.findOne({
      where: {
        id: updateId,
      },
    });
    const comment = {
      id: newComment.id,
      content: newComment.content,
      createdAt: newComment.createdAt.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
      }),
      userId: newComment.userId,
      cardId: newComment.cardId,
    };
    res.status(201).json({ ok: true, message: '수정 완료', comment });
    return;
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const deleteId = req.params.id;
    const comment = await Comment.findOne({
      where: {
        id: deleteId,
      },
    });
    if (!comment) {
      res.status(400).json({ ok: false, message: '댓글이 존재하지 않습니다.' });
      return;
    }
    await Comment.destroy({ where: { id: deleteId } });
    res.status(200).json({ ok: true, message: '삭제 완료' });
    return;
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getComment,
  createComment,
  updateComment,
  deleteComment,
};
