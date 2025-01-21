<?php
require __DIR__ . "/inc/bootstrap.php";

$all = DatabaseConnection::execute_statement("Select id, username, email from Client where id in(select client_id from GaugeMonthOverview))");
$response = file_get_contents('http://localhost:8080/client/to/api/call?param1=5');
?>