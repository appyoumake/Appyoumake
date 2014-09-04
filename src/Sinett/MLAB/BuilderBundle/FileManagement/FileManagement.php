<?php

namespace Sinett\MLAB\BuilderBundle\FileManagement;
use ZipArchive;
use Symfony\Component\Yaml\Parser;


class FileManagement {
	
	private $config;
    private $router;
	private $required_files;
	private $replace_chars;
	private $paths;
	private $entity_type;
	
    public function __construct($mlab, $router)
    {
        $this->config = $mlab;
        $this->router = $router;
    }
	
    /**
     * Little kludge, we use same code for all uploads, here we specify which type we are working with and set certain variables based on that, 
     * helps to make this independednt from parameters, etc
     * @param unknown $entity_type
     */
    public function setConfig($entity_type) {
    	$this->entity_type = $entity_type;
    	$this->required_files = $this->config['verify_uploads'][$entity_type];
        if (isset($this->config['verify_uploads'][$entity_type . "_strings"])) {
            $this->required_strings = $this->config['verify_uploads'][$entity_type . "_strings"];
        } else {
            $this->required_strings = array();
        }
    	$this->replace_chars = $this->config['replace_in_filenames'];
    	$this->destination = $this->config['paths'][$entity_type];
    }
    
	/**
	 * Checks that file is valid, moves it and then returns true or false
	 * @param array $this->required_files: array of file names that MUST be in zip file
	 * @param array $this->replace_chars: array of characters to replace, internally we always use ascii < 128 only.
	 *
	 * @return array result/message
	 */
	public function handleUpload($entity, $overwrite = false)
	{
		
// the file property can be empty if the field is not required
		if (null === $entity->getZipFile()) {
			return;
		}
		 
		if ($entity->getZipFile()->isValid()) {
	
// sanitize filename and use this as the path
			$temp_name = $entity->getZipFile()->getPathname();
			$path_parts = pathinfo($entity->getZipFile()->getClientOriginalName());
			$object_name = $path_parts['filename'];
			$dir_name = preg_replace(array_values($this->replace_chars), array_keys($this->replace_chars), $object_name);
			$full_path = $this->destination . "/" . $dir_name;
			$files = array();
	
			$zip = new ZipArchive();
			$res = $zip->open($temp_name);
	
//loop through and see if all required files are present
			if ($res === TRUE) {
				for( $i = 0; $i < $zip->numFiles; $i++ ){
					$f = $zip->statIndex( $i )['name'];
					if (in_array($f, $this->required_files)) {
						unset($this->required_files[array_search($f, $this->required_files)]);
					}
				}
				 
//missing file, return error
				if (!empty($this->required_files)) {
// clean up the file property, not persisted to DB
					$entity->setZipFile(null);
					return array("result" => false, "message" => "Missing files: " . implode(",", $this->required_files) . " \n(Remember that templates and components must NOT include the top level folder in the zipped file)");
				}
				 
//we also need to make sure that the frontpage.html file has a DIV with the ID specified in params.yml, we have a generic function that looks inside files
//can also be used to, for instance, check if a conf.txt file has a new required property
                if (!empty($this->required_strings)) {
                    foreach ($this->required_strings as $file => $pattern) {
                        $path = "zip://" . $temp_name . '#' . $file;
                        $text = file_get_contents($path);
                        $valid = preg_match($pattern, $text);
                        if ($valid != 1) {
                            $entity->setZipFile(null);
                            return array("result" => false, "message" => "Invalid upload, $file does not have $pattern");
                        }
                    }
                }
                
//if update of existing template, just use existing folder
                
//unable to make dir, return error
				if (!$overwrite && !file_exists($full_path)) {
					if (!mkdir($full_path, 0777, true)) {
// clean up the file property, not persisted to DB
						$entity->setZipFile(null);
						return array("result" => false, "message" => "Unable to create folder for {$this->entity_type}: " . $full_path);
					}
				} else if ($overwrite && !file_exists($full_path)) {
					$entity->setZipFile(null);
					return array("result" => false, "message" => "Folder for {$this->entity_type} does not exist, cannot update: " . $full_path);
				}
		   
//try to unzip it
				if (!$zip->extractTo($full_path)) {
// clean up the file property, not persisted to DB
					$entity->setZipFile(null);
					return array("result" => false, "message" => "Unable to unzip {$this->entity_type}: " . $zip->getStatusString());
				}
				$zip->close();
		   
// finally set the path, name and description properties, description = tooltip in the conf.txt. stored as "tooltip=This is a regular headline, use only once per page"
				if (file_exists($full_path . "/conf.txt")) {
                    $yaml = new Parser();
					$temp = $yaml->parse(@file_get_contents($full_path . "/conf.txt"));
                    if (isset($temp["tooltip"])) {
                        $entity->setDescription($temp["tooltip"]);
                    } 
                    if (isset($temp["compatible_with"])) {
                        $entity->setCompatibleWith(substr(trim($line), 16));
                    } 
                    if (isset($temp["version"])) {
                        $entity->setVersion(substr(trim($line), 8));
                    }
				}
				
				$entity->setPath($dir_name);
				$entity->setName($object_name);
		   
// clean up the file property, not persisted to DB
				$entity->setZipFile(null);
				return array("result" => true);
			} else {
	
// clean up the file property, not persisted to DB
				$entity->setZipFile(null);
				return array("result" => false, "message" => "Unable to open zip file");
			}
		  
		}
	}
	
