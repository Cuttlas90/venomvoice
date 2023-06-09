const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/', function (req, res, next) {
    res.json('user');
});

router.post('/getNonce', controller.getNonce);
router.post('/loginWithPublicKey', controller.loginWithPublicKey);
router.post('/createTransaction', auth.auth, controller.createTransaction);
router.get('/getTransactions', auth.auth, controller.getTransactions);

module.exports = router;