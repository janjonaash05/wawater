<?php
header("Content-Type: application/json");
echo json_encode(['message' => 'cau']);
exit();

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
$request = explode('/', trim($_SERVER['PATH_INFO'], '/'));

$resource = array_shift($request);
$specific_request = array_shift($request);


$resource_controller_map = array
(
    "property" => new PropertyController(),
    "gague" => new GagueController(),
); 

echo $resource_controller_map[$resource].call_specific($specific_request,"h");

?>