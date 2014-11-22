<?php

//Code that is run when the video component is first added to a page
//we need to add a particular addon to play videos under Android, 
//then we create a thumbnail of the video
    function onCreate($path_app, $path_app_html_root, $path_component, $comp_id) {
        $curdir = getcwd();
        chdir($path_app);
        exec("cordova plugin add https://github.com/jaeger25/Html5Video.git");
        chdir($curdir);
        return true;
    }

//this function is called when a file has been uploaded.
//In this case it will generate an image thumbnail of the video to use as a placeholder
    function onUpload($file_uploaded, $path_app_html_root, $path_component, $comp_id) {
        chdir($path_app_html_root . "/video");
        $temp_filename = explode(".", basename($file_uploaded));
        array_pop($temp_filename);
        $thumbnail_filename = implode("_", $path_app_html_root . "/images/" . $temp_filename) . "jpg";
        exec("ffmpeg -i '$file_uploaded' -an -f mjpeg -t 1 -r 1 -y -filter:v scale='640:-1' " . $thumbnail_filename);

    }