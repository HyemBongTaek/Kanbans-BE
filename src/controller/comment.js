const { QueryTypes } = require('sequelize');

const { Comment, Card, User, sequelize } = require('../models/index');
const { getCommentQuery } = require('../utils/query');
const { findNumericId } = require('../utils/service');

const getComment = async (req, res, next) => {
  const { cardId } = req.params;

  const numericCardId = findNumericId(cardId, 'card');

  try {
    const comment = await sequelize.query(getCommentQuery, {
      type: QueryTypes.SELECT,
      replacements: [+numericCardId],
    });
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

  const numericCardId = findNumericId(cardId, 'card');

  try {
    const card = await Card.findOne({
      where: {
        id: numericCardId,
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
      cardId: numericCardId,
    });
    const user = await User.findOne({
      where: {
        id: userId,
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
      profileImage: user.profileImage,
      name: user.name,
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
