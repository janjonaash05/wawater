<?php
// echo $_SERVER['DOCUMENT_ROOT'];
define("PROJECT_ROOT_PATH", $_SERVER['DOCUMENT_ROOT']);
// include main configuration file 
// echo PROJECT_ROOT_PATH."/inc/config.php";
require_once "config.php";
// include the base controller file 
echo "config";

require_once PROJECT_ROOT_PATH . "/DatabaseConnection.php";
include_once PROJECT_ROOT_PATH . "/Controller/API/IController.php";
include_once PROJECT_ROOT_PATH . "/Controller/API/PropertyController.php";
include_once PROJECT_ROOT_PATH . "/Controller/API/ClientController.php";
echo "dbcont";

?>