const conn = require("../dbconn.js");
const {reject} = require("nodemailer/.ncurc");
const {json} = require("express");

class GaugeGateway {


    static gaugeRegistered(gauge_id, trigger_table) {
        return new Promise((resolve, reject) => {
            conn.query("select 1 from ? where gauge_id = ?", [trigger_table, gauge_id], (err, res) => {
                if (err) reject(err)
                resolve(!!res);
            })
        });
    }


    static async getAllGaugeTriggers(client_id) {


        let max_exceeded = await new Promise((resolve, reject) => {
            conn.query("Select guid,max_value from GaugeMaxExceeded inner join Gauge on GaugeMaxExceeded.gauge_id = Gauge.id  where GaugeMaxExceeded.client_id = ?", [client_id], (err, result) => {
                if (err) reject(err)
                resolve(result);
            })
        })

        let max_remainder = await new Promise((resolve, reject) => {
            conn.query("Select guid,max_value from GaugeMaxRemainder inner join Gauge on GaugeMaxRemainder.gauge_id = Gauge.id where  GaugeMaxRemainder.client_id = ?", [client_id], (err, result) => {
                if (err) reject(err)
                resolve(result);
            })
        })

        let month_average_exceeded = await new Promise((resolve, reject) => {
            conn.query("Select guid from GaugeMonthAverageExceeded inner join Gauge on GaugeMonthAverageExceeded.gauge_id = Gauge.id   where GaugeMonthAverageExceeded.client_id = ?", [client_id], (err, result) => {
                if (err) reject(err)
                resolve(result);
            })
        })


        let month_overview = await new Promise((resolve, reject) => {
            conn.query("Select 'true' from GaugeMonthOverview where client_id = ?", [client_id], (err, result) => {
                if (err) reject(err)
                resolve(result?.[0]);
            })
        });
        return {max_exceeded: max_exceeded, max_remainder: max_remainder, month_average_exceeded: month_average_exceeded, month_overview: month_overview}


    }


    // triggers


    static gaugeMonthAverageExceededRegister(client_id, gauge_id) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into GaugeMonthAverageExceeded(client_id, gauge_id) values (?,?)", [client_id, gauge_id], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        });
    }

    static gaugeMonthAverageExceededDelete(client_id, gauge_id) {
        return new Promise((resolve, reject) => {
            conn.query("Delete from GaugeMonthAverageExceeded where client_id = ? and gauge_id = ?", [client_id, gauge_id], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        });
    }


    static gaugeMonthOverviewGetAllClients() {
        return new Promise((resolve, reject) => {
            conn.query("Select id,username,email from Client where id in(select client_id from GaugeMonthOverview)", (err, result) => {
                if (err) reject(err)
                resolve(result);
            })
        });
    }

    static gaugeMonthOverviewRegister(client_id) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into GaugeMonthOverview(client_id) values (?)", [client_id], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        });
    }

    static gaugeMonthOverviewDelete(client_id) {
        return new Promise((resolve, reject) => {
            conn.query("Delete from GaugeMonthOverview where client_id = ?", [client_id], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        });
    }

    static gaugeMaxExceededRegister(client_id, gauge_id, max_value) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into GaugeMaxExceeded(client_id, gauge_id, max_value) values (?,?,?)", [client_id, gauge_id, max_value], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        });
    }

    static gaugeMaxExceededDelete(client_id, gauge_id, max_value) {
        return new Promise((resolve, reject) => {
            conn.query("Delete from GaugeMaxExceeded where client_id = ? and gauge_id = ?", [client_id, gauge_id], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        });
    }


    static gaugeMaxRemainderRegister(client_id, gauge_id, max_value) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into GaugeMaxRemainder(client_id, gauge_id, max_value) values (?,?,?)", [client_id, gauge_id, max_value], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        });
    }

    static gaugeMaxRemainderDelete(client_id, gauge_id, max_value) {
        return new Promise((resolve, reject) => {
            conn.query("Delete from GaugeMaxRemainder where client_id = ? and gauge_id = ?", [client_id, gauge_id], (err, result) => {
                if (err) reject(err)
                resolve();
            })
        });
    }


