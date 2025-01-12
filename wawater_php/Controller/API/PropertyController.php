<?php
class PropertyController implements IController
{
   
    public function specific_request($request, $data)
    {
    
       return match ($request)
       {
        "get-all" => self::GetAll(),
        default => "asas"
       };
        
    }


    private static function GetAll()
    {
        return DatabaseConnection::execute_statement("select * from Firm");
    }
 


    private static function Create($data)
    {
        $name = $data["name"];
        $address = $data["address"];
        $client_username = $data["client_username"];
        
        $client_id = DatabaseConnection::execute_statement("select id from Client where username = ?",[$client_username]);
        DatabaseConnection::execute_statement("insert into Property(name,adress,client_id) values (?,?,?)",[$name, $address, $client_id]);
    }



   






    protected function sendOutput($data, $httpHeaders=array())
    {
        header_remove('Set-Cookie');
        if (is_array($httpHeaders) && count($httpHeaders)) {
            foreach ($httpHeaders as $httpHeader) {
                header($httpHeader);
            }
        }
        echo $data;
        exit;
    }
}