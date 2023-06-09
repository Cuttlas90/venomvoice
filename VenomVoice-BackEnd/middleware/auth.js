const jwt = require('jsonwebtoken');
const user = "";
const pass = '';
const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    auth: function (req, res, next) {
        jwt.verify(req.headers.authtoken, process.env.SECRET, function (err, decoded) {
            if (err) return res.send(401);
            req.userId = decoded.data.id;
            next()
        });
    },
    api: function (req, res, next) {
        let userPass = Buffer.from(req.headers.authorization.split(' ')[1], "base64").toString().split(':');
        if (userPass[0] !== user || userPass[1] !== pass) return res.json({
            hasError: true,
            data: [],
            error: {message: 'authentication error'}
        });
        next()
    }
};
