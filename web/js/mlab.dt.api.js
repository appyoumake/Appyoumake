/*
 * API functions for use by components at design time (i.e. in editor)
 * Used to obtain info such as paths, to display user input requests or to store data
 */


function Mlab_dt_api () {
    this.storage = new Object();
    this.version = 0.2;
};

Mlab_dt_api.prototype = {
  testy : function (test) {
    alert("Mlab_dt_api" + test);
  },

/*
 * Requests for URLs, Symfony allows us to redfine these using the route functionality, so they are always stored in variables
 * picked up from the server, these are wrapper functions to obtain them from the internal variables
 */
    getUrlAppAbsolute : function () {
        return window.location.origin + this.parent.config.urls.app;
    },

    getUrlAppRelative : function () {
        return this.parent.config.urls.app;
    },

    getUrlComponentAbsolute : function () {
        return window.location.origin + this.parent.config.urls.component;
    },

    getUrlComponentRelative : function () {
        return this.parent.config.urls.component;
    },

    getUrlTemplateAbsolute : function () {
        return window.location.origin + this.parent.config.urls.template;
    },

    getUrlTemplateRelative : function () {
        return this.parent.config.urls.template;
    },

    getUrlUploadAbsolute : function (param) {
        return window.location.origin + this.parent.urls.component_upload_file.replace("_APPID_", this.parent.app.id).replace("_COMPID_", param);
    },

    getUrlUploadRelative : function (param) {
        return this.parent.urls.component_upload_file.replace("_APPID_", this.parent.app.id).replace("_FILETYPES_", param);
    },

//get a list of files already uploaded, non-async so we can return data and do not need to know whcih HTML element to put it in
    getMedia : function (param) {
        var data = $.ajax({
            type: "GET",
            url: this.parent.urls.uploaded_files.replace("_APPID_", this.parent.app.id).replace("_FILETYPES_", param),
            async: false,
        }).responseText;

        data = eval("(" + data + ")");
        if (data.result == "success") {
            return data.files;
        } else {
            return "<option>Unable to obtain files</option>";
        }
    },

//create a GUID that is rfc4122 version 4 compliant
    getGUID : function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    },

//loads all js/css files required at design time for a component as specified in conf.yml
    getLibraries : function (param) {
        if ("required_libs" in this.parent.components[param].conf) {
            if ("designtime" in this.parent.components[param].conf.required_libs) {
                var comp_url = window.location.origin + this.parent.urls.components_root_url;
                var comp_path = this.parent.components[param].conf.name;

                for (i in this.parent.components[param].conf.required_libs.designtime) {
                    var file = this.parent.components[param].conf.required_libs.designtime[i];
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

//get api version for designtime API, different from runtime API version
    getVersion : function (param) {
        return this.version;
    },

//get currently selected component (the DIV, not the internal HTML code)
    getSelectedComponent : function (param) {
        return $('.mlab_current_component');
    },

//set the global dirty flag
    setDirty : function () {
        this.parent.flag_dirty = true;
    },

//get the DIV that is the ontainer for the editable area
    getEditorElement : function (param) {
        return this.parent.config.content_id;
    },

//get design time or runtime mode
    getMode : function () {
        return "designtime";
    },

    closeAllPropertyDialogs : function (param) {
        $('.mlab_current_component').qtip('hide');
    },

    displayPropertyDialog : function (el, title, content, func_render, func_visible, func_hide) {
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

    editContent : function (param) {
        $(param).attr('contenteditable', 'true').focus();
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents($(param)[0]);
        sel.removeAllRanges();
        sel.addRange(range);
    },
    
    getLocale: function() {
        return this.parent.parent.locale;
    },

    
//reads in the javascript values stored for the specified element, extracts the value fo the key specified
//this only works on top level vars, further processing must be done in component
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
    
//this updates the script for a control, this is writeonly as it should always be generated from user input and variables!
    setScript: function (el, code) {
        var scrpt = $(el).find("script.mlab_code");
        if (scrpt.length < 1) {
            $(el).append("<script class='mlab_code' />").html(code);
        } else {
            scrpt.html(code);
        }
        return true;
    },
    
//creates a link either to a external page or to a page in the current app
//Links to pages must use the api call pageLoad, links to external pages must use _new as the target value
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

