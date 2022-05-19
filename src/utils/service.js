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

function getProfileFileStorage(profileImageUrl) {
  const splitUrl = profileImageUrl.split('/');
  const platform = splitUrl[2].split('.')[0];

  return platform;
}

function getProfileFilename(profileImageUrl) {
  const splitUrl = profileImageUrl.split('/');
  const filename = splitUrl[splitUrl.length - 1].split('?')[0];

  return filename;
}

async function deleteProfileImage(filename) {
  try {
    await bucket.file(`profile/${filename}`).delete();
  } catch (err) {
    throw new Error(err.message);
  }
}

async function profileImageUploadFn(file, id, profileImage) {
  const ext = path.extname(file.originalname);
  const filename = `profile_${id}_${Date.now()}${ext}`;

  const imageStorage = getProfileFileStorage(profileImage);

  try {
    if (imageStorage === 'firebasestorage') {
      const imageFilename = getProfileFilename(profileImage);
      await deleteProfileImage(imageFilename);
      // await bucket.file(`profile/${imageFilename}`).delete();
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
  getBytes,
  deleteProfileImage,
  getProfileFilename,
  getProfileFileStorage,
  projectDataFormatChangeFn,
  profileImageUploadFn,
};
