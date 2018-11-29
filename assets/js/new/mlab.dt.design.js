/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no) additional functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract Functions to parse HTML for a page and insert it into the editor area 
 */

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
            alert(_tr["mlab.dt.design.js.alert.only.one.comp"]);
            return;
        }
        
//first we load the relevant CSS/JS files, when that is done we will call component_add_html from the getScriptFiles function.
//this is because script files come down at different speeds, and we need them all down before we can add HTML etc to the page
        this.parent.api.getLibraries(id, true);

        
    },
    
    component_add_html : function (id) {

        this.parent.flag_dirty = true;
        var data_resize = (typeof this.parent.components[id].conf.resizeable != "undefined" && this.parent.components[id].conf.resizeable == true) ? "data-mlab-aspectratio='4:3' data-mlab-size='medium'" : "";
        var data_display_dependent = (typeof this.parent.components[id].conf.display_dependent != "undefined" && this.parent.components[id].conf.display_dependent == true) ? "data-mlab-displaydependent='true'" : "";

//add a DIV wrapper around all components, makes it easier to move it up/down later
//for resizable components we add a second div which is used for settin size of content. Doing this on the outer div messs things up at design time
        if (data_resize != "") {
            var new_comp = $("<div data-mlab-type='" + id + "' " + data_display_dependent + " style='display: block;'><div data-mlab-sizer='1' "+ data_resize + " >" + this.parent.components[id].html + "</div></div>");
        } else {
            var new_comp = $("<div data-mlab-type='" + id + "' " + data_display_dependent + " style='display: block;'>" + this.parent.components[id].html + "</div>");
        }

        $("#" + this.parent.config["app"]["content_id"]).append(new_comp);
        new_comp.on("click", function(){var prep_menu = mlab.dt.api.display.componentHighlightSelected($(this)); if (prep_menu) { mlab.dt.ui.displayComponentTools($(this)); } } )
        new_comp.on("input", function(){mlab.dt.flag_dirty = true;});
        
//process all keys if this component wants to manipulate them (i.e. the process_keypress setting exists)
        if (typeof this.parent.components[id].conf.process_keypress != "undefined" && this.parent.components[id].conf.process_keypress) {
            $(new_comp).keydown( function(e) { mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(e); } );
        }

        //$('.mlab_current_component').qtip('hide'); 

        if (this.parent.api.display.componentHighlightSelected(new_comp)) {
            mlab.dt.ui.displayComponentTools(new_comp);
        }
        
//scroll down where the component is added
        window.scrollTo(0, document.body.scrollHeight);

//finally we add dependencies, i.e. components that this component depends on
        if (this.parent.components[id].hasOwnProperty("conf") && this.parent.components[id].conf.hasOwnProperty("dependencies")) {
            for (component in this.parent.components[id].conf.dependencies) {
                this.feature_add(this.parent.components[id].conf.dependencies[0], true);
            }
        }

//execute backend code which performs tasks like adding the permissions required to the manifest file, copying include files and so on
        var url = this.parent.urls.component_added.replace("_APPID_", this.parent.app.id);
        url = url.replace("_COMPID_", id);
        var that = this;
        var comp_id = id;

        var request = $.ajax({
            type: "GET",
            url: url,
            dataType: "json"
        });

//was where XXXX is now:
        this.parent.drag_origin = 'sortable';
//if this is a resizable component we do the initial resizing here
        if (data_resize != "") {
            this.parent.api.display.updateDisplay($(new_comp).children('[data-mlab-sizer]'));
        }
//if this component requires any credentials we request them here
        var local_comp = new_comp;
        var local_comp_id = comp_id;
        var cred_el = $("[data-mlab-comp-tool='credentials']");
        if (Object.prototype.toString.call( this.parent.components[comp_id].conf.credentials ) === "[object Array]") {
            this.parent.api.getCredentials(cred_el, comp_id, this.parent.components[comp_id].conf.credentials, function (credentials, params) { mlab.dt.design.component_store_credentials(credentials, params); that.component_run_code(local_comp, local_comp_id, true); }, false, { component: new_comp });
        } else {
            this.component_run_code(local_comp, local_comp_id, true);
        }
//end XXXX

        request.done(function( result ) {
            if (result.result == "success") {
                that.parent.utils.update_app_title_bar(result.config)
            } else {
                alert(result.msg + "'\n\n" + _tr["mlab.dt.design.js.alert.add.comp"]);
                $(new_comp).remove();
            }
        });

        request.fail(function( jqXHR, textStatus ) {
            alert(_tr["mlab.dt.design.js.alert.error.occurred"] + ": '" + jqXHR.responseText + "'\n\n" + _tr["mlab.dt.design.js.alert.add.comp"]);
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

/*        if (!mlab.dt.qtip_tools) {
            var that = this;
            window.setTimeout(function() { that.component_run_code(el, comp_id, created) }, 500 );
            return;
        }
*/
        
        if (created) {
            if (this.parent.components[comp_id].conf.experimental) {
                alert("Please be aware that this component is in the testing stage. Do not use it for apps you will share with others.");
            }
            if (typeof this.parent.components[comp_id].code.onCreate != "undefined") {
                this.parent.components[comp_id].code.onCreate(el);
            }
//if the component has an autorun function defined we call the click for the matching button here
            if (typeof this.parent.components[comp_id].conf.autorun_on_create == "string") {
                mlab.dt.ui.triggerAutoRun(comp_id)
            }
        } else if (typeof this.parent.components[comp_id].code.onLoad != "undefined") {
            this.parent.components[comp_id].code.onLoad(el);
        }
    },
    
/**
 * Runs a random function in the backend code of a component, i.e. in the server_code.php file.
 * @param {type} el
 * @param {type} comp_id
 * @param {type} func_name
 * @param {type} callback
 * @returns {undefined}
 */
    component_run_backend_code : function (el, comp_id, func_name, callback) {
    //execute specified backend code for this component
        var url = this.parent.urls.component_run_function.replace("_APPID_", this.parent.app.id);
        url = url.replace("_COMPID_", comp_id);
        url = url.replace("_FUNCNAME_", func_name);
        url = url.replace("_PAGENUM_", this.parent.app.curr_page_num);
        
        var local_callback = callback,
            local_el = el;

        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            success: function(data) { if (data.result == "success") { local_callback(local_el, data.html); } else { local_callback(local_el, "<h1>failed</h1>"); } },
            error: function(error) { console.log(error); local_callback(local_el, "<h1>failed</h1>"); }
        });
    },


    component_moveup : function (el) {
        debugger;
        if (typeof el == "undefined") {
            var el = $(".mlab_current_component");
        }
        if (el.length == 0) {
            return;
        }
        el.fadeOut(500, function(){
            el.insertBefore(el.prev());
            var local_el = el;
            el.fadeIn(500, function(){
/*                local_el.qtip("api").reposition(null, false);
                if (mlab.dt.api.properties_tooltip) {
                    $(mlab.dt.api.properties_tooltip).qtip("api").reposition(null, false);
                } */
            });
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
            var local_el = el;
            el.fadeIn(500, function(){
/*                local_el.qtip("api").reposition(null, false);
                if (mlab.dt.api.properties_tooltip) {
                    $(mlab.dt.api.properties_tooltip).qtip("api").reposition(null, false);
                } */
            });
        });
        this.parent.flag_dirty = true;
    },

    invert_color : function (rgb) {
     rgb = [].slice.call(arguments).join(",").replace(/rgb\(|\)|rgba\(|\)|\s/gi, '').split(',');
            for (var i = 0; i < rgb.length; i++) rgb[i] = (i === 3 ? 1 : 255) - rgb[i];
            return rgb.join(", ");
    },
    
    component_delete : function (cut) {
        var that = this;
        var el = $(".mlab_current_component");
        var comp_id = el.data("mlab-type");
               
        if (typeof this.parent.components[comp_id].conf.requires_network != "undefined" && this.parent.components[comp_id].conf.requires_network != "none") {
            var requestDelete = {
                type: "POST",
                data: {
                    execute: '\n\
                        if(isset($component["requires_network"]) && $component["requires_network"] != "none"){\n\
                            $counter = \'count\' . ucfirst($component["requires_network"]) . \'Comp\';\n\
                            isset($config[$counter]) OR $config[$counter] = 0;\n\
                            $config[$counter] = max(0, $config[$counter]-1);\n\
                        }'
                },
                url: this.parent.urls.component_update_config.replace("_APPID_", this.parent.app.id).replace("_COMPID_", comp_id),
                dataType: "json"
            }
        }

        if (el.length == 0) {
            return;
        }
        if (typeof this.parent.components[comp_id].code.onDelete != "undefined") {
            this.parent.components[comp_id].code.onDelete(el);
        }
        mlab.dt.api.closeAllPropertyDialogs();
        var sel_comp = el.prev();
        if (sel_comp.length == 0) {
            sel_comp = el.next();
        }
//TODO: Check if need            el.qtip('hide'); 
        el.remove();
        if (sel_comp.length > 0) {
            if (this.parent.api.display.componentHighlightSelected(sel_comp)) {
                mlab.dt.ui.displayComponentTools(sel_comp);
            }
        } 
        this.parent.flag_dirty = true;
        if(requestDelete) {
            $.ajax(requestDelete)
                .done(function(data) {
                    that.parent.utils.update_app_title_bar(data.config)
                })
        }

        mlab.dt.utils.addHistory({
            type: 'component',
            app_id: that.parent.app.id,
            page: that.parent.app.curr_page_num,
            component: el.clone()
        });

        return true; 
        
    },
    
