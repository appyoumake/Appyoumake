#Mlab CSS(3) styling in detail

>Version: 1.0 (April 2016, first public release)<br>
Copyright: © Norwegian Defence Research Establishment (FFI) 2013 - 2016<br>
Initial author: Cecilie Jackbo Gran, Sinett 3.0, FFI<br>
Updating authors: <br>
Comment: _Only update the version number above when component specifications change_

_(If you have not already done it, you should first read [HOWTO - Template Design & Development.md](HOWTO - Template Design & Development.md) and [Mlab explained.md](Mlab explained.md))_

##CSS and Mlab in general
Generally speaking you use CSS rules in Mlab apps just as you would do on a web page, within the restrictions imposed by small screen sizes of mobile devices. You should make sure you have a [responsive design](https://en.wikipedia.org/wiki/Responsive_web_design) that adjust to different screen sizes and it is worth using a [reset stylesheet](http://meyerweb.com/eric/tools/css/reset/) to create a baseline style for all elements. 

##Mlab specific issues

###Styling for components / predefined classes <a id="ref-predefined_classes"></a>
As well as styling general template features such as header, footer, navigation tools etc., you also need to consider the fact that [components](HOWTO - Template Design & Development.md#the-role-of-the-template-illustrated-and-discussed), the building blocks for Mlab apps, do **in general** not have any styling of their own. It *is* possible to include separate styling for a component by adding a CSS file to the component, but it is recommended to avoid this as much as possible. Instead it is expected that the stylesheets included with the template also style the components, this is to ensure that all components have a matching design. A component can be as simple as a single _h1_ heading, or it can consist of a large number of design time generated elements, such as the quiz component.

Given that there are a wide range of Mlab components available, and that new ones will be created in the future, how can you possibly design for this situation? Mlab has solved this by predefining a range of classes that relate to how elements will be used, and not  how they should look (with two exceptions). So rather than using classes for a label called something like "red_label" we use a three level hierarchy which works as follows, always using mc_ (Mlab Component) as the prefix to avoid clashing with other styles:

  * Level one, basic element type
   * .mc_text (all text elements, regardless of whether it is \<input type=textare"> or \<h1>)
   * .mc_container (elements that contain other elements, like a DIV)
   * .mc_figure (all that is not text or container)

  * Level two for mc_text or mc_figure, related to the possible actions for the element
   * .mc_link (clickable link leaning to something else, either a popup dialog box, another page, etc.)
   * .mc_interactive (typically video or audio elements that you can start/stop, etc)
   * .mc_display ("output" only, i.e. it is for showing information)
   * .mc_entry ("input" only, i.e. the opposite of the previous one)

  * Level three, additional action type classes
   * .mc_correct
   * .mc_blurred
   * .mc_required
   * .mc_info
   * .mc_output
   * .mc_input
   * .mc_resizable 
   * .mc_heading 
   * .mc_chapter 
   * .mc_ingress 
   * .mc_figure_with_caption 
   * .mc_figure_in_text 
   * .mc_numeric 
   * .mc_bullet 
   * .mc_enabled 
   * .mc_disabled 
   * .mc_emphasize 
   * .mc_depreciate 
   * .mc_internal 
   * .mc_external 
   * .mc_map 
   * .mc_timebased 
   * .mc_live_output 
   * .mc_list
 
  * Level three (potentially four), display related classes

    The following classes are utility classes which are used to indicate the size of an element relative to other HTML5 elements on a page. You can for instance have a headline which uses the mc_large as top level headlines, mc_medium for subheadline and mc_small for sub-subheadlines. Like the other classes above, the component developer can use these inside their component. However, these classes are also used by the Mlab app editor to let the app creator change the size of resizable component, for instance the _youtube_ component can be resized through these classes. So they can be changed at designtime, something that must be considered when the classes are defined in the stylesheet.

   * .mc_large 
   * .mc_medium 
   * .mc_small

    The following classes are only used to overrule the default horizontal positioning of elements, stylesheets may choose not to support them if they want to enforce certain positions for all component elements.

   * .mc_left 
   * .mc_right 
   * .mc_center 

**Some examples of component styling**
>This can be used for data entry text boxes that are disabled (for example):
  ```css
  #mlab_editor .mc_text.mc_entry.mc_blurred,
  .mlab_main_body_content .mc_text.mc_entry.mc_blurred {
    color: lightgray;
  }
  ```
>
>Another example, useful for labels of input fields that are required
  ```css
  #mlab_editor .mc_text.mc_display.mc_required,
  .mlab_main_body_content .mc_text.mc_display.mc_required {
    color: red;
  }
  ```

These classes should be put in a separate stylesheet, by convention this is usually named _mlab_component.css_. You need to style all possible combinations of these, but this is mainly achieved through the use of the CSS inheritance, so for the mc_large class setting a single rule using 130% as the size is usually enough.

###Styling for two different situations
A key difference for Mlab templates when compared to regular web pages is that they need to support two distinctly different modes of operation. The runtime mode (when a completed and compiled app is running on a device) is quite simple, here each HTML5 page is displayed on its own, so a change to all DIV elements would only affect the DIVs in the app. 

At design time however, the Mlab app pages are displayed inside another HTML5 page (and **not** inside an iframe). This other HTML5 page contains all the Mlab editing tools. This mean that unless HTML elements are carefully styled (through a strong hierarchy of classes and in some cases IDs from the app editor environment) they will take on the styling of the surrounding editing page. This requires careful attention to the "styling paths" available. 

For example, if you want to display all images (in apps based on your template that is) with a red solid border you cannot simply create a rule like this:

   ```css
    img {
      border: 5px solid red;
    }
   ```
   
This would not only set the image borders in the apps being created to red, it would also affect all the other image elements, such as the component tools in the toolbox. In other words, your attempt at hilighting the images in apps would also highlight tools that are used for the app, but are not part of the app. Instead you need to do something like:
   ```css
    .mlab_main_body_content img {
      border: 5px solid red;
    }
   ```

The second example uses a class that should be applied to the main page content DIV (see [example here](TEMPLATES REFERENCE - frontpage.html file.md#user-content-example-frontpagehtml-file)), thus ensuring that the style is only applied to the app page content, and not any of the surrounding app editor tools.

Sometimes you may need to use many CSS selectors to make sure that a particular element is given a specific style. This is known as [specificity in CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity), in short the more selectors (classes, HTML element types, data tags, etc) you use to specify an element, the more weight it carries when the browser selects which style to apply for this element. 

If there are certain design time only styles you need to use (for instance to make something stand out for the app creator), then you could start with the ID of the design time page (mlab_editor), then the ID of the editable area (mlab_editable_area), then the class of the content area (mlab_main_body_content) and finally the element you want to do something about (for instance img). Then you would have a rule like this:
   ```css
    #mlab_editor #mlab_editable_area .mlab_main_body_content img {
      box-shadow: 10px 10px 5px #888888;
    }
   ```

This would only apply to the design time styling. If you needed strong specificity for design time **and** runtime you can do something like this (assuming you follow convention and gives an ID of mlab_page_body to the [frontpage.html](TEMPLATES REFERENCE - frontpage.html file.md) body):
   ```css
    #mlab_editor #mlab_editable_area .mlab_main_body_content img, #mlab_page_body .mlab_main_body_content img {
      box-shadow: 10px 10px 5px #888888;
    }
   ```

**Finally, you need to be careful when using the "position" property in components. If you use the _position: absolute;_ for components, elements in the component are likely to be displayed somewhere else than you expected as there will be additional elements around a component that will distort the actual position. So the top of a component will never be at the 0 absolute position, instead it will be "height of template elements above component + height of other components over the component being styled".**

*As jQuery Mobile is always included in apps you can also use [jQuery styles](https://api.jquerymobile.com/category/css-framework/) if this is useful.*

##CSS best practices for Mlab templates/styling
### Z-Index positioning

The Z-Index referred to here is the CSS setting of the same name which is used to determine which HTML elements should be displayed on top of others. This is an issue when using floating headers/footers, dialog boxes, toolbars, etc. The Mlab editor is rather intricate when it comes Z-index issues. Firstly there are the interactions between components in pages that are being created, which themselves will be using different Z-index values for the runtime display of elements. Then there is the always updated WYSIWYG display in the editor. Finally we have the editor's own elements such as menus and popup dialog boxes requesting information. It is therefore very important that component developers carefully assign Z-indicies in the correct ranges as specified below.

| Elements                                | Level (z-index) | Comments                                 | 
|-----------------------------------------|-----------------|------------------------------------------|
| Elements in components on top of others | 100-149         | For instance Google map markers          | 
| Tooltips etc in components              | 200             |                                          | 
| Menu for page                           | 1000            |                                          | 
| Settings dialog box for content         | 400             | use $.fn.qtip.zindex in a global place.  | 
| Content of settings dialog box          | 401-449         |                                          | 
| Popup menus for component tools         | 600             |                                          | 
| Dropdown list for page selection        | 980             |                                          | 
| Tooltips etc in editor                  | 990             |                                          | 
| Modal "loading" message                 | 1100            |                                          | 


## CSS hierarchy/namespace

Just as one has to carefully consider how to use Z-index settings to avoid affecting other elements, one also needs to avoid creating CSS rules that unintentionally affect content is added to components by an app creator during the design of the app. As we cannot know for sure what components are or will be created in the future we need to follow certain rules when naming CSS classes or other identifying attributes of HTML tags, for instance data attributes. These rules (often referred to as a [name space](https://en.wikipedia.org/wiki/Namespace)) create a hierarchical style of naming that ensures that we do not duplicate these identifiers. 

**Ideally you should use the [predefined classes](#user-content-ref-predefined_classes) discussed above**, but if not you must use follow the Mlab name space rules. This would typically be the case for HTML elements surrounding the main page content where the predefined classes may prove to be too simple. The name spaces defined take into consideration three issues: Components (or parts of components) may have to be displayed slightly differently in design time and runtime; components (or HTML elements in a component) can override standard styles for them to be displayed correctly; or some elements in the dialog box used by Mlab to request app creator input at design time must be customised to work properly. 

   The Mlab namespace hierarchy is as follows:
    * mlab_ (fixed top level name for anything relating to Mlab, means that it will not be confused with names in external libraries such as a jQuery plugin)
      * dt_/ct_/rt_/cp_ (dt (design time) ct (compile time) and rt (runtime) indicates which of the [Mlab app stages](Mlab%20explained.md#app-stages) this should apply to. 
        * templatename_ (the unique name of a template)
          * mystring (the final part of the namespace, this is anything you choose, you only have to make sure this part is unique within your own component.

   Examples:
   * mlab_dt_mytemplate_labels (could be used to style labels used by the template)
   * mlab_rt_mytemplate_fontsize (could be used as a Javascript variable name to hold the current font size)
   
   Related to the namespace issue we have a few other issues:

   * Avoid the use of global variables if you need to add Javascript to your template. Mlab cannot enforce this, but it is bad practice and should be avoided at all costs. Instead create an object using the above namespace rules, and then add the variable to this, so you will have my_object.my_variable to store the data.

   * If, despite all this, you do have to use a global variable, attach it to the systemwide *document* variable, again using the above name space rules.

  * Generally one should avoid the use of the ID attributes for an HTML element. The HTML5 ID attribute must be unique for an entire document and in Mlab multiple pages may be loaded into the document at the same time. This would cause any use of IDs (for instance in calls to jQuery) to fail. Instead you should identify elements inside your component using unique combinations of HTML data tags and/or classes. For instance, if you have two images, a thumbnail and a full size version of the image, these could be identified by assigning them classes such as mlab_dt_mytemplate_thumb and mlab_dt_mytemplate_full for styling purposes. To manipulate the element or read information from it, it would be more appropriate to use the data attribute, again using a namespace. You then get, for instance, data-mlab-dt-mytemplate-element="somevalue".

The same name spaces should also be used for other HTML attributes. For instance to add a data attribute to an element use data-mlab-dt-xxxx for design time relevant data tags, or data-mlab-mytemplate-xxxx for data tags that are used both at runtime and design time but are specific to templates.
