
/*********************************************************************************************
 *********** Functions to parse HTML for a page and insert it into the editor area ***********
 *********************************************************************************************/

/***********************************************************
 ******************* Utility functions *********************
************************************************************/

/**
 * Standard initialisation of Mlab object which is referred to in several JS files,
 * as these files can come down in different order, we must make sure we can use it here.
 */

function Mlab_dt_design () {
    this.parent = null;
}

Mlab_dt_design.prototype = {
/*
 * DOMParser HTML extension
 * 2012-09-04
 *
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 *! @source https://gist.github.com/1129031
 * global document, DOMParser
 */

    domParserWrapper : function() {
        "use strict";

        var DOMParser_proto = DOMParser.prototype;
        var real_parseFromString = DOMParser_proto.parseFromString;

        // Firefox/Opera/IE throw errors on unsupported types
        try {
            // WebKit returns null on unsupported types
            if ((new DOMParser).parseFromString("", "text/html")) {
                // text/html parsing is natively supported
                return;
            }
        } catch (ex) {}

        DOMParser_proto.parseFromString = function(markup, type) {
            if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
                var doc = document.implementation.createHTMLDocument("") ;
                if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                    doc.documentElement.innerHTML = markup;
                }
                else {
                    doc.body.innerHTML = markup;
                }
                return doc;
            } else {
                return real_parseFromString.apply(this, arguments);
            }
        };
    },

/***********************************************************
 *********** Functions to manipulate components ***********
************************************************************/
    component_add : function (id) {
        if (this.parent.app.locked) {
            return;
        }

//if this control has to be unique we check here to see if one was already added
        if (this.parent.components[id].conf.unique && $("#" + this.parent.config["app"]["content_id"]).find("[data-mlab-type='" + id + "']").length > 0) {
            alert("You can only have one component of this type on a page");
            return;
        }
        
        this.parent.flag_dirty = true;
        var data_resize = (typeof this.parent.components[id].conf.resizeable != "undefined" && this.parent.components[id].conf.resizeable == true) ? "data-mlab-aspectratio='1:1' data-mlab-size='medium'" : "";
        var data_display_dependent = (typeof this.parent.components[id].conf.display_dependent != "undefined" && this.parent.components[id].conf.display_dependent == true) ? "data-mlab-displaydependent='true'" : "";

//add a DIV wrapper around all components, makes it easier to move it up/down later
        var new_comp = $("<div data-mlab-type='" + id + "' " + data_resize + " " + data_display_dependent + " style='display: block;'>" + this.parent.components[id].html + "</div>");
        $("#" + this.parent.config["app"]["content_id"]).append(new_comp);
        new_comp.on("click", function(){var prep_menu = mlab.dt.api.display.componentHighlightSelected($(this)); if (prep_menu) { mlab.dt.design.component_menu_prepare(); } } )
        new_comp.on("input", function(){mlab.dt.flag_dirty = true;});
        
//process all keys if this component wants to manipulate them (i.e. the process_keypress setting exists)
        if (typeof this.parent.components[id].conf.process_keypress != "undefined" && this.parent.components[id].conf.process_keypress) {
            $(new_comp).keydown( function(e) { mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(e); } );
        }

        $('.mlab_current_component').qtip('hide'); 

        if (this.parent.api.display.componentHighlightSelected(new_comp)) {
            this.component_menu_prepare();
        }
        
        window.scrollTo(0,document.body.scrollHeight);
//now we load the relevant CSS/JS files
        this.parent.api.getLibraries(id);

//finally we add dependencies, i.e. components that this component depends on
        if (this.parent.components[id].hasOwnProperty("conf") && this.parent.components[id].conf.hasOwnProperty("dependencies")) {
            for (component in this.parent.components[id].conf.dependencies) {
                this.feature_add(this.parent.components[id].conf.dependencies[0], true);
            }
        }

//execute backend javascript and perform tasks like adding the permissions required to the manifest file and so on
        var url = this.parent.urls.component_added.replace("_APPID_", this.parent.app.id);
        url = url.replace("_COMPID_", id);
        var that = this;
        var comp_id = id;

        var request = $.ajax({
            type: "GET",
            url: url,
            dataType: "json"
        });

        request.done(function( result ) {
            if (result.result == "success") {
                that.parent.drag_origin = 'sortable';
                
//if this component requires any credentials we request them here
                var local_comp = new_comp;
                var local_comp_id = comp_id;
                if (Object.prototype.toString.call( that.parent.components[comp_id].conf.credentials ) === "[object Array]") {
                    that.parent.api.getCredentials(that.parent.components[comp_id].conf.credentials, function (credentials, params) { mlab.dt.design.component_store_credentials(credentials, params); that.component_run_code(local_comp, local_comp_id, true); }, { component: new_comp });
                } else {
                    that.component_run_code(local_comp, local_comp_id, true);
                }
                
            } else {
                alert(result.msg + "'\n\nLegg til komponenten igjen.");
                $(new_comp).remove();
            }
        });

        request.fail(function( jqXHR, textStatus ) {
            alert("En feil oppsto: '" + jqXHR.responseText + "'\n\nLegg til komponenten igjen.");
            $(new_comp).remove();
            this.parent.flag_dirty = false;
        });
        
    },

