#The Mlab design time API 

>Version: 1.0 (April 2016, first public release)<br>
Copyright: © Norwegian Defence Research Establishment (FFI) 2013 - 2016<br>
Initial authors: Arild Bergh & Cecilie Jackbo Gran, Sinett 3.0, FFI<br>
Updating authors: <br>
Comment: _Only update the version number above when the design time API specifications change_

The code described here can be found in the mlab.dt.api.js file

**closeAllPropertyDialogs**()

Simple wrapper function which will ensure that the jQuery plugin qtip2 is closed.

**Returns:**

*{undefined}*

* * *


**displayPropertyDialog**(el,, title, content,, func_render,, func_visible,, func_hide)

Displays the property input dialog for the specified component. This uses the jQuery plugin qtip2 for the actual dialog, and fills it with the specified content. The component is responsible for adding buttons such as Cancel and OK with callback to relevant functions in the component.

**Parameters:**

*{jQuery DOM element}***el,**

the component that the dialog should be attached to

*{string}***title**

*{HTML string}***content,**

valid HTML5

*{function object}***func_render,**

callback function when the property dialog is created, can be used to manipulate dialog, add content, etc.

*{function object}***func_visible,**

callback function when the property dialog is

*{function object}***func_hide**

**Returns:**

*{undefined}*

* * *


**editContent**(el)

Makes the currently selected component editable, using the HTML5 contenteditable attribute. Only works on text elements, such as heading or paragraph

**Parameters:**

*{jQuery DOM element}***el**

**Returns:**

*{undefined}*

* * *


**getCredentials**(el)

This retrieves the credentials for the component, such as API keys for Google maps, or url/username/password for remote databases. 

**Parameters:**

*{jQuery DOM element}***el**

**Returns:**

*{object}***credentials, **object in key/value pairs such as {username: harold, password: pass}

* * *


**getEditorElement**()

Get the ID of the DIV that is the container for the editable area. The string name is specified in the parameter.yml file and can be changed, but there really is no reason to do this.

**Returns:**

*{String: Mlab_dt_api.parent.config.content_id}*

* * *


**getGUID**()

Creates a unique ID starting with the prefix *mlab_*, followed by a rfc4122 version 4 compliant GUID. This is typically used to create an ID for a component that must not clash with any other IDs.

**Returns:**

*{String}*

* * *


**getLibraries**(comp_id,)

Loads all js/css files required by a component at design time. Files loaded are specified in the conf.yml parameter required_libs.

**Parameters:**

*{string}***comp_id,**

the unique ID for the component that needs to load the files

**Returns:**

*{undefined}*

* * *


**getLink**()

Creates the HTML5 code required for a link either to a external page or to a page in the current app. Links to pages must use the api call pageLoad, links to external pages must use _new as the target value. TODO: Can be improved by listing existing pages instead of just requesting the page number.

**Returns:**

*{Boolean|String}*

* * *


**getLocale**()

Returns the local (for instance nb_NO) as specified in the backend Symfony environment. Loaded as a temporary variable on initial MLAB editor page load as it has to be passed from the backend.

**Returns:**

*{Mlab_dt_api.parent.parent.locale}*

* * *


**getMedia**(extensions)

Returns a list of files already uploaded, non-async so we can return data to the calling function who may do any number of things with it.

**Parameters:**

*{String}***extensions**

**Returns:**

*{Array}*list of options for select element

* * *


**getSelectedComponent**()

Get currently selected component (the DIV, not the internal HTML code).

**Returns:**

*{jQuery object that represents the DIV surrounding the component}*

* * *


**getUrlAppAbsolute**()

Requests for the absolute URL to where apps are stored, we work wth the /wwwork directory inside here. Used to load pages in an app, and related CSS/JS/media files.

**Returns:**

*{String.origin|Location.origin|Mlab_dt_api.parent.config.urls.app}*

* * *


**getUrlAppRelative**()

Requests for the relative URL to where apps are stored, we work wth the /wwwork directory inside here Used to load pages in an app, and related CSS/JS/media files

