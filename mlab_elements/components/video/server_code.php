<?php

// primary job for this backend file is to convert videos, 
// we use .mp4 (to be exact, H.264 video, AAC audio, in MPEG-4) based on this:
// https://stackoverflow.com/questions/26172770/how-should-i-choose-a-video-format-to-be-played-on-web-android-ios
class mlab_ct_video {

    public function onUpload($upload_path, $f_mime, $path_app_html_root, $sub_folder, $f_name, $f_ext, $path_component, $comp_id, $conf) {

//preare folder and destination names
        if (!file_exists("$path_app_html_root/$sub_folder")) {
            mkdir("$path_app_html_root/$sub_folder");
        }
        chdir("$path_app_html_root/$sub_folder");
        $thumbnail_filename = "$path_app_html_root/$sub_folder/$f_name.png";
        $video_filename = "$path_app_html_root/$sub_folder/$f_name.mp4";
        
//now we search the file system to see if this was already uploaded, we achieve this by naming the files the same as the checksum of the file
        $find_files = array();
        $dir = new \RecursiveDirectoryIterator($conf["paths"]["app"]);
        $iterator = new \RecursiveIteratorIterator($dir);
        foreach (new \RegexIterator($iterator, "/$f_name.mp4/i", RecursiveRegexIterator::GET_MATCH) as $file) {
            $find_files[] = $file;
        }
        
//found a previous upload, just copy file
        if (!empty($find_files)) {
            copy($find_files[0], $video_filename);
            copy(str_replace($find_files[0], ".mp4", ".png"), $thumbnail_filename);
        } else {
        
//generate thumbnail
            exec("ffmpeg -ss 00:00:05.000 -i '$uploaded_file' -vframes 1 -s 640x480 '$thumbnail_filename'");
//if none created skip time parameter and let first frame be thumbnail
            if (!file_exists("$thumbnail_filename")) {
                exec("ffmpeg -i '$uploaded_file' -vframes 1 -s 640x480 '$thumbnail_filename'");
            }

//convert file if wider than 480 (https://trac.ffmpeg.org/wiki/Scaling%20(resizing)%20with%20ffmpeg), or if different file format than h264/aac: 
            exec("ffmpeg -i '$file_uploaded' -vf 'scale=w=min(iw,480):h=-2' -vcodec h264 -acodec aac -strict -2 '$f_name'.mp4 ");
        }
// Old: exec("ffmpeg -i '$file_uploaded' -vcodec mpeg4 -acodec libfdk_aac '$file_filename'.mp4");
// Web/iOS: exec("ffmpeg -i '$file_uploaded' -vcodec h264 -acodec aac -strict -2 '$file_filename'.mp4 ");
        return "$sub_folder/$f_name.mp4";
    }

}

//ffmpeg -i 2015_03_17_09_33_19.mov -vcodec mpeg4 -acodec aac -strict -2 -movflags faststart 2015_03_17_09_33_19.mp4 
//ffmpeg -i 2015_03_17_09_33_19.mov -c:v libx264 -profile:v baseline -c:a libfaac -ar 44100 -ac 2 -b:a 128k -movflags 2015_03_17_09_33_19.mp4
//ffmpeg -i 2015_03_17_09_33_19.mov -vcodec mpeg4 -acodec aac -strict -2 2015_03_17_09_33_19.mp4 
