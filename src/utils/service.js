const { customAlphabet } = require('nanoid');
const { getCardOrder } = require('./redis');

function projectDataFormatChangeFn(projects) {
  return projects.reduce((acc, cur) => {
    const index = acc.findIndex((idx) => idx.projectId === cur.projectId);
    if (index === -1) {
      acc.push({
        title: cur.title,
        permission: cur.permission,
        projectId: cur.projectId,
        bookmark: cur.bookmark,
        owner: cur.owner,
        users: [
          {
            userId: cur.userId,
            profileImageURL: cur.profileImage,
            name: cur.name,
          },
        ],
      });
    } else {
      acc[index].users.push({
        userId: cur.userId,
        profileImageURL: cur.profileImage,
        name: cur.name,
      });
    }

    return acc;
  }, []);
}

async function makeBoardCardObject(data) {
  try {
    return (
      await Promise.all(
        data.map(async (d) => ({
          ...d,
          cardOrder: (await getCardOrder(d.boardId)) || d.cardOrder,
        }))
      )
    ).reduce(
      (acc, cur) => {
        const boardIds = Object.keys(acc.boardObj);
        const cardIds = Object.keys(acc.cardObj);

        const boardIndex = boardIds.indexOf(cur.boardId.toString());
        const cardIndex = cardIds.indexOf(cur.cardId && cur.cardId.toString());

        if (boardIndex === -1) {
          acc.boardObj[cur.boardId] = {
            id: cur.boardId,
            title: cur.boardTitle,
            projectId: cur.projectId,
            cardId: !cur.cardOrder ? [] : cur.cardOrder.split(';'),
          };
        }

        if (cardIndex === -1 && cur.cardId) {
          acc.cardObj[cur.cardId] = {
            id: cur.cardId,
            title: cur.cardTitle,
            dDay: cur.dDay,
            status: cur.status,
            check: cur.check,
            createdAt: cur.createdAt,
            boardId: cur.boardId,
            labels: cur.labelId
              ? [
                  {
                    labelId: cur.labelId,
                    color: cur.labelColor,
                  },
                ]
              : [],
            taskCount: cur.taskCount || 0,
            taskCheckCount: cur.taskCheckCount || 0,
            commentCount: cur.commentCount || 0,
          };
        } else if (cardIndex >= 0 && cur.cardId) {
          acc.cardObj[cur.cardId].labels.push({
            labelId: cur.labelId,
            color: cur.labelColor,
          });
        }

        return acc;
      },
      {
        boardObj: {},
        cardObj: {},
      }
    );
  } catch (e) {
    throw new Error(e.message);
  }
}

function getBytes(str) {
  let character;
  let charBytes = 0;

  for (let i = 0; i < str.length; i += 1) {
    character = str.charAt(i);

    if (escape(character).length > 4) charBytes += 2;
    else charBytes += 1;
  }

  return charBytes;
}

function makeInviteCode() {
  const customNanoid = customAlphabet(
    '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  );

  return customNanoid(10);
}

module.exports = {
  getBytes,
  makeBoardCardObject,
  makeInviteCode,
  projectDataFormatChangeFn,
};