	/**
	 * This loads *all components*, the user's access to it is noted in the accessible element
	 * This is because they may not have access to a component, but they need it in an existing app that they are given rights to...
	 * We therefore load all, but do not display them in the editor. 
	 * @param array $access: what components are they allowed to access
	 * @param string $path
	 * @param string $config: data from parameters.yml
	 * @throws \Exception
	 * @return array
	 */
	function loadComponents($access, $path, $config, $app_id) {
		$yaml = new Parser();

		$components = array();
		if ($handle = opendir($path)) {
			while (false !== ($entry = readdir($handle))) {
				$comp_dir = $path . $entry . "/";
				
				if ( is_dir($comp_dir) && substr($entry, 0, 1) != "." ) {
//always add html, rest we add content or set bool values that will let us know what to do later
						$components[$entry] = array("html" => @file_get_contents($comp_dir . $config["HTML"]),
								"exec_browser" => @file_get_contents($comp_dir . $config["SCRIPTS"]),
								"exec_server" => file_exists($comp_dir . $config["PHP"]),
								"rights" => @file_get_contents($comp_dir . $config["RIGHTS"]),
								"conf" => $yaml->parse(@file_get_contents($comp_dir . $config["CONFIG"])),
                                "is_feature" => false,
								"accessible" => in_array($entry, $access)); //we hide the ones they are not allowed to see, but still load it for reference may exist in app...
	
                        if (isset($components[$entry]["conf"]) && isset($components[$entry]["conf"]["category"])) {
                            $components[$entry]["is_feature"] = ($components[$entry]["conf"]["category"] == "feature");
                        }
                        if (isset($components[$entry]["conf"]) && isset($components[$entry]["conf"]["urls"])) {
                            foreach ($components[$entry]["conf"]["urls"] as $url_key => $url_name) {
                                $components[$entry]["conf"]["urls"][$url_key] = $this->router->generate($url_name, array('app_id' => $app_id, 'comp_id' => $entry));
                            }
                        }
                        
//tooltips are in the conf file (or not!), so add it here, or blank if none
						$components[$entry]["tooltip"] = isset($components[$entry]["conf"]["tooltip"]) ? $components[$entry]["conf"]["tooltip"] : "";
				}
			}
			
		} else {
			throw new \Exception("Unable to load components");
		}
		ksort($components);
		return $components;
	}
    
	function loadSingleComponent($path, $comp_id, $config) {
		$yaml = new Parser();
        $comp_dir = $path . $comp_id . "/";

        if ( is_dir($comp_dir) ) {
//always add html, rest we add content or set bool values that will let us know what to do later
                $component = array("html" => @file_get_contents($comp_dir . $config["HTML"]),
                        "exec_browser" => @file_get_contents($comp_dir . $config["SCRIPTS"]),
                        "exec_server" => file_exists($comp_dir . $config["PHP"]),
                        "rights" => @file_get_contents($comp_dir . $config["RIGHTS"]),
                        "conf" => $yaml->parse(@file_get_contents($comp_dir . $config["CONFIG"])),
                        "is_feature" => false);

                if (isset($component["conf"]) && isset($component["conf"]["category"]))
                    $component["is_feature"] = ($component["conf"]["category"] == "feature");
//tooltips are in the conf file, so add it here, or blank if none
                $component["tooltip"] = isset($component["conf"]["tooltip"]) ? $component["conf"]["tooltip"] : "";
        }
   
		return $component;
	}
	
