const express = require('express');

const router = express.Router();

const { auth } = require('../middlewares/auth');
const { cardImagesUploadMiddleware } = require('../middlewares/upload');
const {
  deleteCardImage,
  inputCardDetails,
  inputCardImages,
  inviteUser,
  loadCardData,
} = require('../controller/card');

// 카드 보기
router.get('/:cardId', auth, loadCardData);
// 카드 이미지 업로드
router.post(
  '/:cardId/images',
  auth,
  cardImagesUploadMiddleware,
  inputCardImages
);
// 카드에 멤버 초대
router.post('/:cardId/invite', auth, inviteUser);
// 카드 이미지 삭제
router.delete('/:cardId/image/:imgId', auth, deleteCardImage);
// 카드 세부정보 입력
router.patch('/:cardId/card-details', auth, inputCardDetails);

module.exports = router;