//gets a html page to show as help for making the component at dt
    component_help : function () {
        var comp_id = $(".mlab_current_component").data("mlab-type");
        var extended_name = this.parent.api.getLocaleComponentMessage(comp_id, ["extended_name"]);
        var owner_element = $(".mlab_help_icon");
        var qTipClass = 'mlab_comp_help_qTip';
        var title = _tr["mlab.dt.design.js.qtip.help.title"] + " - " + extended_name;
        this.parent.api.displayExternalHelpfile(comp_id, title, owner_element, qTipClass);           
    },
    
// undo deleted component and place it on bottom
    component_undo : function (objId) {
        var deletedElement = mlab.dt.utils.popHistory(objId);
        var that = this;
        
        if(deletedElement) {
            var resumeComponent = function() {
                that.parent.api.display.componentResume(deletedElement.component);
            };
            
            if(this.parent.app.curr_page_num != deletedElement.page) {
                mlab.dt.management.page_open(this.parent.app.id, deletedElement.page)
                .then(resumeComponent);
            } else {
                resumeComponent();
            }
        }
    },
    
//display list of deleted components
    component_trash : function () {
        var that = this,
            previewList = $('<ul class="mlab_undo_preview" onclick="$(\'#mlab_history\').hide();"></ul>'),
            preview_data, preview_html, el, comp_name;
    
        mlab.dt.history.map(function(history) {
// components *should* have a preview, if not we use name + icon
            comp_name = history.component.attr('data-mlab-type');
            preview_data = {}; //reset for each loop

//prepare preview data
            if (typeof mlab.dt.components[comp_name].code.preview === "function") {
                preview_data = mlab.dt.components[comp_name].code.preview(history.component);
            } 
            if (!preview_data["text"]) {
                preview_data["text"] = "";
            }
            if (!preview_data["image_url"]) {
                preview_data["image_url"] = mlab.dt.config.urls.component + comp_name + "/icon.png";
            }
            preview_html = "<img src='" + preview_data["image_url"] + "'>" + 
                           "<p>" + mlab.dt.api.getLocaleComponentMessage(comp_name, ["extended_name"]) + "<br>" +
                           preview_data["text"] + "<br>" +
                           "[From page: " + mlab.dt.app.page_names[history.page].title + "]" +
                           "</p>";
            
//create HTML element and display it
            el = $('<li></li>').html(preview_html);
            
// undo last deleted component and place it on bottom
            el.on('click', function() {
                that.component_undo(history.id);
                this.remove();
                mlab.dt.flag_dirty = true;
                $('#mlab_history').hide();
            });
            previewList.append(el);
        });
        $('#mlab_history').html(previewList).show();
    },
    
