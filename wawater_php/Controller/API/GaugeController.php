<?php
use Hidehalo\Nanoid\Client;
use Hidehalo\Nanoid\GeneratorInterface;
class GaugeController implements IController
{
    public function specific_request($request, $data, $username)
    {
        return match ($request) {
            "get-all" => self::get_all($data, $username),
            "register" => self::register($data, $username)
        };
    }

    private static function get_all($data, $username)
    {
        try {
            $client_id = DatabaseConnection::execute_statement_single_row("select id from Client where username = ?", [$username])["id"];

            $name = $data["property_name"];
            $property_id = DatabaseConnection::execute_statement_single_row("select id from Property where name = ? and client_id = ? ", [$name, $client_id])["id"];
            return DatabaseConnection::execute_statement("select * from Gauge where property_id = ?", [$property_id]);
        } catch (Exception $e) {
            http_response_code(400);
            return $e->getMessage();
        }
    }


    public static function register($data, $username)
    {

        if (!isset($data["serial_number"], $data["property_name"], $data["gauge_type"], $data["location_sign"])) {
            header(http_response_code(400), true);
            return ["msg" => "invalid parameters"];
        }

        $nanoid = new Client();
        $guid = $nanoid->formattedId($alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', $size = 8);
        try {
            $client_id = DatabaseConnection::execute_statement_single_row("select id from Client where username = ?", [$username])["id"];



            $serial_number = $data["serial_number"];
            $property_name = $data["property_name"];
            $property_id = DatabaseConnection::execute_statement_single_row("Select id from Property where name = ? and client_id = ?", [$property_name, $client_id])["id"];
            $gauge_type_short_name = $data["gauge_type"];
            $gauge_type_id = DatabaseConnection::execute_statement_single_row("Select id from GaugeType where short_name = ?", [$gauge_type_short_name])["id"];
            $location_sign = $data["location_sign"];
            echo $property_name . $client_id  ;
            echo DatabaseConnection::execute_statement(
                "insert into Gauge(guid,serial_number,property_id,gauge_type_id,location_sign) values (?,?,?,?,?)",
                [$guid, $serial_number, $property_id, $gauge_type_id, $location_sign],
                true
            );
            return ["guid" => $guid];
        } catch (Exception $e) {
            http_response_code(400);
            return $e->getMessage();
        }


    }

    public static function update($data, $username)
    {
        if (!isset($data["guid"])) {
            http_response_code(400);
            return "no guid";
        }
        try {

            $client_id = DatabaseConnection::execute_statement_single_row("select id from Client where username = ?", [$username])["id"];

            $query = "Update Gauge set ";

            $params = [];
            if (isset($data["serial_number"])) {
                $query .= "serial_number = ?";
                array_push($params, $data["name"]);
            }
            if (isset($data["property_id"])) {
                $query .= "property_id = ?";
                $property_id = DatabaseConnection::execute_statement_single_row("Select id from Property where id = ? and client_id = ?", [$data["property_id"], $client_id])["id"];
                array_push($params, $property_id);
            }
            if (isset($data["gauge_type"])) {
                $gauge_type_short_name = $data["gauge_type"];
                $gauge_type_id = DatabaseConnection::execute_statement_single_row("Select id from GaugeType where short_name = ?", [$gauge_type_short_name])["id"];
                $query .= "gauge_type_id = ?";
                array_push($params, $gauge_type_id);
            }
            if (isset($data["location_sign"])) {
                $query .= "location_sign = ?";
                array_push($params, $data["location_sign"]);
            }

            $query .= " where guid = ? and property_id in (select id from Property where client_id = ?)";

            array_push($params, $data["guid"]);
            $client_id = DatabaseConnection::execute_statement_single_row("select id from Client where username = ?", [$username])["id"];
            array_push($client_id);

            $query = substr(trim($query), 0, -1);
            return DatabaseConnection::execute_statement($query, $params, true);
        } catch (Exception $e) {
            http_response_code(400);
            return $e->getMessage();
        }

    }



}