	/**
	 * Function called to create a new app, first calls cordova to generate structure, then copiues across relevant template files
	 * Default platform is usually android, but could be iOS if run on mac for instance...
	 */
	public function createAppFromTemplate ($template, $app) {
		
//prepare all the paths to use
		$default_platform = $this->config["cordova"]["default_platform"];
		$include_paths = $this->config["cordova"][$default_platform]["include_paths"];
		$app_path = $app->calculateFullPath($this->config["paths"]["app"]);
		$template_path = $template->calculateFullPath($this->config["paths"]["template"]);
		$template_items_to_copy = $this->config["app"]["copy_files"];
		$cordova_asset_path = $app_path . $this->config["cordova"]["asset_path"];
		$app_domain = $this->config["cordova"]["app_creator_identifier"] . "." . $app->getPath();
		
		$cordova_create_command = $this->config["cordova"]["cmds"]["create"];
		$cordova_create_command = str_replace(
				array("_FOLDER_", "_DOMAIN_", "_TITLE_"),
				array($app_path, $app_domain, $app->getPath()),
				$cordova_create_command
		);
		
		$cordova_chdir_command = str_replace("_FOLDER_", $app_path, $this->config["cordova"]["cmds"]["chdir"]);
		
		$cordova_add_platform_command = str_replace("_PLATFORM_", $default_platform, $this->config["cordova"]["cmds"]["platform"]);
        if (!putenv('PATH=' . $this->config["os_path"] . ":" . implode(":", $include_paths))) {
			return array("Could not set path for Cordovava");
		}
		
		$cordova_build_properties = str_replace("_FOLDER_", $app_path, $this->config["cordova"]["android"]["ant_properties"]);
		
		$output = array();
		$exit_code = 0;
		
//if they are offline we just extract a ZIP file that has to be present, 
        //and then we need to update a few files with new data
        if ($this->config["cordova"]["offline"]) {
            if (!file_exists($this->config["cordova"]["offline_archive"])) {
                return array("You are working offine, but the ZIP archive to use for a new app was not found:" . $this->config["cordova"]["offline_archive"]);
            }
            $zip = new ZipArchive();
			$res = $zip->open($this->config["cordova"]["offline_archive"]);
	
//loop through and see if all required files are present
			if ($res === TRUE) {
            if (!mkdir($app_path, 0777, true)) { return array("Unable to create directory: $app_path");}
//try to unzip it
				if (!$zip->extractTo($app_path)) {
// clean up the file property, not persisted to DB
					$entity->setZipFile(null);
					return array("Unable to unzip : " . $zip->getStatusString());
				}
				$zip->close();
                shell_exec($cordova_chdir_command . " && find . -type f -print | xargs sed -i 's/" . $this->config["cordova"]["offline_placeholder_name"] . "/" . $app->getPath() . "/'");
                shell_exec($cordova_chdir_command . " && find . -type f -print | xargs sed -i 's/" . $this->config["cordova"]["offline_placeholder_identifier"] . "/" . $app_domain . "/'");
                foreach ($template_items_to_copy as $from => $to) {
                    $cmd = "cp -r \"$template_path$from\"* \"$cordova_asset_path$to\"";
                    $shell_return = exec("{$cmd} 2>&1 && echo $?" , $output, $exit_code);
                }
                return true;
            } else {
                return array("Unable to unzip : " . $res);
            }
            
                
        } else {
          
          
          // Create new app using cordova command
          // May need to download, so change script time limit
          set_time_limit(240);
          exec("mkdir -p {$app_path}");  
	      exec($cordova_create_command . " 2>&1", $output, $exit_code);	  
		
//check exit code, anything except 0 = fail
            if ($exit_code != 0) {
                return $output + array("Exit code: " . $exit_code);
                error_log("Failed creating new app using cordova, {$exit_code}, {$output}", 0);
            } else {
	      // Add platform
	        
	      //shell_exec($cordova_chdir_command . " && " . $cordova_add_platform_command , $output, $exit_code);
            exec("whoami", $output, $exit_code);	      
            exec("echo $PATH", $output, $exit_code);	      
            exec("android 2>&1 && echo $?", $output, $exit_code);
            exec("java -version 2>&1 && echo $?", $output, $exit_code);

            $shell_return = exec("{$cordova_chdir_command} 2>&1 && {$cordova_add_platform_command} 2>&1 && echo $?" , $output, $exit_code);
	      
// makes available custom build settings, e.g. for signing
            exec("{$cordova_build_properties} 2>&1 && echo $?", $output, $exit_code);
	      
// Creates app-specific log file.
            file_put_contents("{$app_path}cordov.log",print_r($output,true));

            foreach ($template_items_to_copy as $from => $to) {
                $cmd = "cp -r \"$template_path$from\"* \"$cordova_asset_path$to\"";
                $ret = shell_exec($cmd);
            }
            return true;
            }
        }
	}
	
