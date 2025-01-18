<?php

class PropertyController implements IController
{
   
    public function specific_request($request, $data,$username )
    {
       return match ($request)
       {
        "get-all" => self::get_all($username),
        "register" => self::register($data,$username),
        "update" => self::update($data),
        "delete" => self::delete($data),
       };
    }



    private static function get_all($username)
    {
        $client_id = DatabaseConnection::execute_statement_single_row("select id from Client where username = ?",[$username])["id"];
        return  DatabaseConnection::execute_statement("select * from Property where client_id = ?", [$client_id]);
    }
 
    private static function register($data, $username)
    {
        $name = $data["name"];
        $address = $data["address"];

        $client_id = DatabaseConnection::execute_statement_single_row("select id from Client where username = ?",[$username])["id"];
        return DatabaseConnection::execute_statement("insert into Property(name,address,client_id) values (?,?,?)",[$name, $address, $client_id],true);
         
    }


    private static function update($data)
    {
        if(!isset($data["id"]))
        {
            header("HTTP/1.1 444 No ID");
            return "no id";
        }

        $name = "name";
        $address = "address";

        $params = [];
        if (isset($data["name"]))
        {
            $name = "?";
            array_push($params, $data["name"]);
        }
        if (isset($data["address"]))
        {
            $address = "?";
            array_push($params,$data["address"]);
        } 
        
        array_push($params,$data["id"]);
        return DatabaseConnection::execute_statement("update Property set name = ".$name.",  address = ".$address." where id = ?",$params,true);
        
    }

    private static function delete($data)
    {
        return  DatabaseConnection::execute_statement("delete from Property where id = ?",[$data["id"]],true);
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