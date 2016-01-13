/**
 * 
 * API functions for use by components at design time (i.e. in the MLAB editor).
 * Used to obtain info such as paths, to display user input requests or to store data, etc.
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
 * Returns a list of files already uploaded, non-async so we can return data to the calling function who may do any number of things with it.
 * @param {String} extensions
 * @returns {Array} list of options for select element
 */
    getMedia : function (extensions) {
        var data = $.ajax({
            type: "GET",
            url: this.parent.urls.uploaded_files.replace("_APPID_", this.parent.app.id).replace("_FILETYPES_", extensions),
            async: false,
        }).responseText;

        data = eval("(" + data + ")");
        if (data.result == "success") {
            return data.files;
        } else {
            return "<option>Unable to obtain files</option>";
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
 * 
 * @param {type} el: DIV surrounding the component HTML
 * @param {type} cb: Callback function when file is uploaded successfully OR a file is selected
 * @returns {undefined}
 */
    uploadMedia : function (el, component_config, file_extensions, cb, event) {
        this.indicateWait(true);
        content = $('<form />', {id: "mlab_dt_form_upload" } );
        content.append( $('<p />', { text: "Velg ønsket bilde fra listen eller klikk 'velg fil' for å søke frem et bilde", class: "mlab_dt_text_info" }) );
        content.append( $('<select id="mlab_cp_img_select_image" class="mlab_dt_select"><option>...laster bilde...</option></select>') );
        content.append( $('<div />', { id: "mlab_cp_image_uploadfiles", class: "mlab_dt_button_upload_files mlab_dt_left", name: "mlab_cp_image_uploadfiles", text: 'Velg fil', data: { allowed_types: ["jpg", "jpeg", "png", "gif"], multi: false} }) );
        content.append( $('<div />', { class: "mlab_dt_large_new_line" }) );
        content.append( $('<div />', { text: 'Avbryt', id: "mlab_cp_image_button_cancel", class: "pure-button  pure-button-xsmall mlab_dt_button_cancel mlab_dt_left" }) );
       // content.append( $('<div />', { class: "mlab_dt_button_new_line" }) );
        content.append( $('<div />', { text: 'OK', id: "mlab_cp_image_button_ok", class: "pure-button  pure-button-xsmall right mlab_dt_button_ok mlab_dt_left" }) );

        var that = this;
        
        if (typeof event != "undefined") {
            var owner_element = event.currentTarget;
        } else {
            var owner_element = el;
        }
        this.properties_tooltip = $(owner_element).qtip({
            solo: false,
            content: {text: content, title: "Last opp media" },
            position: { my: 'leftMiddle', at: 'rightMiddle' },
            show: { ready: true, modal: { on: true, blur: false } },
            hide: false,
            style: { classes: 'qtip-light mlab_zindex_top_tooltip' },
            events: { render: function(event, api) {
                            that.indicateWait(true);
                            this.dt_component = el;
                            this.dt_component_id = component_config.name;
                            this.dt_config = component_config;
                            this.dt_cb = cb;
//load existing files
                            var existing_files = that.getMedia(file_extensions);
                            $("#mlab_cp_img_select_image").html(existing_files)
                                                          .on("change", function() {
                                that_qtip.dt_cb(that_qtip.dt_component, $("#mlab_cp_img_select_image").val()); 
                                that.setDirty();
                                
                                that.closeAllPropertyDialogs();
                            }); 


//upload files 
                            if ($("#mlab_cp_image_button_ok").length > 0) {
                                var that_qtip = this;
                                var uploadObj = $("#mlab_cp_image_uploadfiles").uploadFile({
                                    url: that.getUrlUploadAbsolute(that_qtip.dt_config.name),
                                    formData: { comp_id: that_qtip.dt_component_id, app_path: that.parent.app.path },
                                    multiple: false,
                                    showCancel: false,
                                    showAbort: false,
                                    showDone: false,
                                    autoSubmit: true,
                                    fileName: "mlab_files",
                                    showStatusAfterSuccess: true,
                                    allowedTypes: file_extensions,
                                    onSuccess: function(files, data, xhr) {
                                                that_qtip.dt_cb(that_qtip.dt_component, data.url);
                                                that.setDirty();
                                                api.hide(); 
                                        }.bind(that_qtip.dt_component),
                                    onError: function(files, status, errMsg) { 
                                        alert(errMsg); 
                                    }
                                });

                                $("#mlab_cp_image_uploadfiles_start").click(function() {
                                    uploadObj.startUpload();
                                });
                            }
                            
                            $('#mlab_cp_image_button_ok', api.elements.content).click(	
                                    function(e) {
                                        api.hide(e); 
                                        if (typeof (document["mlab_code_" + component_id]) !== "undefined") {
                                            document["mlab_code_" + component_id].setProperties( $("#mlab_dt_form_upload").serializeArray(), this );
                                        }
                                    }.bind(that_qtip.dt_component));
                            $('#mlab_cp_image_button_cancel', api.elements.content).click(function(e) { api.hide(e); });
                            
                            //Adding mlab style 
                            //$('#mlab_property_button_ok').addClass('mlab_dt_button_ok mlab_dt_left'); 
                            //$('#mlab_property_button_cancel').addClass('mlab_dt_button_cancel  mlab_dt_left');
                            //$('#mlab_property_uploadfiles').addClass('mlab_dt_button_upload_files  mlab_dt_left');
                            $('.new_but_line').addClass('mlab_dt_button_new_line');
                            $('.new_big_line').addClass('mlab_dt_large_new_line');
                            $('.new_small_line').addClass('mlab_dt_small_new_line');
                            $('.info').addClass('mlab_dt_text_info');
                            $('.ajax-file-upload-filename').addClass('mlab_dt_text_filename');
                            $('.ajax-file-upload-statusbar').addClass('mlab_dt_progress_bar');
                            that.indicateWait(false);
                        },
                        show: function(event, api) { api.focus(event); },
                        hide: function(event, api) { api.destroy(); that.properties_tooltip = false; }
            }
        });
        this.indicateWait(false);
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
 * Loads all js/css files required by a component at design time.
 * Files loaded are specified in the conf.yml parameter required_libs.
 * @param {string} comp_id, the unique ID for the component that needs to load the files
 * @returns {undefined}
 */
    getLibraries : function (comp_id) {
        if ("required_libs" in this.parent.components[comp_id].conf) {
            if ("designtime" in this.parent.components[comp_id].conf.required_libs) {
                var comp_url = window.location.origin + this.parent.urls.components_root_url;
                var comp_path = this.parent.components[comp_id].conf.name;

                for (i in this.parent.components[comp_id].conf.required_libs.designtime) {
                    var file = this.parent.components[comp_id].conf.required_libs.designtime[i];
                    var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/ ;
                    
                    if (regexp.test(file)) {
                        if (file.substr(-3) == ".js") {
                            if ($("script[src*='" + file + "']").length < 1) {
                                $("head").append($("<script src='" + file + "' >"));
                            }
                        } else {
                            if ($("link[href*='" + file + "']").length < 1) {
                                $("head").append($("<link rel='stylesheet' type='text/css' href='" + file +"' >"));
                            }
                        }
                        
                    } else if (file.substr(-3) == ".js") {
                        if ($("script[src*='" + file + "']").length < 1) {
                            $("head").append($("<script src='" + comp_url + comp_path + "/js/" + file + "' >"));
                        }
                    } else if (file.substr(-4) == ".css") {
                        if ($("link[href*='" + file + "']").length < 1) {
                            $("head").append($("<link rel='stylesheet' type='text/css' href='" + comp_url + comp_path + "/css/" + file +"' >"));
                        }
                    }
                }
            }
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
    
    executeCallback : function (func, data) {
        if (typeof func == "undefined" || func == null) {
            return;
        }
        func(data);
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
        that.properties_tooltip = $(owner_element).qtip({
            solo: false,
            content:    {text: content, title: title },
            position:   { my: 'leftMiddle', at: 'rightMiddle', adjust: { screen: true } },
            show:       { ready: true, modal: { on: true, blur: false }, autofocus: focus_selector },
            hide:       false,
            style:      { classes: c },
            events:     {   render: function(event, api) { if (func_render) { that.executeCallback (func_render, el) } },
                            hide: function(event, api) { if (func_hide) { that.executeCallback (func_hide, el) }; api.destroy(); that.properties_tooltip = false; },
                            visible: function(event, api) { if (func_visible) { that.executeCallback (func_visible, el) } } 
                        }
        });
        this.indicateWait(false);
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
    displayHtmlPageInDialog : function (el, title, url_htmlpage, qTipClass, func_render, func_visible, func_hide, focus_selector) {
  
        this.indicateWait(true);
        this.closeAllPropertyDialogs();
        that = this;
        
        if (typeof qTipClass == "undefined" ||  qTipClass === null ||  qTipClass === ""){
            var styleClasses = 'qtip-light mlab_dt_box_style mlab_zindex_top_tooltip';
        } else {
            var styleClasses = 'qtip-light mlab_dt_box_style mlab_zindex_top_tooltip ' + qTipClass;
        }
         
        that.properties_tooltip = $(el).qtip({
            solo: false,
            content:    {
                        text: function(event, api) {
                            $.ajax({
                                url: url_htmlpage // Use href attribute as URL
                            })
                            .then(function(content) {
                                // Set the tooltip content upon successful retrieval
                                api.set('content.text', content);
                            }, function(xhr, status, error) {
                                // Upon failure... set the tooltip content to error
                                api.set('content.text', status + ': ' + error);
                            });

                            return 'Loading...'; // Set some initial text
                            },
                        title: title,
                        button: true
                        },
            position:   { my: 'leftMiddle', at: 'rightMiddle', adjust: { screen: true }, effect: false },
            show:       { ready: true, modal: { on: true, blur: false }, autofocus: focus_selector },
            hide:       false,
            style:      { classes: styleClasses },
            events:     {   render: function(event, api) { if (func_render) { that.executeCallback (func_render, el) } },
                            hide: function(event, api) { if (func_hide) { that.executeCallback (func_hide, el) }; api.destroy();  that.properties_tooltip = false; },
                            visible: function(event, api) { if (func_visible) { that.executeCallback (func_visible, el) } } 
                        }
        });
        
        this.indicateWait(false);
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
 * Returns the local (for instance nb_NO) as specified in the backend Symfony environment.
 * Loaded as a temporary variable on initial MLAB editor page load as it has to be passed from the backend.
 * @returns {Mlab_dt_api.parent.parent.locale}
 */
    getLocale: function() {
        return this.parent.parent.locale;
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
    
    
/**
 * Creates the HTML5 code required for a link either to a external page or to a page in the current app.
 * Links to pages must use the api call navigation.pageDisplay, links to external pages must use _new as the target value.
 * TODO: Can be improved by listing existing pages instead of just requesting the page number.
 * @returns {Boolean|String}
 */
    getLink: function () {
        var link = prompt("Please enter the URL or page number (for pages in this app) to link to");
        var page_name = "";
        if (link != null && link != "") {
            var num = parseInt(link);
            if (parseInt(link) > 0 && num < 1000) {
                var page_name = "onclick='mlab.api.navigation.pageDisplay(-1, " + num + "); return false;'";
            } else if (/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(link)) {
                var page_name = link.trim();
            }
        }
        if (page_name == "") {
            alert("No URL/page specified, cannot add link");
            return false;
        }
        return page_name;
    },

/**
  * Requests credentials such as login name and password (for instance, can also be URL to use, database name, etc)
  * These are all just treated as strings and returned as an array of strings. 
  * @param {type} credentials_required
  * @param {type} cb_function
  * @param {type} params
  * @returns {Boolean|Array of strings}
 */
    getCredentials: function (credentials_required, cb_function, params) {
        var dlg = $('<div />', {id: "mlab_dt_dialog_credentials", title: "Credentials" } );
        for (credential in credentials_required) {   
            dlg.append( $('<p />', { text: 'Her skal credentials forklares.....' , class: 'mlab_dt_text_info' } ) );
            dlg.append( $('<label />', { text: credentials_required[credential].charAt(0).toUpperCase() + credentials_required[credential].slice(1) , for: 'mlab_dt_dialog_credentials_' + credentials_required[credential] , class: 'mlab_dt_short_label' } ) );
            dlg.append( $('<input />', { name: 'mlab_dt_dialog_credentials_' + credentials_required[credential] , id: 'mlab_dt_dialog_credentials_' + credentials_required[credential] , class: 'mlab_dt_input' }) );      
            dlg.append( $('<br />') );   
        }
        
        var that_dlg = $(dlg).dialog({
                autoOpen: true,
                modal: true,
                closeOnEscape: true,
                dialogClass: "mlab_dt_dialog_credentials",
                             
                buttons: {
                    'Save': function() {
                        
                        var credentials = {};
                        for (credential in credentials_required) {
                            credentials[credentials_required[credential]] = $( "#mlab_dt_dialog_credentials_" + credentials_required[credential] ).val() ;
                        }
                        
                        $(this).dialog("close");
                        dlg.remove();
                        cb_function(credentials, params);
                        
                    },
                   
                }
            }).dialog("open");
            
    },
    
//object for display functionality, primarily for resizing 
    display: {
        
/**
 * Updates the aspect ratio setting for a component by updating the data-mlab-ratio setting
 * @param {type} el
 * @param {type} size
 * @returns {undefined}
 */
        setAspectRatio: function (el, aspect) {
            if (["4:3", "16:9", "1:1"].indexOf(aspect) > -1) {
                $(el).attr("data-mlab-aspectratio", aspect);
                this.parent.closeAllPropertyDialogs();
                this.parent.setDirty();
                this.updateDisplay(el);
                
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
                $(el).attr("data-mlab-size", size);
                this.parent.closeAllPropertyDialogs();
                this.parent.setDirty();
                this.updateDisplay(el);
            }
        },
        
/**
 * Updates either a single component, or all components on a page, using data attributes to determine the display
 * @param {type} el: Optional, the element to display. If not specified, then update all components
 * @returns {undefined}
 */
        updateDisplay: function (el) {
            var components = (typeof el == "undefined") ? $('[data-mlab-size][data-mlab-aspectratio]') : $(el);
            var that = this;
            
            components.each( function() {
                var device_width = $('[data-role="page"]').first().innerWidth();
                var aspect_ratio = $(this).attr("data-mlab-aspectratio").split(":");
                var size = $(this).attr("data-mlab-size");
                var times = (size == "small") ? 0.33 : ((size == "medium") ? 0.67 : 1);
                var comp_id = $(this).data("mlab-type");
                
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
 * Updates either a single component, or all components on a page, using data attributes to determine the display
 * @param {type} el: Optional, the element to display. If not specified, then update all components
 * @returns {true if selected different component, false otherwise}
 */   
        componentHighlightSelected : function (el) {
            var curComp = $( "#" + this.parent.getEditorElement() + "> div.mlab_current_component" );

            if (el[0] === curComp[0]) {
                return false;
            }          
            
            if (el[0] !== curComp[0]) {
//Delete the outlines and tools for the last current component
                curComp.qtip('hide');
                curComp.removeClass("mlab_current_component");
                curComp.find("mlab_current_component").css("outline-color", "").removeClass("mlab_current_component");
                curComp.find(".mlab_current_component_editable").css("outline-color", "").removeClass("mlab_current_component_editable").attr("contenteditable", false);
                window.getSelection().removeAllRanges();
                curComp.find(".mlab_current_component_child").css("outline-color", "").removeClass("mlab_current_component_child");
                
//Set the new current component
                var pageBgColor = $("[data-role=page]").css( "background-color" );
//inverts the background color
                var pageBgColorInvert = this.invertColor(pageBgColor);
//set the invert color of the background as the border-color for the current selected component
                $( el ).css("outline-color", pageBgColorInvert);
                $( el ).addClass("mlab_current_component");
                return true;
            }

            return false;
        },
        
/**
 * Updates either a single component, or all components on a page, using data attributes to determine the display
 * @param {type} sub_el: Optional, the element to display. If not specified, then update all components
 * @param {type} editable: Optional, the element to display. If not specified, then update all components
 */   
        componentHighlightSelectedChildren : function (sub_el, editable) {
            $(".mlab_current_component").find(".mlab_current_component_editable").css("outline-color", "").removeClass("mlab_current_component_editable").attr("contenteditable", false);
            $(".mlab_current_component").find(".mlab_current_component_child").css("outline-color", "").removeClass("mlab_current_component_child");
                  
            sub_el = $( sub_el );
//gets the childs background color
            var bgColorC = this.getBackground(sub_el);
//inverts the background color
            var bgColorCInvert = this.invertColor(bgColorC);
//set the invert color of the background as the outline-color for the current selected component
            sub_el.css("outline-color", bgColorCInvert);
//set the class to style the selected highlighted child             
            sub_el.addClass("mlab_current_component_child");                
                
            if (typeof editable != "undefined") {   
                editable = $( editable );
//gets the grandchilds background color
                var bgColorGC = this.getBackground(editable);
//inverts the background color
                var bgColorGCInvert = this.invertColor(bgColorGC);
//set the invert color of the background as the outline-color for the current selected component
                editable.css("outline-color", bgColorGCInvert);
              
                editable.addClass("mlab_current_component_editable").attr("contenteditable", true);
                
                editable.focus();
                var range = document.createRange();
                var sel = window.getSelection();
                range.selectNodeContents(editable[0]);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        },      
    },

}

