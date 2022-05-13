function projectDataFormatChangeFn(projects) {
  return projects.reduce((acc, cur) => {
    const index = acc.findIndex((idx) => idx.title === cur.title);
    if (index === -1) {
      acc.push({
        title: cur.title,
        permission: cur.permission,
        projectId: cur.projectId,
        bookmark: cur.bookmark,
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

module.exports = {
  projectDataFormatChangeFn,
};
