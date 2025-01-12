const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

//
//
// import express from 'express';
// import {default as mysql} from 'mysql2';
// import nodemailer from "nodemailer";
// import {default as bcrypt} from 'bcryptjs';


const app = express();
//app.use(express.static(path.join(__dirname, "public")));
app.use(express.json())
app.use(express.urlencoded({extended: false}));

const conn =  mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "wawater",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    port: 3306
});



// conn.connect(function (err) {
//     if (err) {
//         console.error('Error connecting to MySQL: LOLOLOL' + err.message + " " + err.stack);
//     }
//     else
//     {
//         console.log("Connected to MySQL");
//     }
// });


const mymail = "j69420j995@gmail.com";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: false,
    auth: {
        user: mymail,
        pass: 'lowkey455@'
    }
});


const PORT = 9009;


const saltRounds = 10;

app.get('/firm/deez',authenticateAdmin, (req, res) => {

    conn.query("select id from Firm where name = ? and not exists (select 1 from Client where is_admin = true and firm_id = id)", ["jjc"], (err, result) => {
        if(err)
        {
            res.status(500).json({msg: err});
            return;
        }
        if (result.length === 0) {
            res.status(400).json({msg: "Firm does not exists or already has assigned admin"});
            return;
        }
        // let mailOptions = {
        //     from: mymail,
        //     to: mymail,
        //     subject: 'Registration at ' + "firm_name",
        //     text: 'Username: ' + "client_username" + " password: " + "password"
        // };
        //
        // console.log(JSON.stringify(mailOptions));
        // transporter.sendMail(mailOptions, function (error, info) {
        //     if (error) {
        //         console.log(error);
        //     } else {
        //         res.status(200).json({msg: info});
        //     }
        // });
        res.status(200).json(result);

        //next();

    });


})


app.post('/firm/client', authenticateAdmin, (req, res) => {


    const {firm_id, firm_name, client_username, client_email} = req.body;

    const {assign_admin} = req.body;

    let errCallback = (err) => {
        res.status(500).json({msg: err});
    };
    let successCallback = (password, hash) => {


        conn.query("Insert into Client(username, password,email,is_admin, firm_id) values (?,?,?,?,?)", [client_username, hash, client_email, assign_admin ?? false, firm_id], (err, result_client) => {
            if (err) {
                res.status(500).json({msg: err});
                return;
            }

            res.status(200).json({msg: password});

            // let mailOptions = {
            //     from: mymail,
            //     to: client_email,
            //     subject: 'Registration at ' + firm_name,
            //     text: 'Username: ' + client_username + " password: " + password
            // };
            //
            // transporter.sendMail(mailOptions, function (error, info) {
            //     if (error) {
            //         console.log(error);
            //     } else {
            //         res.status(200).json({msg: info});
            //     }
            // });
        })
    };


    generateAPassword(errCallback, successCallback);
});

app.put("/firm/client", authenticateAdmin, (req, res) => {

    const {firm_name, client_username, client_email, change_password} = req.body;

    let params = [];
    let query = "Update Client set ";
    if (client_username) {
        query += " username = ? and";
        params.push(client_username);
    }
    if (client_email) {
        query += " email = ? and";
        params.push(client_email);
    }
    if (change_password) {
        query += " password = ? and";
    }
    query = query.slice(0, query.length - 3);

    let errCallback = (err) => {
        res.status(500).json({msg: err});
    };


    let updateCallback = (potentialPassword, potentialHash) => {
        if (potentialHash) {
            params.push(potentialHash);
        }


        conn.query(query, params, (err, result_client) => {
            if (err) {
                res.status(500).json({msg: err});
                return;
            }

            let mailOptions = {
                from: mymail,
                to: client_email,
                subject: 'Update at ' + firm_name,
                text: 'Username: ' + client_username + (potentialPassword ? " password: " + potentialPassword : "")
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    res.status(200).json({msg: info});
                }
            });
        })

    }

    if (change_password) {
        generateAPassword(errCallback, updateCallback)
    } else {
        updateCallback(null, null);
    }


})


app.delete("/firm/client", authenticateAdmin, (req, res) => {

});

app.get("/client/validate")


function generateAPassword(errorCallback, callback) {
    let password = Math.random().toString(36).slice(2, 8);
    console.log(password)
    bcrypt.genSalt(saltRounds, (err, salt) => {
        if (err) {
            errorCallback(err);
            return;
        }
        bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
                errorCallback(err);
                return;

            }

            callback(password, hash);

        })
    });


}


function extractUsernamePasswordFromRequest(errCallback, req) {
    const authHeader = req.headers['authorization']
    if (!authHeader) {

        errCallback();
        return [null, null];
    }

    const login = Buffer.from(authHeader.split(' ')[1], "base64").toString();
    console.log(login);
    const username = login.split(":")[0];
    const password = login.split(":")[1];

    return [username, password];

}

// bagr:6kw37n
function authenticateClient(req, res, next) {
    let errCallback = () => {
        res.status(401).send("Unathorized")
    }
    const [username, password] = extractUsernamePasswordFromRequest(errCallback, req);

    if (!username) return;


    conn.query("Select password from User where username = ?", [username, password], (err, results_user) => {
        if (results_user.length === 0) {
            return res.status(400).json({msg: "User does not exist"});
        }
        bcrypt.compare(password, Buffer.from(results_user[0].password).toString(), (err, r) => {
            if (err) {
                return res.status(527).json({msg: err.message});
            }

            if (r) {
                next();
            } else {
                res.status(400).json({msg: "Incorrect password"});
            }

        });

    })


    next()
}

// admin:msrpvc pro jjc
function authenticateAdmin(req, res, next) {

    let errCallback = () => {
        res.status(401).send("Unathorized")
    }
    const [username, password] = extractUsernamePasswordFromRequest(errCallback, req);

    if (!username) {
        errCallback();
        return;
    }

    if(req.body.assign_admin === true)
    {
        if (username == "SYSADMIN" && password == "1234") {
            conn.query("select id from Firm where name = ? and not exists (select 1 from Client where is_admin = true and firm_id = id)", [req.body.firm_name], (err, result) => {
                if(err)
                {
                    res.status(500).json({msg: err});
                    return;
                }
                if (result.length === 0) {
                    res.status(400).json({msg: "Firm does not exists or already has assigned admin"});
                    return;
                }
               // res.status(200).json({msg: result.length});
                 req.body.firm_id = result[0].id;
                console.log(JSON.stringify(result));
                next();

                //next();

            });

            return;
        }
        else
        {
            res.status(401).send("Unathorized")
            return;
        }
    }



    conn.query("Select firm_id, password from Client where username = ? and is_admin = true", [username], (err, results_admin) => {
        if(err)
        {
            return res.status(527).json({msg: err.message});
        }


        if (results_admin.length === 0) {
            return res.status(400).json({msg: "User does not exist"});
        }


        bcrypt.compare(password, Buffer.from(results_admin[0].password).toString(), (err, r) => {
            if (err) {
                return res.status(527).json({msg: err.message});
            }


            let firm_id = results_admin[0].firm_id

            if (r) {
                conn.query("Select name from Firm where id = ?", [firm_id], (err, result_firm) => {
                    if (err) {
                        return res.status(527).json({msg: err.message});
                    }

                    req.body.firm_name = result_firm[0].name;
                    req.body.firm_id = firm_id;
                    next();

                });
            } else {
                res.status(400).json({msg: "Incorrect password"});
            }

        });

    })
}


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});