//게시글 라우트
const express = require("express");
const router = express.Router();
const path = require("path");
const BoardController = require("../controllers/board-controller");

// 게시글 목록 페이지
router.get("/post/list", BoardController.getList);

// 게시글 신규 작성 페이지
router.get("/post/new", BoardController.getNew);

// 게시글 상세 페이지
router.get("/post/:postId(\\d+)", BoardController.getDetail);

// 게시글 수정 페이지
router.get("/post/update/:postId", BoardController.getModify);

module.exports = router;
