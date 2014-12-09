/**
 * 
 * API functions for use by components at design time (i.e. in the MLAB editor).
 * Used to obtain info such as paths, to display user input requests or to store data, etc.
 * @returns {Mlab_dt_api}
 * @constructor
 */
function Mlab_dt_api () {
    this.storage = new Object();
    this.version = 0.2;
};

/**
 * Initialise the different functions.
 * @type type
 */
Mlab_dt_api.prototype = {
  testy : function (test) {
    alert("Mlab_dt_api" + test);
  },

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
                        if ($("script[src*='" + file + "']").length < 1) {
                            $("head").append($("<script src='" + file + "' >"));
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
 * Get the ID of the DIV that is the container for the editable area. 
 * The string name is specified in the parameter.yml file and can be changed, but there really is no reason to do this.
 * @returns {String: Mlab_dt_api.parent.config.content_id}
 */
    getEditorElement : function () {
        return this.parent.config.content_id;
    },

/**
 * Matches a function found in the runtime API JS file/object mlab.api, used by components to call the current API and see what mode they are in. 
 * This can be used to execute different code based on whether the user designs the app, or runs the compiled version.
 * @returns {String}
 */
    getMode : function () {
        return "designtime";
    },

/**
 * Simple wrapper function which will ensure that the jQuery plugin qtip2 is closed.
 * @returns {undefined}
 */
    closeAllPropertyDialogs : function () {
        $('.mlab_current_component').qtip('hide');
    },

/**
 * Displays the property input dialog for the specified component. 
 * This uses the jQuery plugin qtip2 for the actual dialog, and fills it with the specified content.
 * The component is reponsible for adding buttons such as Cancel and OK with callback to relevant functions in the component.
 * @param {jQuery DOM element} el, the component that the dialog should be attached to
 * @param {string} title
 * @param {HTML string} content, valid HTML5
 * @param {function object} func_render, callback function when the property dialog is created, can be used to manipulate dialog, add content, etc.
 * @param {function object} func_visible, callback function when the property dialog is 
 * @param {function object} func_hide
 * @returns {undefined}
 */
    displayPropertyDialog : function (el, title, content, func_render, func_visible, func_hide) {
        this.closeAllPropertyDialogs()
        $(el).qtip({
            solo: true,
            content:    {text: content, title: title },
            position:   { my: 'leftMiddle', at: 'rightMiddle' },
            show:       { ready: true, modal: { on: true, blur: false } },
            hide:       false,
            style:      { classes: 'qtip-light' },
            events:     {   render: func_render,
                            hide: function(event, api) { api.destroy(); },
                            visible: func_visible  
                        }
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
            return undefined;
        }
        try {
            var vars = JSON.parse(json);
        } catch(e) {
            console.log(e);
            return undefined;
        }
        
        return vars[key];
    },

//writes the javascript value and stores it for the specified element
/**
 * Stores a Javascript value for the specified element.
 * This only works on top level vars, but the value can be an object which in effect gives lower level storage posibilities.
 * 
 * Variables are stored in a <script> of type application/json as stringified JSON, on the same level as the main component HTML5 code.
 * These are all contained within a wrapper DIV that is the actual DOM element ppassed to this function.
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
 * This updates the script for a control, this is write only as it should always be generated from user input and variables!
 * It therefore also always replaces existing content in the script element
 * @param {jQuery DOM element} el
 * @param {text} code, any Javascript compatible statements
 * @returns {Boolean}
 */
    setScript: function (el, code) {
        var scrpt = $(el).find("script.mlab_code");
        if (scrpt.length < 1) {
            $(el).append("<script class='mlab_code' />").html(code);
        } else {
            scrpt.html(code);
        }
        return true;
    },
    
/**
 * Creates the HTML5 code required for a link either to a external page or to a page in the current app.
 * Links to pages must use the api call pageLoad, links to external pages must use _new as the target value.
 * TODO: Can be improved by listing existing pages instead of just requesting the page number.
 * @returns {Boolean|String}
 */
    getLink: function () {
        var link = prompt(this.config.custom.msg_requestlink);
        var page_name = "";
        if (link != null && link != "") {
            var num = parseInt(link);
            if (parseInt(link) > 0 && num < 1000) {
                var page_name = "onclick='mlab.api.pageLoad(" + num + "); return false;'";
            } else if (/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(link)) {
                var page_name = link.trim();
            }
        }
        if (page_name == "") {
            alert(this.config.custom.msg_wronglink);
            return false;
        }
        return page_name;
    }

}

