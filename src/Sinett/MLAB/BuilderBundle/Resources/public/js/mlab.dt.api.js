/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no) additional functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract API functions for use by components at design time (i.e. in the MLAB editor).
 * @abstract Used to obtain info such as paths, to display user input requests or to store data, etc.
 * @returns {Mlab_dt_api}
 * @constructor
 */
function Mlab_dt_api () {
    this.storage = new Object();
    this.version = 0.9;
    this.properties_tooltip = false;
};

/**
 * Initialise the different functions.
 * @type type
 */
Mlab_dt_api.prototype = {

/*
 * Symfony allows us to redfine URLs at any time using the route functionality, so we should avoid fixed URLs.
 * They are therefor always stored in variables picked up from the server, using an AJAX call to the load_variable URL.
 * Below are wrapper functions to obtain them from the internal variables.
 */

/**
 * Requests for the absolute URL to where apps are stored, we work wth the /wwwork directory inside here.
 * Used to load pages in an app, and related CSS/JS/media files.
 * @returns {String.origin|Location.origin|Mlab_dt_api.parent.config.urls.app}
 */
    getUrlAppAbsolute : function () {
        return window.location.origin + this.parent.config.urls.app;
    },

/**
 * Requests for the relative URL to where apps are stored, we work wth the /wwwork directory inside here
 * Used to load pages in an app, and related CSS/JS/media files
 * @returns {Mlab_dt_api.parent.config.urls.app}
 */
    getUrlAppRelative : function () {
        return this.parent.config.urls.app;
    },

/**
 * Requests for the absolute URL to where components are stored.
 * Used to load components when designing an app (components consist of configuration file and JS code)
 * and related CSS/JS/media files.
 * @returns {Mlab_dt_api.parent.config.urls.component|String.origin|Location.origin}
 */
    getUrlComponentAbsolute : function () {
        return window.location.origin + this.parent.config.urls.component;
    },

/**
 * Requests for the relative URL to where components are stored.
 * Used to load components when designing an app (components consist of configuration file and JS code).
 * and related CSS/JS/media files.
 * @returns {Mlab_dt_api.parent.config.urls.component}
 */
    getUrlComponentRelative : function () {
        return this.parent.config.urls.component;
    },

/**
 * Requests for the absolute URL to where templates are stored.
 * Not really used much by the MLAB editor front end, the files are usually copied on the server.
 * However we have it here for completeness.
 * @returns {String.origin|Location.origin|Mlab_dt_api.parent.config.urls.template}
 */
    getUrlTemplateAbsolute : function () {
        return window.location.origin + this.parent.config.urls.template;
    },

/**
 * Requests for the relative URL to where templates are stored.
 * Not really used much by the MLAB editor front end, the files are usually copied on the server.
 * However we have it here for completeness.
 * @returns {Mlab_dt_api.parent.config.urls.template}
 */
    getUrlTemplateRelative : function () {
        return this.parent.config.urls.template;
    },

/**
 * Requests for the absolute URL used to upload files, used by components that let users use own files, 
 * such a image component, video player, etc.
 * @param {string} comp_id is the unique ID of the component, for instance img or video
 * @returns {Mlab_dt_api.prototype@pro;parent@pro;urls@pro;component_upload_file@call;replace@call;replace|String.origin|Location.origin}
 */
    getUrlUploadAbsolute : function (comp_id) {
        return window.location.origin + this.parent.urls.component_upload_file.replace("_APPID_", this.parent.app.id).replace("_COMPID_", comp_id);
    },

/**
 * Requests for the absolute URL used to upload files, used by components that let users use own files, 
 * such a image component, video player, etc.
 * @param {string} comp_id is the unique ID of the component, for instance img or video
 * @returns {Mlab_dt_api.prototype@pro;parent@pro;urls@pro;component_upload_file@call;replace@call;replace}
 */
    getUrlUploadRelative : function (comp_id) {
        return this.parent.urls.component_upload_file.replace("_APPID_", this.parent.app.id).replace("_FILETYPES_", comp_id);
    },
    
/**
 * This will return a list in HTML format of all the available storage plugins
 * Each plugin will have an onclick event
 * @param {component} jquery element, the current selected component
 */
    getStoragePluginList: function (component) {
        var storage_plugin_list = $("<ul></ul>");
        var sel_class = "";
        var selected_plugin;
        var that = this;

//find out if the component has a currently selected storage plugin
        var existing_storage_plugin = mlab.dt.api.getVariable(component, "storage_plugin");
        if (existing_storage_plugin && existing_storage_plugin.name) {
            selected_plugin = existing_storage_plugin.name;
        }
    //component.conf.storage_plugins 
    //Hvis true så skal alle pluggins lastes - ellers skal de som er listet lastes
        for (type in this.parent.storage_plugins) {
            if (type == selected_plugin) {
                sel_class = " class='mlab_item_applied' data-mlab-selected-storage='true' "; 
            } else {
                sel_class = "";
            }
            storage_plugin_list.append("<li data-mlab-storage-plugin-type='" + type + "' " + sel_class + " title='" + $('<div/>').text(this.parent.storage_plugins[type]).html() + "'>" 
                                  //bare vise om pluginen trenger credentials...
                                        + "<img data-mlab-comp-tool='credentials' class='mlab_tools mlab_tools_space' src='/img/tools/credentials.png' title='qqq'>" 
                                        + "<span>" + type.charAt(0).toUpperCase() + type.slice(1)   + "</span>"                  
                                        + "</li>");
        }
        
        storage_plugin_list.find("img").on("click", function () { 
                var this_storage_plugin_id = $(this).parent().data("mlab-storage-plugin-type");
                var el = $("[data-mlab-get-info='storage_plugins'] [data-mlab-storage-plugin-type='" + this_storage_plugin_id + "']");
                that.getCredentials(el, this_storage_plugin_id, that.parent.components[this_storage_plugin_id].conf.credentials, that.parent.design.storage_plugin_store_credentials, true, { storage_plugin_id: this_storage_plugin_id, component: component });
        });
        
        storage_plugin_list.find("span").on("click", function () { 
                mlab.dt.design.storage_plugin_setup( $(this), $(this).parent().data("mlab-storage-plugin-type"),  mlab.dt.api.getSelectedComponent() ); 
        });
        
        return storage_plugin_list;
        
    },
/**
 * Wrapper function which calls the back end to load component help, 
 * the backend checks for language selected and sees if there are language specific help file available, if not use generic one
 * @param {type} component: component object
 * @param {type} title: title of dlg box, string
 * @param {type} owner: HTML element that will own this Qtip
 * @returns {undefined}
 */

    displayExternalHelpfile: function (component_id, title, owner_element, qTipClass) {
        var qTipClasses = 'qtip-light mlab_dt_box_style mlab_zindex_top_tooltip';
        var url = this.parent.urls.component_helpfile.replace("_COMPID_", component_id);
        
        if (typeof qTipClass !== "undefined") { 
            qTipClasses = qTipClasses + " " + qTipClass;
        }
        $.getJSON(url, function(data) {
            if (data.result === "SUCCESS") {
                 $(owner_element).qtip({
                     solo: false,
                     content:    {
                                 text: data.html,
                                 title: title,
                                 button: true
                                 },
                     position:   { my: 'topRight', at: 'bottomMiddle', viewport: $(window), effect: false },
                     show:       { ready: true, modal: { on: false } },
                     hide:       false,
                     style:      { classes: qTipClasses, tip: true },
                     events:     {   hide: function(event, api) { api.destroy(); } }
                 });
            } else {
                alert(data.message);
            }

        })
        .fail(function() {
            alert( _tr["mlab.dt.design.js.alert.help.notfound"] );
        });
    },

/**
 * Returns a list of files already uploaded, non-async so we can return data to the calling function who may do any number of things with it.
 * @param {String} extensions
 * @returns {Array} list of options for select element
 */
    getMedia : function (file_type) {
        var data = $.ajax( {
            type: "GET",
            url: this.parent.urls.uploaded_files.replace("_APPID_", this.parent.app.id).replace("_FILETYPE_", file_type),
            async: false,
        } ).responseText;

        data = eval("(" + data + ")");
        if (data.result == "success") {
            return data.files;
        } else {
            return "<option>" + _tr["mlab.dt.api.js.getMedia.fail"] + "</option>";
        }
    },
    
/**
 * Returns a CSS style class name which utilises standard Mlab styles
 * properties = array of nouns describing what style they want
 */
     getStyle: function (properties) {
         var style = "";
         for (i in properties) {
             switch (properties[i]) {
                 case "text": 
                     style = style + "mc_text ";
                     break;
                     
                 case "imgtxt": 
                     style = style + "mc_picture_and_text";
                     break;
             }
         }
     },
     
     indicateWait : function (state) {
         if (state) {
            $("#mlab_editor").addClass("mlab_loading_info");
         } else {
             $("#mlab_editor").removeClass("mlab_loading_info");
         }
     },
/**
 * This is the function used by all components if they want to upload a file.
 * It uses the jquery uploadfile plugin: https://github.com/hayageek/jquery-upload-file
 * @param {type} el: DIV surrounding the component HTML
 * @param {type} cb: Callback function when file is uploaded successfully OR a file is selected
 * @returns {undefined}
 */
    uploadMedia : function (el, component_config, file_type, cb, event, multi) {
        
//store for later when callbacks are executed in different contexts
        var that = this;
        var that_qtip = null;
        
//first some utility functions

//generate the form used to upload files on the fly
        function local_prepare_form_html() {
            content = $('<form />', {"id": "mlab_dt_form_upload" } );
            content.append( $('<p />',      {                                          class: "mlab_dt_text_info",                  text: _tr["mlab.dt.api.js.uploadMedia.qtip.content.1"] }) );
            content.append( $('<select />', { id: "mlab_cp_select_file",               class: "mlab_dt_select" }) );
            content.append( $('<div />',    { id: "mlab_cp_mediaupload_uploadfiles",   class: "mlab_dt_picture mlab_dt_left" }) );
            content.append( $('<div />',    {                                          class: "mlab_dt_tiny_new_line",             html: "&nbsp;" }) );
            content.append( $('<div />',    { id: "mlab_cp_mediaupload_button_cancel", class: "mlab_dt_button_cancel mlab_dt_left", text: _tr["mlab.dt.api.js.uploadMedia.qtip.content.4"] }) );
            content.append( $('<div />',    { id: "mlab_cp_mediaupload_button_ok",     class: "mlab_dt_button_ok mlab_dt_left",     text: _tr["mlab.dt.api.js.uploadMedia.qtip.content.5"] }) );
//            content.append( $('<img />',    { id: "mlab_cp_mediaupload_spinner",       class: "right",                                                               src:  "/img/spinner.gif" }) );
            return content;
        }
        
        function local_set_media_source_existing () {
            cb(el, $("#mlab_cp_select_file").val()); 
            that.setDirty();
            that.closeAllPropertyDialogs();
        }
        
        function local_set_media_source (url) {
            cb(el, url); 
            that.setDirty();
            that.closeAllPropertyDialogs();
        }
        
/**
 * This function displays the tooltip DIV that will contain the HTML elements required to select a file for upload.
 * @param {type} event
 * @param {type} api
 * @returns {Mlab_dt_api.prototype.uploadMedia.local_render_tooltip}
 */
        function local_render_tooltip(event, api) {
            that.indicateWait(true);
            that_qtip = this;
            
            this.dt_component = el;
            this.dt_component_id = component_config.name;
            this.dt_config = component_config;
            this.dt_cb = cb;
            
//load existing files into dropdown box and make it ddslick
            var existing_files = that.getMedia(file_type);

            $("#mlab_cp_select_file").html(existing_files)
                                     .on("change", local_set_media_source_existing)
                                     .ddslick({
                                         width: 254,
                                         height: 64,
                                         imagePosition: "left",
                                         selectText: "Select existing media file to use" });


//prepare upload files jquery plugin
            var uploadObj = $("#mlab_cp_mediaupload_uploadfiles").uploadFile({
                url: that.getUrlUploadAbsolute(that_qtip.dt_config.name),
                formData: { comp_id: that_qtip.dt_component_id, app_path: that.parent.app.path },
                multiple: (multi === true),
                dragDrop: true,
                showCancel: true,
                showAbort: true,
                showDone: true,
                autoSubmit: false,
                fileName: "mlab_files",
                showStatusAfterSuccess: true,
                showPreview:true,
                previewHeight: "100px",
                previewWidth: "100px", 
                statusBarWidth:254,
                dragdropWidth:254,
                onSuccess: function(files, data, xhr) {
                            if (data.result == "failure") {
                                alert(data.msg);
                            } else {
                                local_set_media_source(data.urls[0]);
                                mlab.dt.api.closeAllPropertyDialogs();
                            }
                    }.bind(that_qtip.dt_component),
                onError: function(files, status, errMsg) { alert(errMsg); }
            });
            
//assign close events and add mlab styles
            $('#mlab_cp_mediaupload_button_ok').on("click", function(e) { uploadObj.startUpload(); }.bind(that_qtip.dt_component) );
            $('#mlab_cp_mediaupload_button_cancel').on("click", function(e) { api.hide(e); }.bind(that_qtip.dt_component) );
            $('.new_but_line').addClass('mlab_dt_button_new_line');
            $('.new_big_line').addClass('mlab_dt_large_new_line');
            $('.new_small_line').addClass('mlab_dt_small_new_line');
            $('.info').addClass('mlab_dt_text_info');
            $('.ajax-file-upload-filename').addClass('mlab_dt_text_filename');
            $('.ajax-file-upload-statusbar').addClass('mlab_dt_progress_bar');


            that.indicateWait(false);
        } // end local_render_tooltip
        

//code that is executed when this function is called
//
//can be called from element or in response to event click, this decides who should "own" this tooltip
        var owner_element = (typeof event != "undefined") ? event.currentTarget : el;

//the meat of this function, displaying the tooltip
        that_qtip = this.properties_tooltip = $(owner_element).qtip({
            solo:       false,
            content:    { text: local_prepare_form_html(), title: _tr["mlab.dt.api.js.uploadMedia.qtip.title"] },
            position:   { my: 'leftMiddle', at: 'rightMiddle', viewport: $(window) },
            show:       { ready: true, modal: { on: true, blur: false } },
            hide:       false,
            style:      { classes: 'qtip-light mlab_zindex_top_tooltip', tip: true },
            events:     {
                          render: local_render_tooltip,
                          show: function(event, api) { api.focus(event); },
                          hide: function(event, api) { api.destroy(); that.properties_tooltip = false; 
                        }
            }
        });
        


    },
    
/**
 * Creates a unique ID starting with the prefix mlab_, followed by a rfc4122 version 4 compliant GUID. 
 * This is typically used to create an ID for a component that must not clash with any other IDs.
 * @returns {String}
 */
    getGUID : function () {
        return 'mlab_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    },

/**
 * Goes through a newly loaded page and checks if any of the components on the page requires a library (CSS/JS) to be loaded
 * calls getLibraries for the actual hard lifting, this is just a wrapper
 * @returns {Number}
 */
    getAllLibraries : function () {
        var processed_component = [];
        var comp_id;
        var that = this;
        $( "#" + this.getEditorElement()).children("[data-mlab-type]").each( function() {
            comp_id = $(this).data("mlab-type") ;
            if (processed_component.indexOf(comp_id) < 0) {
                that.getLibraries(comp_id);
                processed_component.push(comp_id)
            }
        });
    },

//if = true we call component_add_html to complete the adding of the components
    getScriptFiles : function (scripts, process_adding_code, comp_id) {
        var next_script = scripts.shift();
        var that = this;
        $.ajaxSetup({ cache: true });
        $.getScript(next_script).done(function( script, textStatus ) {
            if (scripts.length > 0) {
                return that.getScriptFiles(scripts, process_adding_code, comp_id);
            }
            $.ajaxSetup({ cache: false });
            if (process_adding_code === true) {
                mlab.dt.design.component_add_html(comp_id);
            }
            return true;
        }).fail(function( jqxhr, settings, exception ) {
            alert( "Unable to load script: " +  next_script + ". Component not added, please check network connection");
            $.ajaxSetup({ cache: false });
            return false;
        });
    },

/**
 * Loads all js/css files required by a component at design time.
 * Files loaded are specified in the conf.yml parameter required_libs.
 * @param {string} comp_id, the unique ID for the component that needs to load the files
 * @returns {undefined}
 */
    getLibraries : function (comp_id, process_adding_code) {
        var js_stack = [];
        if ("required_libs" in this.parent.components[comp_id].conf) {
            if ("designtime" in this.parent.components[comp_id].conf.required_libs) {
                var comp_url = window.location.origin + this.parent.urls.components_root_url;
                var comp_path = this.parent.components[comp_id].conf.name;

                for (i in this.parent.components[comp_id].conf.required_libs.designtime) {
                    var file = this.parent.components[comp_id].conf.required_libs.designtime[i];
                    var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/ ;
                    
//has full URL including protocol, i.e. it is remote
                    if (regexp.test(file)) {
                        if (file.substr(-3) == ".js") {
                            if ($("script[src*='" + file + "']").length < 1) {
                                js_stack.push(file);
                            }
                        } else {
                            if ($("link[href*='" + file + "']").length < 1) {
                                $("head").append($("<link rel='stylesheet' type='text/css' href='" + file +"' >"));
                            }
                        }
                        
//"local", i.e. file that is part of Mlab a component 
                    } else if (file.substr(-3) == ".js") {
                        js_stack.push(comp_url + comp_path + "/js/" + file);
                    } else if (file.substr(-4) == ".css") {
                        if ($("link[href*='" + file + "']").length < 1) {
                            $("head").append($("<link rel='stylesheet' type='text/css' href='" + comp_url + comp_path + "/css/" + file +"' >"));
                        }
                    }
                }
                
                if (js_stack.length > 0 ) {
                    this.getScriptFiles(js_stack, process_adding_code, comp_id);
                    return;
                }
            }
        }
        if (process_adding_code === true) {
            mlab.dt.design.component_add_html(comp_id);
        }        
    },

/**
 * Get api version for designtime API, different from runtime API version (which is anyway a different file/object).
 * @returns {Number}
 */
    getVersion : function () {
        return this.version;
    },

/**
 * Get currently selected component (the DIV, not the internal HTML code).
 * @returns {jQuery object that represents the DIV surrounding the component}
 */
    getSelectedComponent : function () {
        return $('.mlab_current_component');
    },

/**
 * Set the global dirty flag, this tells the page_save function that the page needs to be updated on the server.
 * @returns {undefined}
 */
    setDirty : function () {
        this.parent.flag_dirty = true;
    },

/**
 * Clear the global dirty flag
 * @returns {undefined}
 */
    clearDirty : function () {
        this.parent.flag_dirty = false;
    },

/**
 * Get the ID of the DIV that is the container for the editable area. 
 * The string name is specified in the parameter.yml file and can be changed, but there really is no reason to do this.
 * @returns {String: Mlab_dt_api.parent.config.content_id}
 */
    getEditorElement : function () {
        return this.parent.config.app.content_id;
    },

/**
 * Simple wrapper function which will ensure that the jQuery plugin qtip2 is closed.
 * @returns {undefined}
 */
    closeAllPropertyDialogs : function () {
        if (this.properties_tooltip) {
            $(this.properties_tooltip).qtip('hide');
        }
    },
    
    executeCallback : function (func, el, event, api) {
        if (typeof func == "undefined" || func == null) {
            return;
        }
        func(el, event, api);
    },

/**
 * Displays the property input dialog for the specified component. 
 * This uses the jQuery plugin qtip2 for the actual dialog, and fills it with the specified content.
 * The component is reponsible for adding buttons such as Cancel and OK with callback to relevant functions in the component.
 * @param {jQuery DOM element} el, the component that the dialdisplayPropertyDialogog should be attached to
 * @param {string} title
 * @param {HTML string} content, valid HTML5
 * @param {function object} func_render, callback function when the property dialog is created, can be used to manipulate dialog, add content, etc.
 * @param {function object} func_visible, callback function when the property dialog is visible
 * @param {function object} func_hide currently unused
 * @returns {undefined}
 */
    displayPropertyDialog : function (el, title, content, func_render, func_visible, func_hide, focus_selector, wide, event) {
        this.indicateWait(true);
        this.closeAllPropertyDialogs();
        that = this;
        var c = 'mlab_property_dlg qtip-light mlab_dt_box_style mlab_zindex_top_tooltip';
        if (wide == true) { 
            c = c + ' mlab_dt_wide_qtip_box ';
        };
            
        if (typeof event != "undefined") {
            var owner_element = event.currentTarget;
        } else {
            var owner_element = el;
        }
        
        var curr_comp = $(".mlab_current_component");
        //set the qTips posistion after where it is placed in the window 
        var myPosQtip = 'leftMiddle';
        //var eTop = curr_comp.top; //get the offset top of the element
        var eTop = curr_comp.offset().top; //get the offset top of the element
        //eTop = eTop - $(window).scrollTop();
        if( eTop <= 145 ){
            myPosQtip = 'leftTop';
        }
        
        that.properties_tooltip = $(owner_element).qtip({
            solo: false,
            content:    {text: content, title: title, button: true },
            position:   { my: myPosQtip, at: 'rightMiddle', viewport: $(window) },
            show:       { ready: true, modal: { on: true, blur: false, escape: false }, autofocus: focus_selector },
            hide:       false,
            style:      { classes: c, tip: true },
            events:     {   render: function(event, api) { if (func_render) { that.executeCallback (func_render, el, event, api) } },
                            show: function(event, api) { $('.qtip-title').append('<img class="mlab_dt_button_help" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiZCAAWNk5BICUAxAboEld+P3zxwYGcgHIYCBuAOL3QPwfB74PxAn4zGHE4+r9WFyNCywA+iYRmwQzFQwHAQNmFhaFf3//bESXYMKieD6JhsNAAtBxDsRY4IDDgAegoADiA3gsyScmch2wROx8NDUGuCKflBS0H6ppPw41+8m2AM03AljEDXAk2/cMlACgAQqg4MKTL+YTlQ9wGG4ATb4COJR8AGJDYH54QCgVkWu4I7rhRFsABP14DF8AdfkFoosKLD7AlToSgQYvILksItKCA0DDHQnpJTaIsHl/IsMoQI4DLLiBGL1MtHbcqAUEAQuR6hqxZTRiNAIEGADaemUuXgZoWQAAAABJRU5ErkJggg==">'); },            
                            hide: function(event, api) { if (func_hide) { that.executeCallback (func_hide, el, event, api) }; api.destroy(); that.properties_tooltip = false; },
                            visible: function(event, api) { if (func_visible) { that.executeCallback (func_visible, el, event, api) } } 
                        }
        });
        this.indicateWait(false);
    },
    
/**
 * Displays the help text, loaded via AJAX from 
 * @param {string} title
 * @param {HTML string} content, valid HTML5
 * @param {function object} func_render, callback function when the property dialog is created, can be used to manipulate dialog, add content, etc.
 * @param {function object} func_visible, callback function when the property dialog is visible
 * @param {function object} func_hide currently unused
 * @returns {undefined}
 */
    displayHtmlPageInDialog : function (el, title, htmlpage, qTipClass) {
        var styleClasses = 'qtip-light mlab_dt_box_style mlab_zindex_top_tooltip';
        if (typeof qTipClass != "undefined") { 
            var styleClasses = styleClasses + " " + qTipClass;
        }
         
        $(el).qtip({
            solo: false,
            content:    {
                        text: htmlpage,
                        title: title,
                        button: true
                        },
            position:   { my: 'topRight', at: 'bottomMiddle', viewport: $(window), effect: false },
            show:       { ready: true, modal: { on: false} },
            hide:       false,
            style:      { classes: styleClasses, tip: true },
            events:     { hide: function(event, api) { api.destroy(); }, render: function() { $(".mlab_help_icon").qtip().elements.tooltip.draggable(); } }
        });
    },

/**
 * Makes currently the socified component editable, using the HTML5 contenteditable attribute.
 * Only works on text elements, such as heading or paragraph
 * @param {jQuery DOM element} el
 * @returns {undefined}
 */
    editContent : function (el) {
        $(el).attr('contenteditable', 'true').focus();
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents($(el)[0]);
        sel.removeAllRanges();
        sel.addRange(range);
    },
    
/**
 * Returns the locale (for instance nb_NO) as specified in the backend Symfony environment.
 * Loaded as a temporary variable on initial MLAB editor page load as it has to be passed from the backend.
 * @returns {Mlab_dt_api.parent.parent.locale}
 */
    getLocale: function() {
        return this.parent.parent.locale;
    },

/**
 * Returns the string from a component as specified by the msg_key and msg_subkey 
 * This is a string that is entered into the conf.yml, it can be a tooltip or generic messages
 * If the key points to a string we just return the string, if it is an object, and it has an object named the same as the current locale,
 * then it returns this locale string, otherwise looks for one called default. If neither found, return empty
 * @param {type} comp_id
 * @param {string array} keys
 * @returns {string}
 */
    getLocaleComponentMessage: function(comp_id, keys) {
        var loc = this.getLocale();
        var obj = this.parent.components[comp_id].conf;
        var found_at_all = false;
        
        for (i in keys) {
            if (keys[i] in obj) {
                found_at_all = true;
                obj = obj[keys[i]];
            } else {
                found_at_all = false;
                break;
            }
        }
        
//does key exist at all?
        if (!found_at_all) {
            return "";
            
//key was found, now ned to see if it is a string or array of strings, and if our locale is present in object
        } else {
            if (typeof obj != "object") {
                return obj;
            } else if (loc in obj) {
                return obj[loc];
            } else if ("default" in obj) {
                return obj["default"];
            } else {
                return "";
            }            
        }
    },

    
/**
 * Reads in the Javascript values stored for the specified element, extracts the value of the key specified.
 * This only works on top level vars, further processing must be done inside the JS code for the component.
 * 
 * Variables are stored in a <script> of type application/json as stringified JSON, on the same level as the main component HTML5 code.
 * These are all contained within a wrapper DIV that is the actual DOM element ppassed to this function.
 * @param {jQuery DOM element} el
 * @param {string} key, the key name in the object
 * @returns {Mlab_dt_api.prototype.getVariable.vars|Array|Object}
 */
    getVariable: function (el, key) {
        var json = $(el).find("script.mlab_storage").html();
        if (typeof json == "undefined"  || json == "") {
            return ;
        }
        try {
            var vars = JSON.parse(json);
        } catch(e) {
            console.log(e);
            return ;
        }
        
        return vars[key];
    },
    
/**
 * Reads in the Javascript values stored for the specified element, and returns it as a single JS object
 * 
 * Variables are stored in a <script> of type application/json as stringified JSON, on the same level as the main component HTML5 code.
 * These are all contained within a wrapper DIV that is the actual DOM element ppassed to this function.
 * @param {jQuery DOM element} el
 * @returns {Mlab_dt_api.prototype.getAllVariables.vars|Array|Object}
 */
    getAllVariables: function (el) {
        var json = $(el).find("script.mlab_storage").html();
        if (typeof json == "undefined"  || json == "") {
            return ;
        }
        try {
            var vars = JSON.parse(json);
        } catch(e) {
            console.log(e);
            return ;
        }
        
        return vars;
    },
    
    getTempVariable: function (comp, key) {
        if (typeof document.mlab_dt_storage == "undefined") {
            return;
        }
        if (typeof document.mlab_dt_storage[comp] == "undefined") {
            return;
        }
        if (typeof document.mlab_dt_storage[comp][key] == "undefined") {
            return;
        }
        
        return document.mlab_dt_storage[comp][key];
    },

//writes the javascript value and stores it for the specified element
/**
 * Stores a Javascript value for the specified element.
 * This only works on top level vars, but the value can be an object which in effect gives lower level storage posibilities.
 * 
 * Variables are stored in a <script> of type application/json as stringified JSON, on the same level as the main component HTML5 code.
 * These are all contained within a wrapper DIV that is the actual DOM element passed to this function.
 * @param {jQuery DOM element} el
 * @param {string} key, the key name in the object
 * @param {anything} value
 * @returns {Boolean}
 */
    setVariable: function (el, key, value) {
        var scrpt = $(el).find("script.mlab_storage");
        if (scrpt.length < 1) {
            $(el).append("<script type='application/json' class='mlab_storage' />");
            var vars = new Object();
            
        } else {
            var json = scrpt.html();
            if (json != "") {
                try {
                    var vars = JSON.parse(json);
                } catch(e) {
                    console.log(e);
                    var vars = new Object();
                }
            } else {
                var vars = new Object();
            }
            
        }
        
        vars[key] = value;
        $(el).find("script.mlab_storage").html(JSON.stringify(vars));
        this.setDirty();
        return true;
    },
    
/**
 * Overwrites all variables for the specified element, complementary to the setVariable function
 * 
 * Variables are stored in a <script> of type application/json as stringified JSON, on the same level as the main component HTML5 code.
 * These are all contained within a wrapper DIV that is the actual DOM element passed to this function.
 * @param {jQuery DOM element} el
 * @param {anything} values to be stores
 * @returns {Boolean}
 */
    setAllVariables: function (el, values) {
        
        var scrpt = $(el).find("script.mlab_storage");
        if (scrpt.length < 1) {
            $(el).append("<script type='application/json' class='mlab_storage' />");
        }         

        $(el).find("script.mlab_storage").html(JSON.stringify(values));
        this.setDirty();
        return true;
    },
    
/**
 * This function stores things for the current session (i.e. the lifetime of this webpage) 
 * @param {object} comp, the name of the component
 * @param {object} key, key to index, the component must itself ensure that this is unique, for instance by using "xxxx" + my_unique_id
 * @param {object} value
 * @returns {undefined}
 */
    setTempVariable: function (comp, key, value) {
        if (typeof document.mlab_dt_storage == "undefined") {
            document.mlab_dt_storage = {};
        }
        if (typeof document.mlab_dt_storage[comp] == "undefined") {
            document.mlab_dt_storage[comp] = {};
        }
        if (typeof document.mlab_dt_storage[comp][key] == "undefined") {
            document.mlab_dt_storage[comp][key] = {};
        }

        document.mlab_dt_storage[comp][key] = value;
    },
    
/**
 * This updates the script for a control, this is write only as it should always be generated from user input and variables!
 * It therefore also always replaces existing content in the script element
 * @param {jQuery DOM element} el
 * @param {text} code, any Javascript compatible statements
 * @returns {Boolean}
 */
    setScript: function (el, code) {
        var scrpt = $(el).find("script.mlab_code");
        if (scrpt.length > 0) {
            scrpt.remove();
        } 
        
        scrpt = document.createElement("script");
        scrpt.type = "text/javascript";
        scrpt.className = "mlab_code";
        scrpt.text = code;
        $(el).append(scrpt);
        
        return true;
    },
    
/***
 * Utility function to get the A element parent of a selection area
 * @returns {String|Boolean}
 */
    getSelTextParentLinkElement: function () {
        var el, sel, node;
        sel = window.getSelection();
        if (sel.rangeCount) {
            el = sel.getRangeAt(0).commonAncestorContainer;
            node = el.nodeName.toLowerCase();
            while (node != 'a' && node != "body") {
                el = el.parentNode;
                node = el.nodeName.toLowerCase();
            }
        }
        
        if (node == 'a') {
            return el;
        } else {
            return false;
        }
    },

/***
 * Utility function to check that the current selection is inside the current mlab component
 * @returns {String|Boolean}
 */
    checkSelTextValid: function () {
        debugger;
        var el, sel, node;
        sel = window.getSelection();
        if (sel.toString() != "") {
            el = sel.getRangeAt(0).commonAncestorContainer;
            debugger;
            if ($(el).hasClass("mlab_current_component") || $(el).parents("div.mlab_current_component").length > 0) {
                return true;
            }
        }
        
        return false;
    },

/**
 * 
 * Links to pages must use the api call navigation.pageDisplay, links to external pages must use _new as the target value.
 * @param {type} link
 * @returns {Boolean}
 */
    updateLink: function (link) {
        var link_type = $("input:radio[name=mlab_dt_getlink_choice]:checked").val();
        var link = "";
        var page_name;

        if (link_type == "page") {
            link = $("#mlab_dt_link_app_pages").val();
            var num = parseInt(link);
            if (num >= 0 && num < 1000) {
                $(".mlab_current_component").find("a[href=MLAB_DT_LINK_TEMP]").attr("href", "#").attr("onclick", 'mlab.api.navigation.pageDisplay(' + num + '); return false;');
            } else {
                alert(_tr["mlab.dt.api.js.getLink.alert_no_page"]);
                return false;
            }
            
        } else if (link_type == "url") {
            link = $("#mlab_dt_link_app_url").val();
            if (/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(link)) {
                page_name = link.trim();
                $(".mlab_current_component").find("a[href=MLAB_DT_LINK_TEMP]").attr("href", page_name);
            } else {
                alert(_tr["mlab.dt.api.js.getLink.alert_url_wrong"]);
                return false;
            }
            
        } else {
            alert(_tr["mlab.dt.api.js.getLink.alert_choose_type"]);
            return false;
            
        }
        
        return true;
    },
        
/**
 * Asks a user for a link either to a external page or to a page in the current app.
 * The actual link is created in updateLink above
 * @returns {Boolean|String}
 */
    setLink: function (el, event) {
//we must first of all check that som text is chosen inside the current component
        if (!this.checkSelTextValid()) {
            alert(_tr["mlab.dt.api.js.getLink.no_selection"]);
            return;
        }

//we need to create a temporary link straight away so that we can refer to it later, otherwise the selection will disappear.
        document.execCommand('createlink', false, "MLAB_DT_LINK_TEMP");
//we set a data tag, because we'll use an API call if they link to another page, etc
        $(".mlab_current_component").find("a[href=MLAB_DT_LINK_TEMP]").addClass('mc_link mc_text').attr('data-mlab-islink', 1).click(function(e) { e.preventDefault(); });

//we need to request the URL *OR* which page to link to
        var opt = "<option value='-1'></option>";
        for (page in mlab.dt.app.page_names) {
            opt = opt + "<option value='" + page + "'>" + mlab.dt.app.page_names[page] + "</option>";
        }
        var that = this;
        var content = $('<div id="mlab_dt_link_dialog">' + 
            '<br><label class="mlab_dt_label"><input type="radio" name="mlab_dt_getlink_choice" value="page" class="mlab_dt_input">' + _tr["mlab.dt.api.js.getLink.app_page"] + '</label><br>' + 
            '<select id="mlab_dt_link_app_pages" class="mlab_dt_select">' + opt + '</select><br>' + 
            '<label class="mlab_dt_label"><input type="radio" name="mlab_dt_getlink_choice" value="url" class="mlab_dt_input">' + _tr["mlab.dt.api.js.getLink.url"] + '</label><br>' + 
            '<input type="text" id="mlab_dt_link_app_url" class="mlab_dt_input">' + '<br>' + 
          '</div>');
  
        content.append( '<button class="mlab_dt_button_ok mlab_dt_right" onclick=" if (that.updateLink()) {mlab.dt.api.closeAllPropertyDialogs();}">' + _tr["mlab.dt.api.js.getLink.ok"] + '</button>');
        content.append( '<button class="mlab_dt_button_cancel mlab_dt_right" onclick=" that.cancelLink();">' + _tr["mlab.dt.api.js.getLink.cancel"] + '</button>');

        var title = _tr["mlab.dt.api.js.getLink.heading"];
        
        this.displayPropertyDialog(el, title, content, function() {$(".qtip-close").on("click", that.cancelLink);}, null, null, null, false, event);
        
    },
    

// remove the link from the currently selected text
    cancelLink: function () {
        $(".mlab_current_component").find("a[href=MLAB_DT_LINK_TEMP]").contents().unwrap();
        mlab.dt.api.closeAllPropertyDialogs();
    },
 
    removeLink: function () {
        //could use //document.execCommand("unlink", false, false);, but avoiding as does only remove links on selected area
        var link = this.getSelTextParentLinkElement();
        if (link) {
            if ($(link).parents("#mlab_editable_area").length > 0) {
                $(link).replaceWith( $(link).contents() );
            }
        }
    },
    

/**
  * Requests credentials such as login name and password (for instance, can also be URL to use, database name, etc)
  * These are all just treated as strings and returned as an array of strings. 
  * @param {type} el
  * @param {String} component_id
  * @param {type} credentials_required
  * @param {type} cb_function
  * @param {Boolean} edit - if true shows the credential dialogue
  * @param {type} params: this is a js object with key:value pairs, it will ALWAYS contain a paameter called component which is the Mlab component being worked on
  * @returns {Boolean|Array of strings}
 */
    getCredentials: function (el, component_id, credentials_required, cb_function, edit, params) {
        var default_cred_values = mlab.dt.components[component_id].conf.credential_values;
        var needinfo = false;
        var saved_cred_values = this.getVariable(params.component, "storage_plugin") ; //params.component is always set to the active Mlab component
        if (saved_cred_values) {
            saved_cred_values = saved_cred_values["credentials"];
        }
        
//if the values are already saved, either because the default was stored when adding storage plugin, 
//or because they since been edited or they are missing altogether then we need to request them
        if (saved_cred_values) {
            var cred_values = saved_cred_values;
            
//nothing saved, and default values exist, so we just save it
        } else if (default_cred_values) {
            for (credential in credentials_required) {
                if (!default_cred_values[credentials_required[credential]]) {
                    needinfo = true;
                }
            }
            var cred_values = default_cred_values;
                    
//have no data at all, need to request
        } else {
            needinfo = true;
            var cred_values = new Array();
            
        }
        if (needinfo || edit) {
            var dlg = $('<div />', {'id': "mlab_dt_dialog_credentials", title: _tr["mlab.dt.api.js.getCredentials.dlg.title"] } );
            dlg.append( $('<p />', {     text: _tr["mlab.dt.api.js.getCredentials.dlg.text"] , 
                                          'class': 'mlab_dt_text_info' } ) );
                                      
            for (credential in credentials_required) {   
                var credential_id = credentials_required[credential];
                
                dlg.append( $('<label />', { text: credential_id.charAt(0).toUpperCase() + credential_id.slice(1) , 
                                            'for': 'mlab_dt_dialog_credentials_' + credential_id , 
                                          'class': 'mlab_dt_short_label' } ) );
                dlg.append( $('<input />', { name: 'mlab_dt_dialog_credentials_' + credential_id , 
                                             'id': 'mlab_dt_dialog_credentials_' + credential_id , 
                                          'class': 'mlab_dt_input',
                                          'value': ( (typeof cred_values[credential_id] === 'undefined') ? "" : cred_values[credential_id] ) }) );       
            }

            dlg.append( $('<div class="mlab_dt_button_small_new_line">&nbsp;</div>') );
            dlg.append( $('<button class="mlab_dt_button mlab_dt_right">' + _tr["mlab.dt.api.js.getCredentials.dlg.save"] + '</button>') );
            dlg.find("button").on("click", function() {
                //TODO verify input here
                var credentials = {};
                for (credential in credentials_required) {
                    credentials[credentials_required[credential]] = $( "#mlab_dt_dialog_credentials_" + credentials_required[credential] ).val() ;
                }

                el.qtip('hide');
                cb_function(credentials, params);
            
            })
            this.displayPropertyDialog(el, _tr["mlab.dt.api.js.getCredentials.dlg.title"], dlg);
        } else {
            cb_function(cred_values, params);
        }
           
    }, // end getCredentials
    
/**
 * object with display functionality, primarily used for resizing and highlighting components
 * @type object
 */
    display: {
        
        setEditableFocus: function (el) {
            var sel = window.getSelection();
            var range = document.createRange();
            var html_el = el[0];
            if (el.text() != "") {
                range.setStart(html_el, 0);
                range.setEnd(html_el, 0);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                html_el.innerHTML = '\u00a0';
                range.selectNodeContents(html_el);
                sel.removeAllRanges();
                sel.addRange(range);
                document.execCommand('delete', false, null);
            }
        },
        
/**
 * Updates the aspect ratio setting for a component by updating the data-mlab-ratio setting
 * @param {type} el
 * @param {type} size
 * @returns {undefined}
 */
        setAspectRatio: function (el, aspect) {
            if (["4:3", "16:9", "1:1"].indexOf(aspect) > -1) {
                var wrapper = $(el).children(":first");
                if (typeof wrapper.data("mlab-sizer") == "undefined") {
                    $(el).children().wrapAll("<div data-mlab-sizer='1' data-mlab-size='medium'></div>");
                    wrapper = $(el).children(":first");
                }

                wrapper.attr("data-mlab-aspectratio", aspect);
                this.parent.closeAllPropertyDialogs();
                this.parent.setDirty();
                this.updateDisplay(wrapper);
            }
        },
        
/**
 * Updates the size setting for a component by updating the data-mlab-size setting
 * Initially this is small, medium, large and fullpage
 * @param {type} el
 * @param {type} size
 * @returns {undefined}
 */
        setSize: function (el, size) {
            if (["small", "medium", "large", "fullscreen"].indexOf(size) > -1) {
                var wrapper = $(el).children(":first");
                if (typeof wrapper.data("mlab-sizer") == "undefined") {
                    $(el).children().wrapAll("<div data-mlab-sizer='1' data-mlab-aspectratio='4:3'></div>");
                    wrapper = $(el).children(":first");
                }

                $(wrapper).attr("data-mlab-size", size);
                this.parent.closeAllPropertyDialogs();
                this.parent.setDirty();
                this.updateDisplay(wrapper);
            }
        },
        
/**
 * Updates either a single component, or all components on a page, using data attributes to determine the display
 * The DIV that is updated is an automatically inserted DIV with data-mlab-sizer='1'
 * @param {type} el: Optional, the element to display. If not specified, then update all components
 * @returns {undefined}
 */
        updateDisplay: function (el) {                      //was '[data-mlab-size][data-mlab-aspectratio]'
            var components = (typeof el == "undefined") ? $('[data-mlab-sizer]') : $(el);
            var that = this;
            components.each( function() {  
                var device_width = ($('[data-mlab-sizer="1"]').parent().width());
                var aspect_ratio = $(this).attr("data-mlab-aspectratio").split(":");
                var size = $(this).attr("data-mlab-size");
                var times = (size == "small") ? 0.33 : ((size == "medium") ? 0.67 : 1);
                var comp_id = $(this).parent().data("mlab-type");
     
                var w = (device_width * times);
                var h = (w / aspect_ratio[0]) * aspect_ratio[1];
                $(this).css( {"width": w + "px", "height": h + "px"} );
                
                if (typeof that.parent.parent.components[comp_id] != "undefined" && typeof that.parent.parent.components[comp_id].code != "undefined" && typeof that.parent.parent.components[comp_id].code.onResize != "undefined") {
                    that.parent.parent.components[comp_id].code.onResize(this);
                };
            });
        },
    
/**
 * This function takes a rgb color as a prameter and use it to return the inverted color
 *
 * @param String rgb
 * @returns String rgb
*/
        invertColor: function(rgbString) {
            if (typeof rgbString == "undefined") {
                return "rgb(255, 255, 255);";
            }
            var parts = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/),
                i;

            parts.splice(0, 1);
            for (i = 1; i < 3; ++i) {
                parts[i] = parseInt(parts[i], 10);
            }
            var rgb = 'rgb(';
            $.each(parts, function(i, item) {
                rgb += (255 - item) + ',';
            });
            rgb = rgb.slice(0, -1);
            rgb += ')';
            return rgb;
        },
    
/**
 * This function gets the background-color or inherited background-color of an element using jQuery 
 *
 * @param jqueryElement
 * @returns String rgb
*/
        getBackground: function(jqueryElement) {
            // Is current element's background color set?
            var color = jqueryElement.css("background-color");

            if (color !== 'rgba(0, 0, 0, 0)') {
                // if so then return that color
                return color;
            }

            // if not: are you at the body element?
            if (jqueryElement.is("body")) {
                // return known 'false' value
                return false;
            } else {
                // call getBackground with parent item
                return this.getBackground(jqueryElement.parent());
            }
        },
        
/**
 * Called when we leave a component, either because another one is added/pasted, or they select another component
 */
        componentBlur : function (el) {
            if (el.length == 0) {
                return;
            }
            el.qtip('hide');
            var comp_id= el.data("mlab-type")
            el.removeClass("mlab_current_component");
//same for any current sub components, such as a question in a quiz
            el.find("mlab_current_component").css("outline-color", "").removeClass("mlab_current_component");
            el.find(".mlab_current_component_editable").css("outline-color", "").removeClass("mlab_current_component_editable").attr("contenteditable", false);
            window.getSelection().removeAllRanges();
            el.find(".mlab_current_component_child").css("outline-color", "").removeClass("mlab_current_component_child");
            
            if (typeof mlab.dt.components[comp_id].code.onBlur != "undefined") {
                mlab.dt.components[comp_id].code.onBlur(el);
            }
            
        },
        
/**
 * Updates either a single component, or all components on a page, using data attributes to determine the display
 * @param {type} el: Optional, the element to display. If not specified, then update all components
 * @returns {true if selected different component, false otherwise}
 */   
        componentHighlightSelected : function (el) {
            var curComp = $( "#" + this.parent.getEditorElement() + "> div.mlab_current_component" );

            if (el[0] === curComp[0]) {
                return false;
            }          
            
//            if (el[0] !== curComp[0]) {
//Delete the outlines and tools for the last current component
                this.componentBlur(curComp);
                
//Set the new current component
                var pageBgColor = $("[data-role=page]").css( "background-color" );
//inverts the background color
                var pageBgColorInvert = this.invertColor(pageBgColor);
//set the invert color of the background as the border-color for the current selected component
                $( el ).css("outline-color", pageBgColorInvert);
                $( el ).addClass("mlab_current_component");
                return true;
/*            }

            return false;*/
        },
        
/**
 * Highlights controls that have child contols inside them
 * @param {type} sub_el: The element to display. If not specified, then update all components
 * @param {type} editable: Optional, the element to display. If not specified, then update all components
 */   
        componentHighlightSelectedChildren : function (sub_el, editable, override) {
            sub_el = $( sub_el );
            
            if (!$(".mlab_current_component").find(".mlab_current_component_child").is(sub_el) || override) {
                $(".mlab_current_component").find(".mlab_current_component_child").css("outline-color", "").removeClass("mlab_current_component_child");

//gets the childs background color
                var bgColorC = this.getBackground(sub_el);
//inverts the background color
                var bgColorCInvert = this.invertColor(bgColorC);
//set the invert color of the background as the outline-color for the current selected component
                sub_el.css("outline-color", bgColorCInvert);
//set the class to style the selected highlighted child             
                sub_el.addClass("mlab_current_component_child");   
            }
                
            if (typeof editable != "undefined") {
                editable = $( editable );
//if they have not re-clicked the current ditable element then we deselect old one and select new one
                if (!$(".mlab_current_component").find(".mlab_current_component_editable").is(editable)) {
                    $(".mlab_current_component").find(".mlab_current_component_editable").css("outline-color", "").removeClass("mlab_current_component_editable").attr("contenteditable", false);
                    if (typeof editable != "undefined" && editable.length > 0 && $(editable).prop("tagName").toLowerCase() != "input") {   
//gets the grandchilds background color
                        var bgColorGC = this.getBackground(editable);
//inverts the background color
                        var bgColorGCInvert = this.invertColor(bgColorGC);
//set the invert color of the background as the outline-color for the current selected component
                        editable.css("outline-color", bgColorGCInvert);

                        editable.addClass("mlab_current_component_editable").attr("contenteditable", true);
                    }
                }                
            }
        },      
    },

}

