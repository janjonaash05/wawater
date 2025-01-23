const express = require("express");
const nodemailer = require("nodemailer");
const ExcelUtility = require('./excelUtility.js');
const multer = require("multer");

const clientGW = require("./gateways/clientGateway.js");
const gaugeGW = require("./gateways/gaugeGateway.js");
const firmGW = require("./gateways/firmGateway.js");

const authUtils = require("./authUtils.js");
const {json} = require("express");

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
    port: 465,
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

app.get('/firm/deez', async (req, res) => {


    let mailOptions = {
        from: mymail,
        to: mymail,
        subject: 'Registration at ' + "firm_name",
        text: 'Username: ' + "client_username" + " password: " + "password"
    };


    await transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            res.status(500).json({msg: error});
        } else {
            res.status(200).json({msg: "info"});
        }
    });


    //next();
})

app.put("/firm/update", authenticateAdmin, async (req, res) =>
{
    let {username, name, email} = req.body;
    try {
        if(username !== authUtils.sysadminUsername)
            throw "Invalid Username";
        await firmGW.updateFirm(name, email);
    } catch (err) {
        res.status(500).json(err);
    }
})


app.post('/firm/register', authenticateAdmin, async (req, res) => {
    let {username, name, email} = req.body;

    try {
        if(username !== authUtils.sysadminUsername)
            throw "Invalid Username";
        await firmGW.registerFirm(name, email);
    } catch (err) {
        res.status(500).json(err);
    }


})

app.post('/firm/delete', authenticateAdmin, async (req, res) => {
    let {username, firm_name} = req.body;

    try {
        if(username !== authUtils.sysadminUsername)
            throw "Invalid Username";
        await firmGW.deleteFirm(firm_name);
    } catch (err) {
        res.status(500).json(err);
    }


})




app.post('/firm/client/register', authenticateAdmin, async (req, res) => {


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

app.put("/firm/client/update", authenticateAdmin, async (req, res) => {

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


app.delete("/firm/client/delete", async (req, res) => {

    // let firm_id = req.body.firm_id;
    // let client_username = req.body.client_username;

    try {
        await clientGW.deleteAllClients();
        res.status(200).send("OK");
    } catch (err) {
        res.status(500).json({msg: err});
    }
});


app.post('/firm/decrease-gauges/excel', authenticateAdmin, upload.single("excel"), async (req, res) => {
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


app.get("/client/excel-overview", authenticateClient, async (req, res) => {
    let client_id = req.body.client_id;



    try {

        let report = await GetReport(client_id);

        res.status(200).setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet").send(report);
    } catch (err) {
        res.status(520).json({err: err});
    }

});


async function GetReport(client_id)
{
    let current_date = new Date();
    let all_gauge_data = await gaugeGW.getAllGaugeDecreaseInfo(client_id, get_previous_month_date(current_date), current_date);
    let gauge_type_month_spendings = [];

    let headers_january_spending = await gaugeGW.getAllGaugeTypeSpending(client_id, 1, 2)
    for (let row of headers_january_spending) {
        gauge_type_month_spendings.push(Object.values(row)); //set initial gauge name and january spending
    }

    for (let i = 2; i < 11; i++) {
        let only_month_spending = await gaugeGW.getAllGaugeTypeSpending(client_id, i, i + 1, true)

        for (let j = 0; j < only_month_spending.length; j++) {
            gauge_type_month_spendings[j].push(only_month_spending[j].value);
        }
    }

    let report = ExcelUtility.createMeterReport({
        all_gauge_data: all_gauge_data,
        gauge_type_month_spendings: gauge_type_month_spendings
    }, current_date.getMonth(), current_date.getFullYear());
}




function get_previous_month_date(date, set_first_day = false) {
    return new Date(date.getFullYear(), date.getMonth() - 1, date.getDay());
}

app.post("/client/gauge-trigger/max-exceeded/register", authenticateClient, async (req, res) => {
    const {client_username, client_id, gauge_guid, max_value} = req.body;
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


app.delete("/client/gauge-trigger/max-exceeded/delete", authenticateClient, async (req, res) => {
    const {client_username, client_id, gauge_guid} = req.body;
    try {
        let gauge_id = await gaugeGW.getIdForGuidAndVerifyOwner(gauge_guid, client_username);
        if (!gauge_id) {
            throw ("Invalid gauge guid");
        }
        await gaugeGW.gaugeMaxExceededDelete(client_id, gauge_id);
        res.status(200).send("OK");
    } catch (err) {
        res.status(400).json({msg: err});
    }
})


app.post("/client/gauge-trigger/month-avg-exceeded/register", authenticateClient, async (req, res) => {
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

app.delete("/client/gauge-trigger/month-avg-exceeded/delete", authenticateClient, async (req, res) => {
    const {client_id, gauge_guid} = req.body;
    try {
        let gauge_id = await gaugeGW.getIdForGuidAndVerifyOwner(gauge_guid, client_id);
        if (!gauge_id) {
            throw ("Invalid gauge guid");
        }
        await gaugeGW.gaugeMonthAverageExceededDelete(client_id, gauge_id);
        res.status(200).send("OK");
    } catch (err) {
        res.status(400).json({msg: err});
    }
})

app.post("/client/gauge-trigger/month-overview/register", authenticateClient, async (req, res) => {
    const {client_id} = req.body;
    try {
        await gaugeGW.gaugeMonthOverviewRegister(client_id);
        res.status(200).send("OK");
    } catch (err) {
        res.status(400).json({msg: err});
    }
})

app.delete("/client/gauge-trigger/month-overview/delete", authenticateClient, async (req, res) => {
    const {client_id} = req.body;
    try {
        await gaugeGW.gaugeMonthOverviewDelete(client_id);
        res.status(200).send("OK");
    } catch (err) {
        res.status(400).json({msg: err});
    }
})


// bagr:bagr
async function authenticateClient(req, res, next) {
    const [username, password] = authUtils.extractUsernamePasswordFromRequest(req);

    if (!username || !password) return res.status(401).send("Unathorized");

    if (authUtils.verifySysAdmin(username, password)) {
        next();
        return;
    }

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

    if (!username || !password) {
        return res.status(401).send("Unathorized")
    }
    try {
        if (req.body.assign_admin == true) {
            if (authUtils.verifySysAdmin(username, password)) {
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

setTimeout(async () => {

    let date = new Date();
    if (date.getDay() === 1)
    {

       let data = await gaugeGW.gaugeMonthOverviewGetAllClients()
        for(let row of data)
        {
            const {id, username, email} = row;

            let report = await GetReport(id);
        }

    }




}, 86_400_000);
