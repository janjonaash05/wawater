const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const ExcelUtility = require('./excelUtility.js');
const multer = require("multer");
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


const conn = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    database: "wawater",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    port: 3306
});

const storage = multer.memoryStorage();
const upload = multer({storage: storage});


const mymail = "ddcorp@seznam.cz";

const transporter = nodemailer.createTransport({
    host: 'smtp.seznam.cz',
    secure: true,
    port: 587,
    auth: {
        user: mymail,
        pass: 'abc12345'
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    },
});


const PORT = 9009;


const saltRounds = 10;

app.get('/firm/deez', (req, res) => {


    let mailOptions = {
        from: mymail,
        to: mymail,
        subject: 'Registration at ' + "firm_name",
        text: 'Username: ' + "client_username" + " password: " + "password"
    };


    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            res.status(500).json({msg: error});
        } else {
            res.status(200).json({msg: "info"});
        }
    });

    //next();
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
    query += " where id = ?"

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


app.post('/firm/decrease-gauges/excel', upload.single("excel"), (req, res) => {


    try {
        // res.json(Object.getOwnPropertyNames(req.file.buffer));
        let ob = ExcelUtility.readMeterData(Buffer.from(req.file.buffer));
        const {client_info, gauge_data} = ob;

        // conn.query("Select password from User where username = ?", [username, password], (err, results_user) => {
        //     if (results_user.length === 0) {
        //         return res.status(400).json({msg: "User does not exist"});
        //     }
        //     bcrypt.compare(password, Buffer.from(results_user[0].password).toString(), (err, r) => {
        //         if (err) {
        //             return res.status(527).json({msg: err.message});
        //         }
        //
        //         if (r) {
        //             next();
        //         } else {
        //             res.status(400).json({msg: "Incorrect password"});
        //         }
        //
        //     });
        //
        // })
    } catch (err) {
        res.status(500).json({msg: err});
    }
})


app.post("/client/gauge-trigger/max-exceeded", authenticateClient,async (req, res) => {
    const {client_id, gauge_guid, max_value} = req.body;
    if(!gauge_guid) return res.status(400).json({msg: "no guid"});


    let gauge_id = await getGaugeIdForGuid(gauge_guid);
    if(!gauge_id) {return res.status(400).json("invalid gauge guid");}


    conn.query("Insert into GaugeMaxExceeded(client_id, gauge_id, max_value) values (?,?,?)", [client_id, gauge_id, max_value], (err, result) => {
        if (err) {
            res.status(500).json({msg: err});
            return;
        }
        res.status(200).json({msg: "ok"});
    })

})


app.post("/client/gauge-trigger/month-avg-exceeded", authenticateClient,async (req, res) => {
    const {client_id, gauge_guid, month} = req.body;

    if(!gauge_guid) return res.status(400).json({msg: "no guid"});


    let gauge_id = await getGaugeIdForGuid(gauge_guid);
    if(!gauge_id) {return res.status(400).json("invalid gauge guid");}


    conn.query("Insert into GaugeMonthAverageExceeded(client_id, gauge_id, month) values (?,?,?)", [client_id, gauge_id, month], (err, result) => {
        if (err) {
            res.status(500).json({msg: err});
            return;
        }
        res.status(200).json({msg: "ok"});
    })
})

app.post("/client/gauge-trigger/month-overview", authenticateClient,async (req, res) => {
    const {client_id} = req.body;

    conn.query("Insert into GaugeMonthOverview(client_id) values (?,?,?)", [client_id], (err, result) => {
        if (err) {
            res.status(500).json({msg: err});
            return;
        }
        res.status(200).json({msg: "ok"});
    })
})




function getGaugeIdForGuid(guid) {
    return new Promise((resolve, reject) => {
        conn.query("Select id from Gauge where guid = ?", [guid], (err, result_gauge) => {
            if (err || !result_gauge) {
                reject(err);
                return;
            }
            console.log(JSON.stringify(result_gauge))
            resolve(result_gauge[0].id);

        })
    });

}

function checkNotTriggerRegistered(trigger_table,client_id, gauge_id = null)
{

    return new Promise((resolve, reject) => {
        let query = "select 1 from ? client_id = ? ";
        let params = [trigger_table, client_id];
        if(gauge_id)
        {
            query += "and gauge_id = ?";
            params.push(gauge_id);
        }

        conn.query(query, params, (err, res) => {
            if (err || !res) {
                reject(err);
                return;
            }

            return res.length !== 0;

        })
    });
}


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

// bagr:wbeu1o
function authenticateClient(req, res, next) {
    let errCallback = () => {
        res.status(401).send("Unathorized")
    }
    const [username, password] = extractUsernamePasswordFromRequest(errCallback, req);

    if (!username) return res.status(401).send("Unathorized");


    conn.query("Select id,password from Client where username = ?", [username], (err, results_user) => {
        if(err) return res.status(401).send("Unathorized");

        if (results_user.length === 0) {
            return res.status(400).json({msg: "User does not exist"});
        }
        bcrypt.compare(password, Buffer.from(results_user[0].password).toString(), (err, r) => {
            if (err) {
                return res.status(527).json({msg: err.message});
            }

            if (r) {
                req.body.client_id = results_user[0].id;
                next();
            } else {
                res.status(400).json({msg: "Incorrect password"});
            }

        });

    })



}

// admin:zu7osu pro ddcorp
function authenticateAdmin(req, res, next) {

    let errCallback = () => {
        res.status(401).send("Unathorized")
    }
    const [username, password] = extractUsernamePasswordFromRequest(errCallback, req);

    if (!username) {
        errCallback();
        return;
    }

    if (req.body.assign_admin === true) {
        if (username == "SYSADMIN" && password == "1234") {
            conn.query("select id from Firm where name = ? and not exists (select 1 from Client where is_admin = true and firm_id = id)", [req.body.firm_name], (err, result) => {
                if (err) {
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
        } else {
            res.status(401).send("Unathorized")
            return;
        }
    }


    conn.query("Select firm_id, password from Client where username = ? and is_admin = true", [username], (err, results_admin) => {
        if (err) {
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