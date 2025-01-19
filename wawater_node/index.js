const express = require("express");
const nodemailer = require("nodemailer");
const ExcelUtility = require('./excelUtility.js');
const multer = require("multer");

const clientGW = require("./gateways/clientGateway.js");
const gaugeGW = require("./gateways/gaugeGateway.js");
const firmGW = require("./gateways/firmGateway.js");

const authUtils = require("./authUtils.js");


const app = express();
//app.use(express.static(path.join(__dirname, "public")));
app.use(express.json())
app.use(express.urlencoded({extended: false}));


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


app.post('/firm/client', authenticateAdmin, async (req, res) => {


    const {firm_id, firm_name, client_username, client_email, assign_admin} = req.body;
    if (!client_username || !client_email) return res.status(400).json("Not enough info supplied");


    try {
        let {password, hash} = await authUtils.generateAPassword();
        await clientGW.registerClient(client_username, hash, client_email, firm_id, assign_admin);
        res.status(200).json({password: password});
    } catch (err) {
        res.status(500).json({msg: err})
    }


});

app.put("/firm/client", authenticateAdmin, async (req, res) => {

    const {firm_name, current_client_username, client_email, new_client_username, change_password} = req.body;

    try {
        let new_password_hash = null;
        if (change_password) {
            const pass = await authUtils.generateAPassword();
            new_password_hash = pass.hash;
        }

        await clientGW.updateClient(new_client_username, new_password_hash, client_email, current_client_username);
        res.status(200).send("ok");
    } catch (err) {
        res.status(500).json({msg: err});
    }

})


app.delete("/firm/client", async (req, res) => {

    // let firm_id = req.body.firm_id;
    // let client_username = req.body.client_username;

    try {
        await clientGW.deleteAllClients();
        res.status(200).send("OK");
    } catch (err) {
        res.status(500).json({msg: err});
    }
});


app.post('/firm/decrease-gauges/excel', upload.single("excel"), async (req, res) => {
    try {
        // res.json(Object.getOwnPropertyNames(req.file.buffer));
        let ob = ExcelUtility.readMeterData(Buffer.from(req.file.buffer));
        const {client_info, gauge_data} = ob;

        let client_id = await clientGW.getIdForUsername(client_info.client);

        for (let gauge_line of gauge_data) {
            let gauge_id = await gaugeGW.getIdForGuidAndVerifyOwner(gauge_line.guid, client_id);

            let belongsToFirm = await gaugeGW.gaugeBelongsToFirm(gauge_id, req.body.firm_id)
            if (!!belongsToFirm) return res.status(400).json({msg: gauge_line.guid + " does not belong"})

            let max_registered = await gaugeGW.gaugeRegistered(gauge_id, "GaugeMaxExceeded")
            let month_avg_registered = await gaugeGW.gaugeRegistered(gauge_id, "GaugeMaxExceeded")

            await gaugeGW.insertGaugeDecrease(client_info.date, gauge_id, gauge_line.value);


            if (max_registered) {
                let exceeded = await gaugeGW.gaugeMaxExceededDuringMonthCheck(gauge_id,)

            }

            if (month_avg_registered) {
                let exceeded = await gaugeGW.gaugeMonthAverageExceededCheck()

            }
        }

    } catch (err) {
        res.status(500).json({msg: err});
    }
})


app.post("/client/gauge-trigger/max-exceeded", authenticateClient, async (req, res) => {
    const {client_username, gauge_guid, max_value} = req.body;
    try {
        let gauge_id = await gaugeGW.getIdForGuidAndVerifyOwner(gauge_guid, client_username);
        if (!gauge_id) {
            throw ("Invalid gauge guid");
        }
        await gaugeGW.gaugeMaxExceededRegister(client_id, gauge_id, max_value);
        res.status(200).send("OK");
    } catch (err) {
        res.status(400).json({msg: err});
    }

})


app.post("/client/gauge-trigger/month-avg-exceeded", authenticateClient, async (req, res) => {
    const {client_id, gauge_guid} = req.body;
    try {
        let gauge_id = await gaugeGW.getIdForGuidAndVerifyOwner(gauge_guid, client_id);
        if (!gauge_id) {
            throw ("Invalid gauge guid");
        }
        await gaugeGW.gaugeMonthAverageExceededRegister(client_id, gauge_id);
        res.status(200).send("OK");
    } catch (err) {
        res.status(400).json({msg: err});
    }
})

app.post("/client/gauge-trigger/month-overview", authenticateClient, async (req, res) => {
    const {client_id} = req.body;
    try {
        await gaugeGW.gaugeMonthOverviewRegister(client_id);
        res.status(200).send("OK");
    } catch (err) {
        res.status(400).json({msg: err});
    }
})


// bagr:wbeu1o
async function authenticateClient(req, res, next) {
    let errCallback = () => {
        res.status(401).send("Unathorized")
    }
    const [username, password] = authUtils.extractUsernamePasswordFromRequest(errCallback, req);

    if (!username) return res.status(401).send("Unathorized");
    try {

        let obj = await clientGW.getIdPasswordForUsername(username);
        if (await authUtils.verifyPassword(password, obj.password)) {
            req.body.client_id = obj.id;
            next();
        } else {
            throw ("Unauthorized")
        }
    } catch (err) {
        res.status(400).json({msg: err});
    }
}

// admin:zu7osu pro ddcorp
async function authenticateAdmin(req, res, next) {

    const [username, password] = authUtils.extractUsernamePasswordFromRequest(req);

    if (!username) {
        return res.status(401).send("Unathorized")
    }
    try {
        if (req.body.assign_admin == true) {
            if (username === "SYSADMIN" && password === "1234") {
                req.body.firm_id = await firmGW.getFirmIdWithNoAdminForName(req.body.firm_name);
                next()
                return;
            } else {
                return res.status(401).send("Unathorized for sysadmin")

            }
        }

        let obj = await firmGW.getFirmInfoAndPasswordForAdminUsername(username);
        if (await authUtils.verifyPassword(password, obj.password)) {
            req.body.firm_name = obj.firm_name;
            req.body.firm_id = obj.firm_id;
            next();
        } else {
            return res.status(401).send("Unathorized")
        }
    } catch (err) {
        return res.status(401).json(err);
    }

}


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});