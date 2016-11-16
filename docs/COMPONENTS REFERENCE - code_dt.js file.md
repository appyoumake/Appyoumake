#The code_dt.js file in detail

>Version: 1.0 (April 2016, first public release)<br>
Copyright: © Norwegian Defence Research Establishment (FFI) 2013 - 2016<br>
Initial author: Arild Bergh, Sinett 3.0, FFI<br>
Updating authors: <br>
Comment: _Only update the version number above when component specifications change_

_(If you have not already done it, you should first read [HOWTO - Component Development.md](HOWTO - Component Development.md) and [Mlab explained.md](Mlab explained.md))_

**Please note that when you work with components they effectively consist of two parts. One is one particular instance of the component represented by the (visible or not) HTML5 code on the currently loaded page of the app, the other is the code in this file which is shared among all instances of the component. For all callback functions that are called by Mlab the currently selected component is passed as a jQuery object. Please refer to [HOWTO - Component Development.md](HOWTO - Component Development.md) for information about what happens when a component is added to a page, and what additional HTML5 code is added to facilitate design time manipulation of the component.**

Although a lot of useful content can be presented by using only static (i.e. display only) HTML elements, such as paragraphs and  images, MLAB becomes more powerful when (inter)active components are used. Such components may be used to play videos, display maps, request data from the user and send it to a cloud service, connect different users of the same app, provide quiz elements or gather statistics on app use. The primary tool to achieve this is Javascript (and the jQuery Javascript libraries), MLAB supports the use of Javascript through the code_dt.js and code_rt.js files. The latter of these are explained after this section.

Code_dt.js is used only at design time, the code here provides functionality that enables the app creator to enter and format data in the component. For instance an image component would have an "upload image" method, whereas a text component would have methods to set text to bold or italic. 

This file takes care of the following tasks.
* Request user input, for instance selecting where to center a map or a Youtube video to show.
* Manipulate the HTML of the component at DT, either based on settings in the conf.yml file or input from the app creator.
* Upload files required by the component, for instance videos.
* Provide standard MLAB functionality, such as changing the HTML tag type.
* Provide custom formatting functionality, for instance make selections bold or italic.
* Collect variables for use at runtime and store these using the setVariable() API function.
* Generate basic Javascript (if required) and store it using the setScript() API function.

**NB: Such Javascript usage should be kept to a minimum, ideally components use code_rt.js for functions and use variable storage instead.**

The functionality in code_dt.js is wholly determined by what the component is trying to achieve. If one is writing a component that displays a Twitter feed it would be natural to have functions that requests which tags and/or user feeds to follow, perhaps coupled with some formatting options such as size of the font, if it should have a border or not, if it should fill the whole screen, etc. These formatting options should as far as possible rely on predefined styles (through the use of CSS3 classes) that Mlab templates provide, please refer to the [template](HOWTO%20-%20Template%20Design%20%26%20Development.md) document which lists these classes.

The choices made by the app creator must be stored in the app at DT, either by updating the HTML or storing Javascript variables through the MLAB DT API, then the RT part of the component code ([code_rt.js]()) will use this information to display the component and/or interact with the user.

This file must be structured as the "inner content" of an object due to the way MLAB loads the code and assigns it to an internal structure outside the control of the component itself. This is the correct way of doing this:

```Javascript
//first line of file
this.onCreate = function (el) {
 this.onLoad (el);
};

this.onLoad = function (el) {
 if ($(el).find('video').attr("poster") == "") {
  $(el).find('video').attr("poster", this.config.placholder);
 } 
};
//last line of file
```

There are some required methods that code_dt.js must always support, and some that are required if certain actions are to be supported. There are also certain naming conventions to be followed for custom actions. 

The code in this file will be loaded into the mlab.dt.components._mycomponent_.code object, and two new members will be added to this new object, .api which is the design time API code, and .config which is the content of the [conf.yml](COMPONENTS%20REFERENCE%20-%20conf.yml%20file.md) file. These can then be accessed through this.api._func_ and this.config._object_ from within all functions. If for some reason you cannot use the _this_ object due to scope issues, then you can use the absolute path: _mlab.dt.api.func_ and _mlab.dt.components[my_component_nam].code.config.object_.

##possible functions in code_dt.js

