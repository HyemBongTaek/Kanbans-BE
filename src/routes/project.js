const express = require('express');

const { auth } = require('../middlewares/auth');
const {
  bookmark,
  createProject,
  deleteProject,
  getMembers,
  getProjectInviteCode,
  leaveProject,
  loadAllProject,
  joinProject,
  updateProject,
} = require('../controller/project');
const { updateBoardLocation } = require('../controller/board');
const { getUninvitedMembers } = require('../controller/card');
const { createLabel } = require('../controller/label');

const router = express.Router();

// 프로젝트 생성
router.post('/', auth, createProject);
// 프로젝트 불러오기
router.get('/', auth, loadAllProject);
// 프로젝트 초대코드 불러오기
router.get('/:projectId/invite-code', auth, getProjectInviteCode);
// 프로젝트 멤버 불러오기
router.get('/:projectId/members', auth, getMembers);
// 프로젝트 수정
router.patch('/:id', auth, updateProject);
// 프로젝트 삭제
router.delete('/:id', auth, deleteProject);
// 프로젝트 북마크
router.post('/bookmark', auth, bookmark);
// 프로젝트 참가
router.post('/join', auth, joinProject);
// 프로젝트 나가기
router.delete('/leave/:id', auth, leaveProject);

// 보드 위치 변경
router.patch('/:projectId/board-location', auth, updateBoardLocation);

// 카드에 초대되지 않은 멤버보기
router.get('/:projectId/card/:cardId', auth, getUninvitedMembers);

// 라벨 추가
router.post('/:projectId/label', auth, createLabel);

module.exports = router;
