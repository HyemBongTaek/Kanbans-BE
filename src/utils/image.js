const path = require('path');
const sharp = require('sharp');

const { bucket, storageBucket } = require('../firebase');

function getProfileFileStorage(profileImageUrl) {
  const splitUrl = profileImageUrl.split('/');
  const platform = splitUrl[2].split('.')[0];

  return platform;
}

function getProfileFilename(profileImageUrl) {
  const splitUrl = profileImageUrl.split('/');
  const filename = splitUrl[splitUrl.length - 1].split('?')[0].split('%2F')[1];

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
    }

    const image = await sharp(file.buffer);
    const metadata = await image.metadata();

    let resizedImage = null;

    if (metadata.width > 640) {
      resizedImage = await image
        .resize({ width: 640 })
        .withMetadata()
        .toBuffer();
    } else if (metadata.height > 640) {
      resizedImage = await image
        .resize({ height: 640 })
        .withMetadata()
        .toBuffer();
    }

    await bucket
      .file(`profile/${filename}`)
      .createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      })
      .end(resizedImage === null ? file.buffer : resizedImage);

    const profileImageUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/profile%2F${filename}?alt=media`;

    return profileImageUrl;
  } catch (err) {
    const error = new Error(err.message);
    throw error;
  }
}

module.exports = {
  deleteProfileImage,
  getProfileFilename,
  getProfileFileStorage,
  profileImageUploadFn,
};
