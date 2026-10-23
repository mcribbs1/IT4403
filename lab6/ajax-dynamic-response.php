<?php
header("Content-Type: text/html");
?>

<h4>This is a partial HTML dynamic page to serve an AJAX call.</h4>

<p>Date/Time: <?php echo date("m/d/Y h:i:s A"); ?></p>

<p>Requested parameter value: 
<?php 
if(isset($_GET["parameter"]) && $_GET["parameter"] != "") {
    echo $_GET["parameter"];
} else {
    echo "none";
}
?>
</p>
