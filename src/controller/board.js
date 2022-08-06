const { QueryTypes } = require('sequelize');

const { Board, Image, Project, sequelize } = require('../models/index');
const { getBoardQuery } = require('../utils/query');
const { findNumericId, makeBoardCardObject } = require('../utils/service');
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

    const boardCardObj = makeBoardCardObject(getBoards);

    const { boardOrder } = await Project.findOne({
      where: {
        id: projectId,
      },
    });

    // let boardOrder = await getBoardOrder(projectId);
    //
    // if (boardOrder === null) {
    //   const project = await Project.findOne({
    //     where: {
    //       id: projectId,
    //     },
    //     attributes: ['boardOrder'],
    //   });
    //
    //   boardOrder = project.boardOrder;
    //   await setBoardOrder(projectId, project.boardOrder);
    // }

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

    const project = await Project.findOne({
      where: {
        id: projectId,
      },
    });

    if (project.boardOrder === '') {
      project.boardOrder = `B${newBoard.id}`;
    } else {
      project.boardOrder = `${project.boardOrder};B${newBoard.id}`;
    }
    await project.save();

    // const boardOrder = await getBoardOrder(projectId);

    // if (boardOrder === null) {
    //   const project = await Project.findOne({
    //     where: {
    //       id: projectId,
    //     },
    //   });
    //   if (project.boardOrder === '') {
    //     await setBoardOrder(projectId, `${newBoard.id}`);
    //   } else {
    //     await setBoardOrder(projectId, `${project.boardOrder};${newBoard.id}`);
    //   }
    // } else if (boardOrder === '') {
    //   await setBoardOrder(projectId, `${newBoard.id}`);
    // } else {
    //   await setBoardOrder(projectId, `${boardOrder};${newBoard.id}`);
    // }

    res.status(201).json({
      ok: true,
      message: '작성 완료',
      newBoard: {
        id: `B${newBoard.id}`,
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
        id: findNumericId(boardId, 'board'),
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
      updateBoards: { id: `B${board.id}`, title: board.title },
    });
  } catch (err) {
    next(err);
  }
};

const deleteBoard = async (req, res, next) => {
  const {
    body: { cardIds: deletedCardIds },
    params: { boardId },
  } = req;

  try {
    const board = await Board.findOne({
      where: {
        id: findNumericId(boardId, 'board'),
      },
    });

    if (!board) {
      res.status(400).json({ ok: false, message: '보드가 존재하지 않습니다.' });
      return;
    }

    if (deletedCardIds > 0) {
      // 카드 이미지 삭제
      const deletedNumericCardIds = deletedCardIds.map((id) =>
        findNumericId(id, 'card')
      );

      const cardImages = await Image.findAll({
        where: {
          cardId: deletedNumericCardIds,
        },
      });

      if (cardImages.length > 0) {
        await Promise.allSettled(
          cardImages.map(({ url, cardId }) => deleteCardImageFn(cardId, url))
        );
      }
    }

    const regex = new RegExp(`${boardId};|;${boardId}|${boardId}`, 'g');

    const project = await Project.findOne({
      where: {
        id: board.projectId,
      },
    });
    project.boardOrder = project.boardOrder.replace(regex, '');
    await project.save();

    // let boardOrder = await getBoardOrder(board.projectId);
    //
    // if (!boardOrder) {
    //   const project = await Project.findOne({
    //     where: {
    //       id: board.projectId,
    //     },
    //   });
    //   boardOrder = project.boardOrder;
    // }
    //
    // await setBoardOrder(board.projectId, boardOrder.replace(regex, ''));
    // await delCardOrder(boardId);

    await Board.destroy({ where: { id: findNumericId(boardId, 'board') } });

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
  console.log('보드순서', boardOrder);

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

    const set = new Set(boardOrder);

    await Project.update(
      {
        boardOrder: [...set].join(';'),
      },
      {
        where: {
          id: projectId,
        },
      }
    );

    // await setBoardOrder(projectId, boardOrder.join(';'));

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
