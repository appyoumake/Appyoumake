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
					$temp_f = $zip->statIndex( $i );
					$f = $temp_f['name'];
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
//can also be used to, for instance, check if a conf.yml file has a new required property
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
		   
// finally set the path, name and description properties, description = tooltip in the conf.yml. stored as "tooltip=This is a regular headline, use only once per page"
				if (file_exists($full_path . "/conf.yml")) {
                    $yaml = new Parser();
					$temp = $yaml->parse(@file_get_contents($full_path . "/conf.yml"));
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
		$components = array();
        
		if ($handle = opendir($path)) {
			while (false !== ($component_entry = readdir($handle))) {
                $comp_dir = $path . $component_entry . "/";
				if ( is_dir($comp_dir) && substr($component_entry, 0, 1) != "." ) {
                    $components[$component_entry] = $this->loadSingleComponent($app_id, $path, $component_entry, $config, $access);
				}
			}
			
		} else {
			throw new \Exception("Unable to load components");
		}
        
		ksort($components);
		return $components;
	}
    
	function loadSingleComponent($app_id, $path, $comp_id, $config, $check_access = false) {
		$yaml = new Parser();
        $comp_dir = $path . $comp_id . "/";

        if ( is_dir($comp_dir) ) {
            
            $failed = false;
            
            try {
                $tmp_yaml = $yaml->parse(@file_get_contents($comp_dir . $config["CONFIG"]));
            } catch (\Exception $e) {
                $tmp_yaml = array();
                $failed = true;
            }

//Html is stored as string (if same for both runtime and designtime) or array if different
            if (isset($tmp_yaml["html"])) {
                if (is_array($tmp_yaml["html"])) {
                    $html = (isset($tmp_yaml["html"]["designtime"]) ? $tmp_yaml["html"]["designtime"] :"");
                } else {
                    $html = $tmp_yaml["html"];
                }
            } else {
                $html = "";
            }

//always add html, rest we add content or set bool values that will let us know what to do later
            $component = array("html" => $html,
                    "code" => @file_get_contents($comp_dir . $config["SCRIPTS"]),
                    "server_code" => file_exists($comp_dir . $config["PHP"]),
                    "conf" => $tmp_yaml,
                    "is_feature" => false);
            
            if ($check_access) {
                $component["accessible"] = ($failed === true ? false : in_array($comp_id, $check_access)); //we hide the ones they are not allowed to see OR with failed config, but still load it for reference may exist in app...
            }


            if (isset($component["conf"]) && isset($component["conf"]["category"])) {
                $component["is_feature"] = ($component["conf"]["category"] == "feature");
                $component["is_storage_plugin"] = ($component["conf"]["category"] == "storage_plugin");
            }
            if (isset($component["conf"]) && isset($component["conf"]["urls"])) {
                foreach ($component["conf"]["urls"] as $url_key => $url_name) {
                    $component["conf"]["urls"][$url_key] = $this->router->generate($url_name, array('app_id' => $app_id, 'comp_id' => $comp_id));
                }
            }

//tooltips are in the conf file (or not!), so add it here, or blank if none
            $component["tooltip"] = isset($component["conf"]["tooltip"]) ? $component["conf"]["tooltip"] : "";
        } else {
            $component = false;
        }
   
		return $component;
	}
	
	/**
	 * Function called to create a new app, copies across relevant template files 
	 */
	public function createAppFromTemplate ($template, $app) {
		
//prepare all the paths to use
		$app_path = $app->calculateFullPath($this->config["paths"]["app"]);
		$template_path = $template->calculateFullPath($this->config["paths"]["template"]);
		$template_items_to_copy = $this->config["app"]["copy_files"];
		
		$output = array();
		$exit_code = 0;
		
        if (mkdir($app_path, 0777, true)) { 
            foreach ($template_items_to_copy as $from => $to) {
                $this->func_copy("$template_path$from", "$app_path$to");
            }
            return true;
        } else {
            return array("Unable to create directory: $app_path");
        }
	}
	
	/**
	 * simple function to copy an app folder to a new one
	 * @param string $sourceApp
	 * @param string $targetApp
	 */
	public static function copyAppFiles($sourceApp, $targetApp) {
	    if (!file_exists($sourceApp)) return false;
	    if (!is_dir($sourceApp)) return copy($sourceApp, $targetApp);
	    if (!mkdir($targetApp, 0777, true)) return false;
	    foreach (scandir($sourceApp) as $item) {
	    	if ($item == '.' || $item == '..' || strtolower(substr($item, -5)) == ".lock") continue;
	    	if (!self::copyAppFiles($sourceApp.DIRECTORY_SEPARATOR.$item, $targetApp.DIRECTORY_SEPARATOR.$item)) return false;
	    }
	    return true;
	}

    /**
     * generates a new version number following these rules:
     * 1: It gets the current highest number from the specified app
     * 2.1: If there are no other apps with the same name, it adds the increment value (0.1 or 1.0) to the highest value
     * 2.2: If other apps with the same name exists (i.e. another branch) it gets the hightst and lowest values from each of these
     *      The final number generated cannot be equal to or larger than the integer value of other branches *above* the current version
     *      number, so it may be that version 2, requesting a new version number of 3 is set to 2.1 if a version 3 exists
     * @param type $app
     * @return array(int $new_page_num, string $new_page_path (complete path to file))
     */
    public function getNewAppVersionNum($app, $branches, $increment) {
        $current_versions = $app->getVersionRange();
        $new_version = $current_versions["high"] + $increment;
        if (sizeof($branches) < 2) {
            return $new_version;
        } else {
            foreach ($branches as $branch) {
                if ($branch->getId() != $app->getId()) {
                   $check_versions = $branch->getVersionRange();
//they are trying to move onto a version number used by a different branch, can't allow this, so we increment the original number with 0.1
                   if ($new_version >= $check_versions["low"]) {
                       while ($new_version >= $check_versions["low"]) {
                           $increment = $increment / 10;
                           $new_version = $current_versions["high"] + $increment;
                       }
                       return $new_version;
                   }
                }
            }
        }
        return $new_version;
    }    

    /**
     * generate new name, get a list of pages in folder, select last one, turn into an int, 
     * then keep increasing it until it is not found (in case someone else creates a file in the mean time)
     * @param type $app
     * @return array(int $new_page_num, string $new_page_path (complete path to file))
     */
    public function getNewPageNum($app) {
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]);

   		$pages = glob ( $app_path . "/???.html" );
   		$new_page_num = intval(basename(array_pop($pages))) + 1;
        $new_page_name = substr("000" . $new_page_num, -3) . ".html";
    	
    	while (file_exists("$app_path$new_page_name")) {
            if ($new_page_num == 999) {
                return array("new_page_num" => false, "new_page_path" => false);
            }
            $new_page_num++;
            $new_page_name = substr("000" . $new_page_num, -3) . ".html";
        }
        
        $new_page_path = $app_path . $new_page_name;
        return array("new_page_num" => $new_page_num, "new_page_path" => $new_page_path);
    }
    
    /**
     * Creates an empty file which will be locked when we redirect to page_get in calling function
     * @param type $app
     * @return bool
     */
    public function newPage($app) {
        
//create the name of the file to create
	    $new_page = $this->getNewPageNum($app);
        if ($new_page["new_page_num"] === false) {
            return false;
        }

        if (file_put_contents ($new_page["new_page_path"], "") !== false) {
            return $new_page["new_page_num"];
        } else {
            return false;
        }
    }
    
    public function savePage($app, $page_num, $html) {
//get path of file to save
        if ($page_num == "index") {
            $file_path = $app->calculateFullPath($this->config['paths']['app']) . "index.html";
        } else {
            $file_path = $app->calculateFullPath($this->config['paths']['app']) . substr("000" . $page_num, -3) . ".html";;
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
        $source_path = $app->calculateFullPath($this->config['paths']['app']) .  substr("000" . $page_num, -3) . ".html";;
        
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
     * deletes a page, when this is done it renames remaining pages so always sequatial.
     * But it cannot do this if one of the remaining pages are locked
     * So, if we have page Index+1, and 1 is deleted, we return 0 for index page
     * If we have pages index+1+2+3 and 1 is deleted we return 1
     * If we have pages index+1+2+3 and 3 is deleted we return 2
     * 
     * @param type $app
     * @param type $page_num
     * @return name of file to open after the page was deleted (next or previous or first page) OR false if fail
     */
    public function deletePage($app, $page_num, $uid) {
//get path of file to delete
        $app_path = $app->calculateFullPath($this->config['paths']['app']);
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
                return intval($page_to_delete);
            } else {
                $page_to_open = substr("000" . (intval($page_to_delete) - 1), -3) . ".html";
                if (file_exists("$app_path/$page_to_open")) {
                    return intval($page_to_open);
                } else {
                    return 0;
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
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]);

        
        if (preg_match('/<title>(.+)<\/title>/', file_get_contents("$app_path/index.html"), $matches) && isset($matches[1])) {
            $pages = array(0 => $matches[1]);
        } else {
            $pages = array(0 => "Untitled");
        }
        
        $files = glob ( $app_path . "/???.html" );
        foreach ($files as $file) {
            $pnum = intval(basename($file)); 
            if (preg_match('/<title>(.+)<\/title>/', file_get_contents("$file"), $matches) && isset($matches[1])) {
                $pages[$pnum] = "{$matches[1]}";
            } else {
                $pages[$pnum] = "Untitled";
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
     * Remove all potential locks on all apps for specified unique ID
     * @param type $uid
     */
    public function clearAppLocks($app, $uid) {
        $app_location = $app->calculateFullPath($this->config["paths"]["app"]);
        $files = $this->func_find($app_location, "f",  "*.$uid.lock");
        foreach ($files as $file) {
             unlink($file);
        }
    }
    
    /**
     * Remove all potential locks on all apps for specified unique ID
     * @param type $uid
     */
    public function clearLocks($uid) {
        $apps_location = $this->config['paths']['app'];
        $files = $this->func_find($apps_location, "f",  "*.$uid.lock");
        foreach ($files as $file) {
             unlink($file);
        }
    }
    
    
    /**
     * Remove all potential locks on all apps for all IDs
     * @param type $uid
     */
    public function clearAllLocks() {
        
        $apps_location = $this->config['paths']['app'];
        $files = $this->func_find($apps_location, "f",  "*.lock");
        foreach ($files as $file) {
             unlink($file);
        }
      
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
        } 
        
        $test = glob("$filename.*.lock");
        if (!empty($test)) {
            $this->clearLocks($uid);
            return "locked";

//open it first time and clear all other locks
        } else {
            $this->clearLocks($uid);
            file_put_contents("$filename.$uid.lock", "");
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
     * Adds a "feature", that is, a hidden component that adds features to an app that are not a visual component
     **/
    public function addFeature($filename, $comp_id, $component) {
        $doc = new \DOMDocument("1.0", "utf-8");
        libxml_use_internal_errors(true);
        $doc->validateOnParse = true;
        $doc->loadHTMLFile($filename);
        libxml_clear_errors();

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
     * Injects some HTML fragment into a div specified by the ID
     * 
     **/ 
    public function injectHtml($filename, $container_id, $html_to_inject, $is_file) {
        if ($is_file) {
            $source = new \DOMDocument("1.0", "utf-8");
            $source->loadHTMLFile($html_to_inject);
            $html = $source->saveHTML($source->getElementsByTagName('body')->item(0));
//must remove the surrounding BODY tag, a bit hacky, but works...
            $html = substr(trim($html), 6, -7);
        } else {
            $html = $html_to_inject;
        }
        
        $doc = new \DOMDocument("1.0", "utf-8");
        libxml_use_internal_errors(true);
        $doc->validateOnParse = true;
        $doc->loadHTMLFile($filename);
        libxml_clear_errors();

        $xpath = new \DOMXPath($doc);
        $div_content = $xpath->query("//*[@id='$container_id']")->item(0);

        if (empty($div_content)) {
            return false;
        }
        
        $inject = $doc->createDocumentFragment();
        $inject->appendXML($html);
        $div_content->appendChild($inject);
        return $doc->saveHTMLFile($filename);
    }
    

    /**
     * get number of pages in app, this is typically used to update javascript variables in mlab_parameters.js
     * @param type $app
     * @return array(int $new_page_num, string $new_page_path (complete path to file))
     */
    public function getTotalPageNum($app) {
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]);

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
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]);
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
        
//MÅ TESTE OM TOM EXCLUDEFILES TIL func_find VIRKER FOR Å IKKE EKSKLUDERE TING, SAMME FOR 
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]);
        $md5sums = array();
        
        if ($exclude_file != "") {
            $files = $this->func_find( $app_path, "f", "*", array($exclude_file, " *.lock") );
        } else {
            $files = $this->func_find( $app_path, "f", "*", array("*.lock") );
        }
        foreach ($files as $file) {
            $md5sums[] = md5_file($file);
        }
        sort($md5sums);
        return md5(implode("", $md5sums));
        
        
        
    }
    
