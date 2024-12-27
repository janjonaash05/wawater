const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const app = express();


app.use(express.static(path.join(__dirname, "public")));
app.use(express.json())
app.use(express.urlencoded({extended: false}));

const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "coffe_lmsoft_cz",
    port: 3306
});

conn.connect(function (err) {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
    }
});


const mymail = "j69420j995@gmail.com";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mymail,
        pass: 'lowkey455@'
    }
});


const PORT = 8083

var str =
    `{
firm_name: ..,
client_username: ..,
client_email: ..,





}`

const saltRounds = 10;

app.post('/firm/register-client', authenticateAdmin, async (req, res) => {

    let password = Math.random().toString(36).slice(2, 8);

    const {firm_id, firm_name, client_username, client_email} = req.body;


    bcrypt.genSalt(saltRounds, (err, salt) => {
        if (err) {
            res.status(500).json({msg: err});
            return;
        }
        bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
                res.status(500).json({msg: err});
                return;
            }

            conn.query("insert into User(username, password) values (?,?)", [client_username, hash], (err, result_user) => {
                if (err) {
                    res.status(500).json({msg: err});
                    return;
                }
                conn.query("Insert into Client(email, user_id, firm_id) values (?,?,?)",[client_email,result_user.insertId, firm_id], (err, result_client) =>
                {
                    if (err) {
                        res.status(500).json({msg: err});
                        return;
                    }

                    let mailOptions = {
                        from: mymail,
                        to: client_email,
                        subject: 'Registration at '+firm_name,
                        text: 'Username: '+client_username + " password: "+password
                    };

                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                        } else {
                           res.status(200).json({msg: info});
                        }
                    });
                })
            })
        });
    });
});

app.get("/firm/update-client",authenticateAdmin, (req, res) => {


})





function authenticate(req, res, next) {
    const authHeader = req.headers['authorization']

    if (!authHeader) res.status(401).send("Unathorized");


    const login = Buffer.from(authHeader.split(' ')[1], "base64").toString();
    console.log(login);
    const username = login.split(":")[0];
    const password = login.split(":")[1];


    console.log(username + " " + password);
    if (username != "coffe" || password != "kafe") {
        res.status(401).send("Unathorized");
        return;
    }

    next()
}


function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization']

    if (!authHeader) res.status(401).send("Unathorized");


    const login = Buffer.from(authHeader.split(' ')[1], "base64").toString();
    console.log(login);
    const username = login.split(":")[0];
    const password = login.split(":")[1];


    conn.query("Select id, password from User where username = ?", [username], (err, results_admin) => {
        if (results_admin.length === 0) {
            return res.status(400).json({msg: "User does not exist"});
        }


        bcrypt.compare(password, Buffer.from(results_admin[0].password).toString(), (err, r) => {
            if (err) {
                return res.status(527).json({msg: err.message});
            }

            if (r) {
                conn.query("Select name, id from Firm where user_admin_id = ?", [results_admin[0].id], (err, result_firm) => {
                    req.body.firm_name = result_firm[0].name;
                    req.body.firm_id = result_firm[0].id;
                    next();

                });
            } else {
                res.status(400).json({msg: "Incorrect password"});
            }

        });

    })
}

function getAll(tablename, callback) {
    let res;
    conn.query('SELECT * FROM ' + tablename, (err, results) => {
        if (err) {
            console.error('Error executing query: ' + err.stack);
            res.status(500).send('Error fetching users');
            return;
        }
        callback(err, results)

    });
}

function getSummaryOfDrinks(month, callback) {
    let query = "SELECT types.typ, count(drinks.ID) as pocet,people.name as osoba FROM `drinks` JOIN people on drinks.id_people=people.ID JOIN types on drinks.id_types=types.ID";
    if (month > 0 && month < 13) {
        query += " WHERE MONTH( `date` ) = " + month;
    }
    query += " group by types.typ"


    let res;
    conn.query(query, (err, results) => {
        if (err) {

            console.log(results);
            console.error('Error executing query: ' + err.stack);
            res.status(500).send('Error fetching users');
            return;
        }

        callback(err, results)

    });
}


function saveDrinks(id_people, drinks, callback) {
    let date_time = new Date();
    const date = date_time.getFullYear() + "-" + (date_time.getMonth() + 1) + "-" + date_time.getDate();
    let query = `INSERT INTO DRINKS(date, id_people, id_types) values `;

    for (let i = 0; i < drinks.length; i++) {
        for (let j = 0; j < drinks[i]; j++) {

            query += `${(i == 0 && j == 0) ? "" : ","}('${date}',${id_people},${i + 1}) `
        }
    }

    console.log(query);

    conn.query(query) , (err, results) => {
        if (err) {
            res.status(500).send('Error fetching users');
            return;
        }
        console.log(results);
        callback(err, results)
    }
}


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});