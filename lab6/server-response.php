<?php
// this page can generate some JSON content if successful (situation=0)

// the following situations are simulated based on a URL parameter "situation"
// 1. Successful response but delayed for 5 seconds
// 2. Response fail with a timeout (30 seconds)
// 3. Response fails (404 file not found)
// 4. Response fails (500 server error)
// 5. Response with invalid JSON
	
    if ($_GET["situation"]=="0")
    {
        echo '
            {
            "FirstName": "Jack",
            "LastName": "Zheng"
            }
        ';
    }
    elseif ($_GET["situation"]=="1")
    {
        sleep(5);
        echo '
            {
            "FirstName": "Ming",
            "LastName": "Yang"
            }
        ';
    }   
    elseif ($_GET["situation"]=="2")
    {
        sleep(30);
    } 
    elseif ($_GET["situation"]=="3")    
    {
        header("HTTP/1.0 404 Not Found");
    }
    elseif ($_GET["situation"]=="4")    
    {
        http_response_code(500);
    }
    elseif ($_GET["situation"]=="5")
    {
        echo "{  null - wrong json }"; // invalid json
    }
    else
    {
        echo '
            {
            "FirstName": "Jack",
            "LastName": "Zheng"
            }
        ';
    }
?>