<?php

class DatabaseConnection
{
    protected static $connection = null;
    private static function Init()
    {
      
        try {
            self::$connection = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE_NAME);
    	
            if ( mysqli_connect_errno()) {
                throw new Exception("Could not connect to database.");   
            }
        } catch (Exception $e) {
            return $e->getMessage();  
        }			
    }
    // public static function select($query = "" , $params = [])
    // {
    //     try {

           


    //         $stmt = self::execute_statement( $query , $params );
    //         $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);				
    //         $stmt->close();
    //         return $result;
    //     } catch(Exception $e) {
    //         throw New Exception( $e->getMessage() );
    //     }
    //     return false;
    // }
    
    public static function execute_statement($query = "" , $params = [],$ignore_result = false)
    {
        try {

            if(self::$connection == null) self::Init();
            
            if($ignore_result)
            {
                self::$connection->execute_query($query, $params );
                return "OK";
            } 
            else 
            {
                return self::$connection->execute_query($query, $params )->fetch_all(MYSQLI_ASSOC);
            }
        } catch(Exception $e) {
            return $e->getMessage().$query;  
        }	
    }

    public static function execute_statement_single_row($query = "" , $params = [])
    {
        try {

            if(self::$connection == null) self::Init();
            
            return self::$connection->execute_query($query, $params )->fetch_all(MYSQLI_ASSOC)[0];
        } catch(Exception $e) {
            return $e->getMessage();  
        }	
    }


}