	/**
	 * simple function to copy an app folder to a new one
	 * @param string $sourceApp
	 * @param string $targetApp
	 */
	public static function copyDirectory($sourceApp, $targetApp) {
	    if (!file_exists($sourceApp)) return false;
	    if (!is_dir($sourceApp)) return copy($sourceApp, $targetApp);
	    if (!mkdir($targetApp)) return false;
	    foreach (scandir($sourceApp) as $item) {
	    	if ($item == '.' || $item == '..') continue;
	    	if (!self::copyDirectory($sourceApp.DIRECTORY_SEPARATOR.$item, $targetApp.DIRECTORY_SEPARATOR.$item)) return false;
	    }
	    return true;
	}

    /**
     * generate new name, get a list of pages in folder, select last one, turn into an int, 
     * then keep increasing it until it is not found (in case someone else creates a file in the mean time)
     * @param type $app
     * @return array(int $new_page_num, string $new_page_path (complete path to file))
     */
    public function getNewPageNum($app) {
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]) . $this->config["cordova"]["asset_path"];

   		$pages = glob ( $app_path . "/???.html" );
   		$new_page_num = intval(basename(array_pop($pages))) + 1;
        $new_page_name = substr("000" . $new_page_num, -3) . ".html";
    	
    	while (file_exists("$app_path$new_page_name")) {
            if ($new_page_num == 999) {
                return array(false, false);
            }
            $new_page_num++;
            $new_page_name = substr("000" . $new_page_num, -3) . ".html";
        }
        
        $new_page_path = $app_path . $new_page_name;
        return array($new_page_num, $new_page_path);
    }
    
    /**
     * Creates an empty file which will be locked when we redirect to page_get in calling function
     * @param type $app
     * @return bool
     */
    public function newPage($app) {
        
//create the name of the file to create
	    list($new_page_num, $new_page_path) = $this->getNewPageNum($app);
        if ($new_page_num === false) {
            return false;
        }

        if (touch ($new_page_path)) {
            return $new_page_num;
        } else {
            return false;
        }
    }
    
    public function savePage($app, $page_num, $html) {
//get path of file to save
        if ($page_num == "index") {
            $file_path = $app->calculateFullPath($this->config['paths']['app']) . $this->config['cordova']['asset_path'] . "index.html";
        } else {
            $file_path = $app->calculateFullPath($this->config['paths']['app']) . $this->config['cordova']['asset_path'] . substr("000" . $page_num, -3) . ".html";;
        }
        
        return file_put_contents ($file_path, $html) ;
    }
    
    /**
     * copies a page
     * @param type $app
     * @param type $page_num
     * @return boolean
     */
    public function copyPage($app, $page_num) {
//get path of file to copy
        $source_path = $app->calculateFullPath($this->config['paths']['app']) . $this->config['cordova']['asset_path'] . substr("000" . $page_num, -3) . ".html";;
        
//create the name of the file to create
	    list($new_page_num, $new_page_path) = $this->getNewPageNum($app);
        if ($new_page_num === false) {
            return false;
        }

        $temp = file_get_contents($source_path);
        $temp = preg_replace('/<title>(.+)<\/title>/', '<title>Copy of $1</title>', $temp);
        if (file_put_contents ($new_page_path, $temp)) {
            return $new_page_num;
        } else {
            return false;
        }
    }
    
    /**
     * copies a page
     * @param type $app
     * @param type $page_num
     * @return name of file to open OR false
     */
    public function deletePage($app, $page_num, $uid) {
//get path of file to delete
        $app_path = $app->calculateFullPath($this->config['paths']['app']) . $this->config['cordova']['asset_path'];
        $page_to_delete = $this->getPageFileName($app_path, $page_num);
        
//check if it is locked, we get a list of all locks, if one of them is "higher" then the one we want to delete, then we bail as we need to rename files to have 
//single list of filenames, i.e. if we have 001, 002, 003, 004; and we try to delete 003, then 004 will be renamed to 003
        $locked_pages = $this->getAppLockStatus($app_path, $uid);
        foreach ($locked_pages as $page) {
            if ($page > $page_to_delete) {
                return false;
            }
        }
        
        if (unlink("$app_path/$page_to_delete")) {
            $pages = glob ( $app_path . "/???.html" );
            foreach ($pages as $page) {
                $page = basename($page);
                if ($page > $page_to_delete) {
                    $newname = substr("000" . (intval($page) - 1), -3) . ".html";
                    rename("$app_path/$page", "$app_path/$newname");
                } 
                
            }
            
            if (file_exists("$app_path/$page_to_delete")) {
                return $this->getPageContent("$app_path/$page_to_delete", $uid);
            } else {
                $page_to_open = substr("000" . (intval($page_to_delete) - 1), -3) . ".html";
                if (file_exists("$app_path/$page_to_open")) {
                    return $this->getPageContent("$app_path/$page_to_open", $uid);
                } else {
                    return $this->getPageContent("$app_path/index.html", $uid);
                }
            }
        } else {
            return false;
        } //end try to unlink
    }    
    
