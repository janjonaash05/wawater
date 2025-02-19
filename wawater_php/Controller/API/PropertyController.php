<?php

class PropertyController implements IController
{

    public function specific_request($request, $data, $username)
    {
        return match ($request) {
            "get-all" => self::get_all($username),
            "register" => self::register($data, $username),
            "update" => self::update($data, $username),
            "delete" => self::delete($data,$username),
        };
    }

    private static function get_all($username)
    {
        try {
            $client_id = DatabaseConnection::execute_statement_single_row("select id from Client where username = ?", [$username])["id"];
            return DatabaseConnection::execute_statement("select * from Property where client_id = ?", [$client_id]);
        } catch (Exception $e) {
            http_response_code(400);
            return $e->getMessage();
        }
    }

    private static function register($data, $username)
    {

        if (!isset($data["name"], $data["address"])) {
            header(http_response_code(400), true);
            return ["msg" => "invalid parameters (must contain name, address)"];
        }

        $name = $data["name"];
        $address = $data["address"];

        try {
            $client_id = DatabaseConnection::execute_statement_single_row("select id from Client where username = ?", [$username])["id"];
            return DatabaseConnection::execute_statement("insert into Property(name,address,client_id) values (?,?,?)", [$name, $address, $client_id], true);
        } catch (Exception $e) {
            http_response_code(400);
            return $e->getMessage();
        }
    }


    private static function update($data, $username)
    {
        if (!isset($data["id"])) {
            header("HTTP/1.1 444 No ID");
            return "no id";
        }

        try {


            $query = "Update Property set ";

            $params = [];
            if (isset($data["name"])) {
                $query .= "name = ?";
                array_push($params, $data["name"]);
            }
            if (isset($data["address"])) {
                $query .= "address = ?";
                array_push($params, $data["address"]);
            }

            $query .= " where id = ? and client_id = ?";

            array_push($params, $data["id"]);
            $client_id = DatabaseConnection::execute_statement_single_row("select id from Client where username = ?", [$username])["id"];
            array_push($client_id);

            $query = substr(trim($query), 0, -1);
            return DatabaseConnection::execute_statement($query, $params, true);
        } catch (Exception $e) {
            http_response_code(400);
            return $e->getMessage();
        }
    }

    private static function delete($data, $username)
    {
        try {
            $client_id = DatabaseConnection::execute_statement_single_row("select id from Client where username = ?", [$username])["id"];
            return DatabaseConnection::execute_statement("delete from Property where id = ? and client_id = ? ", [$data["id"], $client_id], true);
        } catch (Exception $e) {
            http_response_code(400);
            return $e->getMessage();
        }
    }








    // protected function sendOutput($data, $httpHeaders=array())
    // {
    //     header_remove('Set-Cookie');
    //     if (is_array($httpHeaders) && count($httpHeaders)) {
    //         foreach ($httpHeaders as $httpHeader) {
    //             header($httpHeader);
    //         }
    //     }
    //     echo $data;
    //     exit;
    // }
}