<?php
class ClientController implements IController
{

    public function specific_request($request, $data)
    {
        
    }


    public  static function validate_client($username,$password)
    {
        $hash =  DatabaseConnection::execute_statement("select password from Client where username = ?",[$username]);
        return password_verify($password, $hash);  
    }

}