/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no) additional functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract All functions used in /src/Sinett/MLAB/BuilderBundle/Resources/views/App/build_app.html.twig
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
            history: [],

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
            ui: new Mlab_dt_ui(),

        },

        this.initialise_dt_parents = function () {
            self.dt.parent = self;
            self.dt.api.parent = self.dt;
            self.dt.api.display.parent = self.dt.api;
            self.dt.bestpractice.parent = self.dt;
            self.dt.design.parent = self.dt;
            self.dt.management.parent = self.dt;
            self.dt.utils.parent = self.dt;
            self.dt.ui.parent = self.dt;
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
            if (isNaN(data.mlab_app_page_num)) {
                console.log("Error, expecting page number");
                alert("Error, expecting page number, try to refresh");
                return;
            } else {
                mlab.dt.app.curr_page_num = data.mlab_app_page_num;
            }
//checksum of current file
            mlab.dt.app.app_checksum = data.mlab_app_checksum;

//any existing compiled files for this app
            mlab.dt.app.compiled_files = data.mlab_compiled_files;

//configuration stuff from parameter.yml
            mlab.dt.config = data.mlab_config;

//URLs can be changed using routes in MLAB, make sure we always use the latest from Symfony and don't have hardwired ones
            mlab.dt.urls = data.mlab_urls;
            
            mlab.dt.app.config = data.mlab_app_config;


/**** Finished preparing variables, now we set up rest of environment ****/


//check if the doc is modified before closeing it, if so warn user, also unlock file and save component accordion expand collaps state
            window.onbeforeunload = function() {
                var url = mlab.dt.urls.editor_closed.replace("_UID_", mlab.dt.uid);
                $.ajax({ url: url, async: false });

                if (mlab.dt.flag_dirty) { return _tr["mlab_editor.init.js.alert.unsaved"] ; }

            };

//now we load components, the go into a mlab object called components,
//and for each component we need to turn the text of the
            $.get( document.mlab_temp_vars.appbuilder_root_url + document.mlab_temp_vars.app_id  + "/load_components" , function( data ) {
                if (data.result === "success") {

                    var loc = mlab.dt.api.getLocale();
                    mlab.dt.components = data.mlab_components;
                    mlab.dt.storage_plugins = {};
                    var components_html = {};
                    var category_translations = {};
                    var features_html = [];
                    var additional_html = "";
                    var comp_type;

//loop to clean up components so that there are no duplicate order_by entries and also generate JS code from text in code_dt.js file
                    var temp_comp_order = [];
                    for (comp_id in mlab.dt.components) {
                        temp_comp_order.push(parseInt(mlab.dt.components[comp_id].order_by));
//we need to attach the code_dt.js content to an object so we can use it as JS code
                        if (mlab.dt.components[comp_id].code !== false) {
                            eval("mlab.dt.components['" + comp_id + "'].code = new function() { " + mlab.dt.components[comp_id].code + "};");
                        }
                    }
                    temp_comp_order.sort(function(a, b) {return a - b;});

//now loop through all components and for those that inherit another we transfer properties
                    mlab.dt.utils.process_inheritance(mlab.dt.components);

//second loop which is for displaying the tools loaded & prepared above in the editor page
                    for (comp_id in mlab.dt.components) {
//here we create the conf object inside the newly created code object, this way we can access the configuration details inside the code
                        mlab.dt.components[comp_id].code.config = mlab.dt.components[comp_id].conf;
                        var c = mlab.dt.components[comp_id];
                        if (c.accessible && !(c.is_storage_plugin)) {

//prepare the tooltips (regular/extended). Can be a string, in which use as is, or an key-value object, if key that equals mlab.dt.api.getLocale() is found use this, if not look for one called "default"
                            var tt = mlab.dt.api.getLocaleComponentMessage(comp_id, ["tooltip"]);
                            var tte = mlab.dt.api.getLocaleComponentMessage(comp_id, ["footer_tip"]);
                            var eName = mlab.dt.api.getLocaleComponentMessage(comp_id, ["extended_name"]);

//the category setting in the conf.yml files
                            if (typeof components_html[c.conf.category] == "undefined") {
                                components_html[c.conf.category] = [];
                                category_translations[c.conf.category] = mlab.dt.api.getLocaleComponentMessage(comp_id, ["category_name"]);
                            }                                

                            if (c.is_feature) {
                                comp_type = "feature";
                            } else {
                                comp_type = "component";
                            }
                            
                            var pos = temp_comp_order.indexOf(parseInt(c.order_by));
                            delete temp_comp_order[pos];
                            components_html[c.conf.category][pos] = "<div data-mlab-type='" + comp_id + "' " +
                                        "onclick='mlab.dt.design." + comp_type + "_add(\"" + comp_id + "\");' " +
                                        "title='" + tt + "' " +
                                        "class='mlab_button_components' " +
                                        "style='background-image: url(\"" + mlab.dt.config.urls.component + comp_id + "/" + mlab.dt.config.component_files.ICON + "\");'>" +
                                    "</div>" + 
                                    "<div class='mlab_component_footer_tip'>" +
                                            tte +
                                     "</div>";
                        } else if (c.accessible && c.is_storage_plugin) {
                            mlab.dt.storage_plugins[comp_id] = eName;
                        }
                    }

//TODO now first category is hardcoded to be text...
//If the first category of components does not have a cookie it moste likely that none of the mlabCompCatxxx cookies are made (first time users or deleted cookies) - so set the first categroy to expand 
                    var cookieExists = mlab.dt.utils.getCookie("mlabCompCattext");
                    if (cookieExists === 1){
//Cookie for first category not found - set cookie so it will be expanded
                        document.cookie="mlabCompCattext=0; expires=Thu, 18 Dec 2053 12:00:00 UTC; path=/";
                    }

//Puts all components under the same category and adds an accordion to the categroy collapsed or expanded depending on the coockie state 
                    for  (category in components_html) {
                        var activeCat = Number(mlab.dt.utils.getCookie("mlabCompCat" + category));
                        $("<div><h3 data-mlab-category='" + category + "'><div class='mlab_category_name'>" + category_translations[category] + "</div></h3><div>" + components_html[category].join("") + "</div></div>").appendTo("#mlab_toolbar_components").accordion({
                            heightStyle: "content",
                            active: activeCat,
                            collapsible: true
                        });
                    } 


//finally we assign the API object to the component, cannot do this earlier as it would create a loop to parents, etc 
//when trying to merge properties in the previous code block
                    for (index in mlab.dt.components) {
                        if (typeof mlab.dt.components[index].code != "undefined" && mlab.dt.components[index].code !== false) {
                            mlab.dt.components[index].code.api = mlab.dt.api;
                        }
                        
//added to inherit HTML to the additional mlab.dt.components.html which is set in loadSingleComponent in /src/Sinett/MLAB/BuilderBundle/FileManagement/FileManagement.php
                        if (!mlab.dt.components[index].html && mlab.dt.components[index].conf.inherit) {
                            mlab.dt.components[index].html = mlab.dt.components[mlab.dt.components[index].conf.inherit].html;
                        }
                    }

                    components_html = mlab.dt.utils.prepareComponents(data);
                    mlab.dt.ui.displayComponents(components_html);
                    

//we always load pages using AJAX, this takes the parameters passed from the controller
                    mlab.dt.management.app_open( document.mlab_temp_vars.app_id, document.mlab_temp_vars.page_num );

//erase the temporary variable, this is used in inititalisation process only.
                    delete document.mlab_temp_vars;

                } else {
                    alert(_tr["mlab_editor.init.js.compiling.failed.loading.comps"]);
                    //document.location.href = document.mlab_temp_vars.appbuilder_root_url;
                }
            });

        } else {
            alert(_tr["mlab_editor.init.js.compiling.failed.loading.var"]);
            //document.location.href = document.mlab_temp_vars.appbuilder_root_url;
        }
    });

});
    
    