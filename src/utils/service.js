function projectDataFormatChangeFn(projects) {
  return projects.reduce((acc, cur) => {
    const index = acc.findIndex((idx) => idx.title === cur.title);
    if (index === -1) {
      acc.push({
        title: cur.title,
        permission: cur.permission,
        projectId: cur.project_id,
        users: [
          {
            userId: cur.id,
            profileImageURL: cur.profile_image,
            name: cur.name,
          },
        ],
      });
    } else {
      acc[index].users.push({
        userId: cur.id,
        profileImageURL: cur.profile_image,
        name: cur.name,
      });
    }

    return acc;
  }, []);
}

module.exports = {
  projectDataFormatChangeFn,
};
