#The code_rt.js file in detail

>Version: 1.0 (April 2016, first public release)<br>
Copyright: © Norwegian Defence Research Establishment (FFI) 2013 - 2016<br>
Initial author: Arild Bergh, Sinett 3.0, FFI<br>
Updating authors: <br>
Comment: _Only update the version number above when component specifications change_

_(If you have not already done it, you should first read [HOWTO - Component Development.md](HOWTO - Component Development.md) and [Mlab explained.md](Mlab explained.md))_

This file resembles the [code_dt.js](COMPONENTS REFERENCE - code_dt.js file.md) file. It has the same coding style, functions are either called by the Mlab runtime API in response to (for instance) the page containing the component being loaded, whereas other methods are called "directly" by the component itself in response to user actions such as clicks and touches. Whereas [code_dt.js](COMPONENTS REFERENCE - code_dt.js file.md) is responsible for letting the **app creator** tell MLAB how a component should look and behave during the design time process, code_rt.js is used (if required) at runtime for the benefit of the **app user**, partly by applying or acting upon settings that the app creator defined at design time. 

This file is optional, but for more advanced components it will take care of a) the display of the component by using settings provided by the app creator (for instance the _googlemaps_ component uses this to centre the map as specified) and b) the interaction required, i.e responding to touches or clicks on buttons, etc. (the _quiz_ component, for example, uses this file to store responses and evaluate if answers are correct).

**Comments:**
 * **The code in this file will be loaded into the _mlab.api.components.mycomponent_ object, and one new members will be added to this new object. *.api* is the [runtime API code](COMPONENTS%20REFERENCE%20-%20mlab.api.js%20file.md) and it can then be accessed through this.api.function_to_call from within all functions. If for some reason you cannot use the this object due to scope issues, then you can use the absolute path: mlab.api.function_to_call**

* **Functions called directly by Mlab will have the DIV element surrounding the component as the first parameter (by convention it is called "el" in existing code).**

#### Components using storage plugins
When a component has specified that it wants to use a storage plugin by setting the configuration parameter [_storage_plugin_](COMPONENTS REFERENCE - conf.yml file.md#ref-storage_plugin) in the conf.yml file *and* the app creator has specified which plugin to use, the component should initialise the plugin before use, typically in the _onPageLoad_ function. This is done by calling the relevat API function like this:
> ```Javascript
  this.api.db.setupStoragePlugin(myself, callback_function);
```
The parameter _myself_ is the jQuery object that represents the DIV that surrounds the object. This is passed in the initial call to onPageLoad, and can be stored in a local Javascript variable for future reference. The _callback_function_ parameter is optional and is a function that the runtime API will call after it has successfully initialised the 

**Function:** *onPageLoad()*
>Called when the page with the component is loaded. This is where component specific code would go, for example for a map this is
```Javascript
this.onPageLoad = function (el) {
 alert("Welcome to my component");
}
```
**Parameters:**
 * el: A jQuery object representing the DIV that surrounds the component.
