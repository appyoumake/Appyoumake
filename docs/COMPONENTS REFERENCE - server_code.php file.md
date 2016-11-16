# The server_code.php file in detail

>Version: 1.0 (April 2016, first public release)<br>
Copyright: © Norwegian Defence Research Establishment (FFI) 2013 - 2016<br>
Initial author: Arild Bergh, Sinett 3.0, FFI<br>
Updating authors: <br>
Comment: _Only update the version number above when component specifications change_

_(If you have not already done it, you should first read [HOWTO - Component Development.md](HOWTO - Component Development.md) and [Mlab explained.md](Mlab explained.md))_

This is an optional file containing code that is run on the server (**not** in the browser) at certain points in the app creation process. See _App creation workflow and Mlab automated action_ in [HOWTO - Component Development.md](HOWTO - Component Development.md) for more explanation on these automated actions. The file is specific to each component and is stored in the component directory together with [code_dt.js](COMPONENTS%20REFERENCE%20-%20code_dt.js%20file.md) and [code_rt.js](COMPONENTS%20REFERENCE%20-%20code_rt.js%20file.md). It is written in the server scripting language PHP (which is also used for the Mlab App Builder). 

The purpose of this is to a) support functions that can only run on the server (such as converting images and videos to a standard format), and b) support modifications to a component's HTML through advanced processing on the server (for example generating an index of the pages in an app just before it is being compiled). 

