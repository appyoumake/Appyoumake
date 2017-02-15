#The conf.yml file in detail

>Version: 1.0 (April 2016, first public release)<br>
Copyright: © Norwegian Defence Research Establishment (FFI) 2013 - 2016<br>
Initial author: Cecilie Jackbo Gran, Sinett 3.0, FFI<br>
Updating authors: <br>
Comment: _Only update the version number above when component specifications change_

_(If you have not already done it, you should first read [HOWTO - Template Design & Development.md](HOWTO - Template Design & Development.md) and [Mlab explained.md](Mlab explained.md))_

Conf.yml is a [YAML file](http://www.yaml.org/) that provides certain settings for a template that can not be stored in the HTML5 files themselves. Below is a list of all possible entries with some explanations and an example

**Item:** *#* (String, optional) <a id="ref-comment"></a>
>Comment line, ignored by MLAB.
```yml
#this is my first template
```

**Item:** *component* (String, optional) <a id="ref-components"></a>
>Mlab can use rules embedded in the template's conf.yml file to verify that the app creator is following certain best practices for the app type they are creating. These may vary from app type to app type, hence they are rather flexible, for instance a learning app may find it best to have only one video per page, whereas some instructional app types may find it beneficial to allow several videos per page.

>The template itself does **NOT** need to take any actions beyond listing the rules in the conf.yml file, it is the Mlab editor that actually applies the rules. Here the limits for each component **category** (and not individual component) are specified, for page related rules se [*pages*](#user-content-ref-pages) below. 

> * components (top level header indicating the rules that applies to each component on a page)
>   * video: (the component category, for instance text, headline, video, audio, image)
>     * min: (next level is min or max, indicating the bottom and top values acceptable)
>       * count: (final level has three settings, count = min/max number of )
>       * size: (for video & audio this is length in seconds, for text it is number of words and the size in bytes for images)
>       * message: (message to display if the rule is not followed)

>Example:
```yml
components: 
  video:
    min: 
      count: 0
      size: 15
      message: Your videos should be at least 15 second long.
    max: 
      count: 2
      size: 600
      message: We recommend maximum 2 videos of 10 minutes length per page
  text:
    max: 
      count: 3
      size: 300
      message: You should have max 3 text boxes with max 300 words per page
```

**Item:** *developer* (String, optional) <a id="ref-developer"></a>
>Name(s) of the developer(s) of this template.
```yml
developer: Harold Spruce
```

**Item:** *name* (String, required) <a id="ref-name"></a>
>The name of the template, for instance "todo_list".
```yml
name: todo_list
```
**Comments:**
  1. **This must match the name of the folder it is in. If you use MLAB's internal template installer (read about deployment [here](HOWTO - Template Design & Development.md#user-content-ref-deployment)) the template folder will be created from this setting when it is installed, so this is automatic.**
  2. **This must be unique. You must therefore check existing MLAB templates before naming it. If you try to install a template with a non-unique name, then it will attempt to replace the existing template with the same name.**
  3. **This must be lower case and can not have spaces in it! This is partly for compatibility with different web servers on different platforms.**

**Item:** *pages* (array of arrays, optional) <a id="ref-pages"></a>
>Template best practices rules for the entire page. See [*components*](#user-content-ref-components) for more info on the purpose of these rules. The page rules apply only to the total number of pages in the app (minimum/maximum), and not to the content of the pages.
```yml
pages:
  min:
    count: 1
    message: You should have at least 1 pages in an app of this type
  max:
    count: 60
    message: You should have max 60 pages in an app of this type
```

**Item:** *plugins* (array of Strings, optional) <a id="ref-plugins"></a>
>The Cordova framework uses plugins to enable different functionality that is linked to the underlying OS/hardware, such as the GPS location. Without a plugin the app can only use standard HTML5/Javascript functionality either locally or over the internet. When a plugin is added, Cordova automatically adds the permission required on the different operating systems that the app is compiled for.

>In this string array you specify the plugins required by the template, it is an array, so can take one or more entries. See[ https://cordova.apache.org/docs/en/5.1.1/cordova_plugins_pluginapis.md.html](https://cordova.apache.org/docs/en/5.1.1/cordova_plugins_pluginapis.md.html) for available plugins. The list of plugins for a template is added to a file called conf.json which is sent to the Mlab compilation service and ensures that the plugin is added to the final app before it is compiled.
```yml
plugins: ["cordova-plugin-geolocation, cordova-plugin-battery-status"]
```

**Item:** *tooltip* (Object/String, required) <a id="ref-tooltip"></a>
> A brief explanation about what the template is suitable for. This is displayed to the app creator in the MLAB new app wizard when they select template from a dropdown menu. This should be an array of key - value objects with the locale name as the key and the content as the value. If this is a string, locale will be ignored and tooltip will be displayed as is. If locale is not found it will look for a key called "default". If not found tooltip will be left blank. Locale is defined in the backend parameters.yml file and is obtained via the mlab.dt.api.getLocale() function.
```yml
tooltip: { nb_NO: Mal for gjøremålsliste apptyper, en_GB: Template for todo list style app, default: Template for todo list style app }
```

**Item:** *version* (String, optional but recommended) <a id="ref-version"></a>
> Version number of template, useful to know that one has the correct version installed in case of debugging issues.
```yml
version: 0.9
```
