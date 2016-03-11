/*
 * All functions used in /src/Sinett/MLAB/BuilderBundle/Resources/views/App/build_app.html.twig
 * but not the data that has to come from TWIG. Therefore, see top of that page for data structures.
 */
//TODO: NEED TO NOT USE slf (window.slf = JS builtin variable)


/* general variables used globally by different functions
   (variables with data from backend are loaded from the backend in the document.ready event and enters this file as JSON structures */

//turn off automatic initialisation of mobile pages
$.mobile.autoInitializePage = false;


/*********** Startup code ***********/
$(document).ready(function() {
        
//only support chrome and firefox to begin with
    if (bowser.gecko || bowser.chrome) {

    } else {
        alert(_tr["mlab_editor.init.js.alert.browser.support"]);
        $("body").append('<div id="mlab_editor_disabled" style="background-color: gray; position: absolute;top:0;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50)"></div>');
    }
        
//initialise the Mlab object, then create an global instance of it
//the MLAB object contains several other objects loaded in different files
    Mlab = function () {
        var self = this;
        this.locale = document.mlab_temp_vars.locale;

//runtime api is at the top level
        this.api = new Mlab_api();
        this.api.parent = self;

        this.dt = {
//variables used for: general config, path info, app info, page details
            uid: 0,
            config: new Object(),
            paths: new Object(),
            app: new Object(),
            page: new Object(),

// individual variables used by all .dt sub functions
            flag_dirty: false,
            counter_saving_page: 0, // counter which tells us if inside the save function we should restart the timer for
            drag_origin: 'sortable',
            mlab_component_cur_tooltip: null,

// drag'n'drop definitions used by jQuery
            droppable_options: {
                drop: function( event, ui ) {
                    mlab.dt.flag_dirty = true;
                }
            },

            sortable_options: {
                placeholder: "mlab_component_placeholder",
                revert: false,
                helper: "clone",
                cancel: "[contenteditable]",
                stop: function(event, ui){
//make editable after dragging to sort
                    if (mlab.dt.drag_origin == 'sortable' && ui.item.data("contenteditable") == "true") {
                        ui.item.attr("contenteditable", "true");
                    };
                    mlab.dt.flag_dirty = true;
                }
            },

//other pre-defined objects wrapping up this .dt "class"
            api: new Mlab_dt_api(),
            bestpractice: new Mlab_dt_bestpractice(),
            design: new Mlab_dt_design(),
            management: new Mlab_dt_management(),
            utils: new Mlab_dt_utils(),

        },

        this.initialise_dt_parents = function () {
            self.dt.parent = self;
            self.dt.api.parent = self.dt;
            self.dt.api.display.parent = self.dt.api;
            self.dt.bestpractice.parent = self.dt;
            self.dt.design.parent = self.dt;
            self.dt.management.parent = self.dt;
            self.dt.utils.parent = self.dt;
        }

    };
    mlab = new Mlab();
    mlab.initialise_dt_parents();

//here we pick up variables from the backend, if successful we go on, if not we must exit
    $.get( document.mlab_temp_vars.appbuilder_root_url + document.mlab_temp_vars.app_id  + "/" + document.mlab_temp_vars.page_num + "/load_variables" , function( data ) {

        if (data.result === "success") {
//unique ID for this tab/window, used to lock pages
            mlab.dt.uid = data.mlab_uid;

//we use the email of the user to send them links to apps
            mlab.dt.user_email = data.mlab_current_user_email;

//current app/page information, this will be updated when they create a new app or edit properties
            mlab.dt.app = data.mlab_app;
            mlab.dt.app.curr_page_num = data.mlab_app_page_num;
//checksum of current file
            mlab.dt.app.app_checksum = data.mlab_app_checksum;

//any existing compiled files for this app
            mlab.dt.app.compiled_files = data.mlab_compiled_files;

//configuration stuff from parameter.yml
            mlab.dt.config = data.mlab_config;

//URLs can be changed using routes in MLAB, make sure we always use the latest from Symfony and don't have hardwired ones
            mlab.dt.urls = data.mlab_urls;


/**** Finished preparing variables, now we set up rest of environment ****/


//check if the doc is modified before closeing it, if so warn user, also unlock file and save component accordion expand collaps state
            window.onbeforeunload = function() {
                var url = mlab.dt.urls.editor_closed.replace("_UID_", mlab.dt.uid);
                $.ajax({ url: url, async: false });

                if (mlab.dt.flag_dirty) { return _tr["mlab_editor.init.js.alert.unsaved"] ; }
//Loop trough the Component categories/accordians to se if they are expand or collapsed. 
                var compcat = $("#mlab_toolbar_components h3");
                if (typeof compcat != "undefined"){
                    compcat.each(function(){
                        var cat = $(this).data("mlab-category");
                        if ($(this).hasClass("ui-state-active")){
//Set coockie to save expand state of the accordians of the componentgroup
                            document.cookie="mlabCompCat" + cat + "=0; expires=Thu, 18 Dec 2053 12:00:00 UTC; path=/";
                        } else {
//Set coockie to save collapsed state of the accordians of the componentgroup
                            document.cookie="mlabCompCat" + cat + "=1; expires=Thu, 18 Dec 2053 12:00:00 UTC; path=/";
                        }
                    })
                }
            };

//now we load components, the go into a mlab object called components,
//and for each component we need to turn the text of the
            $.get( document.mlab_temp_vars.appbuilder_root_url + document.mlab_temp_vars.app_id  + "/load_components" , function( data ) {
                if (data.result === "success") {
//FLFL              var feature_list = $("<ul></ul>");
/*SPSP              var storage_plugin_list = $("<ul></ul>");*/
                    var loc = mlab.dt.api.getLocale();
                    mlab.dt.components = data.mlab_components;
                    mlab.dt.storage_plugins = {};
                    var components_html = {};
                    var features_html = [];
                    var additional_html = "";

                    for (type in mlab.dt.components) {
//we need to attach the code_dt.js content to an object so we can use it as JS code
                        if (mlab.dt.components[type].code !== false) {
                            eval("mlab.dt.components['" + type + "'].code = new function() { " + mlab.dt.components[type].code + "};");

//here we create the conf object inside the newly created code object, this way we can access the configuration details inside the code
                            mlab.dt.components[type].code.config = mlab.dt.components[type].conf;
                        }
                        var c = mlab.dt.components[type];
                        if (c.accessible && !(c.is_feature || c.is_storage_plugin)) {

//prepare the tooltips (regular/extended). Can be a string, in which use as is, or an key-value object, if key that equals mlab.dt.api.getLocale() is found use this, if not look for one called "default"
                            var tt = mlab.dt.api.getLocaleComponentMessage(type, ["tooltip"]);
                            var tte = mlab.dt.api.getLocaleComponentMessage(type, ["footer_tip"]);
                            var eName = mlab.dt.api.getLocaleComponentMessage(type, ["extended_name"]);

//the newline setting in the database 
                            if (typeof components_html[c.conf.category] == "undefined") {
                                components_html[c.conf.category] = [];
                            }                                

                            components_html[c.conf.category][parseInt(c.order_by)] = "<div data-mlab-type='" + type + "' " +
                                "onclick='mlab.dt.design.component_add(\"" + type + "\");' " +
                                "title='" + tt + "' " +
                                "class='mlab_button_components' " +
                                "style='background-image: url(\"" + mlab.dt.config.urls.component + type + "/" + mlab.dt.config.component_files.ICON + "\");'>" +
                                "</div>" + 
                                "<div class='mlab_component_footer_tip'>" +
                                        tte +
                                 "</div>";

                        } else if (c.accessible && c.is_feature) {

//all features are in a single div

                            features_html[parseInt(c.order_by)] = "<div data-mlab-type='" + type + "' " +
                                "onclick='mlab.dt.design.feature_add(\"" + type + "\");' " +
                                "title='" + tt + "' " +
                                "class='mlab_button_components' " +
                                "style='background-image: url(\"" + mlab.dt.config.urls.component + type + "/" + mlab.dt.config.component_files.ICON + "\");'>" +
                                "</div>" + 
                                "<div class='mlab_component_footer_tip'>" +
                                        tte +
                                 "</div>";

/*FLFL                      feature_list.append("<li data-mlab-feature-type='" + type + "' onclick='mlab.dt.design.feature_add(\"" + type + "\", false);' title='" + $('<div/>').text(eName).html() + "'>" + type.charAt(0).toUpperCase() + type.slice(1) + "</li>"); */
                        } else if (c.accessible && c.is_storage_plugin) {
                            mlab.dt.storage_plugins[type] = eName;
/*SPSP                      mlab.dt.storage_plugin_list.append("<li data-mlab-storage-plugin-type='" + type + "' onclick='mlab.dt.design.storage_plugin_add(\"" + type + "\", $(\".mlab_current_component\")[0]);' title='" + $('<div/>').text(eName).html() + "'>" + type.charAt(0).toUpperCase() + type.slice(1) + "</li>");*/
                        }
                    }
//gets a cookie by name/key                        
                   function getCookie(cname) {
                        var name = cname + "=";
                        var ca = document.cookie.split(';');
                        for(var i=0; i<ca.length; i++) {
                            var c = ca[i];
                            while (c.charAt(0)==' ') c = c.substring(1);
                            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
                        }
                        return 1;
                    }

//TODO now first category is hardcoded to be text...
//If the first category of components does not have a cookie it moste likely that none of the mlabCompCatxxx cookies are made (first time users or deleted cookies) - so set the first categroy to expand 
                    var cookieExsists = getCookie("mlabCompCattext");
                    if (cookieExsists === 1){
//Cookie for first category not found - set cookie so it will be expanded
                        document.cookie="mlabCompCattext=0; expires=Thu, 18 Dec 2053 12:00:00 UTC; path=/";
                    }

//Puts all components under the same category and adds an accordion to the categroy collapsed or expanded depending on the coockie state 
                    for  (category in components_html) {
                        var activeCat = Number(getCookie("mlabCompCat" + category));
                        $("<div><h3 data-mlab-category='" + category + "'>" + category + "</h3><div>" + components_html[category].join("") + "</div></div>").appendTo("#mlab_toolbar_components").accordion({
                            heightStyle: "content",
                            active: activeCat,
                            collapsible: true
                        });
                    } 

                    if (features_html.length != 0) {
//Adds Features as a category (with all the features - if there is any) under the component toolbar and and adds an accordion to the categroy                            
                       var activeCat = Number(getCookie("mlabCompCat" + "Features")); 
                       $("<div><h3 data-mlab-category='Features'>Features</h3><div>" + features_html.join("") + "</div></div>").appendTo("#mlab_toolbar_components").accordion({
                            heightStyle: "content",
                            active: activeCat,
                            collapsible: true
                        });
                    }

                    //$("#mlab_toolbar_components h3").accordion({ heightStyle: "content" });

//add the HTML generated in the component load loop above to their respecitve containers.
//FLFL                        $("#mlab_features_list").html(feature_list);
//SPSP                        $("#mlab_storage_plugin_list").html(storage_plugin_list);

//now loop through all components and for those that inherit another we transfer properties
                    mlab.dt.utils.process_inheritance(mlab.dt.components);

//finally we assign the API object to teh component, cannot do this earlier as it wolud otherwise create a loop to parents, etc 
//when trying to merge properties in the previous code block
                    for (index in mlab.dt.components) {
                        if (typeof mlab.dt.components[index].code != "undefined" && mlab.dt.components[index].code !== false) {
                            mlab.dt.components[index].code.api = mlab.dt.api;
                        }
                    }

//set the extended help text for the component in the footer
                     $(".mlab_button_components").mouseover(function(e){
                        $(".mlab_editor_footer_help").text(e.currentTarget.nextSibling.textContent);
                     });

                     $(".mlab_button_components").mouseout(function(e){
                        $(".mlab_editor_footer_help").text("");
                     });

//we always load pages using AJAX, this takes the parameters passed from the controller
                    mlab.dt.management.app_open( document.mlab_temp_vars.app_id, document.mlab_temp_vars.page_num );

//erase the temporary variable, this is used in inititalisation process only.
                    delete document.mlab_temp_vars;


//prepare the menu popup for the storage plugin selector
/*SPSP                        $("#mlab_button_select_storage_plugin").click( function(event) {
                        mlab.dt.api.closeAllPropertyDialogs();
                        var owner_element = event.currentTarget;
                        mlab.dt.api.properties_tooltip = $(owner_element).qtip({
                            solo: false,
                            content:    {text: $("#mlab_storage_plugin_list").clone(), title: _tr["mlab_editor.init.js.qtip.comp.storage.plugin.title"], button: true },
                            position:   { my: 'leftMiddle', at: 'rightMiddle', adjust: { screen: true } },
                            show:       { ready: true, modal: { on: true, blur: false } },
                            hide:       false,
                            events:     { hide: function(event, api) { api.destroy(); mlab.dt.api.properties_tooltip = false; } },
                            style:      { classes: "mlab_zindex_top_tooltip" }
                        });
                    } );*/

//add spinner to the statusbar to show when needed                   
                    $("#mlab_statusbar_progress_spin").spin('small', '#fff');

//assign click functions to tools
                    $("#mlab_button_up").on("click", function () { mlab.dt.design.component_moveup(); });
                    $("#mlab_button_down").on("click", function () { mlab.dt.design.component_movedown(); });
                    $("#mlab_button_delete").on("click", function () { mlab.dt.design.component_delete(); });
                    $("#mlab_button_help").on("click", function () { mlab.dt.design.component_help(); });
                    $("#mlab_button_cut_comp").on("click", function () { mlab.dt.design.component_cut(); });
                    $("#mlab_button_copy_comp").on("click", function () { mlab.dt.design.component_copy(); });
                    $("#mlab_button_paste_comp").on("click", function () { mlab.dt.design.component_paste(); });

                    $("#mlab_button_redo").on("click", function () { document.execCommand("redo"); });
                    $("#mlab_button_undo").on("click", function () { document.execCommand("undo"); });
                    
                    $("#mlab_page_control_title").on("click", function () {
                        mlab.dt.api.editContent(this);
                        $('#mlab_page_control_title_actions').show();
                        $('#mlab_page_control_title').attr('title', _tr["app.builder.page.tooltip.page.name.edit"]);
                    });

                    $("#mlab_page_control_save_title").on("click", function () {
                        $('#mlab_page_control_title_actions').hide(); 
                        $('#mlab_page_control_title').attr('title', _tr["app.builder.page.tooltip.page.name"]);
                        mlab.dt.management.page_update_title();
                    });

                    $("#mlab_page_control_cancel_title").on("click", function () {
                        $('#mlab_page_control_title_actions').hide(); 
                        $('#mlab_page_control_title').attr('title', _tr["app.builder.page.tooltip.page.name"]);
                        $('#mlab_page_control_title').text(mlab.dt.app.curr_pagetitle);
                    });
    
                    $("#mlab_page_control_new").on("click", function () { mlab.dt.management.page_new(); });
                    
                    $("#mlab_page_control_delete").on("click", function () { mlab.dt.management.page_delete(); });

                    $("#mlab_page_help").on("click", function () { page_help(event); });

//trun on and off footer help
                    $("#mlab_button_help").on("click", function () { mlab.dt.design.toggle_footer(); });


//Checkes if the editor menu icon is cliked
                    $("#mlab_editor_menu_dropdown").on("click",function(event) { 
                        if ($('#mlab_user_menu_dropdown_content').hasClass('mlab_show_user_dropdown')) {
//User menu is open and needs to be closed 
                            $('#mlab_user_menu_dropdown_content').toggleClass('mlab_show_user_dropdown'); 
                            $('#mlab_user_menu_dropdown').toggleClass('mlab_show_user_dropdown_tab_selected'); 
                        } 
//Toggles the Editor menu on and off
                        $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                        $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        event.stopPropagation(); 
                    });

//Checkes if the user menu icon is cliked
                    $("#mlab_user_menu_dropdown").on("click",function(event) { 
                        if ($('#mlab_editor_menu_dropdown_content').hasClass('mlab_show_editor_dropdown')) {
//Editor menu is open and needs to be closed 
                            $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                            $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        } 
//Toggles the User menu on and off
                        $('#mlab_user_menu_dropdown_content').toggleClass('mlab_show_user_dropdown'); 
                        $('#mlab_user_menu_dropdown').toggleClass('mlab_show_user_dropdown_tab_selected'); 
                        event.stopPropagation(); 
                    });

//Checkes if the page menu icon is cliked
                    $("#mlab_page_control_pagelist").on("click",function(event) { 
//User menu is open and needs to be closed 
                        $('#mlab_page_management').toggleClass('mlab_show');
                        event.stopPropagation(); 
                    });

//Listens for any click
                    $(document).on('click', function (event) {
// Checks if editor menu is open
                        if ($('#mlab_editor_menu_dropdown_content').hasClass('mlab_show_editor_dropdown')) {
//Editor menu is open - close it
                            $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                            $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        } 
                        
// Checks if user menu is open
                        if ($('#mlab_user_menu_dropdown_content').hasClass('mlab_show_user_dropdown')) {
//User menu is open - close it
                            $('#mlab_user_menu_dropdown_content').toggleClass('mlab_show_user_dropdown'); 
                            $('#mlab_user_menu_dropdown').toggleClass('mlab_show_user_dropdown_tab_selected'); 
                        } 
                        
// Checks if page menu is open
                        if ($('#mlab_page_management').hasClass('mlab_show')) {
//User menu is open and needs to be closed 
                            $('#mlab_page_management').toggleClass('mlab_show'); 
                        } 
                    });  

//save page button in the editor menu 
                    $("#mlab_page_save_all").on("click", function () { 
                        var temp; 
                        mlab.dt.management.page_save(temp, true); 
//Editor menu is open - close it
                        $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                        $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        return false; 
                    });


                    $("#mlab_button_select_storage_plugin").on("click", function () { 
                        var el = $(this).siblings("[data-mlab-get-info='storage_plugins']");
                        if( !el.is(":visible")) { 
                            el.html(mlab.dt.api.getStoragePluginList(mlab.dt.api.getSelectedComponent()));
                        }
                        el.slideToggle();
                    });
                    
                    $("#mlab_button_get_credentials").on("click", function () { mlab.dt.design.component_edit_credentials(); });

//prepare the menu popup for the component resizer
                    $("#mlab_button_component_size").click( function(event) {
                        mlab.dt.api.closeAllPropertyDialogs();
                        var owner_element = event.currentTarget;
                        mlab.dt.api.properties_tooltip = $(owner_element).qtip({
                            solo: false,
                            content:    {text: $("#mlab_component_size_list").clone(), title: _tr["mlab_editor.init.js.qtip.comp.size.title"], button: true },
                            position:   { my: 'leftMiddle', at: 'rightMiddle', adjust: { screen: true } },
                            show:       { ready: true, modal: { on: true, blur: false } },
                            hide:       false,
                            events:     { hide: function(event, api) { api.destroy(); mlab.dt.api.properties_tooltip = false; } },
                            style:      { classes: "mlab_zindex_top_tooltip" }
                        });

                    } );

//prepare the menu popup for the component aspect ratio selector
                    $("#mlab_button_component_aspect").click( function(event) {
                        mlab.dt.api.closeAllPropertyDialogs();
                        var owner_element = event.currentTarget;
                        mlab.dt.api.properties_tooltip = $(owner_element).qtip({
                            solo: false,
                            content:    {text: $("#mlab_component_aspect_list").clone(), title: _tr["mlab_editor.init.js.qtip.comp.aspect.title"], button: true },
                            position:   { my: 'leftMiddle', at: 'rightMiddle', adjust: { screen: true } },
                            show:       { ready: true, modal: { on: true, blur: false } },
                            hide:       false,
                            events:     { hide: function(event, api) { api.destroy(); mlab.dt.api.properties_tooltip = false; } },
                            style:      { classes: "mlab_zindex_top_tooltip" }
                        });

                    });

//prepare qtip for the download of app buttons
                    $.each(mlab.dt.config.compiler_service.supported_platforms, function(index, platform) {
                        $('#mlab_download_'+ platform + '_icon').qtip({
                            hide:{ delay:500, fixed:true },//give a small delay to allow the user t mouse over it.
                            content: {text: function(){ return $("[data-mlab-download-link-info='" + platform + "']").html()},
                            title: { text: _tr["mlab_editor.init.js.qtip.download.app.title"] + " " + platform } },
                            style: { classes: "mlab_qtip_tooltip mlab_qtip_menu_tooltip" }
                        });
                    });

// finally we connect to the websocket server, this returns data from server callback functions used when connectng to market or compiler services
                    var host = window.document.location.host.replace(/:.*/, '');
                    mlab.dt.services_web_socket = new WebSocket(mlab.dt.config.ws_socket.url_client + mlab.dt.config.ws_socket.path_client + '/' + mlab.dt.uid);

                    mlab.dt.services_web_socket.onmessage = function (event) {
                        data = JSON.parse(event.data);
                        switch (data.status) {

//1: When click on menu, then it should indicate that the app is requested ( mlab.dt.management.js  -  compiler: {  get_app :)
//2: When the request has been processed by the PHP backend it should indicate one stage has passed (? -  case "connected"?)
//3: Then it should indicate that precompilation has taken place (may not be required, so a numeric is not good) (case "precompilation")
//4: createApp is called, this creates the empty app (case "creating"....case "created"?)
//5: Then files are uploaded (lengthy) (case "uploading"? (hoppe vider på case "verifying" og  case "verification_ok"- tar tid----)
//6: App upload finished, compilation starts (case "compiling"...case "compilation_ok")
//7: App is being (case "receiving":)
//8: App is ready (case "ready")

//Sette en grå versjon av iconet om siste versjon er kopilert?
// kan Andoid og iOS kopileres på samme tid?
// hva om man lagrer en ny versjon mens kompiler

                            case "connected":
                                $("#mlab_progressbar").val(5);
                                $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.connected"]);
                                break;

                            case "creating":
                                $("#mlab_progressbar").val(10);
                                $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.creating"]);
                                //createApp is called, this creates the empty app
                                break;

                            case "created":
                                $("#mlab_progressbar").val(15);
                                $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.created"]);
                                break;

                            case "precompilation":
                                $("#mlab_progressbar").val(20);
                                $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.precompilation"]);
                                break;

                            case "uploading":
                                $("#mlab_progressbar").val(25);
                                $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.uploading"]);
                                break;

                            case "verifying":
                                $("#mlab_progressbar").val(30);
                                $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.verifying"]);
                                break;

                            case "verification_ok":
                                $("#mlab_progressbar").val(35);
                                $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.verification_ok"]);
                                break;

                            case "compiling":
                                $("#mlab_progressbar").val(40);
                                $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.compiling"]);
                                break;

                            case "compilation_ok":
                                $("#mlab_progressbar").val(80);
                                $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.compilation_ok"]);
                                break;

                            case "failed":
                            case "precompilation_failed":
                            case "compilation_failed":
                            case "verification_failed":
                            case "create_failed":
                                $("#mlab_statusbar_compiler").text("");
                                $("#mlab_download_" + data.platform + "_icon").removeClass('mlab_download_' + data.platform + '_icon_grey');
                                $("#mlab_download_" + data.platform + "_icon").find("img").hide();
                                $("#mlab_progressbar").hide();
                                mlab.dt.utils.update_status("temporary", data.fail_text, false);
                                break;

                            case "receiving":
                                $("#mlab_progressbar").val(90);
                                $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.receiving"]);
                                break;

                            case "ready":
                                $("#mlab_progressbar").val(100);
                                $("#mlab_statusbar_compiler").text("");
                                $("#mlab_download_" + data.platform + "_icon").removeClass('mlab_download_' + data.platform + '_icon_grey');
                                $("#mlab_download_" + data.platform + "_icon").find("img").hide();
                                $("#mlab_progressbar").hide();

//inserting the QR code and url to the compiled app in the menu
                                if (typeof data.filename != "undefined" && data.filename != null && data.filename != "") {
                                    mlab.dt.app.compiled_files[data.platform] = data.filename;
                                    var text = document.getElementsByTagName("base")[0].href.slice(0, -1) + "_compiled/" + data.filename;
                                    $("#mlab_download_qr_link_" + data.platform).empty().qrcode({text: text, size: 150, background: "#ffffff", foreground: "#000000", render : "table"});
                                    $("#mlab_download_link_" + data.platform).html("<b>URL</b>:</br>" + text);
                                    mlab.dt.utils.update_status("temporary", _tr["mlab_editor.init.js.compiling.ready"], false);
                                } else {
                                    mlab.dt.utils.update_status("temporary", _tr["mlab_editor.init.js.compiling.failed"], false);
                                }
                                //hvor lenge skal teksten stå??
                                break;

                                break;
                        }

                    };

                } else {
                    alert(_tr["mlab_editor.init.js.compiling.failed.loading.comps"]);
                    document.location.href = document.mlab_temp_vars.appbuilder_root_url;
                }
            });

        } else {
            alert(_tr["mlab_editor.init.js.compiling.failed.loading.var"]);
            document.location.href = document.mlab_temp_vars.appbuilder_root_url;
        }
    });

});
    
    