/**
 * Removes the temporay files from a template or component upload
 * @param type $entity: the component or template doctribe entity
 * @param type $type: template or component
 */
    public function removeTempCompFiles($entity, $type) {
        $path = $this->config["paths"][$type] . $entity->getPath();
        $this->func_rmdir($path);
    }

    public function getComponentsUsed($apps) {
        $app_root = $this->config["paths"]["app"];
        $all_comps_used = array();

        foreach ($apps as $app) {
            $app_path = $app->calculateFullPath($app_root);
            $files = $this->func_find( $app_path, "f", "*.html" );
            
            foreach ($files as $filename) {
                if (filesize($filename) > 0) {
                    $doc = new \DOMDocument("1.0", "utf-8");
                    libxml_use_internal_errors(true);
                    $doc->loadHTMLFile($filename);
                    $container = $doc->getElementById("content");
                    $elements = $container->getElementsByTagName("div");
                    foreach ( $elements as $el ) {
                        $temp_tag = $el->getAttribute("data-mlab-type");
                        if ($temp_tag != "") {
                            $all_comps_used[] = $temp_tag;
                        }
                    }
                }
            }
        }
        $all_comps_used = array_unique($all_comps_used);
        return $all_comps_used;
    }
    
//loads a list of app icon foregrounds from the icon directory
    public function getForegrounds() {
        $icon_root = $this->config["paths"]["icon"];
        $icon_url = $this->config["urls"]["icon"];
        $foregrounds = array();
        
        $temp_foregrounds = $this->func_find( $icon_root . "foregrounds/", "f", "*.png" ) + $this->func_find( $icon_root  . "foregrounds/", "f", "*.jpg" ) + $this->func_find( $icon_root . "foregrounds/", "f", "*.gif" );
        foreach ($temp_foregrounds as $temp_foreground) {
            $foregrounds[basename($temp_foreground)] = $icon_url . "foregrounds/" . basename($temp_foreground);
        }
        
        return $foregrounds;
    }
 
