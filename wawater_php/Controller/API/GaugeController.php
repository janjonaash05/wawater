<?php
use Hidehalo\Nanoid\Client;
use Hidehalo\Nanoid\GeneratorInterface;
class GaugeController implements IController
{
    public function specific_request($request, $data,  $username)
    {
        return match ($request)
        {
        "get-all" => self::get_all( $data,$username),
        "register" => self::register($data)
        };
    }

    private static function get_all($data, $username)
    {
        $client_id = DatabaseConnection::execute_statement_single_row("select id from Client where username = ?",[$username])["id"];
       
        $name = $data["property_name"];
        $property_id = DatabaseConnection::execute_statement_single_row("select id from Property where name = ? and client_id = ? ",[$name, $client_id])["id"];
        return  DatabaseConnection::execute_statement("select * from Gauge where property_id = ?", [$property_id]);
    }
 

    public static function register($data)
    {

        if(!isset($data["serial_number"],$data["property_name"],$data["property_name"],$data["gauge_type"],$data["location_sign"]))
        {
            header("400 Invalid parameters");
            return "invalid";
        }


        $client = new Client();
        $guid = $client->formattedId($alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', $size = 8);
        $serial_number = $data["serial_number"];
        $property_name =  $data["property_name"];
        $property_id = DatabaseConnection::execute_statement_single_row("Select id from Property where name = ?",[$property_name])["id"];
        $gauge_type_short_name = $data["gauge_type"];
        $gauge_type_id =   DatabaseConnection::execute_statement_single_row("Select id from GaugeType where short_name = ?",[$gauge_type_short_name])["id"];
        $location_sign = $data["location_sign"];
        
        DatabaseConnection::execute_statement("insert into Gauge(guid,serial_number,property_id,gauge_type_id,location_sign) values (?,?,?,?,?,?)",
        [$guid, $serial_number,$property_id,$gauge_type_id,$location_sign], true);
        return ["guid" => $guid]; 
    }

    public static function update($data)
    {
        $client = new Client();
        
        $serial_number = $data["serial_number"];
        $value =  $data["value"];
        $property_name =  $data["property_name"];
        $property_id = DatabaseConnection::execute_statement("Select id from Property where name = ?",[$property_name]);
        $gauge_type_short_name = $data["gauge_type"];
        $gauge_type_id =   DatabaseConnection::execute_statement("Select id from gaugeType where short_name = ?",[$gauge_type_short_name]);
        $location_sign = $data["location"];
         
    }



}