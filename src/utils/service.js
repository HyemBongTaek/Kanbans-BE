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

module.exports = {
  getBytes,
  projectDataFormatChangeFn,
};