//loads a list of app icon backgrounds from the icon directory
    public function getBackgrounds() {
        $icon_root = $this->config["paths"]["icon"];
        $icon_url = $this->config["urls"]["icon"];
        $backgrounds = array();
        
        $temp_backgrounds = $this->func_find( $icon_root . "backgrounds/", "f", "*.png" ) + $this->func_find( $icon_root  . "backgrounds/", "f", "*.jpg" ) + $this->func_find( $icon_root . "backgrounds/", "f", "*.gif" );
        foreach ($temp_backgrounds as $temp_background) {
            $backgrounds[basename($temp_background)] = $icon_url . "backgrounds/" . basename($temp_background);
        }
        
        return $backgrounds;
    }
    
    public static function GUID_v4() {
        return sprintf('%04x%04xX%04xX%04xX%04xX%04x%04x%04x',

          // 32 bits for "time_low"
          mt_rand(0, 0xffff), mt_rand(0, 0xffff),

          // 16 bits for "time_mid"
          mt_rand(0, 0xffff),

          // 16 bits for "time_hi_and_version",
          // four most significant bits holds version number 4
          mt_rand(0, 0x0fff) | 0x4000,

          // 16 bits, 8 bits for "clk_seq_hi_res",
          // 8 bits for "clk_seq_low",
          // two most significant bits holds zero and one for variant DCE1.1
          mt_rand(0, 0x3fff) | 0x8000,

          // 48 bits for "node"
          mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
 
//functions that replicate linux commands
    
/**
 * Basic find function, like Linux command can take wildcards and specify file or directory
 * @param type $path
 * @param type $type = f for files, d for directories
 * @param type $wildcard
 * @param type $exclude_files
 */
    private function func_find($path, $type = "", $wildcard = "", $exclude_files = "") {
        $dir_iterator = new \RecursiveDirectoryIterator($path);
        $iterator = new \RecursiveIteratorIterator($dir_iterator, \RecursiveIteratorIterator::SELF_FIRST);
        if ($wildcard == "") {
            $wildcard = "*";
        }
        $result = array();
        
        foreach ($iterator as $file) {
            if ( ($type == "") || ( $type == "f" && $file->isFile() ) || ( $type == "d" && $file->isDir() ) ) {
                if ( fnmatch($wildcard, $file->getPathname()) ) {
                    if ($exclude_files != "") {
                        $exclude = false;
                        foreach ($exclude_files as $exclude_file) {
                            if (fnmatch($exclude_file, $file->getPathname())) {
                                $exclude = true;
                                break;
                            }
                        }
                        if (!$exclude) {
                            $result[] = $file->getPathname();
                        }
                    } else {
                        $result[] = $file->getPathname();
                    }
                }
            }
        }
        
        return $result;
    }
    
/**
 * Simple function to replace a string in entire file, from list of files
 * 
 * @param type $files
 * @param type $search
 * @param type $replace
 */
    public function func_sed($files, $search, $replace) {
        foreach ($files as $file) {
            $content = file_get_contents($file);
            file_put_contents( $file, str_replace($search, $replace, $content) );
        }
    }
    
    private function func_rmdir($dir) {
        if (! is_dir($dir)) {
            return false;
        }

        $it = new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS);
        $files = new RecursiveIteratorIterator($it, RecursiveIteratorIterator::CHILD_FIRST);
        foreach($files as $file) {
            if ($file->isDir()){
                rmdir($file->getRealPath());
            } else {
                unlink($file->getRealPath());
            }
        }
        rmdir($dir);
    }
    
    //xidel alternative
    private function func_extract_components() {
        // DOMDocument::loadHTMLFile
        // echo $element->getAttribute('data-test');
    }
    
    private function func_copy($src, $dst) {
        if (!file_exists($src)) {
            return;
        }
        
        if ( is_dir($src) ) { 
            $dir = opendir($src); 
            @mkdir($dst); 
            while(false !== ( $file = readdir($dir)) ) { 
                if (( $file != '.' ) && ( $file != '..' )) { 
                    if ( is_dir($src . '/' . $file) ) { 
                        $this->func_copy($src . '/' . $file,$dst . '/' . $file); 
                    } 
                    else { 
                        copy($src . '/' . $file,$dst . '/' . $file); 
                    } 
                } 
            } 
            closedir($dir);      
        } else {
            copy($src, $dst); 
        }
    }
   
}