**Returns:**

*{Mlab_dt_api.parent.config.urls.app}*

* * *


**getUrlComponentAbsolute**()

Requests for the absolute URL to where components are stored. Used to load components when designing an app (components consist of configuration file and JS code) and related CSS/JS/media files.

**Returns:**

*{Mlab_dt_api.parent.config.urls.component|String.origin|Location.origin}*

* * *


**getUrlComponentRelative**()

Requests for the relative URL to where components are stored. Used to load components when designing an app (components consist of configuration file and JS code). and related CSS/JS/media files.

**Returns:**

*{Mlab_dt_api.parent.config.urls.component}*

* * *


**getUrlTemplateAbsolute**()

Requests for the absolute URL to where templates are stored. Not really used much by the MLAB editor front end, the files are usually copied on the server. However we have it here for completeness.

**Returns:**

*{String.origin|Location.origin|Mlab_dt_api.parent.config.urls.template}*

* * *


**getUrlTemplateRelative**()

Requests for the relative URL to where templates are stored. Not really used much by the MLAB editor front end, the files are usually copied on the server. However we have it here for completeness.

**Returns:**

*{Mlab_dt_api.parent.config.urls.template}*

* * *


**getUrlUploadAbsolute**(comp_id)

Requests for the absolute URL used to upload files, used by components that let users use own files, such a image component, video player, etc.

**Parameters:**

*{string}***comp_id**

is the unique ID of the component, for instance img or video

**Returns:**

*{Mlab_dt_api.prototype@pro;parent@pro;urls@pro;component_upload_file@call;replace@call;replace|String.origin|Location.origin}*

* * *


**getUrlUploadRelative**(comp_id)

Requests for the absolute URL used to upload files, used by components that let users use own files, such a image component, video player, etc.

**Parameters:**

*{string}***comp_id**

is the unique ID of the component, for instance img or video

**Returns:**

*{Mlab_dt_api.prototype@pro;parent@pro;urls@pro;component_upload_file@call;replace@call;replace}*

* * *


**getVariable**(el, key,)

Reads in the Javascript values stored for the specified element, extracts the value of the key specified. This only works on top level vars, further processing must be done inside the JS code for the component. Variables are stored in a of type application/json as stringified JSON, on the same level as the main component HTML5 code. These are all contained within a wrapper DIV that is the actual DOM element ppassed to this function.

**Parameters:**

*{jQuery DOM element}***el**

*{string}***key,**

the key name in the object

**Returns:**

*{Mlab_dt_api.prototype.getVariable.vars|Array|Object}*

* * *


**getVersion**()

Get api version for designtime API, different from runtime API version (which is anyway a different file/object).

**Returns:**

*{Number}*

* * *


**setDirty**()

Set the global dirty flag, this tells the page_save function that the page needs to be updated on the server.

**Returns:**

*{undefined}*

* * *


**setCredentials**(el, credentials)

This updates the credentials for the component, such as API keys for Google maps, or url/username/password for remote databases. 

**Parameters:**

*{jQuery DOM element}***el**

*{text}***credentials, **object in key/value pairs such as {username: harold, password: pass}

**Returns:**

*{Boolean}*

* * *


**setScript**(el, code)

This updates the script for a control, this is write only as it should always be generated from user input and variables! It therefore also always replaces existing content in the script element

**Parameters:**

*{jQuery DOM element}***el**

*{text}***code,**

any Javascript compatible statements

**Returns:**

*{Boolean}*

* * *


**setVariable**(el, key, value)

Stores a Javascript value for the specified element. This only works on top level vars, but the value can be an object which in effect gives lower level storage posibilities. Variables are stored in a of type application/json as stringified JSON, on the same level as the main component HTML5 code. These are all contained within a wrapper DIV that is the actual DOM element ppassed to this function.

**Parameters:**

*{jQuery DOM element}***el**

*{string}***key,**

the key name in the object

*{anything}***value**

**Returns:**

*{Boolean}*

