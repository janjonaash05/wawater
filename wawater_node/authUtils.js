const bcrypt = require("bcryptjs");

class AuthUtils {

    static sysadminUsername = "SYSADMIN";
    static sysadminPassword = "1234";

    static verifySysAdmin(username, password) { return username === AuthUtils.sysadminUsername && password === AuthUtils.sysadminPassword}

    static generateAPassword() {
        return new Promise((resolve, reject) => {
            const saltRounds = 10;
            let password =  Math.random().toString(36).slice(2, 8);
            console.log(password)
            bcrypt.genSalt(saltRounds, (err, salt) => {
                if (err) {
                    reject(err)

                }
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) {
                        reject(err)
                    }
                    resolve({password: password, hash: hash});
                });
            });
        })

    }

    static verifyPassword(password, hash) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, Buffer.from(hash).toString(), (err, r) => {
                if(err) reject(err)
                resolve(r);
            });
        })

    }


    static extractUsernamePasswordFromRequest(req) {
        const authHeader = req.headers['authorization']
        if (!authHeader) {
            return [null, null];
        }
        try
        {
            const login = Buffer.from(authHeader.split(' ')[1], "base64").toString();
            console.log(login);
            const username = login.split(":")[0];
            const password = login.split(":")[1];

            return [username, password];
        }catch (err)
        {
            return [null,null]
        }

    }
}
module.exports = AuthUtils;