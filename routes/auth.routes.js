const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', requireAuth, controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router; 
