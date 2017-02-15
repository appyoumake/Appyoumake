#The frontpage.html file in detail

>Version: 1.0 (April 2016, first public release)<br>
Copyright: © Norwegian Defence Research Establishment (FFI) 2013 - 2016<br>
Initial author: Cecilie Jackbo Gran, Sinett 3.0, FFI<br>
Updating authors: <br>
Comment: _Only update the version number above when component specifications change_

_(If you have not already done it, you should first read [HOWTO - Template Design & Development.md](HOWTO - Template Design & Development.md) and [Mlab explained.md](Mlab explained.md))_

This is the core template file that is copied to an app's index.html file (the first HTML5 page that the Cordova framework displays when an app is started) when a new app is created based on a template. It contains the physical layout for an app and links to all the initial CSS and Javascript files that an app requires (components may add their own Javascript and CSS files later). The layout should be based on the [jQuery Mobile framework](https://jquerymobile.com/) as Mlab is using this framework to support smart device specific features, for instance the use of swiping to move between pages. In addition it can contain Javascript code to perform certain tasks such as navigation, etc.

Below we will go through the different elements that can be present in the frontpage.html file. Some of these are required for Mlab apps to function properly, other elements are optional and meant to enhance the experience of using Mlab apps on smart devices. As Mlab apps are based on HTML5 and related technologies there is nothing stopping you from adding additional features as long as they are HTML5 compatible and do not interfer with how Mlab works. This document is describing required and optional but common functionality to support, but if something is not mentioned here it does not disqualify it from being added to a template if it is useful.

**When creating this file it is important to remember that you need to support both the Mlab app editor functionality, i.e. all the design time features of Mlab, as well as the final runtime app. The former represents a particular challenge as you are in effect editing and modifying HTML5 pages inside another HTML5 page so care must be taken to avoid accidentally affecting the editing tools when trying to do something to the app page(s).**

