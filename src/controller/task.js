const { Task } = require('../models/index');

const createTask = async (req, res, next) => {
  try {
    if (!req.body.title || !req.body.cardId) {
      res.status(400).json({ ok: false, message: '빈값이 존재합니다.' });
      return;
    }
    const postTask = await Task.create({
      check: req.body.check,
      title: req.body.title,
      cardId: req.body.cardId,
    });
    const task = await Task.findOne({
      where: {
        id: postTask.id,
      },
    });
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
    res.status(201).json({ ok: true, message: '삭제 완료' });
    return;
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTask,
  deleteTask,
};
