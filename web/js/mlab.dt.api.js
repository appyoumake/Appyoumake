/*
 * API functions for use by components at design time (i.e. in editor)
 * Used to obtain info such as paths, to display user input requests or to store data
 */

/**
 * Standard initialisation of Mlab object which is referred to in several JS files, 
 * as these files can come down in different order, we must make sure we can use it here.
 */

if (typeof Mlab == "undefined") {
    Mlab = function () {
        var self = this;
        var documentOb = $(document);
        var designMode = true;
    }
}

if (typeof Mlab.dt == "undefined") {
    Mlab.dt = function () {
        var self = this;
        var config = new Object();
        
// State variables used by all .dt sub functions
        this.flag_dirty = false;
        this.counter_saving_page = 0; // counter which tells us if inside the save function we should restart the timer for
        this.drag_origin = 'sortable';
        this.timer_save = null;
    }
}

Mlab.dt.api = function () {
    this.storage = new Object();
    this.version = 0.2;
    this.parent = Mlab.dt;
};

Mlab.dt.api.prototype = {

    getUrlAppAbsolute : function (param) {
        return window.location.origin + mlab_config.urls.app;
    },

    getUrlAppRelative : function (param) {
        return mlab_config.urls.app;
    },

    getUrlComponentAbsolute : function (param) {
        return window.location.origin + mlab_config.urls.component;
    },

    getUrlComponentRelative : function (param) {
        return mlab_config.urls.component;
    },

    getUrlTemplateAbsolute : function (param) {
        return window.location.origin + mlab_config.urls.template;
    },

    getUrlTemplateRelative : function (param) {
        return mlab_config.urls.template;
    },

    getUrlUploadAbsolute : function (param) {
        return window.location.origin + mlab_urls.component_upload_file.replace("_APPID_", document.mlab_current_app.id).replace("_COMPID_", param);
    },

    getUrlUploadRelative : function (param) {
        return mlab_urls.component_upload_file.replace("_APPID_", document.mlab_current_app.id).replace("_FILETYPES_", param);
    },

//get a list of files already uploaded, non-async so we can return data and do not need to know whcih HTML element to put it in
    getMedia : function (param) {
        var data = $.ajax({
            type: "GET",
            url: mlab_urls.uploaded_files.replace("_APPID_", document.mlab_current_app.id).replace("_FILETYPES_", param),
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
        if ("required_libs" in mlab_components[param].conf) {
            if ("designtime" in mlab_components[param].conf.required_libs) {
                var comp_url = window.location.origin + mlab_urls.components_root_url;
                var comp_path = mlab_components[param].conf.name;

                for (i in mlab_components[param].conf.required_libs.designtime) {
                    var file = mlab_components[param].conf.required_libs.designtime[i];
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
        return mlab_config.content_id;
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
    },

/***********************************************************
 *********** Function to manipulate adaptive menus (those defined by component itself ********
************************************************************/

/* adds component specific menu when a component is added/selected */
    mlab_menu_prepare: function () {
        var comp = $(".mlab_current_component");
        if (comp.length < 1) {
            return;
        }
        var comp_name = comp.data("mlab-type");
        var items = new Object();
        var title = "";
        for(var index in document["mlab_code_" + comp_name]) {
            if (index.substr(0, 7) == "custom_") {
                title = index.slice(7);
                items[index] =  { name: title.charAt(0).toUpperCase() + title.slice(1).replace("_", " "),
                                  callback: function(key, options) {
                                      document["mlab_code_" + $('.mlab_current_component').data("mlab-type")][key]($('.mlab_current_component'));
                                  }
                                };
            }
        }
        if ((typeof mlab_components[comp_name].conf.compatible != "undefined") && (document["mlab_code_" + $('.mlab_current_component').data("mlab-type")].hasOwnProperty("onReplace"))) {
            items["sep1"] = "---------";
            items["replace"] = {"name": "Replace control with"};
            var sub_items = new Object;
            mlab_components[$(".mlab_current_component").data("mlab-type")].conf.compatible.forEach(function(replace_with) {
                title = replace_with.trim();
                sub_items[title] = { name: " -> " + title.replace("_", " "),
                                     callback: function(key, options) {
                                        document["mlab_code_" + $('.mlab_current_component').data("mlab-type")].onReplace($('.mlab_current_component'), key, mlab_components[key].html);
                                     }
                                   };
            } );
            items["replace"]["items"] = sub_items;
       }

        $.contextMenu( 'destroy', '#mlab_button_menu' );
        $.contextMenu( 'destroy', '.mlab_current_component' );

        if (Object.keys(items).length < 1) {
            items["empty"] = "No actions available for this component";
        }

        $.contextMenu({
            selector: '#mlab_button_menu',
            className: 'mlab_menu_title',
            trigger: 'left',
            items: items
        });

        $.contextMenu({
            selector: '.mlab_current_component',
            className: 'mlab_menu_title',
            trigger: 'right',
            items: items
        });

        $('.mlab_menu_title').attr('data-menutitle', "Modify component");
    }


}

