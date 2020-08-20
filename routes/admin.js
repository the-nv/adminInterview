var express = require('express');
var router = express.Router();

var scheduleController = require('../controller/scheduleController');

router.get('/', scheduleController.index);

router.get('/schedule/add', scheduleController.schedule_create_get);
router.post('/schedule/add', scheduleController.schedule_create_post);

// router.get('/schedule/delete', scheduleController.schedule_delete_get);
router.post('/schedule/delete', scheduleController.schedule_delete_post);

router.get('/schedule//:id/edit', scheduleController.schedule_edit_get);
router.post('/schedule/:id/edit', scheduleController.schedule_edit_post);

module.exports = router;