/**
 * This executes (using eval()) any code for a component that is added to the app
 * @param {type} el = html element we're working on
 * @param {type} comp_id
 * @param {type} created
 * @returns {undefined}
 */
    component_run_code : function (el, comp_id, created) {
        if (typeof this.parent.components[comp_id] == "undefined" || typeof this.parent.components[comp_id].code == "undefined") {
            return;
        }

        if (created && typeof this.parent.components[comp_id].code.onCreate != "undefined") {
            this.parent.components[comp_id].code.onCreate(el);
        } else if (typeof this.parent.components[comp_id].code.onLoad != "undefined") {
            this.parent.components[comp_id].code.onLoad(el);
        }
    },

    component_moveup : function (el) {
        if (typeof el == "undefined") {
            var el = $(".mlab_current_component");
        }
        if (el.length == 0) {
            return;
        }
        el.fadeOut(500, function(){
            el.insertBefore(el.prev());
            el.fadeIn(500);
        });
        this.parent.flag_dirty = true;
    },

    component_movedown : function () {
        if (typeof el == "undefined") {
            var el = $(".mlab_current_component");
        }
        if (el.length == 0) {
            return;
        }
        el.fadeOut(500, function(){
            el.insertAfter(el.next());
            el.fadeIn(500);
        });
        this.parent.flag_dirty = true;
    },

    invert_color : function (rgb) {
     rgb = [].slice.call(arguments).join(",").replace(/rgb\(|\)|rgba\(|\)|\s/gi, '').split(',');
            for (var i = 0; i < rgb.length; i++) rgb[i] = (i === 3 ? 1 : 255) - rgb[i];
            return rgb.join(", ");
    },
    
    component_delete : function () {
        mlab.dt.api.closeAllPropertyDialogs();
        var sel_comp = $(".mlab_current_component").prev();
        if (sel_comp.length == 0) {
            sel_comp = $(".mlab_current_component").next();
        }
        $(".mlab_current_component").qtip('hide'); 
        $(".mlab_current_component").remove();
        if (sel_comp.length > 0) {
            if (this.parent.api.display.componentHighlightSelected(sel_comp)) {
                this.component_menu_prepare();
            }
        } 
        this.parent.flag_dirty = true;
    },

//cut and copy simply takes the complete outerHTML and puts it into a local variable, mlab.dt.clipboard
    component_cut : function () {
        mlab.dt.clipboard = $(".mlab_current_component").clone();
        this.component_delete();
    },

    component_copy : function () {
        mlab.dt.clipboard = $(".mlab_current_component").clone();
    },

