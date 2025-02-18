const conn = require("../dbconn.js");

class GaugeGateway {


    static gaugeRegistered(gauge_id, trigger_table) {
        return new Promise((resolve, reject) => {
            conn.query("select 1 from ? where gauge_id = ?", [trigger_table, gauge_id], (err, res) => {
                if(err) reject(err)
                resolve(!!res);
            })
        });
    }

    static gaugeMonthAverageExceededRegister(client_id, gauge_id) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into GaugeMonthAverageExceeded(client_id, gauge_id) values (?,?)", [client_id, gauge_id], (err, result) => {
                if(err) reject(err)
                resolve();
            })
        });
    }

    static gaugeMonthAverageExceededDelete(client_id, gauge_id) {
        return new Promise((resolve, reject) => {
            conn.query("Delete from GaugeMonthAverageExceeded where client_id = ? and gauge_id = ?", [client_id, gauge_id], (err, result) => {
                if(err) reject(err)
                resolve();
            })
        });
    }


    static gaugeMonthOverviewGetAllClients() {
        return new Promise((resolve, reject) => {
            conn.query("Select id,username,email from Client where id in(select client_id from GaugeMonthOverview)", (err, result) => {
                if(err) reject(err)
                resolve(result);
            })
        });
    }

    static gaugeMonthOverviewRegister(client_id) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into GaugeMonthOverview(client_id) values (?)", [client_id], (err, result) => {
                if(err) reject(err)
                resolve();
            })
        });
    }

    static gaugeMonthOverviewDelete(client_id) {
        return new Promise((resolve, reject) => {
            conn.query("Delete from GaugeMonthOverview where client_id = ?", [client_id], (err, result) => {
                if(err) reject(err)
                resolve();
            })
        });
    }

    static gaugeMaxExceededRegister(client_id, gauge_id, max_value) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into GaugeMaxExceeded(client_id, gauge_id, max_value) values (?,?,?)", [client_id, gauge_id, max_value], (err, result) => {
                if(err) reject(err)
                resolve();
            })
        });
    }

    static gaugeMaxExceededDelete(client_id, gauge_id, max_value) {
        return new Promise((resolve, reject) => {
            conn.query("Delete from GaugeMonthOverview where client_id = ? and gauge_id = ?", [client_id, gauge_id], (err, result) => {
                if(err) reject(err)
                resolve();
            })
        });
    }


//// PROCEDURES
    static gaugeBelongsToUser(gauge_id, property_name, firm_id, username) {
        return new Promise((resolve, reject) => {
            conn.query("call GaugeBelongsToUserCheck(?,?,?,?, @belongs)", [gauge_id, property_name, firm_id, username], (err, res) => {
                if(err) reject(err)
                resolve(!!res);
            })
        });
    }

    static gaugeMonthAverageExceededCheck(gauge_id, month, year) {
        return new Promise((resolve, reject) => {
            conn.query("call GaugeMonthAverageExceededCheck(?,?,?, @exceeded)", [gauge_id, month, year], (err, res) => {
                if(err) reject(err)
                resolve(!!res);
            })
        });
    }

    static gaugeMaxExceededDuringMonthCheck(gauge_id, month, year) {
        return new Promise((resolve, reject) => {
            conn.query("call GaugeMaxExceededDuringMonthCheck(?,?,?, @exceeded)", [gauge_id, month, year], (err, res) => {
                if(err) reject(err)
                resolve(!!res);
            })
        });
    }

////

    static insertGaugeDecrease(date, gauge_id, value) {
        return new Promise((resolve, reject) => {
            conn.query("insert into GaugeDecrease(decrease_date, value, gauge_id)  values(DATE_FORMAT(STR_TO_DATE(?, '%e.%c. %Y'), '%Y-%m-%d') ,?,?)", [date, value, gauge_id ], (err, res) => {
                if(err) reject(err)
                resolve();
            })
        });
    }

    static getIdForGuidAndVerifyOwner(guid, client_id) {
        return new Promise((resolve, reject) => {
            conn.query("Select id from Gauge where guid = ? and property_id in (select id from Property where client_id = ?)", [guid, client_id], (err, result_gauge) => {
                if(err) reject(err)
                resolve(result_gauge?.[0]?.id);
            })
        });
    }

    static getAllGaugeDecreaseInfo(client_id, date_start, date_end) {
        return new Promise((resolve, reject) => {
            conn.query
            (
                `  select Gauge.guid, Gauge.serial_number, Gauge.location_sign, GaugeType.name as gauge_type, GaugeType.value_unit,Property.name as property_name, GaugeDecrease.decrease_date,
                 Property.address , Sum(GaugeDecrease.value) as gauge_value
            from GaugeDecrease
            right outer join Gauge on GaugeDecrease.gauge_id = Gauge.id and decrease_date between  ? and ?
             right outer join GaugeType on Gauge.gauge_type_id = GaugeType.id
               right outer join Property on Property.id = Gauge.property_id
            and Property.client_id = ?
                group by guid    `,
                [date_start, date_end,client_id], (err, result_gauge) => {
                    if(err) reject(err)
                    resolve(result_gauge);

                })
        });
    }




    static getAllGaugeTypeSpending(client_id, month_start, month_end, ignore_gauge_name = false) {
        return new Promise((resolve, reject) => {
            conn.query
            (
                `
select ${!ignore_gauge_name ? "GaugeType.name, GaugeType.value_unit,":""}  sum(value) as value from GaugeDecrease 
        right outer join Gauge on Gauge.id = GaugeDecrease.gauge_id and month(decrease_date) between ? and ?
                 left outer join GaugeType on GaugeType.id = Gauge.gauge_type_id
                 where Gauge.property_id in (select id from Property where client_id = ?)
                 group by GaugeType.name`,
                [month_start, month_end,client_id], (err, result_gauge) => {
                    if(err) reject(err)
                resolve(result_gauge);
            })
        });
    }
}

module.exports = GaugeGateway;
