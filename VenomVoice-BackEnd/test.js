var bcrypt = require('bcrypt');
bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash('test', salt, function (err, hash) {
        console.log(hash)
    });
});