//when they past we need to go through similar checks as we do when adding a component, like is it unique, etc.
//also need to attach event handlers, etc, they are lost as 
    component_paste : function() {
        var comp_id = mlab.dt.clipboard.data("mlab-type")
        if (this.parent.components[comp_id].conf.unique && $("#" + this.parent.config["app"]["content_id"]).find("[data-mlab-type='" + comp_id + "']").length > 0) {
            alert("You can only have one component of this type on a page");
            return;
        }
        $(".mlab_current_component").removeClass("mlab_current_component");
        $("#" + this.parent.config["app"]["content_id"]).append(mlab.dt.clipboard);
        if (this.parent.api.display.componentHighlightSelected(mlab.dt.clipboard)) {
            this.component_menu_prepare();
        }

        window.scrollTo(0,document.body.scrollHeight);
        mlab.dt.clipboard.on("click", function(){var prep_menu = mlab.dt.api.display.componentHighlightSelected($(this)); if (prep_menu) { mlab.dt.design.component_menu_prepare(); } } )
        mlab.dt.clipboard.on("input", function(){mlab.dt.flag_dirty = true;});
        
//process all keys if this component wants to manipulate them (i.e. the process_keypress setting exists)
        if (typeof this.parent.components[comp_id].conf.process_keypress != "undefined" && this.parent.components[comp_id].conf.process_keypress) {
            $(mlab.dt.clipboard).keydown( function(e) { mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(e); } );
        }
        
        this.parent.flag_dirty = true;
    },
    
    component_edit_credentials : function () {
        var curr_comp = $(".mlab_current_component");
        var comp_id = curr_comp.data("mlab-type");
        if (Object.prototype.toString.call( this.parent.components[comp_id].conf.credentials ) === "[object Array]") {
            this.parent.api.getCredentials(this.parent.components[comp_id].conf.credentials, this.component_store_credentials, { component: curr_comp });
        }        
    },

/**
 * features are simply components that are not displayed with a GUI
 * they are added to a hidden div on the index page, if we are NOT working on the index page we call a backend function to add this code
 *
 * @returns {undefined}
 */

    feature_add : function (comp_id, silent) {
        if ($(this.parent.app.curr_indexpage_html).find("#mlab_features_content").length == 0) {
            $(this.parent.app.curr_indexpage_html).find("body").append("<div id='mlab_features_content' style='display: none;'></div>");
        } else {
//make sure not duplicate it
            if ($(this.parent.app.curr_indexpage_html).find("#mlab_features_content [data-mlab-type='" + comp_id + "']").length > 0) {
                if (!silent) {
                    this.parent.utils.update_status("temporary", "Feature already added", false);
                }
                return;
            }
        }
        var c = this.parent.components[comp_id].conf;
        var data_resize = (typeof c.resizeable != "undefined" && c.resizeable == true) ? "data-mlab-aspectratio='1:1' data-mlab-size='medium'" : "";
        var data_display_dependent = ((typeof c.display_dependent != "undefined" && c.display_dependent == true) || (typeof c.resizeable != "undefined" && c.resizeable == true)) ? "data-mlab-displaydependent='true'" : "";

        $(this.parent.app.curr_indexpage_html).find("#mlab_features_content").append("<div data-mlab-type='" + comp_id + "' " + data_resize + " " + data_display_dependent + " >" + this.parent.components[comp_id].html + "</div>");

        var new_feature = $(this.parent.app.curr_indexpage_html).find("#mlab_features_content [data-mlab-type='" + comp_id + "']");
        if (new_feature.length > 0) {
            this.parent.components[comp_id].code.onCreate(new_feature[0]);
        }


//here we request any credentials that are required
/*                    if (typeof that.parent.components[data.component_id].conf.credentials != "undefined") {
                        if (Object.prototype.toString.call( that.parent.components[storage_plugin_id].conf.credentials ) === "[object Array]") {
                            that.parent.api.getCredentials(that.parent.components[storage_plugin_id].conf.credentials, that.storage_plugin_store_credentials, { storage_plugin_id: storage_plugin_id, component: component });
                        }
                    }
*/

//if we are not working on the index page we need to tell the back end to update the index.html file
//otherwise this will be lost
        if (this.parent.app.curr_page_num != "0" && this.parent.app.curr_page_num != "index") {
            var url = this.parent.urls.feature_add.replace("_APPID_", this.parent.app.id);
            url = url.replace("_COMPID_", comp_id);
            if (!silent) {
                this.parent.utils.update_status("callback", 'Adding feature...', true);
            }

            var that = this;
            $.get( url, function( data ) {
                if (data.result == "success") {
                    that.parent.utils.update_status("temporary", "Feature added", false);
                    $("#mlab_features_list [data-mlab-feature-type='" + data.component_id + "']").addClass("mlab_item_applied");
                    

                } else {
                    that.parent.utils.update_status("temporary", data.msg, false);
                }

            });
        }
    },
    
