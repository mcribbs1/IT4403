<?php
    // this page can generate a static or dynamic JSON
    $courseJSON='
                "Course":
                    [
		                {
			                "Title": "IT6713",
			                "Enrollment": "18"
                        },
                        {
			                "Title": "IT6753",
			                "Enrollment": "22"
                        }
	                ]
            ';
    
    // generate JSON output
	echo '
            {
            "FirstName": "Jack",
            "LastName": "Zheng",
            "@HireDate": "2011-08-01",
            "Title": "Assistant Professor"
        ';
		
    if (isset($_GET["withcourse"]) && $_GET["withcourse"]=="true") //URL parameter to also add course information to the output.
    {
        echo ",";
        echo $courseJSON; 
    }
	
    echo '}';
?>