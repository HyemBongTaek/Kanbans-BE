const http = require('http');
const https = require('https');
const fs = require('fs');
const io = require('socket.io');

const dbConnector = require('./db');
const { redisConnect } = require('./redis');
const { verifyJWT } = require('./utils/jwt');

module.exports = (app) => {
  const httpsOptions = {
    ca: fs.readFileSync(
      '/etc/letsencrypt/live/cocorikanbans.site/fullchain.pem'
    ),
    key: fs.readFileSync(
      '/etc/letsencrypt/live/cocorikanbans.site/privkey.pem'
    ),
    cert: fs.readFileSync('/etc/letsencrypt/live/cocorikanbans.site/cert.pem'),
  };

  const httpServer = http.createServer(app);
  const httpsServer = https.createServer(httpsOptions, app);
  const socketServer = new io.Server(httpsServer, {
    cors: {
      origin: ['http://localhost:3000', 'https://cocori.site'],
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
      // console.log('SOCKET DISCONNECT', connectedUser);
      // console.log(socket.adapter.rooms);
    });

    socket.on('join', (roomNo) => {
      socket.join(roomNo);
      // console.log('SOCKET CONNECT', connectedUser);
      // const { rooms } = socket.adapter;
    });

    socket.on('leave', (roomNo) => {
      socket.leave(roomNo);
      // const { rooms } = socket.adapter;
    });

    socket.on('dragStart', ({ type, id }) => {
      if (draggable[`${type}_${id}`]) {
        const draggingUser = draggable[`${type}_${id}`];

        socket.emit('duplicatedDrag', {
          isDraggable: false,
          message: `이미 ${connectedUser[draggingUser].name}님이 드래그 중입니다.`,
        });
      } else {
        draggable[`${type}_${id}`] = socket.id;
      }
      console.log('드래그 시작', draggable);
    });

    socket.on(
      'dragEnd',
      ({ type, id, room, startPoint, endPoint, startOrder, endOrder }) => {
        const draggingUserSocketId = draggable[`${type}_${id}`];
        console.log(draggingUserSocketId, socket.id);

        if (draggingUserSocketId === socket.id) {
          delete draggable[`${type}_${id}`];

          if (type === 'column') {
            socket.broadcast.to(room.toString()).emit('moveResult', {
              type,
              order: endOrder,
            });
          } else if (type === 'card') {
            socket.broadcast.to(room.toString()).emit('moveResult', {
              type,
              startPoint: startPoint || null,
              endPoint,
              startOrder: startOrder || null,
              endOrder,
            });
          }
        }
        console.log('드래그 끝', draggable);
      }
    );

    socket.on('boardCreate', ({ room, boardId, title }) => {
      socket.broadcast.to(room.toString()).emit('boardCreateResult', {
        id: boardId,
        projectId: room,
        title,
        cardId: [],
      });
    });

    socket.on('boardDelete', ({ room, boardId }) => {
      socket.broadcast.to(room.toString()).emit('boardDeleteResult', {
        boardId,
      });
    });

    socket.on('cardCreate', ({ room, boardId, cardId, title, createdAt }) => {
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
      socket.broadcast.to(room.toString()).emit('cardDeleteResult', {
        boardId,
        cardId,
      });
    });

    socket.on('cardCheck', ({ room, cardId, check }) => {
      socket.broadcast.to(room.toString()).emit('cardCheckResult', {
        cardId,
        check,
        status: check ? 'finish' : 'progress',
      });
    });

    socket.on('cardAllDelete', ({ room, boardId }) => {
      socket.broadcast.to(room.toString()).emit('cardAllDeleteResult', {
        boardId,
      });
    });

    socket.on('cardStatus', ({ room, cardId, status }) => {
      socket.broadcast.to(room.toString()).emit('cardStatusResult', {
        cardId,
        status,
        check: status === 'finish',
      });
    });

    socket.on('boardTitle', ({ room, boardId, title }) => {
      socket.broadcast.to(room.toString()).emit('boardTitleResult', {
        boardId,
        title,
      });
    });
  });

  async function listener() {
    console.log(`✅ Server listening on http://localhost:${app.get('port')}`);
    await dbConnector();
    await redisConnect();
  }

  httpServer.listen(8080, () => {
    console.log('http listening on port 8080');
  });
  httpsServer.listen(8090, listener);
};
