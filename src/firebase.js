const admin = require('firebase-admin');

const serviceAccount = require('../serviceAccountKey.json');

const storageBucket = 'kanbanproject-3c80b.appspot.com';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket,
});

const bucket = admin.storage().bucket();

module.exports = {
  bucket,
  storageBucket,
};