//// PROCEDURES
    static gaugeBelongsToUser(gauge_id, firm_id, client_id) {
        return new Promise((resolve, reject) => {
            conn.query("call GaugeBelongsToUserCheck(?,?,?, @belongs)", [gauge_id, firm_id, client_id], (err, res) => {
                if (err) reject(err)

                conn.query("select @belongs as belongs", (err,res)=>
                {
                    if (err) reject(err)

                    console.log(gauge_id+" "+firm_id+" "+client_id+" "+JSON.stringify(res))
                    resolve(res?.[0]?.belongs);
                })


            })
        });
    }

    static gaugeMonthAverageExceededCheck(gauge_id, month, year) {
        return new Promise((resolve, reject) => {
            conn.query("call GaugeMonthAverageExceededCheck(?,?,?, @exceeded)", [gauge_id, month, year], (err, res) => {
                if (err) reject(err)
                conn.query("select @exceeded as exceeded", (err,res)=>
                {
                    if (err) reject(err)
                    resolve(res?.[0]?.exceeded);
                })
            })
        });
    }

    static gaugeMaxExceededDuringMonthCheck(gauge_id, month, year) {
        return new Promise((resolve, reject) => {
            conn.query("call GaugeMaxExceededDuringMonthCheck(?,?,?, @exceeded)", [gauge_id, month, year], (err, res) => {
                if (err) reject(err)
                conn.query("select @exceeded as exceeded", (err,res)=>
                {
                    if (err) reject(err)
                    resolve(res?.[0]?.exceeded);
                })
            })
        });
    }

    static gaugeMaxRemainderCheck(gauge_id, month, year) {
        return new Promise((resolve, reject) => {
            conn.query("call GaugeMaxRemainderCheck(?,?,?, @remainder)", [gauge_id, +month, +year], (err, res) => {
                if (err) reject(err)
                conn.query("select @remainder as remainder", (err,res)=>
                {
                    if (err) reject(err)
                    resolve(res?.[0]?.remainder);
                })
            })
        });
    }

////

    static insertGaugeDecrease(date, gauge_id, value) {
        return new Promise((resolve, reject) => {
            conn.query("insert into GaugeDecrease(decrease_date, value, gauge_id)  values(DATE_FORMAT(STR_TO_DATE(?, '%e.%c. %Y'), '%Y-%m-%d') ,?,?)", [date, value, gauge_id], (err, res) => {
                if (err) reject(err)
                resolve();
            })
        });
    }

    static getIdForGuidAndVerifyOwner(guid, client_id) {
        return new Promise((resolve, reject) => {
            conn.query("Select id from Gauge where guid = ? and property_id in (select id from Property where client_id = ?)", [guid, client_id], (err, result_gauge) => {
                if (err) reject(err)
                resolve(result_gauge?.[0]?.id);
            })
        });
    }

    static getAllGaugeDecreaseInfo(client_id, date_start, date_end) {
        return new Promise((resolve, reject) => {
            conn.query
            (
                `  select Gauge.guid, Gauge.serial_number, Gauge.location_sign, GaugeType.name as gauge_type, GaugeType.value_unit,Property.name as property_name,
                 Property.address , Sum(GaugeDecrease.value) as gauge_value
            from GaugeDecrease
            right outer join Gauge on GaugeDecrease.gauge_id = Gauge.id and decrease_date between  ? and ?
             right outer join GaugeType on Gauge.gauge_type_id = GaugeType.id
               right outer join Property on Property.id = Gauge.property_id
            and Property.client_id = ?
                group by guid    `,
                [date_start, date_end, client_id], (err, result_gauge) => {
                    if (err) reject(err)
                    resolve(result_gauge);

                })
        });
    }


    static getAllGaugeTypeSpending(client_id, month, year, ignore_gauge_name = false) {
        return new Promise((resolve, reject) => {
            conn.query
            (
                `
select ${!ignore_gauge_name ? "GaugeType.name, GaugeType.value_unit,":""}  sum(value) as value from GaugeDecrease 
        right outer join Gauge on Gauge.id = GaugeDecrease.gauge_id and month(decrease_date) = ? and year(decrease_date) = ?
                 left outer join GaugeType on GaugeType.id = Gauge.gauge_type_id
                 where Gauge.property_id in (select id from Property where client_id = ?)
                 group by GaugeType.name`,
                [month, year, client_id], (err, result_gauge) => {
                    if (err) reject(err)
                    resolve(result_gauge);
                })
        });
    }
}

module.exports = GaugeGateway;
