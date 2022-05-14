const path = require('path');
const { bucket, storageBucket } = require('../firebase');

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

async function profileImageUploadFn(file, id, profileImage) {
  const ext = path.extname(file.originalname);
  const filename = `profile_${id}_${Date.now()}${ext}`;

  const splitUrl = profileImage.split('/');
  const platform = splitUrl[2].split('.')[0];

  try {
    if (platform === 'firebasestorage') {
      const prevFilename = splitUrl[splitUrl.length - 1].split('?')[0];
      await bucket.file(`profile/${prevFilename}`).delete();
    }

    await bucket
      .file(`profile/${filename}`)
      .createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      })
      .end(file.buffer);

    const profileImageUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/profile/${filename}?alt=media`;

    return profileImageUrl;
  } catch (err) {
    const error = new Error(err.message);
    throw error;
  }
}

module.exports = {
  projectDataFormatChangeFn,
  profileImageUploadFn,
};
