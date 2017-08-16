<?php

class mlab_ct_video {

    public function onUpload($file_uploaded, $path_app_html_root, $path_component, $comp_id) {
        chdir($path_app_html_root . "/video");
        $file_filename = explode(".", basename($file_uploaded));
        $file_extension = $file_filename[1];
        $file_filename = $file_filename[0];
    //    array_pop($file_filename);
    //    $thumbnail_filename = implode("_", $path_app_html_root . "/images/" . $file_filename) . "jpg";
        $thumbnail_filename = $path_app_html_root . "/images/" . $file_filename;
        // exec("ffmpeg -i '$file_uploaded' -an -f mjpeg -t 1 -r 1 -y -filter:v scale='640:-1' " . $thumbnail_filename);

    //    exec("avconv -i '$file_uploaded' -c copy '$file_filename'.mp4");
    //    exec("avconv -i '$file_uploaded' -c h263 '$file_filename'.mp4");
    //    exec("ffmpeg -i '$file_uploaded' -vcodec mpeg4 -acodec libfdk_aac '$file_filename'.mp4");

        // Android
        exec("ffmpeg -i '$file_uploaded' -vcodec mpeg4 -acodec aac -strict -2 android_'$file_filename'.mp4 ");
        exec("mkdir ../../platforms/android/res/raw/");
        exec("mv android_'$file_filename'.mp4 ../.");

        // Web/iOS
        exec("ffmpeg -i '$file_uploaded' -vcodec h264 -acodec aac -strict -2 '$file_filename'.mp4 ");
        return True;
    }

}

//ffmpeg -i 2015_03_17_09_33_19.mov -vcodec mpeg4 -acodec aac -strict -2 -movflags faststart 2015_03_17_09_33_19.mp4 
//ffmpeg -i 2015_03_17_09_33_19.mov -c:v libx264 -profile:v baseline -c:a libfaac -ar 44100 -ac 2 -b:a 128k -movflags 2015_03_17_09_33_19.mp4
//ffmpeg -i 2015_03_17_09_33_19.mov -vcodec mpeg4 -acodec aac -strict -2 2015_03_17_09_33_19.mp4 
