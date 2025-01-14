<?php
class ClientController implements IController
{

    public function specific_request($request, $data, $username)
    {
        
    }


    public  static function validate_client($username,$password)
    {
        $row =  DatabaseConnection::execute_statement_single_row("select password from Client where username = ?",[$username]);
        $hash = $row["password"];
         return password_verify($password, $hash);  
    }

}