**function:** *onCreate(el)* (required) <a id="ref-oncreate"></a>
>This is called when a component is first added to a page (and **not** when the component is reloaded as a result of opening the same pagae again later). It is only called if the [server side code](COMPONENTS%20REFERENCE%20-%20server_code.php%20file.md) (if any) is successfully executed. If this code fails, through a missing connection to the server or due to some error on the server, then the app creator is alerted and the component is removed to avoid incorrectly initialised components from existing on the page. 
```Javascript
this.onCreate = function (el) {
 this.onLoad (el);
 $(el).find('video').css("width", "100%");
};
```
**Parameters:**
 * _el_ - jquery object that contains the outer DIV for the component being added

**function:** *onLoad(el)* (required) <a id="ref-onload"></a>
>Please also read [onSave](#user-content-ref-onsave) below to get a full understanding of the implications of the onLoad/onSave round trip used by Mlab to support advanced manipulation of the HTML5 DOM tree that constitutes the components visible aspect.

>onLoad is called every time the page containing the component is loaded *after* the component has been added inititally (i.e. it is NOT called when the component is first added by the app creator, then onCreate is called). Some components may need to modify the HTML5 DOM considerable between the design time and runtime implementations. For instance you want all your plain text elements to be editable when you are in design mode, so the app creator can just click on the text to edit it. This clearly enhances usability and is how most users would expect the Mlab app builder to work. However, at runtime one should not be able to edit the text, otherwise the app would become corrupted and simply not reflect the original intention. 
```Javascript
//support the above example of allowing direct editing of text on a page
this.onLoad = function (el) {
 $(el).find('p').attr("contenteditable", true);
};
```
**Parameters:**
 * _el_ - jquery object that contains the outer DIV for the component being loaded

>**Comments:**
 * **See the _quiz_ component for some advanced examples on DOM manipulation in the onLoad() function.**
 * **onCreate may share some code with onLoad and do any creation specific actions before or after calling the shared code. Whether this is useful or not depends on how much manipulation of the DOM happens, for more advanced components this might not be very useful to do.**

**function:** *onSave(el)* (required) <a id="ref-onsave"></a>
>Please also read [onLoad](#user-content-ref-onload) above to get a full understanding of the implications of the onLoad/onSave round trip used by Mlab to support advanced manipulation of the HTML5 DOM tree that constitutes the components visible aspect.
>Returns the HTML5 code that should be stored in the HTML page that is saved on the server. This has to take into consideration the re-display of the component next time this page is opened for editing as well as any runtime use. 

>You can also use the Mlab setVariable() function in onSave() to store variables that are persistent across the page openings at design time, or to use at runtime, **before** returning the HTML code.
```Javascript
this.onSave = function (el) {
 var local_el = $(el).clone();
 local_el.find("p").removeAttr("contenteditable");
 return local_el[0].outerHTML;
};
```
**Parameters:**
 * _el_ - jquery object that contains the outer DIV for the component being saved.
**Returns:**
 * the HTML5 code to save, including any manipulations that have been done.

>**Comments:**
 * **See the quiz component for some advanced examples on DOM manipulation in the onSave() function.**

**function:** *onDelete(el)* (optional) <a id="ref-ondelete"></a>
>Any cleanup actions (such as removing in-memory variables or telling a remote service you are no longer connected) should be performed here. Most of the time MLAB takes care or removing the entire component with all stored variables, so this is only for very specific cases.
```Javascript
this.onDelete = function (el) {
 delete document.my_global_variable;
};
```
**Parameters:**
 * _el_ - jquery object that contains the outer DIV for the component being deleted

**function:** *onKeypress(e)* (required if the _process_keypress_ setting has been set in [conf.yml](COMPONENTS%20REFERENCE%20-%20conf.yml%20file.md)) <a id="ref-onkeypress"></a>
>This function is called if process_keypress is set to true in the conf.yml file. This is where the component checks which keys have been pressed and perform actions in response to certain keys being pressed. The most common use for this is to override formatting that the browser inserts. For instance when you press Enter in a paragraph, some browsers insert extra DIV or SPAN tags. To avoid this you may want to block the enter key, and insert a plain &lt;br&gt; tag which will not disturb any formatting. A component may also want to "eat" certain keys, so you cannot have enter (new line) in a headline for instance.
```Javascript
//this shows how to avoid different browsers inserting spurious HTML codes when all we want is a new line. 
//for example Chromium inserst some DIVs and SPANSs
 this.onKeyPress = function (e) {
     if (e.keyCode == 13) {
         e.preventDefault();
         var sel, range, html;
         sel = window.getSelection();
         range = sel.getRangeAt(0);
         range.deleteContents();
         var linebreak = document.createElement("br") ;
         range.insertNode(linebreak);
         sel.modify("move", "forward", "character");
     }
 };
```
**Parameters:**
 * _e_ - jQuery event object

**function:** *onReplace(el, replacement_id, replacement_html)* (required if the _compatible_ setting has been set in [conf.yml](COMPONENTS%20REFERENCE%20-%20conf.yml%20file.md)) <a id="ref-onreplace"></a>
>Modifies the HTML of the component so that it becomes a different component type. For instance you may want to change a _header_ component to a plain _paragraph_. As the Mlab app builder or other components would not know how the content is stored in your component, you must support the change 
```Javascript
this.onReplace = function (el, replacement_id, replacement_html) {
 var content = $(el).find("h1").html();
 $(el).empty().html(replacement_html).data("mlab-type", replacement_id).children(0).html(content);
};
```
**Parameters:**
 * el: Outer div of the component to be replaced (your component).
 * replacement_id: the unique id (or name) of the new component, for instance _p_.
 * replacement_html: The "starting" HTML of the component that will replace this. For instance "\<h1\>Add headline\</h1\>".

**function:** *onResize(el)* (required if the _resizable_ setting has been set in [conf.yml](COMPONENTS%20REFERENCE%20-%20conf.yml%20file.md)) <a id="ref-onresize"></a>
>Mlab cannot know exactly how a component should be modified when a user selects the ratio (4:3 for instance) or size (medium for example) for a component. Instead this code is called to let the component handle the resizing itself. It should read the data-mlab-aspectratio and/or data-mlab-size attributes (which are updated by Mlab before this function is called) to see what size the app creator has specified. 
```Javascript
//example for a Youtube video component
this.onResize = function (el) {
     var w = $(el).innerWidth();
     var h = $(el).innerHeight();
     var aspectratio = $(el).attr("data-mlab-aspectratio").split(":");
     $(el).find("iframe").attr({"data-aspectratio" : (aspectratio[1] / aspectratio[0]), "width": w + "px", "height": h + "px"});
 }
 ```
**Parameters:**
 * _el_ - jquery object that contains the outer DIV for the component that we want to resize
**Comments:** 
 * **Sizes can be "small", "medium", "large" and "fullscreen", aspect ratios can be 16:9, 4:3 and 1:1.**
 * **An alternative to using the built in resize functionality of the Mlab API is to create a [custom function](#user-content-ref-custom).** 

**function:** *getContentSize(el)* (optional, but recommended) <a id="ref-getcontentsize"></a>
>A template can specify certain suggestions (not rules) for app creators to follow so the content being added follows best practices. For instance it may be that a paragraph should only contain 300 words, or that there should only be one video per page. To support this, a component has to have a function named getContentSize() which returns the size of the content in a way that makes sense depending on the type of component.
```Javascript
//For video and audio this should be the length. 
this.getContentSize = function (el) {
 return $(el).find("video").duration;
};
//For image type components (including maps), this should be x/y size. 
this.getContentSize = function (el) {
	var ctrl = $(el).find("img");
	return { "width": ctrl.width(), "height": ctrl.height() }
}
//For text this should be the number of words.
this.getContentSize = function (el) {
	return $(el).find("p").text().split(' ').length;
}
```
**Parameters:**
 * _el_ - jquery object that contains the outer DIV for the component that we want the size of

**function:** *custom_xx(el)* (optional) <a id="ref-custom"></a>
>Any custom code that should be made available to the app creator, not as a prompt, but as an option, can be added by prefixing the function name with custom_. xx = the name of the functionality, such as toggle_bold.

>MLAB will then display the icon specified by the custom: xx: icon setting in the conf.yml file, with custom: xx: tooltip as the tooltip. This is displayed in the component toolbar when the component is selected as the current component.
```Javascript
this.custom_toggle_bold = function (el) {
 document.execCommand('bold', null, null);
};
```
**Parameters:**
 * _el_ - jquery object that contains the outer DIV for the component being edited
