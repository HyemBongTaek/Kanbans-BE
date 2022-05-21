const { Board } = require('../models/index');

exports.getBoard = async (req, res, next) => {
  try {
    const board = await Board.findAll({
      where: {
        project_id: req.params.project_id,
      },
      order: [['id', 'DESC']],
    });
    if (board.length <= 0) {
      return res
        .status(400)
        .json({ ok: false, message: '검색 결과가 없습니다.' });
    }
    return res.status(200).json({ ok: true, board });
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
    return res.status(200).json({ ok: true, message: '작성 완료', newBoard });
  } catch (err) {
    next(err);
  }
};
