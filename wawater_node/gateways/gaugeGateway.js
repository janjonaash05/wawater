const conn = require("../dbconn.js");

class GaugeGateway {


    static gaugeRegistered(gauge_id, trigger_table) {
        return new Promise((resolve, reject) => {
            conn.query("select 1 from ? where gauge_id = ?", [trigger_table, gauge_id], (err, res) => {
                resolve(!!res);
            })
        });
    }

    static gaugeMonthAverageExceededRegister(client_id, gauge_id) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into GaugeMonthAverageExceeded(client_id, gauge_id) values (?,?)", [client_id, gauge_id], (err, result) => {
                resolve();
            })
        });
    }

    static gaugeMonthOverviewRegister(client_id) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into GaugeMonthOverview(client_id) values (?)", [client_id], (err, result) => {
                resolve();
            })
        });
    }

    static gaugeMaxExceededRegister(client_id, gauge_id, max_value) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into GaugeMaxExceeded(client_id, gauge_id, max_value) values (?,?,?)", [client_id, gauge_id, max_value], (err, result) => {
                resolve();
            })
        });
    }


//// PROCEDURES
    static gaugeBelongsToFirm(gauge_id, property_name, firm_id, username) {
        return new Promise((resolve, reject) => {
            conn.query("call GaugeBelongsToFirmCheck(?,?,?,?, @belongs)", [gauge_id, property_name, firm_id, username], (err, res) => {
                resolve(!!res);
            })
        });
    }

    static gaugeMonthAverageExceededCheck(gauge_id, month, year) {
        return new Promise((resolve, reject) => {
            conn.query("call GaugeMonthAverageExceededCheck(?,?,?, @exceeded)", [gauge_id, month, year], (err, res) => {
                resolve(!!res);
            })
        });
    }

    static gaugeMaxExceededDuringMonthCheck(gauge_guid, month, year) {
        return new Promise((resolve, reject) => {
            conn.query("call GaugeMonthAverageExceededCheck(?,?,?, @exceeded)", [gauge_id, month, year], (err, res) => {
                resolve(!!res);
            })
        });
    }

////

    static insertGaugeDecrease(date, gauge_id, value) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into GaugeDecrease(decrease_date,gauge_id,value) values (?,?,?)", [date, gauge_id, value], (err, res) => {
                resolve();
            })
        });
    }

    static getIdForGuidAndVerifyOwner(guid, client_id) {
        return new Promise((resolve, reject) => {
            conn.query("Select id from Gauge where guid = ? and property_id in (select id from Property where client_id = ?", [guid, client_id], (err, result_gauge) => {
                resolve(result_gauge[0].id);
            })
        });
    }
}

module.exports = GaugeGateway;