//cut and copy simply takes the complete outerHTML and puts it into a local variable, mlab.dt.clipboard
    component_cut : function () {
        var cut = true;
        mlab.dt.clipboard = $(".mlab_current_component").clone();
        this.component_delete(cut);
    },

    component_copy : function () {
        mlab.dt.clipboard = $(".mlab_current_component").clone();
    },

//when they past we need to go through similar checks as we do when adding a component, like is it unique, etc.
//also need to attach event handlers, etc, they are lost as 
    component_paste : function() {
        var that = this;
        if(typeof mlab.dt.clipboard == 'undefined' ) {
            return true;
        }

        var comp_id = mlab.dt.clipboard.data("mlab-type");
        if (this.parent.components[comp_id].conf.unique && $("#" + this.parent.config["app"]["content_id"]).find("[data-mlab-type='" + comp_id + "']").length > 0) {
            alert(_tr["mlab.dt.design.js.alert.only.one.comp"]);
            return;
        }
                
        $("#" + this.parent.config["app"]["content_id"]).append(mlab.dt.clipboard);
        if (this.parent.api.display.componentHighlightSelected(mlab.dt.clipboard)) {
            mlab.dt.ui.displayComponentTools(mlab.dt.clipboard);
        } else {
            //TODO - the check does not work.....
            mlab.dt.ui.displayComponentTools(mlab.dt.clipboard);
        }

        window.scrollTo(0,document.body.scrollHeight);
        mlab.dt.clipboard.on("click", function(){var prep_menu = mlab.dt.api.display.componentHighlightSelected($(this)); if (prep_menu) { mlab.dt.ui.displayComponentTools($(this)); } } )
        mlab.dt.clipboard.on("input", function(){mlab.dt.flag_dirty = true;});
        
//process all keys if this component wants to manipulate them (i.e. the process_keypress setting exists)
        if (typeof this.parent.components[comp_id].conf.process_keypress != "undefined" && this.parent.components[comp_id].conf.process_keypress) {
            $(mlab.dt.clipboard).keydown( function(e) { mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(e); } );
        }
        if (typeof this.parent.components[comp_id].conf.requires_network != "undefined" && this.parent.components[comp_id].conf.requires_network != "none") {
            $.ajax({
                type: "POST",
                data: {
                    execute: '\n\
                        if(isset($component["requires_network"]) && $component["requires_network"] != "none"){\n\
                            $counter = \'count\' . ucfirst($component["requires_network"]) . \'Comp\';\n\
                            isset($config[$counter]) OR $config[$counter] = 0;\n\
                            $config[$counter] += 1;\n\
                        }'
                },
                url: this.parent.urls.component_update_config.replace("_APPID_", this.parent.app.id).replace("_COMPID_", comp_id),
                dataType: "json"
            })
            .done(function(data) {
                that.parent.utils.update_app_title_bar(data.config)
            });
        }

               
        this.parent.flag_dirty = true;
        mlab.dt.clipboard = undefined;
    },
    
    component_edit_credentials : function () {
        var curr_comp = $(".mlab_current_component");
        var cred_el = $("[data-mlab-comp-tool='credentials']");
        var comp_id = curr_comp.data("mlab-type");
        if (Object.prototype.toString.call( this.parent.components[comp_id].conf.credentials ) === "[object Array]") {
            this.parent.api.getCredentials(cred_el, comp_id, this.parent.components[comp_id].conf.credentials, this.component_store_credentials, true, { component: curr_comp });
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
                    this.parent.utils.update_status("temporary", _tr["mlab.dt.design.js.update_status.feature.already.added"], false);
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

//if we are not working on the index page we need to tell the back end to update the index.html file
//otherwise this will be lost
        if (this.parent.app.curr_page_num != 0) {
            var url = this.parent.urls.feature_add.replace("_APPID_", this.parent.app.id);
            url = url.replace("_COMPID_", comp_id);
            if (!silent) {
                this.parent.utils.update_status("callback", _tr["mlab.dt.design.js.update_status.adding.feature"], true);
            }

            var that = this;
            $.get( url, function( data ) {
                if (data.result == "success") {
                    that.parent.utils.update_status("temporary", _tr["mlab.dt.design.js.update_status.feature.added"], false);
                    $("#mlab_features_list [data-mlab-feature-type='" + data.component_id + "']").addClass("mlab_item_applied");
                    

                } else {
                    that.parent.utils.update_status("temporary", data.msg, false);
                }

            });
        }
    },
    
/**
 * Function to add or remove storageplugin for a component. 
 * Add plugin:
 * storage_plugins are similar to features, except they are linked to individual components and not app as whole
 * They do nothing at design time so here we just call the back end to copy and add the code_rt.js file to the app
 * If credentials = true, we request credentials and store them for the component that this plugin was added to
 * 
 * Remove plugin:
 * Just need to set the storage_plugin variable that is stored with the omponent to ""
 * 
 * @param {type} el: list item showing name of storage plugin = currently clicked HTML element
 * @param {type} storage_plugin_id: unique ID of the storage plugin
 * @param {type} component: the component that wants to use this storage plugin
 */
    storage_plugin_setup: function(el, storage_plugin_id, component) {
        if (el.parent().attr("data-mlab-selected-storage")) {
            mlab.dt.api.setVariable(component, "storage_plugin", "");
            el.parent().removeClass("mlab_item_applied").removeAttr("data-mlab-selected-storage");      
        } else {
            var url = this.parent.urls.storage_plugin_add.replace("_APPID_", this.parent.app.id);
            url = url.replace("_STORAGE_PLUGIN_ID_", storage_plugin_id);
            this.parent.utils.update_status("callback", _tr["mlab.dt.design.js.update_status.adding.storage.plugin"], true);
            var that = this;
            $.get( url, function( data ) {
                var el = $("[data-mlab-get-info='storage_plugins'] [data-mlab-storage-plugin-type='" + data.storage_plugin_id + "']");
                if (data.result == "success") {
                    
//first remove data and classes from currently selected plugin, if any
                    el.parent().siblings().removeClass("mlab_item_applied").removeAttr("data-mlab-selected-storage");
                    
                    that.parent.utils.update_status("temporary", _tr["mlab.dt.design.js.update_status.storage.plugin.added"], false);
                    el.addClass("mlab_item_applied").attr("data-mlab-selected-storage", "true");

                    if (Object.prototype.toString.call( that.parent.components[storage_plugin_id].conf.credentials ) === "[object Array]") {
                        that.parent.api.getCredentials(el, storage_plugin_id, that.parent.components[storage_plugin_id].conf.credentials, that.storage_plugin_store_credentials, false, { storage_plugin_id: storage_plugin_id, component: component });
                    } else {
                        mlab.dt.api.setVariable(component, "storage_plugin", {name: storage_plugin_id});
                        $(mlab.dt.qtip_tools).qtip().elements.content.find("[data-mlab-storage-plugin-type='storage_plugins']").slideUp();
                    }

                } else {
                    that.parent.utils.update_status("temporary", data.msg, false);
                }

            });   
        }
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
                     .on("click", function(){var prep_menu = mlab.dt.api.display.componentHighlightSelected($(this)); if (prep_menu) { mlab.dt.ui.displayComponentTools($(this)); } })
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


/*
 * Turn the help in the footer and the footer on and off
 */
    toggle_footer : function () {

    var footer = $(".mlab_editor_footer");
    var footer_text = $(".mlab_editor_footer_help");
        if (footer.hasClass("mlab_transparent")) {
            footer.removeClass("mlab_transparent");
            footer_text.removeClass("mlab_hidden");
            //TODO toggle title as well
        } else {
            footer.addClass("mlab_transparent");
            footer_text.addClass("mlab_hidden");
        }
    },
    
} // end design.prototype


