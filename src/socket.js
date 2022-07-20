const http = require('http');
const io = require('socket.io');

const dbConnector = require('./db');
const { redisConnect } = require('./redis');
const { verifyJWT } = require('./utils/jwt');

module.exports = (app) => {
  const httpServer = http.createServer(app);
  const socketServer = new io.Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000',
    },
  });

  const connectedUser = {};
  const draggable = {};

  socketServer.use(async (socket, next) => {
    const accessToken = socket.handshake.headers.authorization.split(' ')[1];
    // console.log(socket.request.headers.referer);

    try {
      const verifiedToken = await verifyJWT(accessToken);

      // eslint-disable-next-line no-param-reassign
      socket.user = {
        id: verifiedToken.id,
        name: verifiedToken.name,
      };

      next();
    } catch (e) {
      next(new Error(e.message));
    }
  });

  socketServer.on('connection', (socket) => {
    connectedUser[socket.id] = socket.user;

    socket.on('disconnect', () => {
      delete connectedUser[socket.id];
      console.log('SOCKET DISCONNECT', connectedUser);
      console.log(socket.adapter.rooms);
    });

    socket.on('join', (roomNo) => {
      socket.join(roomNo);
      console.log('SOCKET CONNECT', connectedUser);
      // const { rooms } = socket.adapter;
    });

    socket.on('leave', (roomNo) => {
      socket.leave(roomNo);
      // const { rooms } = socket.adapter;
    });

    socket.on('dragStart', ({ type, id }) => {
      console.log('DRAGGABLE', draggable);
      if (draggable[`${type}_${id}`]) {
        draggable[`${type}_${id}`].dragging = true;
        const draggingUser = draggable[`${type}_${id}`].socketId;

        socket.emit('duplicatedDrag', {
          isDraggable: false,
          message: `이미 ${connectedUser[draggingUser].name}님이 드래그 중입니다.`,
        });
      } else if (!draggable[`${type}_${id}`]) {
        draggable[`${type}_${id}`] = {
          socketId: socket.id,
          dragging: false,
        };
      }
      console.log('DRAG DRAGGABLE', draggable);
    });

    socket.on(
      'dragEnd',
      ({ type, id, room, startPoint, endPoint, startOrder, endOrder }) => {
        console.log('DRAG END');
        console.log(type, id, room, startPoint, endPoint, startOrder, endOrder);
        const isDragging = draggable[`${type}_${id}`].dragging;

        if (!isDragging) {
          delete draggable[`${type}_${id}`];

          if (type === 'column') {
            console.log('Board 이동');
            socket.broadcast.to(room.toString()).emit('moveResult', {
              type,
              order: endOrder,
            });
          } else if (type === 'card') {
            console.log('Card 이동');
            socket.broadcast.to(room.toString()).emit('moveResult', {
              type,
              startPoint: startPoint || null,
              endPoint,
              startOrder: startOrder || null,
              endOrder,
            });
          }
        } else {
          draggable[`${type}_${id}`].dragging = false;
        }
        console.log('DROP DRAGGABLE', draggable);
      }
    );

    socket.on('boardCreate', ({ room, boardId, title }) => {
      console.log(
        'Board Create Event: room',
        room,
        'boardId',
        boardId,
        'title',
        title
      );
      socket.broadcast.to(room.toString()).emit('boardCreateResult', {
        id: boardId,
        projectId: room,
        title,
        cardId: [],
      });
    });

    socket.on('boardDelete', ({ room, boardId }) => {
      console.log('Board Delete Event: room', room, 'boardId', boardId);
      socket.broadcast.to(room.toString()).emit('boardDeleteResult', {
        boardId,
      });
    });

    socket.on('cardCreate', ({ room, boardId, cardId, title, createdAt }) => {
      console.log(
        'Card Create Event: room',
        room,
        'boardId',
        boardId,
        'cardId',
        cardId,
        'title',
        title
      );
      socket.broadcast.to(room.toString()).emit('cardCreateResult', {
        id: cardId,
        boardId,
        title,
        createdAt,
        status: 'progress',
        check: false,
      });
    });

    socket.on('cardDelete', ({ room, boardId, cardId }) => {
      console.log(
        'Card Delete Event: room',
        room,
        'boardId',
        boardId,
        'cardId',
        cardId
      );
      socket.broadcast.to(room.toString()).emit('cardDeleteResult', {
        boardId,
        cardId,
      });
    });

    socket.on('cardCheck', ({ room, cardId, check }) => {
      console.log('Card Check: room', room, 'cardId:', cardId, 'check:', check);
      socket.broadcast.to(room.toString()).emit('cardCheckResult', {
        cardId,
        check,
        status: check ? 'finish' : 'progress',
      });
    });

    socket.on('cardAllDelete', ({ room, boardId }) => {
      console.log('Card All Delete: room', room, 'boardId:', boardId);
      socket.broadcast.to(room.toString()).emit('cardAllDeleteResult', {
        boardId,
      });
    });

    socket.on('cardStatus', ({ room, cardId, status }) => {
      console.log(
        'Card Status: room',
        room,
        'cardId:',
        cardId,
        'status:',
        status
      );
      socket.broadcast.to(room.toString()).emit('cardStatusResult', {
        cardId,
        status,
        check: status === 'finish',
      });
    });
  });

  async function listener() {
    console.log(`✅ Server listening on http://localhost:${app.get('port')}`);
    await dbConnector();
    await redisConnect();
  }

  httpServer.listen(app.get('port'), listener);
};