/**
 * returns an associative array of file names and titles of the pages for an app
 * @param type $app
 * @return types
 */
    public function getPageIdAndTitles($app) {
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]) . $this->config["cordova"]["asset_path"];

        
        if (preg_match('/<title>(.+)<\/title>/', file_get_contents("$app_path/index.html"), $matches) && isset($matches[1])) {
            $pages = array(0 => $matches[1] . " [Frontpage]");
        } else {
            $pages = array(0 => "Untitled [Frontpage]");
        }
        
        $files = glob ( $app_path . "/???.html" );
        foreach ($files as $file) {
            $pnum = intval(basename($file)); 
            if (preg_match('/<title>(.+)<\/title>/', file_get_contents("$file"), $matches) && isset($matches[1])) {
                $pages[$pnum] = "{$matches[1]} [{$pnum}]";
            } else {
                $pages[$pnum] = "Untitled [{$pnum}]";
            }
        }
        return $pages;
    }

    
/**
 * Converts a page number/name to file name, allows for first, last, index, number
 * @param type $app_path
 * @param type $page_num
 * @return boolean or string
 */
    public function getPageFileName($app_path, $page_num) {
        if ($page_num == 'last') {
//pick up last page, get the whole array, pop off last element and get filename
    		$pages = glob ( $app_path . "/???.html" );
            if (sizeof($pages) == 0) {
                return "index.html";
            } else {
                return basename(array_pop($pages));
            }
    		
    	} else if ($page_num == 'first') {
            if (file_exists( $app_path . "/001.html" )) {
                return '001.html';
            } else {
                return "index.html";
            }
    		
    	} else if ($page_num == '0' || $page_num == 'index') {
    		return 'index.html';
    		
    	} else {
    		if ($page_num > 0 ) {
    			return substr("000" . $page_num, -3) . ".html";
    		} else {
    			return false;    		
    		}
    	}
    }
    
    /**
     * Remove all potential locks on all other apps for specified unique ID
     * @param type $uid
     */
    public function clearLocks($uid) {
        $apps_location = $this->config['paths']['app'];
        `find $apps_location -type f -name "*.$uid.lock" -exec rm {} \;`;
    }
    
    
    /**
     * Remove all potential locks on all apps for all IDs
     * @param type $uid
     */
    public function clearAllLocks() {
        $apps_location = $this->config['paths']['app'];
        `find $apps_location -type f -name "*.lock" -exec rm {} \;`;
    }
    
    
    /**
     * Simple file loader which will check if file is locked and add lock of own if not found
     * Any other locks with the same UID will be removed as UID is unique to a tab/window, so can only have one open
     * A file lock = filename.UID.lock
     * TODO: Improve with flock
     * @param type $filename
     * @param type $uid
     * @return string|boolean
     */
    public function getPageContent($filename, $uid) {
        
//we always read file contents, the lock status is used to disable editing in front end
        $result = array("html" => file_get_contents($filename),
                        "lock_status" => $this->getPageLockStatus($filename, $uid));
        
        return $result;
    }

