<?php
/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no)

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Library that contains all code related to file and app page management, for instance copying a page or processing pages for compilation.
 */

namespace Sinett\MLAB\BuilderBundle\FileManagement;
use ZipArchive;
use Symfony\Component\Yaml\Parser;
use Sinett\MLAB\BuilderBundle\Entity\Component;

//this class is used to store new functions that will process embedded variables in the index.html file
//one example is a class to 
class CustomPreProcessing {
    
//gets total number of pages in an app
    public function getnumberofpages($file_mgmt, $config, $app, $app_path) {
   		$pages = $file_mgmt->getAppConfigValue($app, "page_order");
        if (!$pages) {
            $pages = glob( $app_path . "/???.html" );
        }
        return sizeof($pages); //when we get the complete list of pages (see getpageorder() below) we add page 0 (index) hence this is correct return value, normally we need to reduce by one
    }
    
//returns list of pages in the order they are to be displayed
    public function getpageorder($file_mgmt, $config, $app, $app_path) {
        
        $pages = $file_mgmt->getAppConfigValue($app, "page_order");
        if (!$pages) {
            $pages = array_map("basename", glob( $app_path . "/???.html" ));
        }
        $page_order = array_map(function($val){return intval($val); }, $pages);
        
        array_unshift($page_order, 0);
        return json_encode($page_order);
    }
    
}


/**
 * a service class that is used primarily by the App and Services controllers. Deals with all aspects of file and app mangement (uploading, deleting, etc)
 */

class FileManagement {
	
	private $config;
    private $router;
	private $required_files;
	private $replace_chars;
	private $paths;
	private $entity_type;
	private $em;
    
    public function __construct($mlab, $mlab_app, $router, \Doctrine\ORM\EntityManager $em, $locale)
    {
        $this->config = array_merge_recursive($mlab, $mlab_app);
        $this->router = $router;
        $this->em = $em;
        $this->locale = $locale;
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
            $this->required_strings = $this->config['verify_uploads'][$entity_type . "_required_strings"];
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
            $conf_ok = TRUE;
	
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
                    foreach($this->config['verify_uploads'][$this->entity_type . "_conf_required"] as $required_setting) {
                        if (!isset($temp[$required_setting])) {
                            $conf_ok = FALSE;
                            $err_msg = "The following required entry was missing from the conf.yml file: " . $required_setting;
                            break;
                        }
                    }
                    if (isset($temp["tooltip"])) {
                        if (is_array($temp["tooltip"])) {
                            if (isset($temp["tooltip"][$this->locale])) {
                                $entity->setDescription($temp["tooltip"][$this->locale]);
                            }
                        } else {
                            $entity->setDescription($temp["tooltip"]);
                        }
                    }

                    if (isset($temp["name"])) {
                        if (is_array($temp["name"])) {
                            if (isset($temp["name"][$this->locale])) {
                                $entity->setName($temp["name"][$this->locale]);
                            }
                        } else {
                            $entity->setName($temp["name"]);
                        }

//fallback, if no name specified in conf.yml we use thename of zip file
                    } else {
                        $entity->setName($object_name);
                    }
                    
                    if (isset($temp["compatible_with"])) {
                        $entity->setCompatibleWith($temp["compatible_with"]);
                    } 
                    if (isset($temp["version"])) {
                        $entity->setVersion($temp["version"]);
                    } else {
                        $entity->setVersion(0);
                    }
                    
                    if (isset($temp["order_by"])) {
//always increase order by to a higher number, then they can amend it later in the database
                        $entity->setOrderBy($this->em->getRepository('SinettMLABBuilderBundle:Component')->findOneBy(array(), array('order_by' => 'DESC'))->getOrderBy() + 1);
                    }

                } else {
                    $conf_ok = false;
                    $err_msg = "No configuration file found";
                }
                
//config file does not exists or does not have all required properties, so we bail.
                if (!$conf_ok) {
// clean up the file property, not persisted to DB
                    $entity->setZipFile(null);
                    return array("result" => false, "message" => $err_msg);
                    
                }
				
				$entity->setPath($dir_name);
		   
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

            $component_record = $this->em->getRepository('SinettMLABBuilderBundle:Component')->findByPath($comp_id);
            if (is_array($component_record) && sizeof($component_record) > 0) {
                $ob = $component_record[0]->getOrderBy();
//add credentials if the component has gotten it saved in the database
                $comp_groups = $component_record[0]->getComponentGroups();
                if (sizeof($comp_groups) > 0){
                    $comp_group = $comp_groups[0];
                    $credential = $comp_group->getCredential();
                } else {
                    $credential = "";
                }
            } else {
                $ob = 999 + rand(1, 10000); // make sure it comes at the end of the list and has a unique position
                $credential = "";
            }

//always add html, rest we add content or set bool values that will let us know what to do later
            $component = array("html" => $html,
                    "code" => @file_get_contents($comp_dir . $config["SCRIPTS"]),
                    "server_code" => file_exists($comp_dir . $config["PHP"]),
                    "conf" => $tmp_yaml,
                    "is_feature" => false,
                    "order_by" => $ob);
            
            $component["conf"]["credential_values"] = $credential;
            
            if ($check_access) {
                $component["accessible"] = ($failed === true ? false : in_array($comp_id, $check_access)); //we hide the ones they are not allowed to see OR with failed config, but still load it for reference may exist in app...
            }


            if (isset($component["conf"]) && isset($component["conf"]["feature"])) {
                $component["is_feature"] = $component["conf"]["feature"] == "true";
            }
            
            if (isset($component["conf"]) && isset($component["conf"]["category"])) {
                $component["is_storage_plugin"] = ($component["conf"]["category"] == "storage_plugin");
                $component["is_component"] = (!$component["is_feature"] && !$component["is_storage_plugin"]);
                $component["inheritance_processed"] = false;
            }
            
