<?php 

require_once("HTTPResponse.php");

if($_SERVER['REQUEST_METHOD'] === 'POST'){
    if($_POST === []){
        // Fill the post array with values from php://input
        $post = json_decode(file_get_contents('php://input'));
        $url = $post->url;
    }
    else{
        $url = $_POST["url"];
    }
    // Check if url is valid
    if(filter_var($url, FILTER_VALIDATE_URL)){
        // Initialize curl
        $curl = curl_init();
        // Set the url
        curl_setopt($curl, CURLOPT_URL, $url);
        // Return as string
        $output = curl_exec($curl);
        // Close curl
        curl_close($curl);
        // Output results
        echo json_encode($output);
        die();
    }
    else{
        $response = HTTPResonse::badRequest();
    }
}
else{
    $response = HTTPResonse::methodNotAllowed();
}
http_response_code($response->getStatus());
echo json_encode($response);

?>