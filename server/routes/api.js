const express = require('express');
const router = express.Router();
const cors = require('cors');

router.use(cors());

const questionController = require('../controller/questionController');
const answerController = require('../controller/answerController');
const recordController = require('../controller/recordController')

// PUT & DELETE temporarily disabled for security.

router.get('/question', questionController.all);
router.get('/question/:id', questionController.getOne);
router.post('/question', questionController.create);
// router.put('/question/:id', questionController.update);
// router.delete('/question/:id', questionController.remove);

router.get('/answer', answerController.all);
router.get('/answer/:id', answerController.getOne);
router.get('/upvoteAnswer/:id', answerController.upvote);
router.get('/downvoteAnswer/:id', answerController.downvote);
router.post('/answer', answerController.create);
// router.put('/answer/:id', answerController.update);
// router.delete('/answer/:id', answerController.remove);
router.get('/answerOfQuestion/:question_id', answerController.getByQuestion);

router.get('/record/upvote', recordController.getUpvoted);
router.get('/record/downvote', recordController.getDownvoted);
router.get('/record', recordController.getAll);


module.exports = router;