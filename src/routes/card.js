const express = require('express');

const router = express.Router();

const { auth } = require('../middlewares/auth');
const { cardImagesUploadMiddleware } = require('../middlewares/upload');
const {
  deleteCardImage,
  deleteUserInCard,
  inputCardDetails,
  inputCardImages,
  inviteUser,
  loadCardData,
} = require('../controller/card');
const { addCardLabel, deleteCardLabel } = require('../controller/label');

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
// 카드에서 멤버 삭제
router.delete('/:cardId/exit/:userId', auth, deleteUserInCard);
// 카드 세부정보 입력
router.patch('/:cardId/card-details', auth, inputCardDetails);

// 카드에 라벨 추가
router.post('/:cardId/label', auth, addCardLabel);
// 카드에서 라벨 삭제
router.delete('/:cardId/label/:labelId', auth, deleteCardLabel);

module.exports = router;
