<?php

/*
 * Downloads all javascript/CSS files required for Mlab
 */
$files = array(
    "web/js/bowser.js" => "https://raw.githubusercontent.com/ded/bowser/v0.7.3/bowser.js", 
    "web/js/jquery.contextMenu.js" => "https://raw.githubusercontent.com/joewalnes/jquery-simple-context-menu/master/jquery.contextmenu.js", 
    "web/css/jquery.contextMenu.css" => "https://raw.githubusercontent.com/joewalnes/jquery-simple-context-menu/master/jquery.contextmenu.css", 
    "web/js/jquery-2.1.4.js" => "https://code.jquery.com/jquery-2.1.4.min.js", 
    "web/js/jquery.ddslick-1.0.0.js" => "https://raw.githubusercontent.com/prashantchaudhary/ddslick/master/jquery.ddslick.js", 
    "web/js/jquery.mobile-1.4.5.js" => "http://code.jquery.com/mobile/1.4.5/jquery.mobile-1.4.5.min.js", 
    "web/js/jquery.qrcode-0.12.0.js" => "https://release.larsjung.de/jquery-qrcode/jquery-qrcode-0.12.0.zip",
    "web/js/jquery.qtip-2.2.0.js" => "http://cdn.jsdelivr.net/qtip2/2.2.0/jquery.qtip.min.js", 
    "web/css/jquery.qtip.css" => "http://cdn.jsdelivr.net/qtip2/2.2.0/jquery.qtip.min.css", 
    "web/js/jquery.spin.js" => "https://raw.githubusercontent.com/fgnass/spin.js/2.2.0/spin.js", 
    "web/js/jquery.ui-1.11.4.js|web/css/jquery-ui.css" =>  "https://jqueryui.com/resources/download/jquery-ui-1.11.4.zip", 
    "web/js/jquery.uploadfile-1.9.0.js" => "https://raw.githubusercontent.com/hayageek/jquery-upload-file/1.0.0/js/jquery.uploadfile.min.js", 
    "web/css/jquery.uploadfile.css" => "https://raw.githubusercontent.com/hayageek/jquery-upload-file/1.0.0/css/uploadfile.css"
);

//set start folder = root
if (chdir(__DIR__)) {

//loop through files defined in the local array and download them
    foreach ($files as $destination => $source) {
        $filename = basename($source);
        
//zip files must be unzipped, first download the zip file to a local file, then 
        if (substr($source, -3) == "zip") {
            if (!copy($source, "./" . $filename)) {
                break;
            } else {
                
//there may be multiple files that we want from a single archive, these are delimited in the destination variable with a pipe ( | ) symbol.
                $extract_files = explode("|", $destination);
                $zip = new ZipArchive;
                if ($zip->open($filename) === true) {
                    
//files we want may be inside a folder, therefore we must loop through all files to get the right one
                    for($i = 0; $i < $zip->numFiles; $i++) {
                        $zipped_file = $zip->getNameIndex($i);
                        $zipped_file_name = pathinfo($zipped_file)['basename'];
                        
                        foreach ($extract_files as $extract_file) {
                            if ($zipped_file_name == basename($extract_file)) {
                                copy("zip://".$filename."#".$zipped_file, $extract_file);
                            }
                        }
                    }                   
                    
                    $zip->close();                   
                } else {
                    
                }
            }
            
        } else {
            if (!copy($source, $destination)) {
                break;
            }
        }
    }
}


/* NOT REMOVED
 * /home/utvikler/workspace/mlab.local.dev/web/css/jqm-notheme.css", 
 * /home/utvikler/workspace/mlab.local.dev/web/css/images", 
 * 
 */