/**
 * Checks lock status for a specified file
 * @param type $filename
 * @param type $uid
 */
    public function getPageLockStatus($filename, $uid) {
//already open and locked by us
        if (file_exists(("$filename.$uid.lock"))) {
            return "unlocked";
            
//opened by someone else
        } else if (!empty(glob("$filename.*.lock"))) {
            $this->clearLocks($uid);
            return "locked";

//open it first time and clear all other locks
        } else {
            $this->clearLocks($uid);
            touch("$filename.$uid.lock");
            return "unlocked";
            
        }
    }

/**
 * Check which pages are locked for a whole app, and returns an array of filenames that were locked by others.
 * @param type $filename
 * @param type $uid
 * @return array
 */
    public function getAppLockStatus($app_path, $uid) {
        $res = array();
        $lock_files = glob("$app_path/*.lock");
        foreach ($lock_files as $key => $value) {
            if (basename($value) != "$uid.lock") {
                $res[] = substr(basename($value), 0, 8);
            }
        }
        sort($res);
        return $res;
    }
 
/**
 * Calls on cordova to build the app and then returns the URL of the app
 * @param type $app
 * @return boolean
 */
	public function buildApp ($app) {
		
//prepare all the paths to use
		$default_platform = $this->config["cordova"]["default_platform"];
		$include_paths = $this->config["cordova"][$default_platform]["include_paths"];
        $compiled_app_location = $this->config["cordova"][$default_platform]["compiled_app_location"];
		$app_path = $app->calculateFullPath($this->config["paths"]["app"]);
		
//prepare the command
        $cordova_build_command = $this->config["cordova"]["cmds"]["compile"];
		
		$output = array();
		$exit_code = 0;
		
		if (!putenv('PATH=' . $this->config["os_path"] . ":" . implode(":", $include_paths))) {
			return array("Could not set path for Cordova");
		}
		
		// May need to download and then run for a while, so set time limit
		set_time_limit(300);
        chdir($app_path);
        exec($cordova_build_command . " 2>&1", $output, $exit_code);
		
//check exit code, anything except 0 = fail
        $protocol = stripos($_SERVER['SERVER_PROTOCOL'],'https') === true ? 'https://' : 'http://';
        $url = $this->config["urls"]["app"] . $app->calculateFullPath("") . $compiled_app_location . $app->getPath() . "-release.apk";
        if ($exit_code != 0) {
            return array("result" => "error", "url" => $url, "message" => "Exit code: " . $exit_code . " (" . implode(", ", $output));
        } else {
            return array("result" => "success", "url" => $url);
        }
	}
    
    /**
     * Adds a "feature", that is, a hidden component that adds features to an app that are not a visual component
     **/
    public function addFeature($filename, $comp_id, $component) {
        $doc = new \DOMDocument("1.0", "utf-8");
        $doc->validateOnParse = true;
        $doc->loadHTMLFile($filename);

        $xpath = new \DOMXPath($doc);
        $div_for_features = $xpath->query("//*[@id='mlab_features_content']")->item(0);

        if (empty($div_for_features)) {
            $div = $doc->createDocumentFragment();
            $div->appendXML("<div id='mlab_features_content' style='display: none;'></div>");
            
            foreach($doc->getElementsByTagName('body') as $node) {
                $node->appendChild($div);
            }
            $div_for_features = $xpath->query("//*[@id='mlab_features_content']")->item(0);
        }
        
        $feature_component = $doc->createDocumentFragment();
        $feature_component->appendXML("<div data-mlab-type='$comp_id' >" . $component["html"] . "</div>");
        $div_for_features->appendChild($feature_component);
        return $doc->saveHTMLFile($filename);
    }
    
    /**
     * This function will update an XML file (typically /www/config.xml or /platforms/android/AndroidManifest.xml)
     * with values that either replace existing ones or add to new ones 
     * @param type $filename
     * @param type string update: can be attribute or content, this is what will be added or replaced in the XML code
     * @param type string $tag
     * @param type string $attribute
     * @param type string $value
     * http://stackoverflow.com/questions/1193528/how-to-modify-xml-file-using-php
     * http://stackoverflow.com/questions/15156464/i-want-to-modify-the-existing-data-in-xml-file-using-php
     * http://stackoverflow.com/questions/10909372/checking-if-an-object-attribute-is-set-simplexml
     * http://stackoverflow.com/questions/17661167/how-to-replace-xml-node-with-simplexmlelement-php
     * http://www.php.net/manual/en/book.simplexml.php
     */
    public function updateCordovaConfiguration($filename, $update, $tag, $attribute, $existing_attribute_value, $update_value) {
        if (!file_exists($filename)) {
            return "File not found: $filename";
        }
        if (empty($tag)) {
            return "No tag specified";
        }

        if (empty($attribute) || empty($existing_attribute_value)) {
            $query = "//*[local-name() = '$tag']";
        } else {
            $query = "//*[local-name() = '$tag'][@$attribute = '$existing_attribute_value']";
        }
        $xml = simplexml_load_file($filename);

        
        $res = $xml->xpath($query);
        if (sizeof($res) > 1) {
            return "Found more than one configuration setting matching criteria, cannot continue";
        }
           
        if (sizeof($res) == 0) {
            $res[0] = $xml->addChild($update_value);
        }
        if ($update == "attribute") {
            $res[0][$attribute] = $update_value;
        } elseif ($update == "content") {
            $xml->{$tag} = $update_value;
        }
 
        if (!$xml->asXML($filename)) {
            return "Unable to update the configuration for this application";
        }
        
        return true;
    }
    
    /**
     * get number of pages in app, this is typically used to update javascript variables in mlab_parameters.js
     * @param type $app
     * @return array(int $new_page_num, string $new_page_path (complete path to file))
     */
    public function getTotalPageNum($app) {
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]) . $this->config["cordova"]["asset_path"];

   		$pages = glob ( $app_path . "/???.html" );
        
