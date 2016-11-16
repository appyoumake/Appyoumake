#The Mlab runtime API 

>Version: 1.0 (April 2016, first public release)<br>
Copyright: © Norwegian Defence Research Establishment (FFI) 2013 - 2016<br>
Initial authors: Arild Bergh & Cecilie Jackbo Gran, Sinett 3.0, FFI<br>
Updating authors: <br>
Comment: _Only update the version number above when the runtime API specifications change_

The code described here can be found in the mlab.api.js file

### **Storage functions (to be replicated by storage plugins)**

**getAllConfig**(user:)

Gets all stored configs, or all stored configs for user (if given).

**Parameters:**

*{String}* **user:**

User ID for the currently logged in user. Optional.

**Returns:**

*{Object}* Object containing the configs

* * *


**getAllStates**(user)

Gets all stored states, or all stored states for user (if given).

**Parameters:**

*{String}* **user**

User ID for the currently logged in user. Optional.

**Returns:**

*{Object}* Object containing the states

* * *


**getConfig**(user, key)

Gets config for given user an key.

**Parameters:**

*{String}* **user**

User ID for the currently logged in user. Required.

*{String}* **key**

Key name for the config to be stored. Required.

**Returns:**

*{any}* The config value (any type), or null

* * *


**getResult**(user, name, key)

Get saved result for specific question

**Parameters:**

*{String}* **user**

User ID for the currently logged in user. Required.

*{String}* **name**

The name of the quiz. Must be unique within the app. Required.

*{String}* **key**

The name of the question. Must be unique within the quiz. Required.

**Returns:**

*{any}* The value that was saved. Normally an object, but any JSON-stringifiable value is allowed.

* * *


_TODO: ADD GETALLERESULTS_

* * *


**getState**(user, key)

Gets state for given user an key. getState() implemented in a plugin has to return an array with 1) boolean (success/failure to get state), and 2) value.

**Parameters:**

*{String}* **user**

User ID for the currently logged in user. Required.

*{String}* **key**

Key name for the state to be stored. Required.

**Returns:**

*{Any}* Value of state

* * *


**loginRemotely**(service, username, password:)

Login on remote service, through loaded plugin. If we have a loginToken stored, we assume this is valid, and simply return the token.

**Parameters:**

*{String}* **service**

The short_name of the service

*{String}* **username**

User name

*{String}* **password:**

Password

**Returns:**

*{boolean}* or {String}. True if we have sent a login request, false if we haven't. Login token string if it exists.

* * *


**loginToken**(service)

Getter/setter for the login token string.

**Parameters:**

*{String}* **service**

The short_name of the service

*{String}* **token.**

Token to be set. Optional.

**Returns:**

*{String}* or {false}. The currently set token, or false if not set.

* * *


**logoffRemotely**(service)

Log off the remote service, through plugin.

**Parameters:**

*{String}* **service**

The short_name of the service

**Returns:**

*{boolean}* True if plugin has logged off, false if not.

* * *


**setConfig**(user, key, value)

Sets config for user, also makes sure it is saved for later use.

**Parameters:**

*{String}* **user**

User ID for the currently logged in user. Required.

*{String}* **key**

Key name for the config to be stored. Required.

*{any}* **value**

The config value to be stored. Required. Anything that is compatible with JSON.stringify. All basic Javascript types should be OK.

* * *


**setResult**(user, name, key, value)

Saves result for a question.

**Parameters:**

*{String}* **user**

User ID for the currently logged in user. Required.

*{String}* **name**

The name of the quiz. Must be unique within the app. Required.

*{String}* **key**

The name of the question. Must be unique within the quiz. Require	d.

*{any}* **value**

The value to be stored.

**setState**(user, key, value)

Sets the state for given user and key, a state can be the past opened page for instance, or whether or not to display navigation bar, it tracks states of the app based on what user has selected (by, for instance clicking on a button).

**Parameters:**

*{String}* **user**

User ID for the currently logged in user. Required.

*{String}* **key**

Key name for the state to be stored. Required.

*{Any}* **value**

Value of the state to be stored. Required.

**Returns:**

*{Bool}* Result of the storage operation

### **Other functions**

**getLocale**()

Added by Arild to get current locale

**Returns:**

string

* * *


**getMode**()

Get the mode and device the app is in/on and return as object: mode = "runtime" if in app mode, "design" if in editor mode and device = "mobile" if running with Cordova in a comiled app, otherwise "desktop".

**Returns:**

*{Object}*

* * *


**setupStoragePlugin**(el)

Loads an external JS file, containing a plugin. Stores the plugin in the this.plugins object. When plugin is loaded, triggers an event "pluginloaded".

**Parameters:**

*{String}* **name**

The name of the plugin. The JS file that is loaded must be named "plugin_.js" and must be places in the js directory. Also, the plugin itself must be stored in an object .

* * *


_TODO: Fix this documentation, now stores it with unique ID for owning component_

* * *


**onMlabReady**()

Runs when mlab object has been set up. Loops through the globally defined arrays "mlab_initialiseApp" and "mlab_initialiseComponent", and calls the functions registered in these. In the spec, mlab_initialiseApp and mlab_initialiseComponent are defined as single functions. However, most apps and pages have more than one component. If they all implement functions of the same name in the global namespace, only the latest added will be run. So instead, we store the component's init methods in two global arrays, and loop through these, to make sure everything gets set up properly.

* * *


**_****get/setVar**** **Add explanation of these functions_

* * *



