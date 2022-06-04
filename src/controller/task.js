const { Task, Card } = require('../models/index');

const createTask = async (req, res, next) => {
  const { check, content, cardId } = req.body;
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
    const newTask = await Task.create({
      check,
      content,
      cardId,
    });
    const task = {
      id: newTask.id,
      content: newTask.content,
      check: newTask.check,
      cardId: newTask.cardId,
    };
    res.status(201).json({ ok: true, message: '작성 완료', task });
    return;
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const deleteId = req.params.id;
    const task = await Task.findOne({
      where: {
        id: deleteId,
      },
    });
    if (!task) {
      res
        .status(400)
        .json({ ok: false, message: '태스크가 존재하지 않습니다.' });
      return;
    }
    await Task.destroy({ where: { id: deleteId } });
    res.status(200).json({ ok: true, message: '삭제 완료' });
    return;
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  deleteTask,
};
