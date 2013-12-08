<?php

namespace Sinett\MLAB\BuilderBundle\FileManagement;
use ZipArchive;

class FileManagement {
	
	private $config;
	private $required_files;
	private $replace_chars;
	private $paths;
	private $entity_type;
	
    public function __construct($mlab)
    {
        $this->config = $mlab;
    }
	
    /**
     * Little kludge, we use same code for all uploads, here we specify which type we are working with and set certain variables based on that, 
     * helps to make this independednt from parameters, etc
     * @param unknown $entity_type
     */
    public function setConfig($entity_type) {
    	$this->entity_type = $entity_type;
    	$this->required_files = $this->config['verify_uploads'][$entity_type];
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
					return array("result" => false, "message" => "Missing files: " . implode(",", $this->required_files));
				}
				 
//if overwrite, just use existing folder
				
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
					$temp = file($full_path . "/conf.txt");
					foreach ($temp as $line) {
						if (substr(trim($line), 0, 8) == "tooltip=") {
							$entity->setDescription(substr(trim($line), 8));
						} else if (substr(trim($line), 0, 16) == "compatible_with=") {
							$entity->setCompatibleWith(substr(trim($line), 16));
						} else if (substr(trim($line), 0, 8) == "version=") {
							$entity->setVersion(substr(trim($line), 8));
						}
						
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
	function loadComponents($access, $path, $config) {
		
		$components = array();
		if ($handle = opendir($path)) {
			while (false !== ($entry = readdir($handle))) {
				$comp_dir = $path . $entry . "/";
				
				if ( is_dir($comp_dir) && substr($entry, 0, 1) != "." ) {
//always add html, rest we add content or set bool values that will let us know what to do later
						$components[$entry] = array("html" => @file_get_contents($comp_dir . $config["HTML"]),
								"js" => file_exists("$comp_dir$entry.js"),
								"exec_browser" => @file_get_contents($comp_dir . $config["SCRIPTS"]),
								"exec_server" => file_exists($comp_dir . $config["PHP"]),
								"rights" => @file_get_contents($comp_dir . $config["RIGHTS"]),
								"conf" => @file_get_contents($comp_dir . $config["CONFIG"]),
								"accessible" => in_array($entry, $access)); //we hide 
	
//convert the conf.text to an associative array, this way can use it a a lookup
						if ($components[$entry]["conf"] !== false) {
							$tmp = explode("\n", $components[$entry]["conf"]);
							$components[$entry]["conf"] = array();
							foreach ($tmp as $line) {
								$line = trim($line);
								if (strlen($line) > 0 && substr($line, 0, 1) != ";") {
									list($key, $val) = explode("=", $line);
									$components[$entry]["conf"][$key] = $val;
								}
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
	
	/**
	 * Function called to create a new app, first calls cordova to generate structure, then copiues across relevant template files
	 * Default platform is usually android, but could be iOS if run on mac for instance...
	 */
	public function createAppFromTemplate ($template, $app) {
		
//prepare all the paths to use
		$default_platform = $this->config["cordova"]["default_platform"];
		$cordova_bin_path = $this->config["cordova"][$default_platform]["bin_path"];
		$include_paths = $this->config["cordova"][$default_platform]["include_paths"];
		$app_path = $app->calculateFullPath($this->config["paths"]["app"]);
		$template_path = $template->calculateFullPath($this->config["paths"]["template"]);
		$template_items_to_copy = $this->config["app"]["copy_files"];
		$cordova_asset_path = $app_path . $this->config["cordova"]["asset_path"];
		$app_domain = $this->config["cordova"]["app_creator_identifier"];
		
		$cmd = "$cordova_bin_path/create $app_path $app_domain \"" . $app->getPath() . "\" 2>&1";
		
		if (!putenv('PATH=' . getenv('PATH') . ":" . implode(":", $include_paths))) {
			return array("Could not set path for Cordova");
		}
		
		$output = array();
		$exit_code = 0;
		exec($cmd, $output, $exit_code);
		
		//TODO FIX
		$exit_code = 0;
		
//check exit code, anything except 0 = fail
		if ($exit_code != 0) {
			return $output + array("Exit code: " . $exit_code);
		} else {
			foreach ($template_items_to_copy as $from => $to) {
				$cmd = "cp -r \"$template_path$from\"* \"$cordova_asset_path$to\"";
				$ret = shell_exec($cmd);
			}
			return true;
		}
	}
	
	/**
	 * Function called to create a new app, first calls cordova to generate structure, then copiues across relevant template files
	 * Default platform is usually android, but could be iOS if run on mac for instance...
	 */
	public function lockPage ($app, $page_num) {
		
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
     * then keep increasing it until it is not found (in vcase someone else creates a file inthe mean time)
     * @param type $app_path
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
     * Copies a template page
     * @param type $app
     * @return bool
     */
    public function newPage($app, $title) {
//get path of template file to copy
        $template_path = $app->getTemplate()->calculateFullPath($this->config['paths']['template']) . $this->config['app']['new_page'];
        
//create the name of the file to create
	    list($new_page_num, $new_page_path) = $this->getNewPageNum($app);
        if ($new_page_num === false) {
            return false;
        }

        $temp = file_get_contents($template_path);
        $temp = preg_replace('/<title>(.+)<\/title>/', "<title>$title</title>", $temp);
        if (file_put_contents ($new_page_path, $temp)) {
            return $new_page_num;
        } else {
            return false;
        }
    }
    
    public function savePage($app, $page_num, $html) {
//get path of file to save
        $file_path = $app->calculateFullPath($this->config['paths']['app']) . $this->config['cordova']['asset_path'] . substr("000" . $page_num, -3) . ".html";;
        
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
    
    
    public function getPageIdAndTitles($app) {
        $pages = array("index.html" => "Front page");
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]) . $this->config["cordova"]["asset_path"];
   		$files = glob ( $app_path . "/???.html" );
        
        foreach ($files as $file) {
            if (preg_match('/<title>(.+)<\/title>/', file_get_contents("$file"), $matches) && isset($matches[1])) {
                $pages[intval(basename($file))] = $matches[1];
            } else {
                $pages[intval(basename($file))] = "Untitled [{$file}]";
            }
        }
        return $pages;
    }
		
}