In addition to three fixed functions ([onCreate](#ref-oncreate), [onUpload](#ref-onupload) and [onCompile](#ref-oncompile)) you can have any custom function in this file and have Mlab execute the code at compile time. This is done by creating a function called (for example) myfunction, and then putting a placeholder in your [template](HOWTO%20-%20Template%20Design%20%26%20Development.md) (or even inside another component!) that must look like this: _%%MLAB_CT_FUNC_MYFUNCTION%%_. The double percentage signs indicates to Mlab that this is a placholder and the prefix _MLAB_CT_FUNC__ is used to distinguish this from other types of placeholders, and it also uses the MLAB -> compile time name space. See [example below](#ref-custom) for more on custom functions.

This file is not required, thus none of the functions in it are required either. If they are present then they must be wrapped in a class called *mlab_ct_xx*, where ct indicates compiletime xx is the name of the component. So for the *index* component this would be *mlab_ct_index* (always use lower case).

**Comment: If you prefer to use another scripting language such as Ruby or Python you can of course do this by spawning the other script from the PHP code, but for now PHP is the only supported language for the initial code.**

**Function:** *onCreate($path_app, $path_component, $comp_id)* <a id="ref-oncreate"></a>
>This is called when a component is first added to a page on the browser side. It can do some processing that is required by the component, for instance downloading files/data required to ensure that the app can be used offline as well as online.
```PHP
class mlab_ct_index {
  public function onCreate($path_app_html_root, $path_component, $comp_id) {
    $curdir = getcwd();
    chdir($path_app);
    exec("wget http://myurl.com/getAddresses.php");
    chdir($curdir);
    return true;
  }
}
```
**Parameters:**
 * $path_app: The full path to the app directory. This will typically be /path/to/mlab/app_directory/this_app/1, where this_app = a unique 32 bytes ID that each Mlab app has and 1 = the version number. Under this path you can expoect to find /css and /js directories where you place Javascript or CSS files. This will let you edit files, download files into this directory, etc.
 * $path_component: The full path to the path where the component files are, this could for instance be used to load the conf.yml settings if you need access to the component's settings. This would typically be /path/to/mlab/component_directory/this_component/1, where this_component = the name (also sometimes called ID as it is unique) of the component.
 * $comp_id: The unique name of the component, for instance _index_.

**Function:** *onUpload($path_uploaded_file, $path_app, $path_component, $comp_id)* <a id="ref-onupload"></a>
>Code to run after a file is uploaded by the component. Used to process the uploaded file, for instance to create a thumbnail for a video file, convert files to a particular format, validating file content, etc.
```PHP
class mlab_ct_index {
  public function onUpload($file_uploaded, $path_app, $path_component, $comp_id) {
    chdir($path_app_html_root . "/video");
    $temp_filename = explode(".", basename($file_uploaded));
    array_pop($temp_filename);
    $thumbnail_filename = implode("_", $path_app_html_root . "/images/" . $temp_filename) . "jpg";
    exec("ffmpeg -i '$file_uploaded' -an -f mjpeg -t 1 -r 1 -y -filter:v scale='640:-1' " . $thumbnail_filename);
  }
}
```
**Parameters:**
 * $file_uploaded: the full path to the file just uploaded, typically this will be in a a directory below the main app directory. If this is a video it goes into /video subdirectory, images go into /img subdirectory, etc.
 * $path_app: The full path to the app directory. This will typically be /path/to/mlab/app_directory/this_app/1, where this_app = a unique 32 bytes ID that each Mlab app has and 1 = the version number. Under this path you can expect to find /css and /js directories where you place Javascript or CSS files. This will let you edit files, download files into this directory, etc.
 * $path_component: The full path to the path where the component files are, this could for instance be used to load the conf.yml settings if you need access to the component's settings. This would typically be /path/to/mlab/component_directory/this_component/1, where this_component = the name (also sometimes called ID as it is unique) of the component.
 * $comp_id: The unique name of the component, for instance _index_.

**Function:** *onCompile($app_config, $html_node, $html_text, $app_path, $variables)* <a id="ref-oncompile"></a>
>Code to execute for each compilation, will typically replace content in component with own code. An example is to replace variables in a component with content that is only available after all pages are saved, such as an index.

>This function should return the HTML5 code that will replace the component's visual content. It can also contain Javascript, although this is not recommended, any Javascript should be in a separate file and added through the conf.yml file.
```PHP
class mlab_ct_h1 {
  public function onCompile($html_node, $html_text) {
    $plain_text = $html_node->getElementsByTagName("h1")->item(0)->nodeValue;
    return "<h1>PrOcEsSeD " . $plain_text . " OK?</h1>";
  }
}
```
**Parameters:**
 * $app_config: Content of the conf.json file as a PHP object that is created for each app, and used by Mlab to store details such as the last compilation checksum, title of the app, permissions required, etc. 
 * $html_node: The components visible HTML5 code (i.e. NOT the two additional elements that are script elements for storing data and on the fly generated Javascript) as a [PHP DOMNode](http://php.net/manual/en/class.domnode.php).
 * $html_text: The same as above, but as HTML text.
 * $app_path: The full path to the app directory. This will typically be /path/to/mlab/app_directory/this_app/1, where this_app = a unique 32 bytes ID that each Mlab app has and 1 = the version number. Under this path you can expect to find /css and /js directories where you place Javascript or CSS files. 
 * $variables: The variables stored at design time by this component. For instance the _googlemap_ component stores information about where the map should be centred, the zoom level, etc. in these variables. This is an associative array.

**Function:** *MLAB_CT_FUNC_MYFUNCTION($app_config, $app_object, $app_path) <a id="ref-custom"></a>
>These functions replace a placeholder in the page that Mlab is currently processing before compiling an app. You can create any PHP function that returns HTML5 code back to the calling function. 
```PHP
class mlab_ct_h1 {
  public function myfunction($app_config, $app_object, $app_path) {
    return "<em>Compiled on " . $app_object->getName() + date('l jS \of F Y h:i:s A') + "</em>";
  }
}
```
**Parameters:**
 * $app_config: Content of the conf.json file as a PHP object that is created for each app, and used by Mlab to store details such as the last compilation checksum, title of the app, permissions required, etc. 
 * $app_object: A [Doctrine](http://www.doctrine-project.org/) object which contains the row from the _app_ table in the Mlab database tha represents the current app. Can be read, but not written to. You access value through a traditional "getter", so to get the current version you can use _$app_object->getActiveVersion();_ for instance.
 * $app_path: The full path to the app directory. This will typically be /path/to/mlab/app_directory/this_app/1, where this_app = a unique 32 bytes ID that each Mlab app has and 1 = the version number. Under this path you can expect to find /css and /js directories where you place Javascript or CSS files. 
