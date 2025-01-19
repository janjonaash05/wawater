const bcrypt = require("bcryptjs");

class AuthUtils {


    static generateAPassword() {
        return new Promise((resolve, reject) => {
            const saltRounds = 10;
            let password = Math.random().toString(36).slice(2, 8);
            console.log(password)
            bcrypt.genSalt(saltRounds, (err, salt) => {
                if (err) {
                    throw err;

                }
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) {
                        throw err;
                    }
                    resolve({password: password, hash: hash});
                });
            });
        })

    }

    static verifyPassword(password, hash) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, Buffer.from(hash).toString(), (err, r) => {
                resolve(r);
            });
        })

    }


    static extractUsernamePasswordFromRequest(req) {
        const authHeader = req.headers['authorization']
        if (!authHeader) {
            return [null, null];
        }

        const login = Buffer.from(authHeader.split(' ')[1], "base64").toString();
        console.log(login);
        const username = login.split(":")[0];
        const password = login.split(":")[1];

        return [username, password];

    }
}
module.exports = AuthUtils;