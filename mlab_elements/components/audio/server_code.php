<?php

// primary job for this backend file is to convert audios, 
// we use AAC audio based on this:
// https://stackoverflow.com/questions/26172770/how-should-i-choose-a-video-format-to-be-played-on-web-android-ios
class mlab_ct_audio {

    public function onUpload($upload_path, $f_mime, $path_app_html_root, $sub_folder, $f_name, $f_ext, $path_component, $comp_id, $conf) {

//preare folder and destination names
        if (!file_exists("$path_app_html_root/$sub_folder")) {
            mkdir("$path_app_html_root/$sub_folder");
        }
        chdir("$path_app_html_root/$sub_folder");
        $audio_filename = "$path_app_html_root/$sub_folder/$f_name.m4a";
        
//now we search the file system to see if this was already uploaded, we achieve this by naming the files the same as the checksum of the file
        $find_files = array();
        $dir = new \RecursiveDirectoryIterator($conf["paths"]["app"]);
        $iterator = new \RecursiveIteratorIterator($dir);
        foreach (new \RegexIterator($iterator, "/$f_name.m4a/i", RecursiveRegexIterator::GET_MATCH) as $file) {
            $find_files[] = $file;
        }
        
//found a previous upload, just copy file
        if (!empty($find_files)) {
            copy($find_files[0], $audio_filename);
        } else {
        
//convert file if wider than 480 (https://trac.ffmpeg.org/wiki/Scaling%20(resizing)%20with%20ffmpeg), or if different file format than h264/m4a: 
            exec("ffmpeg -i '$file_uploaded' -c:a libfdk_aac '$f_name'.m4a ");
        }
        return "$sub_folder/$f_name.m4a";
    }

}