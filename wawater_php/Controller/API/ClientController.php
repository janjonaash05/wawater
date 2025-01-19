<?php
class ClientController
{

    public  static function validate_client($username,$password)
    {
        try
        {
            $row =  DatabaseConnection::execute_statement_single_row("select password from Client where username = ?",[$username]);
            $hash = $row["password"];
            return password_verify($password, $hash);  
        } catch (Exception $e) {
            header("444 err");
            return $e->getMessage();
        }
       
    }

}