//if no pages we have one page, index.html
        if (empty($pages)) {
            $total_page_num = 1;
        } else {
            $total_page_num = intval(basename(array_pop($pages)));
        }
        return $total_page_num;
    }
    
//this scans through a javascript file and if it finds a parameter match it will replace the value, it not add it to the end of the file 
    public function updateAppParameter($app, $param, $value) {
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]) . $this->config["cordova"]["asset_path"];
        $file = $app_path . "/js/mlab_parameters.js";

        $lines = file($file);
        $found = false;
        foreach ($lines as $index => $line) {
            if ($param == substr(trim($line), 0, strlen($param))) {
                $lines[$index] = "$param = $value;";
                $found = true;
            }
        }
        if (!$found) {
            $lines[] = "$param = $value;\n";
        }

        file_put_contents($file, $lines);
    }
 
/**
 * Using Linux commands to generate an MD5 sum for an app, looks in the /www folder, excluding lock files
 * @param type $app
 * @param type $exclude_file: Usually used to 
 * @return type
 */
    public function getAppMD5($app, $exclude_file = "") {
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]) . $this->config["cordova"]["asset_path"];
        if ($exclude_file != "") {
            $exclude_file = " ! -iname '$exclude_file' ";
        }
        $cmd = "find $app_path -type f \( -iname '*' ! -iname '*.lock' $exclude_file\) -exec md5sum {} \; | sort -k2 | md5sum";
        $result = explode("  ", exec($cmd));
        return $result[0];
    }
    
    public function removeTempCompFiles($entity, $type) {
        $path = $this->config["paths"][$type] . $entity->getPath();
        $cmd = "rm -rf $path";
        return shell_exec($cmd);
    }

    public function getComponentsUsed($apps) {
        $all_comps_used = array();
        $app_root = $this->config["paths"]["app"];
        foreach ($apps as $app) {
            $app_path = $app->calculateFullPath($app_root) . $this->config["cordova"]["asset_path"] . "/";
            foreach (glob("$app_path*.html") as $filename) {
                if (filesize($filename) > 0) {
                    $temp_cmd = str_replace("%PATH%", $filename, $cmd);
                    $extracted_data = shell_exec($temp_cmd);
                    $temp_comp = json_decode($extracted_data);
                    if (!is_null($temp_comp[0])) {
                        if (!is_array($temp_comp[0])) {
                            $all_comps_used[] = $temp_comp[0];
                        } else {
                            $all_comps_used = array_merge($all_comps_used, $temp_comp[0]);
                        }
                    }
                }
            }
        }
        $all_comps_used = array_unique($all_comps_used);
    }

}