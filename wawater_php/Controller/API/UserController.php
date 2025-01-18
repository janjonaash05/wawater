<?php
class UserController implements IController
{

    public function specific_request($request, $data)
    {
        
    }


    private  static function ValidateUser($username,$password)
    {
        $hash =  DatabaseConnection::execute_statement("select password from Client where username = ?",[$username]);
        return password_verify($password, $hash);  
    }

}