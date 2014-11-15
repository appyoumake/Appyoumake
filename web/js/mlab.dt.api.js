/*
 * API functions for use by components at design time (i.e. in editor)
 * Used to obtain info such as paths, to display user input requests or to store data
 */


function Mlab_dt_api () {
    var self = this;
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
    getUrlAppAbsolute : function (param) {
        return window.location.origin + this.parent.config.urls.app;
    },

    getUrlAppRelative : function (param) {
        return this.parent.config.urls.app;
    },

    getUrlComponentAbsolute : function (param) {
        return window.location.origin + this.parent.config.urls.component;
    },

    getUrlComponentRelative : function (param) {
        return this.parent.config.urls.component;
    },

    getUrlTemplateAbsolute : function (param) {
        return window.location.origin + this.parent.config.urls.template;
    },

    getUrlTemplateRelative : function (param) {
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
    setDirty : function (param) {
        this.flag_dirty = true;
    },

//get the DIV that is the ontainer for the editable area
    getEditorElement : function (param) {
        return this.parent.config.content_id;
    },

//get design time or runtime mode
    isDesignTime : function (param) {
        return true;
    },

    closeAllPropertyDialogs : function (param) {
        $('.mlab_current_component').qtip('hide');
    },

    editContent : function (param) {
        $(param).attr('contenteditable', 'true').focus();
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents($(param)[0]);
        sel.removeAllRanges();
        sel.addRange(range);
    }

}