/**
 * storage_plugins are similar to features, except they are linked to individual components and not app as whole
 * They do nothing at design time so here we just call the back end to copy and add the code_rt.js file to the app
 * If credentials = true, we request credentials and store them for the component that this plugin was added to
 * 
 * @param {type} storage_plugin_id: unique ID of the storage plugin
 * @param {type} component: the component that wants to use this storage plugin
 */
    storage_plugin_add: function(storage_plugin_id, component) {
        
        $("#mlab_storage_plugin_list").fadeOut("slow");
        
        var url = this.parent.urls.storage_plugin_add.replace("_APPID_", this.parent.app.id);
        url = url.replace("_STORAGE_PLUGIN_ID_", storage_plugin_id);
        this.parent.utils.update_status("callback", 'Adding storage plugin...', true);
        var that = this;
        $.get( url, function( data ) {
            if (data.result == "success") {
                that.parent.utils.update_status("temporary", "Storage plugin added", false);
                if (Object.prototype.toString.call( that.parent.components[storage_plugin_id].conf.credentials ) === "[object Array]") {
                    that.parent.api.getCredentials(that.parent.components[storage_plugin_id].conf.credentials, that.storage_plugin_store_credentials, { storage_plugin_id: storage_plugin_id, component: component });
                } else {
                    mlab.dt.api.setVariable(component, "storage_plugin", {name: storage_plugin_id});
                }
                
                $("#mlab_storage_plugin_list [data-mlab-storage-plugin-type='" + data.storage_plugin_id + "']").addClass("mlab_item_applied");
                
            } else {
                that.parent.utils.update_status("temporary", data.msg, false);
                
            }

        });
        
        
    },
    
/**
 * Callback function which stores the storage_plugin name and the credentials entered
 * @param {type} credentials: 
 * @param {type} params
 * 
 */
    component_store_credentials: function (credentials, params) {
        
        mlab.dt.api.setVariable( params.component, "credentials", credentials );

    },

/**
 * Callback function which stores the storage_plugin name and the credentials entered
 * @param {type} credentials: 
 * @param {type} params
 * 
 */
    storage_plugin_store_credentials: function (credentials, params) {
        
        mlab.dt.api.setVariable( params.component, "storage_plugin", { name: params.storage_plugin_id, credentials: credentials } );

    },


/*
 *
 * @param divs (html/DOM) all divs to edit
 */
    prepare_editable_area : function () {
//need to loop through all divs in the editable box after they have been added
//and set the styles for dragging/dropping so it works OK
        var that = this;
        $( "#" + that.parent.config["app"]["content_id"] + "> div" ).each(function( index ) {
            $( this ).droppable(that.parent.droppable_options)
                     .sortable(that.parent.sortable_options)
                     .on("click", function(){var prep_menu = mlab.dt.api.display.componentHighlightSelected($(this)); if (prep_menu) { mlab.dt.design.component_menu_prepare(); } })
                     .on("input", function(){mlab.dt.flag_dirty = true;});

            comp_id = $( this ).data("mlab-type");
            that.component_run_code($( this ), comp_id);
            
//process all keys if this component wants to manipulate them (i.e. the process_keypress setting exists)
            if (typeof that.parent.components[comp_id].conf.process_keypress != "undefined" && that.parent.components[comp_id].conf.process_keypress) {
                $( this ).keydown( function(e) { mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(e); } );
            }
        });

//set draggable/sortable options for the editable area
        $( "#" + that.parent.config["app"]["content_id"] ).droppable(that.parent.droppable_options).sortable(that.parent.sortable_options);

    },

    /***********************************************************
 *********** Function to manipulate adaptive menus (those defined by component itself ********
************************************************************/