            if (isset($component["conf"]) && isset($component["conf"]["urls"])) {
                foreach ($component["conf"]["urls"] as $url_key => $url_name) {
                    $component["conf"]["urls"][$url_key] = $this->router->generate($url_name, array('app_id' => $app_id, 'comp_id' => $comp_id));
                }
            }

//required_libs require the prefix for the URL added here, this way one component can inherit another component's complete set of files
            if (isset($component["conf"]) && isset($component["conf"]["required_libs"])) {
                if (isset($component["conf"]["required_libs"]["designtime"])) {
                    $component["conf"]["required_libs"]["designtime"] = array_map(function($filename) use ($comp_id) {
                            if(!filter_var($filename, FILTER_VALIDATE_URL)) { 
                                $path_parts = pathinfo($filename);
                                return $this->config['urls']['component'] . $comp_id . "/" . $path_parts['extension'] . "/" . $filename; 
                            } else {
                                return $filename;
                            }
                        }, $component["conf"]["required_libs"]["designtime"]);
                }
                if (isset($component["conf"]["required_libs"]["runtime"])) {
                    $component["conf"]["required_libs"]["runtime"] = array_map(function($filename) use ($comp_id) {
                            if(!filter_var($filename, FILTER_VALIDATE_URL)) { 
                                $path_parts = pathinfo($filename);
                                return $this->config['urls']['component'] . $comp_id . "/" . $path_parts['extension'] . "/" . $filename; 
                            } else {
                                return $filename;
                            }
                        }, $component["conf"]["required_libs"]["runtime"]);
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
 * Helper function that will copy across all required files for the current component + any components it is inherited from
 */
    public function copyRequiredFiles($comp_config, $path_app, $path_components_root) {
        $yaml = new Parser();
        $required_file_list = array();
        $temp_comp = $comp_config["name"];

//first compile a list of all required files, we do this by recursively following the "inherit" setting and 
//add ing the required/runtime files for each step in the chain         
        while ($temp_comp) {
            $file_name = "{$path_components_root}{$temp_comp}/conf.yml";
            if (file_exists($file_name)) {
                $temp_config = $yaml->parse(@file_get_contents($file_name));
                if (isset($temp_config["required_libs"]) && isset($temp_config["required_libs"]["runtime"])) {
                    $required_file_list[$temp_comp] = $temp_config["required_libs"]["runtime"];
                }
                $temp_comp = (array_key_exists("inherit", $temp_config) ? $temp_config["inherit"] : false);
            } else {
                $temp_comp = false;
            }
        }
        
//now loop through the list of dependencies
        foreach ($required_file_list as $component => $dependencies) {
            $path_component = "{$path_components_root}{$component}/";
            foreach ($dependencies as $dependency) {
                $filetype = pathinfo($dependency, PATHINFO_EXTENSION);
                if ($filetype == "") {
                    $filetype = "js";
                } 

//if this is a URL we just add it to the include file, no need to copy the file
                if(!filter_var($dependency, FILTER_VALIDATE_URL)) {
                    if (file_exists( "$path_component/$filetype/$dependency" ) && !file_exists( "$path_app/$filetype/$dependency" )) {
//if we fail we bail
                        if (!@copy( "$path_component/$filetype/$dependency", "$path_app/$filetype/{$component}_{$dependency}" )) {
                            return array(
                                'result' => 'failure',
                                'msg' => sprintf("Unable to copy dependency file %s for this component: %s", $dependency , $comp_id));
                        }
                    }
                }

//we need to update the include files of the app
                if (file_exists("$path_app/$filetype/include.$filetype")) {
                    $include_items = file("$path_app/$filetype/include.$filetype", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                } else {
                    $include_items = array();
                }

                if ($filetype == "css") {
                    if (!in_array("@import url('../css/{$component}_{$dependency}');", $include_items)) {
                        $include_items[] = "@import url('../css/{$component}_{$dependency}');";
                    }
                } else {
                    if (substr($dependency, 0, 4) == "http") {
                        if (!in_array("$.getScript('$dependency');", $include_items)) {
                            $include_items[] = "$.getScript('$dependency');";
                        }
                    } else {
                        if (!in_array("$.getScript('js/{$component}_{$dependency}');", $include_items)) {
                            $include_items[] = "$.getScript('js/{$component}_{$dependency}');";
                        }
                    }
                }
                file_put_contents("$path_app/$filetype/include.$filetype", implode("\n", $include_items));
            } //end inner loop to copy and add runtime scripts 
        } //end outer component loop

        
    }

    public function componentAdded($app_id, $app, $comp_id) {
        $path_component = $this->config['paths']['component'] . $comp_id . "/";
        $path_app = $app->calculateFullPath($this->config['paths']['app']);
        $path_app_js = $path_app . "js/";
        
//check if path to component and app exists
        if ( is_dir($path_component) && is_dir($path_app) ) {

//1: Copy JS file, it is called code_rt.js, but needs to be renamed as all JS files for components have same name to begin with
//   We use the component name as a prefix
            if (file_exists( $path_component . "code_rt.js") && !file_exists( $path_app_js . $comp_id . "_code_rt.js")) {
                if (!@copy($path_component . "code_rt.js", $path_app_js . $comp_id . "_code_rt.js")) {
                    return array(
                        'result' => 'failure',
                        'msg' => sprintf("Unable to copy JavaScript file for this component: %s", $comp_id));
                }

                if (file_exists("$path_app_js/include_comp.txt")) {
                    $include_items = file("$path_app_js/include_comp.txt", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                } else {
                    $include_items = array();
                }
                if (!in_array("js/" . $comp_id . "_code_rt.js", $include_items)) {
                    $include_items[] = "js/" . $comp_id . "_code_rt.js";
                }
                file_put_contents("$path_app_js/include_comp.txt", implode("\n", $include_items));
            }

            $appConfig = $appConfigUpdate['config'] = $this->getAppConfig($app);
                
//2: Add plugins to the local conf file. We store these as the compiler service will later add these through CLI commands
//https://cordova.apache.org/docs/en/5.1.1/guide_cli_index.md.html
//https://cordova.apache.org/docs/en/5.1.1/cordova_plugins_pluginapis.md.html#Plugin%20APIs.
            if (file_exists($path_component . "conf.yml")) {
                $yaml = new Parser();
                $comp_config = $yaml->parse(@file_get_contents($path_component . "conf.yml"));

                if (isset($comp_config["plugins"])) {
                    $new_plugins = $comp_config["plugins"];

//update config file for app with the list of plugins, Used when we compile the app using Cordova
                    $appConfigUpdate['config']["title"] = $app->getName();
                    $appConfigUpdate['config']["plugins"] = array_unique(array_merge($new_plugins, $appConfig["plugins"]));
                }
                
                if (isset($comp_config["requires_network"]) && $comp_config["requires_network"] != 'none') {
                    $counter = 'count' . ucfirst($comp_config["requires_network"]) . 'Comp';
                    isset($appConfigUpdate['config'][$counter]) OR $appConfigUpdate['config'][$counter] = 0;
                    $appConfigUpdate['config'][$counter] += 1;
                }
                $this->componentUpdateConfig($app, $comp_id, $appConfigUpdate);

//2.5: copy across any runtime dependencies, can be JS or CSS
                $this->copyRequiredFiles($comp_config, $path_app, $this->config['paths']['component']);

            } //end conf file exists

//3: run the server_code.php file if it exists
            if (file_exists($path_component . "server_code.php")) {
                $temp_class_name = "mlab_ct_" . $comp_id;
                
                if (!class_exists($temp_class_name) && !@(include($path_component . "server_code.php"))) {
                    return array(
                            'result' => 'failure',
                            'msg' => "Unable to load server_code.php file");
                }
                
                if (class_exists($temp_class_name)) {
                    $component_class = new $temp_class_name();
                    if (method_exists($component_class, "onCreate")) {
                        if (!$component_class->onCreate($path_app, $path_component, $comp_id)) {
                            return array(
                                'result' => 'failure',
                                'msg' => "Unable to run application on server");
                        }
                    }
                }
            }

            return array('result' => 'success', 'config' => $appConfigUpdate['config']);

        } else {
                $error = "";
                if (!is_dir($path_component)) { $error .= "Component not found\n"; }
                if (!is_dir($path_app)) { $error .= "App not found\n"; }
                return array(
                            'result' => 'failure',
                            'msg' => $error);
        }        
    }
	
        public function componentUpdateConfig($app, $comp_id = null, $update = []) {
            $component = null;
            $path_app = $app->calculateFullPath($this->config['paths']['app']);
            $config = $prevConfig = $this->getAppConfig($app);

            if(!is_dir($path_app)) {
                return array(
                    'result' => 'failure',
                    'msg' => "App not found\n"
                );
            }
            
            if($comp_id) {
                $path_component = $this->config['paths']['component'] . $comp_id . "/";
                if (file_exists($path_component . "conf.yml")) {
                    $yaml = new Parser();
                    $component = $yaml->parse(@file_get_contents($path_component . "conf.yml"));
                }
            }

            if(isset($update['config'])) {
                $config = array_merge($config, $update['config']);
            }

            if(isset($update['execute'])) {
                $execute = $update['execute'];
                $config = call_user_func(function() use ($component, $config, $execute) {
                    eval($execute);
                    return $config;
                });
            }

            if($config != $prevConfig) {
               $path_app_config = $path_app . $this->config['filenames']["app_config"];
               file_put_contents($path_app_config, json_encode($config));   
            }

            return array('result' => 'success', 'config' => $config);
        }
	
	/**
	 * Function called to create a new app, copies across relevant template files 
	 */
	public function createAppFromTemplate ($template, $app) {
		
//prepare all the paths to use
		$app_path = $app->calculateFullPath($this->config["paths"]["app"]);
        $app_config_path = $app_path . $this->config['filenames']["app_config"];
		$template_path = $template->calculateFullPath($this->config["paths"]["template"]);
		$template_items_to_copy = $this->config["app"]["copy_files"];
		$app_conf = array("title" => $app->getName(), "plugins" => array());
		$output = array();
		$exit_code = 0;
		
        if (mkdir($app_path, 0777, true)) { 
            foreach ($template_items_to_copy as $from => $to) {
                $this->func_copy("$template_path$from", "$app_path$to");
            }
            
//first update the conf.json file with any global plugins, as specified in parameters.yml
            if ($this->config["plugins"]) {
                $app_conf["plugins"] = array_merge($app_conf["plugins"], $this->config["plugins"]);
            }
                        
//update the conf.json file with any plugins specified in the template file
            if (file_exists($template_path . "conf.yml")) {
                $yaml = new Parser();
                $temp = $yaml->parse(@file_get_contents($template_path . "conf.yml"));
                if (array_key_exists("plugins", $temp)) {
                    $app_conf["plugins"] = array_merge($app_conf["plugins"], $temp["plugins"]);
                }
            }
            
            file_put_contents($app_config_path, json_encode($app_conf));
            return true;
        } else {
            return array("Unable to create directory: $app_path");
        }
	}
	
/**
 * Simple function to update the conf.json file that is used to store info about an app for compilation purposes
 * @param type $app
 * @param type $values = associative array
 */
    public function updateAppConfigFile($app, $values) {
        $path_app = $app->calculateFullPath($this->config['paths']['app']);
        $path_app_config = $path_app . $this->config['filenames']["app_config"];
        if (file_exists($path_app_config)) {
            $tmp_existing_config = json_decode(file_get_contents($path_app_config), true);
        } else {
            $tmp_existing_config = array();
        }
        foreach($values as $key => $value) {
            $tmp_existing_config[$key] = $value;
        }
        file_put_contents($path_app_config, json_encode($tmp_existing_config));        
    }

/**
 * Simple function to retrieve a value from the app specific config file
 * @param type $app
 * @param type $key
 * @return any requested value
 */
    public function getAppConfigValue($app, $key) {
        $path_app = $app->calculateFullPath($this->config['paths']['app']);
        $path_app_config = $path_app . $this->config['filenames']["app_config"];
        if (file_exists($path_app_config)) {
            $tmp_existing_config = json_decode(file_get_contents($path_app_config), true);
            if (array_key_exists($key, $tmp_existing_config)) {
                return $tmp_existing_config[$key];
            } 
        }
        return false;

    }

/**
 * Get application config json
 * @param type $app
 */
    public function getAppConfig($app = null) {
        $defaultConfig = [
            'tableOfContents' => []
        ];
        $config = [];

        if ($app && !$this->appConfig) {
            $path_app = $app->calculateFullPath($this->config['paths']['app']);
            $path_app_config = $path_app . $this->config['filenames']["app_config"];

            if (file_exists($path_app_config)) {
                $config = json_decode(file_get_contents($path_app_config), true);
            }

            $this->appConfig = array_merge($defaultConfig, $config);
        }

        return $this->appConfig;
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
    public function newPage($app, $title) {
        
//create the name of the file to create
	    $new_page = $this->getNewPageNum($app);
        if ($new_page["new_page_num"] === false) {
            return false;
        }
        
//if title is specified we store the page WITH content, otherwise it is just an emopty placeholder that is filled in with data from front end when user saves it next time.
        if ($title) {
            $content = str_replace("%TITLE%", $title, $this->config["app"]["html_header"]) . $this->config["app"]["html_footer"];
        } else {
            $content = "";
        }

        if (file_put_contents ($new_page["new_page_path"], $content) !== false) {
//update order with the new page
            $current_order = $this->getAppConfigValue($app, "page_order");
            if (!$current_order) {
                $app_path = $app->calculateFullPath($this->config["paths"]["app"]);
                $current_order = array_map("basename", glob( $app_path . "/???.html" ));
            } else {
                $current_order[] = basename($new_page["new_page_path"]);
            }
            $this->updateAppConfigFile($app, array("page_order" => $current_order));
            return $new_page["new_page_num"];
        } else {
            return false;
        }
    }
    
    public function savePage($pageNum, $html) {
        $pageTOC = $this->getPageTOC($pageNum);
        $title = $pageTOC['title'];

//get path of file to save
        if ($pageNum === 0) {
            $file_path = $this->app->calculateFullPath($this->config['paths']['app']) . "index.html";
            return file_put_contents ($file_path, $html);
        } else {
            $template_page_path = $this->app->getTemplate()->calculateFullPath($this->config["paths"]["template"]) . $this->config["app"]["new_page"];
            $page = str_replace(array("%%TITLE%%", "%%CONTENT%%"), array($title, $html), file_get_contents ($template_page_path));
//We use this code to save to cache directory as well, if so we will have a complete path, not a page number
            if(is_numeric($pageNum)) {
                $file_path = $this->app->calculateFullPath($this->config['paths']['app']) . substr("000" . $pageNum, -3) . ".html";
            } else {
                $file_path = $pageNum;
            }
            return file_put_contents ($file_path, $page);
        }
    }
    
    /**
     * copies a page
     * @param type $app
     * @param type $page_num
     * @return boolean
     */
    public function copyPage($app, $page_num) {
//get path of file to copy, we do not allow them to copy the index.html page, so will always be numeric.
        $source_path = $app->calculateFullPath($this->config['paths']['app']) .  substr("000" . $page_num, -3) . ".html";;
        
//create the name of the file to create
	    $new_page = $this->getNewPageNum($app);
        if ($new_page["new_page_num"] === false) {
            return false;
        }

        $temp = file_get_contents($source_path);
        $temp = preg_replace('/<title>(.+)<\/title>/', '<title>Copy of $1</title>', $temp);
        if (file_put_contents ($new_page["new_page_path"], $temp)) {
//update links with the new page
            $current_order = $this->getAppConfigValue($app, "page_order");
            if (!$current_order) {
                $app_path = $app->calculateFullPath($this->config["paths"]["app"]);
                $current_order = array_map("basename", glob( $app_path . "/???.html" ));
            } else {
                $current_order[] = basename($new_page["new_page_path"]);
            }
            $this->updateAppConfigFile($app, array("page_order" => $current_order));
            return $new_page["new_page_num"];
        } else {
            return false;
        }
    }

    /**
     * List of deleted 
     * 
     * @param type $app
     * @return array [pageNum => pageTitle]
     */
    public function listDeletedPages($app) {
        $app_path = $app->calculateFullPath($this->config['paths']['app']);
        $appConfig = $this->getAppConfig($app);

        $allPages = array_map("basename", glob($app_path . "/???.html"));
        $deletedPages = array_diff($allPages, $appConfig['page_order']);
        $list = [];
        
        libxml_use_internal_errors(true);

        foreach($deletedPages as $pageFile) {
            $doc = new \DOMDocument("1.0", "utf-8");
            $doc->validateOnParse = false;
            $doc->loadHTMLFile($app_path .  $pageFile);
            
            $xpath = new \DOMXPath($doc);
            $pageContainer = $xpath->query("(//div[@data-role='page'])[1]");
            
            $pageId = substr($pageFile, 0, -5);
            
            $list[$pageId] =  $pageContainer[0]->getAttribute("data-title");
        }
        
        return $list;
    }
    
    protected function updateNetworkComponentCounters($action, &$config, $pageComponents) {
        $add = $action == 'add' ? 1 : -1;
        foreach ($pageComponents as $component) {
             if (isset($component['config']["requires_network"]) && $component['config']["requires_network"] != 'none') {
                $counter = 'count' . ucfirst($component['config']["requires_network"]) . 'Comp';
                isset($config[$counter]) OR $config[$counter] = 0;
                $config[$counter] = max(0, $config[$counter] + $add);
            }
        }
    }    

    protected function getPageComponents($path) {
        $components = [];
        $componentConfigs = [];

        $doc = new \DOMDocument("1.0", "utf-8");
        libxml_use_internal_errors(true);
        $doc->validateOnParse = false;
        $doc->loadHTMLFile($path);
        libxml_clear_errors();

        $xpath = new \DOMXPath($doc);
        $page_components = $xpath->query('//div[@data-mlab-type]');

        foreach ($page_components as $page_component) {
            $comp_name = $page_component->getAttribute("data-mlab-type");
            if(!isset($componentConfigs[$comp_name])) {
                $path_component = $this->config['paths']['component'] . $comp_name . "/";
                if (file_exists($path_component . "conf.yml")) {
                    $yaml = new Parser();
                    $componentConfigs[$comp_name] = $yaml->parse(@file_get_contents($path_component . "conf.yml"));
                }
            }
            $components[] = [
                'node' => $page_component,
                'type' => $comp_name,
                'config' => $componentConfigs[$comp_name]
            ];
        }
        
        return $components;
    }
    
    /**
     * Moves a page, this is done by renaming pages so they are always sequential.
     * 
     * @param type $app
     * @param type $page_num
     * @return name of file to open after the page was deleted (next or previous or first page) OR false if fail
     */
    public function reorderPage($app, $from_page, $to_page, $uid) {
        
//get path of files to reorder
        $app_path = $app->calculateFullPath($this->config['paths']['app']);
        $current_order = $this->getAppConfigValue($app, "page_order");
        if (!$current_order) {
            $current_order = array_map("basename", glob( $app_path . "/???.html" ));
        }
        
        $from_page = array_search(substr("000" . $from_page, -3) . ".html", $current_order);
        $to_page = array_search(substr("000" . $to_page, -3) . ".html", $current_order);

//rearrange the array so the page is "moved" in the list        
        $temp_order = array_splice($current_order, $from_page, 1);
        array_splice($current_order, $to_page, 0, $temp_order);

//update the order and return it.
        $this->updateAppConfigFile($app, array("page_order" => $current_order));
        return true;
    }    

/**
 * Updates all pages in an app when a page has been moved
 * We always add internal links as this: mlab.api.navigation.pageDisplay(x); 
 *    here x can be index, first, last, next, previous or a page number
 *    we are only concerned with actual numbers, the rest are 
 * 
 * Need to loop through all pages, but only replace links of pages that have been moved
 * We have pages 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 
 * If 7 is moved to 3
 *    7 = 3
 *    3 to 6 = +1
 * If 4 is moved to 9
 *    4 = 9
 *    5 to 9 = -1
 */    
    
/* redundant as we never move pages anymore 

    public function updatePageLinks($app_path, $from_page, $to_page) {
        $match = "mlab.api.navigation.pageDisplay";
        $files = glob ( $app_path . "/*.html" );
        foreach ($files as $file) {
            $lines = file($file);
            for($i = 0; $i < sizeof($lines); $i++) {
                if (strpos($lines[$i], $match) > 0) {
                    $lines[$i] = preg_replace_callback(  "/$match\s*\((\d+)\)/", 
                                            function($page) use ($from_page, $to_page, $match) {
                                                $orig_page = intval($page[1]);
                                                if ($orig_page == $from_page) {
                                                    $new_page = $to_page;
//moved a page "up", that is to a lower page number
                                                } else if ($from_page > $to_page && $orig_page >= $to_page && $orig_page < $from_page) {
                                                    $new_page = $orig_page + 1;
                                                    
//moved a page "down", that is to a higher page number
                                                } else if ($from_page < $to_page && $orig_page > $from_page && $orig_page <= $to_page) {
                                                    $new_page = $orig_page - 1;
                                                } else {
                                                    $new_page = $orig_page;
                                                }
                                                return "$match($new_page)";
                                            },
                                            $lines[$i]
                        );
                }
                file_put_contents( $file, implode("", $lines)); //we carry along newlines, etc, so no need to add anything between lines here. Preserves win to lin/lin to win differences.
            }
        }
    }
 */

    
/**
 * returns an associative array of file positions (the key), filenames and titles of the pages for an app
 * @param type $app
 * @return $pages
 */
    public function getPageIdAndTitles($app) {
        
//get list of the file order, this ALWAYS exclude the index.html file as it is non-deletable, non-moveable
        $page_order = $this->getAppConfigValue($app, "page_order");
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]);
        if (!$page_order) {
            $page_order = array_map("basename", glob( $app_path . "/???.html" ));
        }
//first store the index file details
        if (preg_match('/<title>(.+)<\/title>/', file_get_contents("$app_path/index.html"), $matches) && isset($matches[1])) {
            $pages = array(0 => array("filename" => "index.html", "title" => $matches[1]));
        } else {
            $pages = array(0 => array("filename" => "index.html", "title" => "Untitled"));
        }

//now loop through the remaining pages which will exclude "deleted" pages although they are on the disk
        foreach ($page_order as $filename) {
            if (preg_match('/<title>(.+)<\/title>/', file_get_contents("$app_path/$filename"), $matches) && isset($matches[1])) {
                $pages[] = array("filename" => $filename, "title" => $matches[1]);
            } else {
                $pages[] = array("filename" => $filename, "title" => "Untitled");
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
        $doc->validateOnParse = false;
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
        $doc->validateOnParse = false;
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
/*    public function updateAppParameter($app, $param, $value) {
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
    }*/
 
/**
 * Using PHP function to generate an MD5 sum for an app, looks in the root folder, excluding lock files
 * @param type $app
 * @param type $exclude_file: Usually used to 
 * @return type
 */
    public function getAppMD5($app, $exclude_file = "") {
        
//MÅ TESTE OM TOM EXCLUDEFILES TIL func_find VIRKER FOR Å IKKE EKSKLUDERE TING, SAMME FOR 
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]);
        $md5sums = array();
        
        if ($exclude_file != "") {
            $files = $this->func_find( $app_path, "f", "*", array($exclude_file, "*.lock") );
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
 * Using PHP function to generate an MD5 sum for the final generated files of an app, looks in the root folder, excluding lock files
 * @param type $app
 * @param type $exclude_file: Usually used to 
 * @return type
 */
    public function getProcessedAppMD5($app, $exclude_file = "") {
        
        $app_path = $app->calculateFullPath($this->config["paths"]["app"]);
        $cached_app_path = substr_replace($app_path, "_cache/", -1); 
        
        if (!file_exists($cached_app_path)) {
            return "";
        }
        
        $md5sums = array();
        
        if ($exclude_file != "") {
            $files = $this->func_find( $cached_app_path, "f", "*", array($exclude_file, "*.lock") );
        } else {
            $files = $this->func_find( $cached_app_path, "f", "*", array("*.lock") );
        }
        foreach ($files as $file) {
            $md5sums[] = md5_file($file);
        }
        sort($md5sums);
        return md5(implode("", $md5sums));
    }

/**
 * Function that will go through each page in an app and run various processing functions
 * Returns array that is status and the checksum of the code output (not original code!)
 * @param type $app
 * 
 * 
 */
    public function preCompileProcessingAction($app) {
        
//get basic objects and variables ready
        $comp_dir = $this->config["paths"]["component"];
        $components = $this->loadComponents(array(), $comp_dir, $this->config["component_files"], $app->getId());
        $app_path = $app->calculateFullPath($this->config['paths']['app']);
        $path_app_config = $app_path . $this->config['filenames']["app_config"];
        $cached_app_path = substr_replace($app_path, "_cache/", -1); 
        $app_checksum = $this->getAppMD5($app, $this->config['filenames']["app_config"]);
        
//prepare list of pages here, this also updates the conf.json so we sen through the correct app config to any external functions
//OLD         $pages = glob ( $app_path . "???.html" );
        $pages = $this->getAppConfigValue($app, "page_order");
        if (!$pages) {
            $pages = array_map("basename", glob( $app_path . "/???.html" ));
            $this->updateAppConfigFile($app, array("page_order" => $pages));
        }
//add app path to all paths, we never store paths in config file.
        $func = function($val) use ($app_path) { return $app_path . $val; };
        $pages = array_map($func, $pages);        
        
        array_unshift($pages, $cached_app_path . "000.html"); //fake placeholder to make loop below work neater
        array_unshift($pages, $app_path . "index.html"); //fake placeholder to make loop below work neater
        
// check to see if this has already been processed, if so just return
        if (file_exists($path_app_config)) {
            $tmp_existing_config = json_decode(file_get_contents($path_app_config), true);
            if (array_key_exists("processed_checksum", $tmp_existing_config)) {
                if ($tmp_existing_config["processed_checksum"] == $app_checksum) {
                    return array("result" => "success", "checksum" => $this->getProcessedAppMD5($app, $this->config['filenames']["app_config"]));
                }
            }
        } else {
            $tmp_existing_config = array();
        }
        $tmp_existing_config["processed_checksum"] = $app_checksum;
        file_put_contents($path_app_config, json_encode($tmp_existing_config));

//prepare processing class
        $process = new CustomPreProcessing();

//first make the cache dir (i.e. the dir with the files to be compiled) and then process index.html file
//This can have special variables in it, for the other pages we only execute the onCompile function
        if (!file_exists($cached_app_path)) {
            mkdir($cached_app_path);
        }
        $frontpage_content = file_get_contents($app_path . "index.html");

//we extract the content of the index.html file and store it in 000.html, otherwise the content will always be displayed
        $doc = new \DOMDocument("1.0", "utf-8");
        libxml_use_internal_errors(true);
        $doc->validateOnParse = false;

        $doc->loadHTML($frontpage_content);
        libxml_clear_errors();
        
        $content = ""; 
        $element = $doc->getElementById($this->config["app"]["content_id"]);
        $children  = $element->childNodes;
        foreach ($children as $child) {
            $content .= $element->ownerDocument->saveHTML($child);
        }

        //$content = $doc->saveHtml($doc->getElementById($this->config["app"]["content_id"]));
        $this->savePage($app, $cached_app_path . "000.html", $doc->getElementsByTagName('title')->item(0)->textContent, $content);

//get list of all placeholders, each placeholder is surrounded by double percentage (%) signs
        preg_match_all('~%%(.+?)%%~', $frontpage_content, $placeholders);
        $placeholders = array_unique($placeholders[1]);

//we use two separate loops to check for function or component placeholders. 
//Reason for this is that a component may well have a function placeholder inside it.
// * NB!!!!! This will not be suitable for components that are interactive at designtime, 
//           such as a map that requires settings to be chosen.

//start with the component placeholders
        foreach ($placeholders as $placeholder) {
            if (strpos($placeholder, "MLAB_CT_COMP_") !== false) {
                
//extract name of component plus variables
                $temp_data = explode("|", $placeholder);
                $comp_name = strtolower(str_replace("MLAB_CT_COMP_", "", $temp_data[0]));
                if (sizeof($temp_data) > 1) {
                    $variables = '<script type="application/json" class="mlab_storage">' . $temp_data[1] . '</script>';
                } else {
                    $variables = '';
                }
                
                if (array_key_exists($comp_name, $components)) {
                      
//here we insert the html of the component in place of the placeholder
//this is a two step process, first insert the content of the component and then run the backend code (if any) further down
                    $disp = "";
                    if ( (array_key_exists("resize", $components[$comp_name]) && $components[$comp_name]["resize"]) || (array_key_exists("display_dependent", $components[$comp_name]) && $components[$comp_name]["display_dependent"] == true ) ) {
                        $disp = "data-mlab-displaydependent='true'";
                    }
                    
                    $s = '/%%' . $temp_data[0] . '.*?%%/i';
                    $r = "<div data-mlab-type='" . $comp_name . "' " . $disp . " style='display: block;'>" . $components[$comp_name]["html"] . $variables . "</div>";
                    $frontpage_content = preg_replace($s, $r, $frontpage_content);
                    $res = $this->componentAdded($app->getId(), $app, $comp_name);
                    if ($res["result"] != "success") {
                        error_log("Failed to run ComponentAdded code for $comp_name");
                    }
                } else {
                    error_log("$comp_name is not a component installed on this server");
                }
            }
        }

        
//now check for functions to be run. starts with MLAB_CT_FUNC_. 
        foreach ($placeholders as $placeholder) {
//Functions are kept in the CustomPreProcessing class, where all names are in lower case (i.e. no CamelCase or similar)
            if (strpos($placeholder, "MLAB_CT_FUNC_") !== false) {
                $func_name = strtolower(str_replace("MLAB_CT_FUNC_", "", $placeholder));
                if (method_exists($process, $func_name)) {
                    
//here we run the function and obtain the result
                    $value = call_user_func_array(array($process, $func_name), array($this, $this->config, $app, $app_path));
                    
//to avoid javascript errors we set empty values to 0
//(for instance code may be: var x = %%MLAB_CT_FUNC_GET_NUM%%; , with an empty value this would cause all javascript below to fail at runtime
                    if (!isset($value)) {
                        $value = 0;
                    }
                    
                    $frontpage_content = str_replace("%%$placeholder%%", $value, $frontpage_content);
                } else {
                    error_log("$func_name is not a function in class CustomPreProcessing in " . __FILE__);
                }
                
            } else if (strpos($placeholder, "MLAB_CT_") === false) {
                error_log("Placeholder $placeholder was not processed");
            }
        }

//loop through all pages to process the components that have a matching onCompile function


        foreach ($pages as $page) {
            
//parse pages and loop through the components for each page
            $doc = new \DOMDocument("1.0", "utf-8");
            libxml_use_internal_errors(true);
            $doc->validateOnParse = false;
            if (substr($page, -10) == "index.html") {
                $doc->loadHTML($frontpage_content);
                libxml_clear_errors();
                $content = $doc->getElementById($this->config["app"]["content_id"]);
                $content->parentNode->removeChild($content);
                 
            } else {
                $doc->loadHTML(file_get_contents($page));
                libxml_clear_errors();
            }
            
            $xpath = new \DOMXPath($doc);
            $page_components = $xpath->query('//div[@data-mlab-type]');
            
            if ($page_components) {
                foreach ($page_components as $page_component) {

    //check if this component has a server_code.php file and if it has a onCompile class, 
    //if so we send the inside of the DIV node object and the html version of this to the function to be manipulated. 
    //We get plain HTML back
                    $comp_name = $page_component->getAttribute("data-mlab-type");
                    if ($comp_name != "") {
                        $path_component = $comp_dir . $comp_name . "/";
                        if (file_exists($path_component . "server_code.php")) {
                            if (!class_exists("mlab_ct_" . $comp_name) && !@(include($path_component . "server_code.php"))) {
                                return array(
                                        'result' => 'failure',
                                        'msg' => "Unable to load server_code.php file");
                            } 

                            if (class_exists("mlab_ct_" . $comp_name)) {
//store the variables and code script tags for later storage
                                $temp_variables = $temp_code = "";
                                $temp_class_name = "mlab_ct_" . $comp_name;
                                $component_class = new $temp_class_name();
                                if (method_exists($component_class, "onCompile")) {
//get variables from the JSON data structure saved as a script, also store it for later
                                    $variables = array();
                                    foreach ($page_component->childNodes as $child_element) {
                                        if (get_class($child_element) == "DOMElement" && $child_element->getAttribute("class") == "mlab_storage") {
                                            $variables = json_decode($child_element->textContent, true);
                                            $temp_variables = $doc->saveHtml($child_element);
                                        } else if (get_class($child_element) == "DOMElement" && $child_element->getAttribute("class") == "mlab_code") {
                                            $temp_code = $doc->saveHtml($child_element);
                                        }
                                    }
                                    $processed_html = $component_class->onCompile($tmp_existing_config, $page_component, $doc->saveHTML($page_component), $app_path, $variables);

                                    if (!$processed_html) {
                                        return array(
                                            'result' => 'failure',
                                            'msg' => "Unable to run application on server");
                                    } 
//plain text HTML has been returned, we need to convert it to DomNodeElement and insert into page, together with the (optional) variables and code
                                    $temp_doc = new \DOMDocument("1.0", "utf-8");
                                    $temp_doc->loadHTML('<?xml encoding="UTF-8">' . $processed_html . $temp_variables . $temp_code);
                                    $temp_comp = $temp_doc->getElementsByTagName('body')->item(0);

//erase old nodes
                                    while($page_component->childNodes->length){
                                        $page_component->removeChild($page_component->firstChild);
                                    }

//insert the new nodes from the transformed HTML
                                    foreach($temp_comp->childNodes as $transfer_node){
                                        $page_component->appendChild($doc->importNode($transfer_node,TRUE));
                                    }


                                } //end method exists
                            } //end class exists
                        } //end file server_code.php exists
                    } //end not blank component name
                } //end page loop
            }// end if any mlab components
            //$doc->saveHTMLFile($cached_app_path . basename($page));
            file_put_contents($cached_app_path . basename($page), $doc->saveHTML());
            
        }
        
//update the include.js file with common variables. These include
// - number of pages
// - title of app
// - version of app
// - name of creator
// - based on template
// - tags
// - last preprocessing (now)
// - last time updated (from db)
// - uid
        $metatags = get_meta_tags($app_path . "index.html");
        date_default_timezone_set('UTC');

        $app_vars = array(
            "num_pages" => $process->getnumberofpages($this, $this->config, $app, $app_path),
            "app_title" => $metatags["mlab:app_uid"],
            "app_version" => $app->getActiveVersion(),
            "app_tags" => $app->getTags(),
            "app_creator" => $app->getUser(),
            "app_template" => $app->getTemplate(),
            "time_processed" => date("Y-m-d H:i:s"),
            "time_updated" => $app->getUpdated(),
            "app_uid" => $app->getUid()
            
        );
        
        if (!file_exists($app_path . "js/include.js")) {
            file_put_contents($app_path . "js/include.js", "");
        }
        $include_js = file($app_path . "js/include.js");
        $new_include_js = array();
        foreach ($include_js as $line) {
            if (substr(trim($line), 0, 12) == "MLAB_RT_VARS") {
                $new_include_js[] = "var MLAB_RT_VARS = " . json_encode($app_vars) . ";";
            } else {
                $new_include_js[] = $line;
            }
        }
        if (empty($new_include_js)) {
            $new_include_js = array("var MLAB_RT_VARS = " . json_encode($app_vars) . ";");
        }
        
//unlike other functions here, here we update the live file, an not the cached post-processing file, this is because the vars do not cause a problem in the original file, 
//and we can still create symlinks to all non html files
        file_put_contents($app_path . "js/include.js", implode("\n", $new_include_js));
        
//finally, to avoid using a lot of disk space (for uploaded videos for instance), we symlink all the files that are NOT HTML files
//we need to delete existing symlinks first to avoid "dangling" links with no target file after a page is deleted, etc.
        $symlinks = glob($cached_app_path . "*"); 
        foreach ($symlinks as $symlink) {
            if(is_link($symlink)) {
                unlink($symlink);
            } 
        }
        
        $other_files = glob($app_path . "*");
        foreach ($other_files as $other_file) {
            if (substr($other_file, -5) != ".html" && substr($other_file, -5) != ".lock") {
                $file_name = basename($other_file);
                symlink($other_file, $cached_app_path . $file_name);
            }
        }
        
        return array("result" => "success", "checksum" => $this->getProcessedAppMD5($app, $this->config['filenames']["app_config"]));
        
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
                    $xpath = new \DOMXPath($doc);
                    $page_components = $xpath->query('//div[@data-mlab-type]');

                    if ($page_components) {
                        foreach ( $page_components as $el ) {
                            $temp_tag = $el->getAttribute("data-mlab-type");
                            if ($temp_tag != "") {
                                $all_comps_used[] = $temp_tag;
                            }
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
    
/**
 * Copy remote file over HTTP one small chunk at a time.
 * Based on http://stackoverflow.com/questions/4000483/how-download-big-file-using-php-low-memory-usage
 * @param $infile The full URL to the remote file
 * @param $outfile The path where to save the file
 */
    public function download_file($infile, $outfile) {
        $chunksize = 10 * (1024 * 1024); // 10 Megs

/**
 * parse_url to find port, if no port, look at scheme, http = port 80, https = port 443
 */
        $parts = parse_url($infile);
        if (!array_key_exists('port', $parts)) {
            $parts['port'] = ($parts['scheme'] == "https" ? 443: 80);
        }
        
        $i_handle = fsockopen($parts['host'], $parts['port'], $errstr, $errcode, 5);
        $o_handle = fopen($outfile, 'wb');

        if ($i_handle == false || $o_handle == false) {
            return false;
        }

        if (!empty($parts['query'])) {
            $parts['path'] .= '?' . $parts['query'];
        }

        /**
         * Send the request to the server for the file
         */
        $request = "GET {$parts['path']} HTTP/1.1\r\n";
        $request .= "Host: {$parts['host']}\r\n";
        $request .= "User-Agent: Mozilla/5.0\r\n";
        $request .= "Keep-Alive: 115\r\n";
        $request .= "Connection: keep-alive\r\n\r\n";
        fwrite($i_handle, $request);

        /**
         * Now read the headers from the remote server. We'll need
         * to get the content length.
         */
        $headers = array();
        while(!feof($i_handle)) {
            $line = fgets($i_handle);
            if ($line == "\r\n") break;
            $headers[] = $line;
        }

        /**
         * Look for the Content-Length header, and get the size
         * of the remote file.
         */
        $length = 0;
        foreach($headers as $header) {
            if (stripos($header, 'Content-Length:') === 0) {
                $length = (int)str_replace('Content-Length: ', '', $header);
                break;
            }
        }

        /**
         * Start reading in the remote file, and writing it to the
         * local file one chunk at a time.
         */
        $cnt = 0;
        while(!feof($i_handle)) {
            $buf = '';
            $buf = fread($i_handle, $chunksize);
            $bytes = fwrite($o_handle, $buf);
            if ($bytes == false) {
                return false;
            }
            $cnt += $bytes;

            /**
             * We're done reading when we've reached the conent length
             */
            if ($cnt >= $length) break;
        }

        fclose($i_handle);
        fclose($o_handle);
        return md5_file($outfile);
    }
 
    
//functions that replicate linux commands
    
/**
 * Basic find function, like Linux command can take wildcards and specify file or directory
 * @param type $path
 * @param type $type = f for files, d for directories
 * @param type $wildcard
 * @param type $exclude_files
 */
    public function func_find($path, $type = "", $wildcard = "", $exclude_files = "") {
        $result = array();

//bail if directory does not exist
        if (file_exists($path)) {
        
            $dir_iterator = new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::FOLLOW_SYMLINKS | \RecursiveDirectoryIterator::SKIP_DOTS);
            $iterator = new \RecursiveIteratorIterator($dir_iterator, \RecursiveIteratorIterator::SELF_FIRST);
            if ($wildcard == "") {
                $wildcard = "*";
            }

            foreach ($iterator as $file) {
                if ( ($type == "") || ( $type == "f" && $file->isFile() ) || ( $type == "d" && $file->isDir() ) ) {
                    if ( fnmatch($wildcard, $file->getPathname()) ) {
                        if ($exclude_files != "") {
                            $exclude = false;
                            foreach ($exclude_files as $exclude_file) {
                                if (fnmatch($exclude_file, $file->getPathname()) || $exclude_file == $file->getBasename()) {
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
            if (file_exists($file)) {
                $content = file_get_contents($file);
                file_put_contents( $file, str_replace($search, $replace, $content) );
            }
        }
    }
    
    private function func_rmdir($dir) {
        if (! is_dir($dir)) {
            return false;
        }

        $it = new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS);
        $files = new \RecursiveIteratorIterator($it, \RecursiveIteratorIterator::CHILD_FIRST);
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


// NEW
    
    protected $app = null;
    public $appConfig = null;

    public function setApp(\Sinett\MLAB\BuilderBundle\Entity\App $app) {
        $this->app = $app;
        $this->getAppConfig($this->app);

        return $this;
    }
    
    /**
     * Creates an empty file which will be locked when we redirect to page_get in calling function
     * @param type $app
     * @return bool
     */
    public function createNewPage($position = null, $section = null, $title = null) {
        $pageProperties = $this->getNewPageNum($this->app);
        if ($pageProperties['new_page_num'] === false) {
            return false;
        }

        if (is_null($title)) { //default page name if 
            $title = 'New Page ' . $pageProperties['new_page_num'];
        }
        $content = str_replace('%TITLE%', $title, $this->config['app']['html_header']) . $this->config['app']['html_footer'];

        if (file_put_contents($pageProperties['new_page_path'], $content) !== false) {
            $appConfig = $this->getAppConfig($this->app);
            $page = $this->getNewPageConfig([
                'title' => $title,
                'fileName' => basename($pageProperties['new_page_path']),
                'pageNumber' =>  $pageProperties['new_page_num'],
            ]);

            if($section) {
                $tableOfContents = $this->searchTOC($appConfig['tableOfContents'], ['type' => 'section', 'id' => $section]);
                $tableOfContents = &$tableOfContents[0]['children'];
            } else {
                $tableOfContents = &$appConfig['tableOfContents'];
            }

            if(is_numeric($position)) {
                array_splice($tableOfContents, $position, 0, [$page]);
            } else {
                array_push($tableOfContents, $page);
            }


            // $appConfig['tableOfContents'] = [];

            $this->updateAppConfig($appConfig);

            return $page;
        } else {
            return false;
        }
    }

    public function searchTOC(&$tableOfContents, $conditions = [], &$parents = []) {
        $results = [];

        foreach ($tableOfContents as $key => &$child) {
            if (count(array_intersect_assoc($child, $conditions)) === count($conditions)) {
                $parents[$key] = &$tableOfContents;
                $results[] = &$child;
            }

            if(isset($child['children'])) {
                $nextLevel = $this->searchTOC($child['children'], $conditions, $parents);
                if($nextLevel) {
                    $results = array_merge($results, $nextLevel);
                }
            }
        }

        return $results;
    }

    public function createNewSection($position = null, $parent = null) {
        $appConfig = $this->getAppConfig($this->app);
        $section = $this->getNewSectionConfig();

        $parentSection = $this->searchTOC($appConfig['tableOfContents'], ['type' => 'section', 'id' => $parent]);
        $parentSection = &$parentSection[0];

        if($parentSection) {
            if(!isset($parentSection['children'])) {
                $parentSection['children'] = [];
            }

            if($position !== null) {
                array_splice($parentSection['children'], $position, 0, [$section]);
            } else {
                array_push($parentSection['children'], $section);
            }
        } else {
            if(!empty($position)) {
                array_splice($appConfig['tableOfContents'], $position, 0, [$section]);
            } else {
                array_push($appConfig['tableOfContents'], $section);
            }
        }

        $this->updateAppConfig($appConfig);

        return $section;

    }

    public function indentSection($sectionId, $indent) {
        if($indent == 'down') {
            return $this->deleteSection($sectionId);
        }

        $appConfig = $this->getAppConfig($this->app);

        $cutParent = null;
        $cut = $this->searchTOC($appConfig['tableOfContents'], ['type' => 'section', 'id' => $sectionId], $cutParent);
        $key = key($cutParent);

        $paste = &$cutParent[$key];
        $out = array_splice($cutParent[$key], $key, 1);

        if(isset($cutParent[$key][$key-1]) && $cutParent[$key][$key-1]['type'] == 'section'){
            array_splice($paste[$key-1]['children'], count($paste[$key-1]['children']), 0, $out);
        } else {
            $newSection = $this->getNewSectionConfig();
            $newSection['children'] = $out;
            
            array_splice($cutParent[$key], $key, 1, [$newSection]);
        }

        return $this->updateAppConfig($appConfig);
    }

    public function updateSectionTitle($sectionId, $title) {
        $appConfig = $this->getAppConfig($this->app);

        $parentSection = $this->searchTOC($appConfig['tableOfContents'], ['type' => 'section', 'id' => $sectionId]);
        $parentSection = &$parentSection[0];
        $parentSection['title'] = $title;

        return $this->updateAppConfig($appConfig);
    }

    public function updatePageTitle($pageNum, $title) {
        $appConfig = $this->getAppConfig($this->app);

        $parentSection = $this->searchTOC($appConfig['tableOfContents'], ['type' => 'page', 'pageNumber' => $pageNum]);
        $parentSection = &$parentSection[0];
        $parentSection['title'] = $title;

        return $this->updateAppConfig($appConfig);
    }

    public function deleteSection($sectionId) {
        $appConfig = $this->getAppConfig($this->app);
        $parents = [];

        $parentSection = $this->searchTOC($appConfig['tableOfContents'], ['type' => 'section', 'id' => $sectionId], $parents);
        $key = key($parents);
        $children = $parents[$key][$key]['children'];

        array_splice($parents[$key], $key, 1, $children);

        return $this->updateAppConfig($appConfig);
    }

    protected function getNewPageConfig($page = []) {
        return array_merge([
           'type' => 'page',
           'order' => 0,
           'title' => 'New Page',
           'fileName' => null,
        ], $page);
    }
    
    protected function getNewSectionConfig($section = []) {
        $appConfig = $this->getAppConfig($this->app);
        $listSections = $this->searchTOC($appConfig['tableOfContents'], ['type' => 'section']);

        usort($listSections, function($a, $b) {
            return @$b['id'] <=> @$a['id'];
        });

        $last = reset($listSections);
        $nextId = isset($last['id']) ?  $last['id']+1 : 1;

        return array_merge([
            'id' => $nextId,
            'type' => 'section',
            'order' => 0,
            'title' => 'New Section ' . $nextId,
            'children' => []
        ], $section);
    }
    
    protected function getPageTOC($pageNum) {
        $appConfig = $this->getAppConfig($this->app);
        $page = $this->searchTOC($appConfig['tableOfContents'], ['type' => 'page', 'pageNumber' => $pageNum]);
        
        return reset($page);
    }

    public function updateAppConfig($config = []) {
        $current = $this->getAppConfig();
        $config = array_merge($current, $config);
        $pathApp = $this->app->calculateFullPath($this->config['paths']['app']);

        $pathAppConfig = $pathApp . $this->config['filenames']['app_config'];

        $result = file_put_contents($pathAppConfig, json_encode($config));

        if($result) {
            $this->appConfig = $config;
        }

        return $result;
    }
    
    /**
     * "deletes" a page, simply removes from list of pages, but leaves file untouched so can recover it later.
     * 
     * @param type $app
     * @param type $pageNum
     * @return name of file to open after the page was deleted (next or previous or first page) OR false if fail
     */
    public function deletePage($pageNum) {
        $appConfig = $this->getAppConfig($this->app);

        $page = $this->searchTOC($appConfig['tableOfContents'], ['type' => 'page', 'pageNumber' => $pageNum]);
        $page[0]['is_deleted'] = true;

        return $this->updateAppConfig($appConfig);
    }    

    /**
     * Restore previously deleted page
     * 
     * @param type $pageNum
     * @return array $pageTOC
     */
    public function restorePage($pageNum) {
        // $this->updateNetworkComponentCounters('add', $appConfig['config'], $pageComponents);
        $appConfig = $this->getAppConfig($this->app);

        $page = $this->searchTOC($appConfig['tableOfContents'], ['type' => 'page', 'pageNumber' => $pageNum]);
        $page[0]['is_deleted'] = false;
        $this->updateAppConfig($appConfig);

        return $page[0];
    }

    public function tocMove($node, $section, $position) {
        $appConfig = $this->getAppConfig($this->app);
        $conditions = array_intersect_key($node, array_flip(['type', 'id', 'pageNumber']));

        $cutParent = null;
        $cut = $this->searchTOC($appConfig['tableOfContents'], $conditions, $cutParent);

        if(!empty($section)) {
            $paste = $this->searchTOC($appConfig['tableOfContents'], ['type' => 'section', 'id' => $section]);
        } else {
            $paste = &$appConfig['tableOfContents'];
        }
        
        foreach ($cutParent as $key => &$parent) {
            // if moving object is in the same level and the new position is after old one
            // fix new position
            if($parent == $paste && $key < $position) {
                $position--;
            }
            $fixDeletedPostions = 0;
            for ($i=0; $i < $position; $i++) { 
                if(isset($paste[$i]['is_deleted']) && $paste[$i]['is_deleted']) {
                    $fixDeletedPostions++;
                }
            }

            $position = $position+$fixDeletedPostions;

            $out = array_splice($parent, $key, 1);

            if(isset($paste[0]['children'])) {
                array_splice($paste[0]['children'], $position, 0, $out);
            } else {
                array_splice($paste, $position, 0, $out);
            }
        }
        
        return $this->updateAppConfig($appConfig);
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
