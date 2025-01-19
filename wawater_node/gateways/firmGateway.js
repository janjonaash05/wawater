const conn = require("../dbconn.js");

class FirmGateway {
    static getFirmNameForId(firm_id) {
        return new Promise((resolve, reject) => {
            conn.query("Select name from Firm where id = ?", [firm_id], (err, res) => {
                resolve(res[0].name);
            })
        });
    }


    static getFirmInfoAndPasswordForAdminUsername(username) {
        return new Promise((resolve, reject) => {
            conn.query("Select firm_id, Firm.name as firm_name, password from Client inner join Firm on Firm.id = Client.firm_id where username = ? and is_admin = true", [username], (err, res) => {
                resolve({firm_name: res[0].firm_name, firm_id: res[0].firm_id, password: res[0].password});
            })
        });
    }


    static getFirmIdWithNoAdminForName(firm_name) {
        return new Promise((resolve, reject) => {
            conn.query("select id from Firm where name = ? and not exists (select 1 from Client where is_admin = true and firm_id = id)", [firm_name], (err, res) => {
                resolve(res[0].id);
            })
        });
    }
}

module.exports = FirmGateway;