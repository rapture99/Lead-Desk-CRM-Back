const router = require('express').Router();
const { addNote } = require('../controllers/note.controller'); 

router.post('/:id/notes', addNote);

module.exports = router;