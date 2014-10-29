<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>CpuSim Code</title>
        
        <link rel="stylesheet" href="css/sh_darkness.min.css" />
<!--        <link rel="stylesheet" href="css/sh_golden.min.css" />-->
<!--        <link rel="stylesheet" href="css/sh_vim-dark.min.css" />-->
        <script src="js/sh_main.min.js"></script>
        <script src="js/lang/sh_javascript.min.js"></script>
        
        <style>
            body, html, pre { padding: 0; margin: 0; border: 0; display: block; }
            body { background-color: #000; }
            
            pre { padding: 15px; }
        </style>
    </head>
    <body onload="sh_highlightDocument();">
        <pre class="sh_javascript">
<?php 
    $lines = file(__DIR__."/js/CpuSimCore.js");
    foreach ($lines as $line_num => $line) {
        echo htmlspecialchars($line);
    }
?>
        </pre>
    </body>
</html>