if (!function_exists('fnmatch')) { 
    define('FNM_PATHNAME', 1); 
    define('FNM_NOESCAPE', 2); 
    define('FNM_PERIOD', 4); 
    define('FNM_CASEFOLD', 16); 

    function fnmatch($pattern, $string, $flags = 0) { 
        return pcre_fnmatch($pattern, $string, $flags); 
    } 
} 

function pcre_fnmatch($pattern, $string, $flags = 0) { 
    $modifiers = null; 
    $transforms = array( 
        '\*'    => '.*', 
        '\?'    => '.', 
        '\[\!'    => '[^', 
        '\['    => '[', 
        '\]'    => ']', 
        '\.'    => '\.', 
        '\\'    => '\\\\' 
    ); 

    // Forward slash in string must be in pattern: 
    if ($flags & FNM_PATHNAME) { 
        $transforms['\*'] = '[^/]*'; 
    } 

    // Back slash should not be escaped: 
    if ($flags & FNM_NOESCAPE) { 
        unset($transforms['\\']); 
    } 

    // Perform case insensitive match: 
    if ($flags & FNM_CASEFOLD) { 
        $modifiers .= 'i'; 
    } 

    // Period at start must be the same as pattern: 
    if ($flags & FNM_PERIOD) { 
        if (strpos($string, '.') === 0 && strpos($pattern, '.') !== 0) return false; 
    } 

    $pattern = '#^' 
        . strtr(preg_quote($pattern, '#'), $transforms) 
        . '$#' 
        . $modifiers; 

    return (boolean)preg_match($pattern, $string); 
} 