* **Page layout (required)**

   The basics of the layout will be familiar to anyone who has designed a website (or indeed an app). You will have some repeating elements on every page, typically navigation features such as forward/backward buttons and tools such as search, zoom, change colour scheme, etc., and some elements that are unique for each page. The latter are typically the title/headline of a page and the content of the page itself. Mlab is following jQuery Mobile conventions ith regards to creating the layout, see [https://learn.jquery.com/jquery-mobile/getting-started/](https://learn.jquery.com/jquery-mobile/getting-started/) and [http://demos.jquerymobile.com/1.4.5/pages/](http://demos.jquerymobile.com/1.4.5/pages/) for more information on this, here we will focus on Mlab specific aspects of the layout.

   This page *must* have an div with **both** an ID and class of "mlab_editable_area". This DIV is where the HTML5 code for components are put when the app creator adds a component to the app at design time. The reason for using both an ID attribute and a class name is that we cannot locate the DIV by ID when it is manipulated in the MLAB editor tool. Typically this DIV goes inside the DIV marked as being for content in jQuery Mobile. 
   
   You may also need to add some wrapper DIVs for layout or styling purposes for formatting of the content during design time. Then we will have something like this for the core content (see end of this post for a [complete frontpage.html](#user-content-example-frontpagehtml-file)):
   ```HTML
    <div data-role="page">
        <!-- The CONTENT of the page - filled in via the App builder -->
        <div class="mlab_content_wrapper">
            <div role="main" class="mlab_main_body_content">
                <div id="mlab_editable_area" class="mlab_editable_area">
                    <!-- Where the content/components is placed -->
                </div>
            </div>
        </div><!-- /Content -->
    </div>   
   ```

   When index.html is saved at design time, the *mlab_editable_area* DIV will contain the initial page that users see when they open the app. During the [precompilation process](Mlab explained.md#app-stages) this content is removed from the DIV and stored in a separate page named 000.html. This ensures that all pages in an app are initialised in the same way during tuntime.

* **Linked files (CSS3/Javascript) (some are required)**

   The content of frontpage.html is only part of what makes up a template. In addition there are several supporting files, just as with web pages, that provide styling information (CSS3 files) and custom programming code to perform tasks related to user interaction, validation of input, etc (Javascript) and additional media files (images for tools, etc.). The required files are  listed below, those marked with an asterisk are libraries you just need to add to your template folders, the rest you must create yourself, either from existing examples or from scratch:
   ```
<link rel="stylesheet" href="./css/jquery-mobile.css"> *
<link rel="stylesheet" href="./css/style.css">
<link rel="stylesheet" href="./css/style_rt.css">
<link rel="stylesheet" href="./css/mlab_component.css">
<script src="./js/jquery.js"></script> *
<script src="./js/jquery-ui.js"></script> *
<script src="./js/jquery-mobile.js"></script> *
<script src="./js/mlab.api.js"></script> *
   ```

   **During the design phase, Mlab updates the value of the [base href](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base) tag to the path of the app that has been opened. This is done everytime an app is either created new, or an existing app is opened. The base href tells the browser what it should use as the starting path for all files that it loads, such as CSS, Javascript and image files. The reason for doing this is that the apps that are created by the app creator may be stored (by the Mlab server) at a different location/URL than where the Mlab app editor code is stored. This is in fact encouraged for security reasons. As mentioned above, we are editing HTML pages inside a HTML page, without this modification to the base href Mlab would fail to load any linked files of an app.**

   Because of this, all paths to secondary files loaded by the browser must be relative (i.e. "./img/myfile.png" and not "/img/myfile.png"). So for Javascript and CSS files we have this code:
     ```HTML
     <link rel="stylesheet" href="./css/include.css">
     <script src="./js/jquery.js"></script>
     ```
     
   Additionally, images for stylesheets must be in a folder below the /css folder: ./css/img or ./css/images for example.

* **App initialisation (required)**

   When the compiled app is started on a mobile device the index.html file, i.e. the file discussed here, is loaded first. As a part of this, jQuery Mobile triggers certain [events](https://api.jquerymobile.com/category/events/). Mlab uses this to perform some internal initialisation work through the [Mlab runtime API](Mlab API.html file.md), such as connecting to remote databases. When this is done Mlab will call a function named **mlabInitialiseApp()** which you need to create in frontpage.html. The function taks no parameters, and it will look something like this:
   ```Javascript
   function mlabInitialiseApp() {
     alert("Welcome to my app");
   };
   ```
   It must be a global function, see end of this post for [an example of this function](#user-content-example-frontpagehtml-file). You can use this for anything, but often it is used to initialise the navigation variables for your app.

* **Page initialisation (optional)**

   Every time an Mlab app loads a different page (typically by calling the Mlab API function _navigation.pageDisplay()_ in response to the user interacting with some navigational elements, [see below](#user-content-ref-navigation)), the jQuery Mobile framework issues a number of [event calls](https://api.jquerymobile.com/category/events/). If you wish to support any of these, for instance to update a page number in a footer, etc., you can assign your own Javascript handlers to specific event. 
   
   See these pages for a detailed description on when these events are triggered, and how: [https://jqmtricks.wordpress.com/2014/03/26/jquery-mobile-page-events/](https://jqmtricks.wordpress.com/2014/03/26/jquery-mobile-page-events/) [https://jqmtricks.wordpress.com/2014/07/13/pagecontainerbeforechange/](https://jqmtricks.wordpress.com/2014/07/13/pagecontainerbeforechange/) and [https://jqmtricks.wordpress.com/2014/05/23/jquery-mobile-page-events-extra/](https://jqmtricks.wordpress.com/2014/05/23/jquery-mobile-page-events-extra/). 
   
   One useful thing is to filter what page(s) an event is handled for, the example below is only triggered for the page with id *mlab_index_page*, this has been set on the body tag of the frontpage.html file, so will only trigger when the index.html file is initially loaded. Here we tell jQuery that when the element with the class of _mlab_nav_previous_page_ is clicked we should move to the previous page.
   
   ```Javascript
   $(document).on('pagecreate', '#mlab_index_page', function(e) {
     $(".mlab_nav_previous_page").on("click", function () { mlab.api.navigation.pageDisplay("previous"); });
    });
   ```
   
* **Navigation support (optional, but usually a good idea)** <a id="ref-navigation"></a>

   If the template does not support navigation between different pages in an app, each page would need to individually support it. This is obviously not optimal, therefore it is recommended that your template, through the frontpage.html file, support some form of navigation. This includes, but is not limited to, the navigation code which is required to move from one page to another. 
   
   Navigation support typically entails two parts, first there is some visual element that the user presses to trigger an event, secondly there is some code to load the page that the visual element indicates. The latter can use the Mlab runtime API functions found in the [navigation object](mlab.api.js file.md) to move between pages, typically through the use of the navigation.pageDisplay function. Some examples of visual elements you could deply include:

    * An index of all pages/sections in the app displayed as text. When a text string is pressed the template code opens that specific page.
   * Previous/next buttons that move one page back or forth.
   * A slider control to quickly scroll through the app, similar to the scrollbar in desktop applications.
   
   You may also have "invisible" triggers. For instance you can use the swipe event to determine if the app user has swiped left or right and then open the previous or next page accordingly. **The Back-button on Android is automatically supported to move to the previous page you viewed.**

   In all of these examples you would typically listen to a jQuery Mobile page event and initialise the page loading functionality in response to yet another HTML element event, for instance when someone clicks on a "Next" button. This could look like this in Javascript executed when the index.html page is loaded:

   ```Javascript   
   $(document).on('pagecreate', '#mlab_index_page', function(e) {
     $(".mlab_nav_previous_page").on("click", function () { mlab.api.navigation.pageDisplay("previous"); });
     $(".mlab_nav_next_page").on("click", function () { mlab.api.navigation.pageDisplay("next"); });
   });
   ```

* **General usability support (optional)**

   Exactly what constitutes _usability_ depends very much on the audience for the apps you plan to make with your template, what the apps will (typically) do, etc. For instance, if this template is meant for step by step instructions on different topics, and the users will be using it outside an office, then being able to zoom the text and change the colour scheme (to counter issues with too much sunshine, or dark at night) would be important. If the template is meant for task lists, then perhaps adding support for bookmarking your currently viewed step would be useful.
   
   Usability features would typically have an interface element to trigger it (i.e. a button to press) in this file, whereas the actual implementation would likely be a mixture of CSS applied through Javascript amending classes for content containers. 
   
   Some common usability features include:
   * Show/hide any header/footer/navigation elements, typically to provide more space to read. Done by trapping single touches on the main content of the page.
   * Scale text.
   * Switch between dark and light colour schemes for the pages.
   * Remember last position (i.e. page) in the app.
   
   Code that changes the colour could look like this:
   
   ```html
     <div class="mlab_btn_color_toggle" onclick="$('#mlab_page_body').toggleClass('mlab_color_toggle');")">Toggle</div>
   ```
   ```css
     #mlab_page_body.mlab_color_toggle {
       background-color: white;
       color: black;
     }
   ```

* **Extending templates with Mlab variable and/or component placeholders; why and how (optional)**
   
   As mentioned in [Mlab explained.md](Mlab explained.md) the Mlab templates frame what is known as Mlab components, and a component is a self contained set of HTML5/Javascript/CSS3 code that provides the app creator with tools to build an app. The user of the compiled app will experience it as a single set of pages, but each page will in fact have one or more components in it. 
   
   Sometimes it can be useful for a template to contain one ore more components, rather than having to recreate all the functionality of a component. A good example of this is the _index_ component. This is a core component that generates an index when an app is compiled, this index can be in one of three formats. 1) it can use just an outline of chapter headings; 2) if can use an outline of chapter headings + page titles under each chapter or 3) same as 2, but each chapter is foldable. Reusing, rather than recreating, this component will obviously save considerable time.
   
   The template designer can add components to a template by using what is known as a placeholder. A placeholder tells Mlab where to put the component when the app is compiled, the palceholder will then be replaced with HTML5 code. All placeholders must start and end with two percentage signs (%%), the name of the component must be prefixed with MLAB_CT_COMP_ (MLAB tells Mlab that this is an Mlab placeholder, CT indicates that it should be acted upon at compile time and COMP shows that this is a component) and the name of the component as defined in the [conf.yml](COMPONENTS REFERENCE - conf.yml file.md#user-content-ref-name) such as INDEX for a component named index. As you can see the entire string must be in uppercase, and the full placeholder should then be like this:
   
   ```html
   <div class="mlab_menu_text">%%MLAB_CT_COMP_INDEX%%</div>
   ```
   
   The other type of placeholder will be replaced by a single value, this is typically used for data that we do not know the value of until the app is completed. One example of this is the number of pages in an app. You may need this value to display a slider to move from page 0 (index.html) to the last page in the app. It is not possible through the Cordova framework to get this value, neither would it be realiable to ask the app creator to enter this number when he has finished the app. 
   
   The solution is to use functions built into the Mlab precompilation process. Like the component placeholders it is made up of four elements, the first two are the same, then you use FUNC to indicate that this is a function (and not a component) followed by the name of the function that will return the value to replace the placeholder with. Curently (April 2016) there is only one function, _getnumberofpages_, that is available. To use this you will have some Javascript code like this:
   
   ```javascript
   mlab.api.navigation.initialise(0, "%%MLAB_CT_FUNC_GETNUMBEROFPAGES%%");
     $(function(){
       $("[data-role=header],[data-role=footer]").toolbar();
       $( "[data-role='panel']" ).panel();
     });
   ```
   
   The placeholder in the example above is used in the initialisation of the navigation functionality built into Mlab, once it is initialised the Mlab navigation functions will automatically refer to this value when determining which is the last page that can be opened.
   
* **Accessing/using the Mlab API in a template, why and how (optional)** <a id="ref-use-mlabapi"></a>
   
   To provide support for some common app facilities there is an Mlab API available. An API is simply a set of Javascript functions, you can access the Mlab API functions through the global mlab.api object. To use the functionality that display a page for example, you would use the following code:
   ```javascript
   mlab.api.navigation.pageDisplay("next");
   ```
   
   It is worth looking through the [Mlab runtime API documentation](Mlab API - runtime.md) to see a list of functions and what you can use it for, it can save you considerable time when adding interactive elements to your template.

---
##Example frontpage.html file
```HTML
<!DOCTYPE html>
<html>
<head>
<title>Add page title here</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="mlab:app_uid" content="%%APP_UID%%" />
<link rel="stylesheet" href="./css/jquery-mobile.css">
<link rel="stylesheet" href="./css/style.css">
<link rel="stylesheet" href="./css/style_rt.css">
<link rel="stylesheet" href="./css/mlab_component.css">
<link rel="stylesheet" href="./css/include.css">
<script src="./js/jquery.js"></script>
<script src="./js/jquery-ui.js"></script>
<script src="./js/jquery-mobile.js"></script>
<script src="./js/mlab.api.js"></script>
<script src="./js/include.js"></script>

<script>
    //<![CDATA[
    // When document is ready we assign the mlab.api.navigation.pageDisplay call to various page navigation elements
    function mlabInitialiseApp() {
        mlab.api.navigation.initialise(0, "%%MLAB_CT_FUNC_GETNUMBEROFPAGES%%");
				$(function(){
				   $("[data-role=header],[data-role=footer]").toolbar();
				   $( "[data-role='panel']" ).panel();
				});
    };
    $(document).on('pagecreate', '#mlab_index_page', function(e) {
        $(".mlab_nav_previous_page").on("click", function () { mlab.api.navigation.pageDisplay("previous"); });
        $(".mlab_nav_next_page").on("click", function () { mlab.api.navigation.pageDisplay("next"); });
        $(".mlab_btn_color_toggle").on("vclick", function () { mlab.api.settings.pageColorToggle("mlab_page_body", "mc_text"); });
        $(".mlab_btn_txsize_toggle").on("vclick", function () { mlab.api.settings.pageTextSizeToggle("mlab_main_body_content"); });
    });
</script>

</head>
<body id="mlab_page_body">
<!-- MENU Panel -->
        <div data-role="panel" id="mlab_menu_panel" data-position="left" data-display="overlay" data-theme="a" class="mlab_menu_panel mlab_hide_in_app_builder ui-panel ui-panel-position-left ui-panel-display-overlay ui-body-a ui-panel-animate ui-panel-open">
            <div class="ui-panel-inner">
                <!-- Menu panel content goes here -->
                <a href="#" data-rel="close"><div class="mlab_btn_close_menu"></div></a>
                <div class="mlab_menu_heading">Meny</div>
                <hr class="mlab_hr_panel">
                <div class="mlab_menu_text">%%MLAB_CT_COMP_INDEX%%</div>
            </div>
        </div>
<!-- /Menu panel -->
        
<!-- SETTINGS Panel -->
        <div data-role="panel" id="mlab_settings_panel" data-position="right" data-display="overlay" data-theme="b" class="mlab_settings_panel mlab_hide_in_app_builder ui-panel ui-panel-position-right ui-panel-display-overlay ui-body-a ui-panel-animate ui-panel-open">
            <div class="ui-panel-inner">
                <!-- Settings panel content goes here -->
                <div class="mlab_creators">Made by Sinett</div> 
                <a href="#" data-rel="close"><div class="mlab_btn_close"></div></a>
                <div class="mlab_settings_heading">Settinger</div>
                <hr class="mlab_hr_panel">
                <div class="mlab_btn_color_toggle"></div>
                <div class="mlab_btn_txsize_toggle"></div> 
            </div>
        </div>
<!-- /Settings panel -->
        
<!-- The HEADER with navigation, menu and settings -->
        <div data-role="header" data-theme="a" class="mlab_header mlab_hide_in_app_builder" data-position="fixed">  
            <div class="mlab_header_box">
                <a href="#mlab_menu_panel"><div class="mlab_btn_menu btn_secondary"></div></a>
                <div class="mlab_nav_previous_page"></div>
                <div class="mlab_btn_heraldisk"></div> 
                <div class="mlab_page_name"></div> 
                <a href="#mlab_settings_panel"><div class="mlab_btn_settings"></div></a>
                <div class="mlab_nav_next_page"></div>
            </div>
        </div>
<!-- /Header -->
        
<!-- Main content area -->
    <div data-role="page" id="mlab_index_page">
        <div class="mlab_content_wrapper">
            <div role="main" class="mlab_main_body_content">
                <div id="mlab_editable_area" class="mlab_editable_area">
                    <!-- Where the content/components is placed -->
                </div>
            </div>
        </div>
    </div>   
<!-- /Content -->
        
    <script>
        $( document ).on( "pagecreate", function ( event ) {
            if (mlab.api == null) {
               var curr_page = 0;
            } else {
                var curr_page = mlab.api.navigation.current_page;
            }

            var last_page = Number("%%MLAB_CT_FUNC_GETNUMBEROFPAGES%%");
            switch (curr_page) {
                case 0:
                    //First page in the app
                    if ($(".mlab_nav_previous_page").hasClass('mlab_hide')) { // do nothing
                    } else { //hide the previous button on the first page
                        $(".mlab_nav_previous_page").addClass('mlab_hide'); 
                    }
                    if (last_page == 0) { //the app only has one page - hide the next button
                        $(".mlab_nav_next_page").addClass('mlab_hide'); 
                    } else if ($(".mlab_nav_next_page").hasClass('mlab_hide')) {
                        $(".mlab_nav_next_page").removeClass('mlab_hide');
                    }
                    break;

                case last_page: //Last page in the app and the app has more than one page
                    if ($(".mlab_nav_next_page").hasClass('mlab_hide')) { // do nothing
                    } else { //hide the next button on the last page
                        $(".mlab_nav_next_page").addClass('mlab_hide');
                    }
                     if ($(".mlab_nav_previous_page").hasClass('mlab_hide')) {
                        $(".mlab_nav_previous_page").removeClass('mlab_hide');
                    }
                    break;

                default:
                    if ($(".mlab_nav_next_page").hasClass('mlab_hide')) {
                        $(".mlab_nav_next_page").removeClass('mlab_hide');
                    }
                    if ($(".mlab_nav_previous_page").hasClass('mlab_hide')) {
                        $(".mlab_nav_previous_page").removeClass('mlab_hide');
                    }
                    break;
            }
    });
</script>
</body>
</html>
```
