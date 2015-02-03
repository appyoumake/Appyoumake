
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


/* this function processes the index page that was retrieved.
 *
 * It does the following:
    Remove old HTML from the editing div (mlab_editor_chrome)
    Remove old stylesheets from previously edited page from *this page*
    Add new stylesheets from page that is opened for editing to *this page*
    Extract BODY and insert content into mlab_editor_chrome
    Process the top level DIVs inside DIV with ID = this.parent.config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    index_page_process : function (page, page_num, is_final_destination) {
        var comp_id, temp_comp, temp_link;
        var temp_stylesheets = "";
        var start_dir = this.parent.config.urls.app + this.parent.app.path + "/" + this.parent.app.version + this.parent.config.cordova.asset_path;

//parse doc into a variable
        var doc = (new DOMParser()).parseFromString(page,"text/html");

//check if it has editable area, if not we cannot continue
        if (doc.getElementById(this.parent.config["app"]["content_id"]) == null) {
            alert("This app does not have an editable area called " + this.parent.config["app"]["content_id"] + ", unable to open app. Check with the system administrator for further information.")
            return;
        }

//set the base href to the folder of the app
        document.getElementsByTagName("base")[0].href = start_dir;

//remove old stuff
        $("#mlab_editor_chrome").empty();
        $("link[rel=stylesheet][href^='css']").remove();

//store different parts of doc for easy access/manipulation
        var head = doc.getElementsByTagName("head")[0];
        var divs = doc.getElementById(this.parent.config["app"]["content_id"]).cloneNode(true).childNodes;

//assign vars to current app var, we remove all elements that are editable so we have clean HTML to add our edited content to
//this HTML chunk will include HTML header + all body content outside the editable area, plus the empty div for the editable area
        var content = doc.getElementById(this.parent.config["app"]["content_id"]);
        while (content.firstChild) {
            content.removeChild(content.firstChild);
        }
        var body = doc.getElementsByTagName("body")[0].cloneNode(true);

        var stylesheets = head.getElementsByTagName("link");

//insert stylesheets
        for ( var i = 0; i < stylesheets.length; i++) {
            temp_link = stylesheets[i].getAttribute("href");
            temp_stylesheets = temp_stylesheets + "<link rel='stylesheet' href='" + temp_link + "' type='text/css'>" + "\n";
        }
        $("head link[rel='stylesheet']").last().after(temp_stylesheets);

//here we insert the body MINUS the editable area (which was just removed) which is stored in the divs variable, into the editor_chrome
        $("#mlab_editor_chrome").append(body.innerHTML);

//now we need to make the internal code editable, but only if they actually want to edit this page
        if (is_final_destination) {
            $("#" + this.parent.config["app"]["content_id"]).html(divs);
            this.prepare_editable_area();
        }

        this.parent.app.curr_indexpage_html = doc;
//Page name is picked up from title tag in head
        this.parent.app.curr_pagetitle = head.getElementsByTagName("title")[0].innerText;
        this.parent.app.curr_page_num = page_num;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);

        this.parent.management.app_update_gui_metadata();

//finally we need to initialise the jQuery mobile stuff on the page we loaded, otherwise it will not display correctly
        $.mobile.initializePage();

    },


/* this function processes a regular page that was retrieved.
 *
 * It does the following:
    Remove old HTML from the internal editing div (this.parent.config["app"]["content_id"])
    Extract title and save it to JS var
    Extract BODY and insert content into this.parent.config["app"]["content_id"]
    Process the top level DIVs inside DIV with ID = this.parent.config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    regular_page_process : function (page, page_num) {
        var comp_id, temp_comp, temp_link;
        var start_dir = this.parent.config.urls.app + this.parent.app.path + "/" + this.parent.app.version + this.parent.config.cordova.asset_path;

//remove old stuff
        $("#" + this.parent.config["app"]["content_id"]).html("");

//a page may have failed to save, in this case we create an empty page here, then everything works
        if (page == "") {
            page = this.parent.config["app"]["html_header"].replace("%TITLE%", "Title") + this.parent.config["app"]["html_footer"];
            page = page.replace(/\\n/g, "\n");
        }
//
//parse doc into variables
        var doc = (new DOMParser()).parseFromString(page,"text/html");
        var head = doc.getElementsByTagName("head")[0];
        var body = doc.getElementsByTagName("body")[0].cloneNode(true);

//Page name is picked up from title tag in head
        this.parent.app.curr_pagetitle = head.getElementsByTagName("title")[0].innerText;
        this.parent.app.curr_page_num = page_num;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);

        this.parent.management.app_update_gui_metadata();

//add body content
        $("#" + this.parent.config["app"]["content_id"]).html(body.innerHTML);

        this.prepare_editable_area();
        $.mobile.initializePage();
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

//add a DIV wrapper around all components, makes it easier to move it up/down later
        var new_comp = $("<div data-mlab-type='" + id + "' style='display: block;'>" + this.parent.components[id].html + "</div>");
        $("#" + this.parent.config["app"]["content_id"]).append(new_comp);
        new_comp.on("click", function(){mlab.dt.design.component_highlight_selected(this);})
        new_comp.on("input", function(){mlab.dt.flag_dirty = true;});
        
//process all keys if this component wants to manipulate them (i.e. the process_keypress setting exists)
        if (typeof this.parent.components[id].conf.process_keypress != "undefined" && this.parent.components[id].conf.process_keypress) {
            $(new_comp).keydown( function(e) { mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(e); } );
        }

        $('.mlab_current_component').qtip('hide');

        this.component_run_code(new_comp, id, true);
        this.component_highlight_selected(new_comp);
        window.scrollTo(0,document.body.scrollHeight);

//execute backend javascript and perform tasks like adding the permissions required to the manifest file and so on
        var url = this.parent.urls.component_added.replace("_APPID_", this.parent.app.id);
        url = url.replace("_COMPID_", id);
        var that = this;

        var request = $.ajax({
            type: "GET",
            url: url,
            dataType: "json"
        });

        request.done(function( result ) {
            if (result.result == "success") {
                that.parent.drag_origin = 'sortable';
            } else {
                alert(result.msg + "'\n\nLegg til komponenten igjen.");
                $(new_comp).remove();
            }
        });

        request.fail(function( jqXHR, textStatus ) {
            alert("En feil oppsto: '" + jqXHR.responseText + "'\n\nLegg til komponenten igjen.");
            $(new_comp).remove();
        });

//finally we add dependencies, i.e. components that this component depends on
        if (this.parent.components[id].hasOwnProperty("conf") && this.parent.components[id].conf.hasOwnProperty("dependencies")) {
            for (component in this.parent.components[id].conf.dependencies) {
                this.feature_add(this.parent.components[id].conf.dependencies[0], true);
            }
        }

        this.parent.flag_dirty = true;

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

        if (created) {
            this.parent.components[comp_id].code.onCreate(el);
        } else {
            this.parent.components[comp_id].code.onLoad(el);
        }
    },

    component_moveup : function () {
        $el = $(".mlab_current_component");
        if ($el.length == 0) {
            return;
        }
        $el.fadeOut(500, function(){
            $el.insertBefore($el.prev());
            $el.fadeIn(500);
        });
        this.parent.flag_dirty = true;
    },

    component_movedown : function () {
        $el = $(".mlab_current_component");
        if ($el.length == 0) {
            return;
        }
        $el.fadeOut(500, function(){
            $el.insertAfter($el.next());
            $el.fadeIn(500);
        });
        this.parent.flag_dirty = true;
    },

    component_highlight_selected : function (el) {
         $( "#" + this.parent.config["app"]["content_id"] + "> div" ).removeClass("mlab_current_component");
         $( el ).addClass("mlab_current_component");
         this.component_menu_prepare();
    },

    component_delete : function () {
        var sel_comp = $(".mlab_current_component").prev();
        if (sel_comp.length == 0) {
            sel_comp = $(".mlab_current_component").next();
        }
        $(".mlab_current_component").remove();
        if (sel_comp.length > 0) {
            sel_comp.addClass("mlab_current_component");
        }
        this.parent.flag_dirty = true;
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

        $(this.parent.app.curr_indexpage_html).find("#mlab_features_content").append("<div data-mlab-type='" + comp_id + "'>" + this.parent.components[comp_id].html + "</div>");

        var new_feature = $(this.parent.app.curr_indexpage_html).find("#mlab_features_content [data-mlab-type='" + comp_id + "']");
        if (new_feature.length > 0) {
            this.parent.components[comp_id].code.onCreate(new_feature[0]);
        }

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
                     .on("click", function(){mlab.dt.design.component_highlight_selected(this);})
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
        
        $("#mlab_toolbar_for_components #mlab_component_toolbar_heading").text(comp_name);
        menu.html("");

        if (typeof conf.custom != "undefined") {
            for(var index in this.parent.components[comp_name].code) {
                if (index.substr(0, 7) == "custom_") {
                    title = index.slice(7);
                    var icon = ( typeof conf.custom[title + "_icon"] != "undefined" ) ? "src='" + conf.custom[title + "_icon"] + "'" : "class='missing_icon'";
                    var tooltip = ( typeof conf.custom[title + "_tooltip"] != "undefined" ) ? conf.custom[title + "_tooltip"] : title;
                    menu.append("<img onclick='mlab.dt.components." + comp_name + ".code." + index + "($(\".mlab_current_component\"));' " + 
                                     "title='" + tooltip + "' " + 
                                     icon + " >");
                }
            }
            
            menu.append("<div class='clear'>&nbsp;</div>");
            
        }
        
        
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

    },
    
} // end design.prototype


