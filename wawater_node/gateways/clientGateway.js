const conn = require("../dbconn.js");

class ClientGateway {

    static registerClient(client_username, password_hash, client_email, firm_id, assign_admin = null) {
        return new Promise((resolve, reject) => {
            conn.query("Insert into Client(username, password,email,is_admin, firm_id) values (?,?,?,?,?)", [client_username, password_hash, client_email, assign_admin ?? false, firm_id], (err, res) => {

                if(err) reject(err)
                resolve(!!res);
            })
        });
    }

    static deleteClient(client_username, firm_id) {
        return new Promise((resolve, reject) => {
            conn.query("delete from Client where username = ? and firm_id = ? ", [client_username, firm_id], (err, res) => {
                if(err) reject(err)
                resolve();
            })
        });
    }

    static deleteAllClients() {
        return new Promise((resolve, reject) => {
            conn.query("delete from Client", (err, res) => {
                if(err) reject(err)
                resolve();
            })
        });
    }

    static getIdPasswordForUsername(username) {
        return new Promise((resolve, reject) => {
            conn.query("Select id,password from Client where username = ?", [username], (err, res) => {
                if(err) reject(err)
                resolve({id: res?.[0]?.id, password: res?.[0]?.password});
            })
        });
    }

    static getIdForUsername(username) {
        return new Promise((resolve, reject) => {
            conn.query("Select id from Client where username = ?", [username], (err, res) => {
                if(err) reject(err)
                resolve(res?.[0]?.id);
            })
        });
    }

    static updateClient(new_client_username, password_hash, client_email, current_client_username) {
        return new Promise((resolve, reject) => {
            let params = [];
            let query = "Update Client set "
            if (new_client_username) {
                query += " username = ?,";
                params.push(new_client_username);
            }
            if (password_hash) {
                query += " password = ?,";
                params.push(password_hash);
            }
            if (client_email) {
                query += " email = ?,";
                params.push(password_hash);
            }
            query = query.slice(0, -1);
            query += " where username = ?"
            params.push(current_client_username);
            conn.query(query, params, (err, res) => {
                if(err) reject(err)
                resolve()
            })
        });
    }
}

module.exports = ClientGateway;