/* adds component specific menu (images) when a component is added/selected */
    component_menu_prepare: function () {
        var curr_comp = $(".mlab_current_component");
        if (curr_comp.length < 1) {
            return;
        }
        var conf = this.parent.components[curr_comp.data("mlab-type")].conf;
        var comp_name = curr_comp.data("mlab-type");
        var items = new Object();
        var title = "";
        var menu = $("#mlab_component_context_menu");
        var temp_menu = [];
        var loc = mlab.dt.api.getLocale();
        
        $("#mlab_toolbar_for_components #mlab_component_toolbar_heading").text(comp_name);
        menu.html("");
        

        if (typeof conf.custom != "undefined") {
            for(var index in this.parent.components[comp_name].code) {
                if (index.substr(0, 7) == "custom_") {
                    title = index.slice(7);
                    var icon = ( typeof conf.custom[title]["icon"] != "undefined" ) ? "src='" + conf.custom[title]["icon"] + "'" : "class='missing_icon'";
                    var temp_tt = ( typeof conf.custom[title]["tooltip"] != "undefined" ) ? conf.custom[title]["tooltip"] : title;
                    var tt = (typeof temp_tt == "object" ? (typeof temp_tt[loc] == "string" ? temp_tt[loc] : (typeof temp_tt["default"] == "string" ? temp_tt["default"] : "") ) : temp_tt );

                    var order = ( typeof conf.custom[title]["order"] != "undefined" ) ? conf.custom[title]["order"] : 0;
                    if (typeof conf.custom[title]["newline"] != "undefined" && conf.custom[title]["newline"] === true) {
                        var cl = "mlab_newline";
                    } else {
                        var cl = "";
                    }
                    
                    temp_menu[order] = "<img onclick='(function(e){ mlab.dt.components." + comp_name + ".code." + index + "($(\".mlab_current_component\"), e);})(event)' " + 
                                     "title='" + tt + "' " + 
                                     "class='" + cl + "' " + 
                                     icon + " >";
                }
            }
            menu.append(temp_menu.join(""));
            menu.append("<div class='clear'>&nbsp;</div>");
            
        }
        
        
//display storage selection list button, if this supports storage
        if (typeof conf.credentials != "undefined" && Object.prototype.toString.call( conf.credentials ) === "[object Array]") {
            $("#mlab_button_get_credentials").removeClass("mlab_hidden");
        } else {
            $("#mlab_button_get_credentials").addClass("mlab_hidden");
        }

//display storage selection list button, if this supports storage
        if (typeof conf.storage_plugin != "undefined" && conf.storage_plugin == true) {
            $("#mlab_button_select_storage_plugin").removeClass("mlab_hidden");
            $("#mlab_storage_plugin_list li").removeClass("mlab_item_applied");
//update the menu with the existing selection, if any
            var current_storage = this.parent.api.getVariable(curr_comp[0], "storage_plugin");
            if (typeof current_storage != "undefined" && typeof current_storage.name != "undefined") {
                $("#mlab_storage_plugin_list [data-mlab-storage-plugin-type='" + current_storage.name + "']").addClass("mlab_item_applied");
            }
        } else {
            $("#mlab_button_select_storage_plugin").addClass("mlab_hidden");
        }
        
//display size and aspect ratio selection list buttons, if this supports resizing
        if (typeof conf.resizeable != "undefined" && conf.resizeable == true) {
            $("#mlab_button_component_size").removeClass("mlab_hidden");
            $("#mlab_button_component_aspect").removeClass("mlab_hidden");
            $("#mlab_component_size_list li").removeClass("mlab_item_applied");
            $("#mlab_component_aspect_list li").removeClass("mlab_item_applied");
//update the menus with the existing selection, if any
            $("#mlab_component_size_list [data-data-mlab-comp-size='" + curr_comp.data("mlab-comp-size") + "']").addClass("mlab_item_applied");
            $("#mlab_component_aspect_list [data-data-mlab-comp-aspect='" + curr_comp.data("mlab-comp-aspect") + "']").addClass("mlab_item_applied");
        } else {
            $("#mlab_button_component_size").addClass("mlab_hidden");
            $("#mlab_button_component_aspect").addClass("mlab_hidden");
        }
       
        this.parent.qtip_tools = $(curr_comp).qtip({
            solo: false,
            content:    { text: function() { return $('#mlab_toolbar_for_components').clone().removeAttr("id"); } },
            position:   { my: 'leftTop', at: 'rightTop', adjust: { screen: true } },
            show: {ready: true, modal: { on: false, blur: false }},
            hide: false,
            events: {
                hide: function(event, api) { $(mlab.dt.api.properties_tooltip).qtip('hide'); api.destroy(); },
            },
            style: { classes: 'qtip-light mlab_zindex_regular_tooltip' },
    
/*            show:       { ready: true, modal: { on: false, blur: false } },
            hide:       false, */
        });
        
        //$('#mlab_toolbar_for_components').show();
    },
    
} // end design.prototype


