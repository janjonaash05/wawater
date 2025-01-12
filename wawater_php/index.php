<?php
// header("Content-Type: application/json",false,200);
// echo json_encode(['message' => 'cau']);
// exit();

require __DIR__ . "/inc/bootstrap.php";
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode( '/', $uri );



// if ((isset($uri[2]) && $uri[2] != 'user') || !isset($uri[3])) {
//     header("HTTP/1.1 404 Not Found");
//     exit();
// }
// require PROJECT_ROOT_PATH . "/Controller/Api/UserController.php";
// $objFeedController = new UserController();
// $strMethodName = $uri[3] . 'Action';
// $objFeedController->{$strMethodName}();


// $inputJSON = file_get_contents('php://input');
// $data = json_decode($inputJSON, TRUE);

$method = $_SERVER['REQUEST_METHOD'];
// echo $_SERVER['REQUEST_URI'] ;


$request = explode('/', trim( $_SERVER['REQUEST_URI'], '/'));


$resource = array_shift($request);
echo $resource ;

$specific_request = array_shift($request);


// if (!isset($_SERVER['PHP_AUTH_USER'])) {
//     header('WWW-Authenticate: Basic realm="My Realm"');
//     header('HTTP/1.0 401 Unauthorized');

//     exit;
// } else {
//     echo "<p>Hello {$_SERVER['PHP_AUTH_USER']}.</p>";
//     echo "<p>You entered {$_SERVER['PHP_AUTH_PW']} as your password.</p>";

//     if (!ClientController::validate_client($_SERVER['PHP_AUTH_USER'],$_SERVER['PHP_AUTH_PW']))
//     {

//     }

// }



$resource_controller_map = array
(
    "property" => new PropertyController()
); 


echo json_encode($resource_controller_map[$resource]->specific_request($specific_request,"h")); 


//($resource_controller_map[$resource]); //.call_specific($specific_request,"h");

?>