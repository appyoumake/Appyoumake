<?php
/**
 * @abstract Used by the composer installation programme, downloads required Javascript and CSS libraries
 */
namespace Sinett;

use Composer\Script\Event;

class ScriptHandler
{
    /**
     * Install required files, using data from the extra tag.
     *
     * @param Event $event
     */
    public static function installRequirementsFile(Event $event) {
        $options = $event->getComposer()->getPackage()->getExtra()["mlab_specific"];
        $files = $options["js_libraries"];
        
//Current working directory = root of Symfony project
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
                    $zip = new \ZipArchive;
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
                        unlink("./" . $filename);
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
        
}
