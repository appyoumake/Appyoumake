# The conf.yml file in detail

>Version: 1.0 (April 2016, first public release)<br>
Copyright: © Norwegian Defence Research Establishment (FFI) 2013 - 2016<br>
Initial author: Arild Bergh, Sinett 3.0, FFI<br>
Updating authors: <br>
Comment: _Only update the version number above when component specifications change_

_(If you have not already done it, you should first read [HOWTO - Component Development.md](HOWTO - Component Development.md) and [Mlab explained.md](Mlab explained.md))_

Conf.yml is a [YAML file](http://www.yaml.org/) that defines most aspects of a component. A lot of a component's functionality can be achieved simply by defining the right settings in this file. In addition, these settings tell the MLAB editor how to handle the component; should it receive all keys that are pressed, what HTML should be displayed in the page when it is added, can there be more than one instance of it on a page, etc. 

Below is a list of all possible entries with some explanations and an example

**Item:** *#* (String, optional) <a id="ref-comment"></a>
>Comment line, ignored by MLAB.
```yml
#this is my first component
```

**Item:** *autorun_on_create* (string, optional) <a id="ref-autorun_on_create"></a>
>If a particular function in this component should be run when the component is added (after the onCreate function which is always run if it exists) you can add the name here. For instance the image control uses this to automatically call the function that asks the app creator for an image to upload. In this case it saves the user from having to manually click an option that is always required, but it could also be used to run other functionality in addition to the onCreate function.
```yml
autorun_on_create: custom_upload_image
```

**Item:** *category* (String, required) <a id="ref-category"></a>
>The name of the category of components that the component belongs to. All components that have the same category will be grouped together in the Mlab app builder web page. The actual name used can be anything, however, it should fit in with existing categories, such as text, map, image, etc. Thus it is worth looking at the conf.yml file of existing components to see what they use and determine whether you can join an existing ategory, or require a new one.
```yml
category: text
```
**Comment: storage plugins must set this to _storage_plugin_. You could also use this to group all components for a particular organisation together**

**Item:** *compatible* (array of Strings, optional) <a id="ref-compatible"></a>
>This indicates which other component types this could be replaced by. So for instance standard tet components are all interchangable, thus a headline could be changed to a paragraph, and so on.
```yml
compatible: ["h1", "h2", "p"]
```
**Comment: To support this functionality the component must also have an onReplace() method. This method must extract the content of the existing component and replace the HTML around it with the HTML code submitted to the function.**

**Item:** *credentials* (array of Strings, opional) <a id="ref-credentials"></a>
>If the component requires some credentials from the app creator (for instance URL and login details to a database, or an API key to an online service) then you can use the runtime API function *getCredentials* to request these details. The credentials supplied are then sent back to a callback function supplied with the call to *getCredentials*. See also the [API reference](COMPONENTS%20REFERENCE%20-%20design%20time%20API.md)
```yml
credentials: ["apikey"]
```

**Item:** *custom* (Object (key/value style), required if custom functions are written in the code_dt.js code, see comment) <a id="ref-custom"></a>
>This is an entry that is used to store a list of sub-entries that can be anything from a single string to an array of objects. This is used by the component creator to store values that are not supported by the MLAB editing tool, so for instance it may be an API key to use or an initial value for the component. See comments below with regards to specific settings here for custom functions.
```yml
custom:
  my_array: ["test", "test2"]
```
  **Comment: A component can have _custom functions_. These functions are unique to the component but should be accessible to the app creator through a clickable icon that the app creator can see in the component toolbox. In these cases you need to specify four elements under a new heading under the custom setting. The icon is a URI encoded image ([here](http://websemantics.co.uk/online_tools/image_to_data_uri_convertor/) is a tool to encode an image) which is displayed in the component toolbox when the component is selected by the app creator. The [tooltip](#ref-tooltip) setting is identical to the top level setting of the same name. If you have several custom functions you can group them together by specifying the order of the icon in the toolbox and whether the icon should be placed at the start of a new row. This helps the app creator to see what type of actions belong together, and for instance avoid that new and delete icons are next to each other.**
  **So, if you have a custom function called _custom_upload_image_ then you need entries similar to these:**
```yml
custom:
    upload_image:
        icon: data:image/png;base64,iVBORw0KGgoAAAANSUhErkJggg==
        tooltip: { nb_NO: Last opp et bilde eller velg et bilde allerede i denne appen, en_GB: Upload a picture or select one already in the app, default: Upload a picture or select one already in the app }
        order: 10
        newline: true
```

**Item:** *developer* (String, optional) <a id="ref-developer"></a>
>Name(s) of the developer(s) of this component.
```yml
developer: Harold Spruce
```

**Item:** *display_dependent* (Boolean, optional) <a id="ref-display_dependent"></a>
>Indicates whether this component needs to know the size of other DOM elements at runtime. This is the case for Google Maps for instance. When this is true, the component will be loaded after all other components have been loaded during page loading.
```yml
display_dependent: true
```
**Comment: _resizable_ (see below) set to true will force the component to be treated as if this setting is set to true.**

**Items:** *extended_name/extended_tooltip* (Object/String, optional but highly recommended) <a id="ref-extended"></a>
>A longer explanation than the [*name*](#ref-name) and [*tooltip*](#ref-tooltip) values provides, about what the component is/does. The former is used in various prompts to the user, the latter is displayed to the app creator in footer of the MLAB app builder page when the mouse hovers over the component icon. The value of this setting is the text to display, see [tooltip](#ref-tooltip) further down for formatting information.

**Item:** *feature* (Boolean, optional) <a id="ref-feature"></a>
>If the component is a feature, then this setting must be true. A feature is available on all pages automatically, and can be visible or not (see [visible](#ref-visible)). Examples of features can be a GPS tracker that stores the location of the user at set intervals, or a newsfeed that is visible on all pages. 
```yml
feature: true
```

**Item:** *html* (String or object, required) <a id="ref-html"></a>
>Contains all the HTML5 tags for the control. It can be an object or a string. If it is a string the same value will be used for DT and RT, if it is an object they must be named *designtime* and *runtime*. Usually this will be a multiline entry, refer to YAML documentation for how to create a multiline entry.
```yml
html: <h1>Enter headline</h1>
or
html: <p>%%index%%</p>
or
html: |
    <figure class="mc_container mc_picture_and_text">
      <img class='mc_figure mc_display mc_figure_with_caption mc_figure_in_text' alt="sample image">
      <figcaption class='mc_text mc_display mc_figure_text' contenteditable="true">Caption</figcaption>
    </figure>
    <p class='mc_text mc_display mc_medium'>Your text goes here</p>
    <div style="clear: both;"></div>
```
**Comments:**
 * **You can also use placeholders in the HTML that can be substituted at design time (for instance %%unique_id%%) or compile (for instance %%index%%). The placeholders should as a convention use double percentage signs before and after and have no spaces. In either case it is the component itself, either in this file or in [server_code.php](COMPONENTS%20REFERENCE%20-%20server_code.php%20file.md)**
 * **If you need to style the HTML, please refer to the [template](HOWTO%20-%20Template%20Design%20%26%20Development.md) document which will list predefined styles (applied by using CSS3 classes) that should be used where possible.**

**Item:** *inherit* (String, optional) <a id="ref-inherit"></a>
>The name of a component that this component inherits variables and functions from. For example, the numbered list component (named ol) is to all intents and purposes identical to the bullet point list (ul) component, this can therefore inherit all the functionality of the h1 component. Inheritance can be on multiple levels, so in the core components the heading component is the parent that the parapgraph component inherits from, then the ordered list inherits from paragraph

>The way it works is that all components are loaded at design time. Then components that inherit another component will have the objects in the parent component that does not already exists copied across to itself. What gets copied across is configuration settings (i.e. what is described in this file) and individual functions from [code_dt.js](COMPONENTS REFERENCE - code_dt.js file.md).
```yml
inherit: h1
```
**Comments:**
 * **One important thing to make inheritance work is to create a separate function to access the inner HTML item you want to work on. For the *heading (h1)* component this is *$(el).find("h1")*, whereas for the *paragraph (p)* component this is *$(el).find("p")*. A simple wrapper function, for instance called getHtmlElement, could be used to search for the different element, and the rest of the code would then be identical.**
 * **If you want to make a component that should _not_ support a particular function (let us say that the parent component has a function to set selected text to bold), then create an empty function with th same name. Alternatively, review which component should be the parent.**
 * **At runtime inheritance has no meaning as the pre-compilation process generates and stores the static HTML before the page is being compiled into the app.**

**Item:** *messages* (Array of objects of strings, optional) <a id="ref-messages"></a>
>By convention you can store messages (i.e. strings) you need to display to the user under this heading. Each element under this heading should be an object similar to an key/value pair, where the keys are the locale code (en\_GB for instance) and the value is the message in that locale's language. The Mlab runtime API function _getLocaleMessage_ can then be used to retrieve these messages by specifying the path to the string you want.
```yml
messages: 
  connection_failure: { nb_NO: Klarte ikke å logge på tjenesten, en_GB: Unable to log on to the service, default: Unable to log on to the service }
```

**Item:** *name* (String, required) <a id="ref-name"></a>
>The name of the component, for instance h1 or img_text.
```yml
name: googlemap
```
**Comments:**
  1. **This must match the name of the folder it is in. If you use MLAB's internal component installer (read about deployment [here](HOWTO - Deployment.md) the component folder will be created from this setting when it is installed, so this is automatic.**
  2. **This must be unique. You must therefore check existing MLAB components before naming it. If you try to install a component with a non-unique name, then it will attempt to replace the existing component with the same name.**
  3. **This must be lower case and can not have spaces in it! This is partly due to how the pre-compilation processing of components works and partly for compatibility with different web servers on different platforms.**

**Item:** *paste_allowed* (Boolean, optional) <a id="ref-paste_allowed"></a>
>This must be set to true or Mlab will not let the app creator paste text into the component. This is to avoid possibly corruption of the layout when random HTML is copied in. 
```yml
paste_allowed: true
```
**Comment: If paste_allowed is set to true, Mlab will still convert the text being pasted into plain text, i.e. formatting such as tables, bold font, etc., will not be allowed. This is because all formatting should be done through the [template](HOWTO%20-%20Template%20Design%20%26%20Development.md) being used.**

**Item:** *plugins* (array of Strings, optional) <a id="ref-plugins"></a>
>The Cordova framework uses plugins to enable different functionality that is linked to the underlying OS/hardware, such as the GPS location. Without a plugin the app can only use standard HTML5/Javascript functionality either locally or over the internet. When a plugin is added, Cordova automatically adds the permission required on the different operating systems that the app is compiled for.

>In this string array you specify the plugins required by the component, it is an array, so can take one or more entries. See[ https://cordova.apache.org/docs/en/5.1.1/cordova_plugins_pluginapis.md.html](https://cordova.apache.org/docs/en/5.1.1/cordova_plugins_pluginapis.md.html) for available plugins. The list of plugins for a component is added to a app specific file called conf.json which is sent to the Mlab compilation service and ensures that the plugin is added to the final app before it is compiled.
```yml
plugins: ["cordova-plugin-geolocation, cordova-plugin-battery-status"]
```

**Item:** *placeholder* (String, optional) <a id="ref-placeholder"></a>
>This is either a simple string (for text based components) or a URI encoded image ([here](http://websemantics.co.uk/online_tools/image_to_data_uri_convertor/) is a tool to encode an image) which is used as a placeholder whilst requesting data from a user for the content of the component.
```yml
placeholder: { nb_NO: Rediger kapittel overskriften her, en_GB: Enter your chapter headline here, default: Enter your chapter headline here }
OR
placeholder: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gsdBDEc5BaajQAAABZJREFUCNdj+M/AoKKiwqCiovKfgQEAFeYC18kngsoAAAAASUVORK5CYII=
```
**Comment: When inheriting component values this is useful to specify and then refer to as a display prompt when component is empty.**

**Item:** *process_keypress* (Boolean, optional) <a id="ref-process_keypress"></a>
>If this is true then the component wants to trap and perform actions in response to certain keys being pressed. The most common use for this is to override formatting that the browser inserts. For instance when you press Enter in a paragraph, some browsers insert extra DIV or SPAN tags. To avoid this you may want to block the enter key, and insert a plain &lt;br&gt; tag which will not disturb any formatting. A component may also want to "eat" certain keys, so you cannot have enter (new line) in a headline for instance.
```yml
process_keypress: true
```
**Comment: To support this functionality the component must have a method in [code_dt.js](COMPONENTS REFERENCE - code_dt.js file.md#user-content-ref-onkeypress) called onKeyPress()**

**Item:** *required_libs* (Object of string arrays, optional) <a id="ref-required_libs"></a>
>This is an object that can have two members: *designtime* and *runtime*. It is used to specify additional Javascript or CSS libraries to copy and/or add to an app. It is very useful to access external services (such as Twitter) or use additional Javascript libraries for a component (a calendar component could for instance use a jQuery calendar library).

>**Design time**: If the string points to a local file (just a filename) then MLAB will load this file into the current MLAB app builder page from the MLAB server. The file should be stored in a sub folder called either *js* or *css* (depending on the filetype) under the main component folder (see [Mlab deployment](HOWTO - Mlab Development.md)). If it starts with _http_ it will be loaded from the remote server using the URL as is.

>**Runtime**: When the component is added to the page, Mlab will copy any specified LOCAL files from the *js* or *css* (depending on the filetype) sub folder in the component folder and into the app directory using a matching sub folder as the destination. Mlab will then add a link in either the include.js or include.css file so that it is loaded when the app starts. Remote files (i.e. those that have a value starting with HTTP) will just be added as links to the relevant include file and Mlab will load this from the remote server at runtime.
```yml
required_libs: { designtime: ["google_maps.css"], runtime: ["http://maps.google.com/maps/api/js?v=3"] }
```

**Item:** *resizable* (Boolean, optional) <a id="ref-resizable"></a>
>Indicates whether this component can be resized at design time. This means that it can have its aspect ratio and/or size set from popup menus displayed when a user clicks two additional icons, **aspect ratio** and **size**. Aspect ratio can be 1:1, 4:3 and 16:9, size can be small, medium, large and full screen. The latter will fill the screen in any orientation.
```yml
resizable: true
```
**Comments:**
 * **When this setting is true, Mlab will add an additional DIV between the outer component DIV and the HTML5 content that makes up the component.**
 * **_resizable_ set to true will force the component to be treated the same as components with the [_display_dependent_](#ref-display_dependent) setting set to true.**

**Item:** *storage_plugin* (Boolean or array of strings, required if component is a storage plugin) <a id="ref-storage_plugin"></a>
> Indicates whether this component will require a storage plugin. If this is set to true, then MLAB will add an icon to the component toolbar which will list all plugins as a drop down menu, and the app creator can then indicate which plugin they want to use. If it is an array of strings, then each of these strings should match the name of an existing storage plugin.
```yml
storage_plugin: true
or
storage_plugin: []
```
**Comment: If the component only requires local storage on the mobile device, then this should be left empty.**

**Item:** *tooltip* (Object/String, required) <a id="ref-tooltip"></a>
> A brief explanation about what the component does which is displayed to the app creator in the MLAB editor when the mouse hovers over the component. This should be an array of key - value objects with the locale name as the key and the content as the value. If this is a string, locale will be ignored and tooltip will be displayed as is. If locale is not found it will look for a key called "default". If not found tooltip will be left blank. Locale is defined in the backend parameters.yml file and is obtained via the mlab.dt.api.getLocale() function.
```yml
tooltip: { nb_NO: Skaler bildet opp med 10%, en_GB: Scale image up by 10%, default: Scale image up by 10% }
```
**Comment: See also the [*extended_tooltip and extended_name settings*](#ref-extended)**

**Item:** *unique* (Boolean, optional) <a id="ref-unique"></a>
>Indicates whether there can only be one instance of this component on page. MLAB will automatically block adding another component if this setting is true and one already exists.
```yml
unique: true
```

**Item:** *version* (String, optional but recommended) <a id="ref-version"></a>
> Version number of component, useful to know that one has the correct version installed in case of debugging issues.
```yml
version: 1.1
```

**Item:** *visible* (boolean) <a id="ref-visible"></a>
> Used only in conjunction with the [feature](#ref-feature) type of component. If this setting is true, then only an icon representing the feature will be displayed to the app creator at design time, otherwise the [HTML of the component is displayed](#ref-html).
```yml
visible: true
```

