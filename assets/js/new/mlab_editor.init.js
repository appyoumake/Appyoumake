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

                    components_html = mlab.dt.utils.prepareComponents(data);
                    mlab.dt.ui.displayComponents(components_html);
                    

//we always load pages using AJAX, this takes the parameters passed from the controller
                    mlab.dt.management.app_open( document.mlab_temp_vars.app_id, document.mlab_temp_vars.page_num );

//erase the temporary variable, this is used in inititalisation process only.
                    delete document.mlab_temp_vars;


//prepare the menu popup for the storage plugin selector
/*SPSP                        $("[data-mlab-comp-tool='storage_plugin']").click( function(event) {
                        mlab.dt.api.closeAllPropertyDialogs();
                        var owner_element = event.currentTarget;
                        mlab.dt.api.properties_tooltip = $(owner_element).qtip({
                            solo: false,
                            content:    {text: $("data-mlab-get-info='storage_plugins'").clone(), title: _tr["mlab_editor.init.js.qtip.comp.storage.plugin.title"], button: true },
                            position:   { my: 'leftMiddle', at: 'rightMiddle', adjust: { screen: true } },
                            show:       { ready: true, modal: { on: true, blur: false } },
                            hide:       false,
                            events:     { hide: function(event, api) { api.destroy(); mlab.dt.api.properties_tooltip = false; } },
                            style:      { classes: "mlab_zindex_top_tooltip", tip: true }
                        });
                    } );*/

//add spinner to the statusbar to show when needed                   
                    $("#mlab_statusbar_progress_spin").spin('small', '#fff');

//assign click functions to tools
                    $("[data-mlab-comp-tool='move_up']").on("click", function () { mlab.dt.design.component_moveup(); });
                    $("[data-mlab-comp-tool='move_down']").on("click", function () { mlab.dt.design.component_movedown(); });
                    $("[data-mlab-comp-tool='delete']").on("click", function () { mlab.dt.design.component_delete(); });
                    $("[data-mlab-comp-tool='help']").on("click", function () { mlab.dt.design.component_help(); });
                    $("[data-mlab-comp-tool='cut']").on("click", function () { mlab.dt.design.component_cut(); });
                    $("[data-mlab-comp-tool='copy']").on("click", function () { mlab.dt.design.component_copy(); });
                    $("[data-mlab-comp-tool='paste']").on("click", function () { mlab.dt.design.component_paste(); });

//                    $("[data-mlab-comp-tool='redo']").on("click", function () { document.execCommand("redo"); });
//                    $("[data-mlab-comp-tool='undo']").on("click", function () { document.execCommand("undo"); });

                    $("[data-mlab-comp-tool='undo']").on("click", function () { mlab.dt.design.component_trash(); });
                    
                    $("#mlab_page_control_title").on("click", function () {
                        mlab.dt.api.editContent(this);
                        $('#mlab_page_control_title_actions').show();
                        $('#mlab_page_control_title').attr('title', _tr["app.builder.page.tooltip.page.name.edit"]);
                    });

                    $("#mlab_page_control_save_title").on("click", function () {
                        $('#mlab_page_control_title_actions').hide(); 
                        $('#mlab_page_control_title').attr('title', _tr["app.builder.page.tooltip.page.name"]);
                        mlab.dt.management.page_update_title();
                    });

                    $("#mlab_page_control_cancel_title").on("click", function () {
                        $('#mlab_page_control_title_actions').hide(); 
                        $('#mlab_page_control_title').attr('title', _tr["app.builder.page.tooltip.page.name"]);
                        $('#mlab_page_control_title').text(mlab.dt.app.curr_pagetitle);
                    });
    
                    $("#mlab_page_control_new").on("click", function () { mlab.dt.management.page_new(); });
                    $("#mlab_page_control_import").on("click", function () {
                        $( "#mlab_dialog_import" ).dialog({ resizable: false, height:120, modal: true });
                    });
                    
                    
                    $("#mlab_page_control_delete").on("click", function () { mlab.dt.management.page_delete(); });

                    $("#mlab_page_help").on("click", function () { page_help(event); });

//trun on and off footer help
                    $("#mlab_button_help").on("click", function () { mlab.dt.design.toggle_footer(); });


//Checks if the editor menu icon is cliked
                    $("#mlab_editor_menu_dropdown").on("click",function(event) { 
                        if ($('#mlab_user_menu_dropdown_content').hasClass('mlab_show_user_dropdown')) {
//User menu is open and needs to be closed 
                            $('#mlab_user_menu_dropdown_content').toggleClass('mlab_show_user_dropdown'); 
                            $('#mlab_user_menu_dropdown').toggleClass('mlab_show_user_dropdown_tab_selected'); 
                        } 
//Toggles the Editor menu on and off
                        $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                        $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        event.stopPropagation(); 
                    });

//Checks if the user menu icon is cliked
                    $("#mlab_user_menu_dropdown").on("click",function(event) { 
                        if ($('#mlab_editor_menu_dropdown_content').hasClass('mlab_show_editor_dropdown')) {
//Editor menu is open and needs to be closed 
                            $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                            $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        } 
//Toggles the User menu on and off
                        $('#mlab_user_menu_dropdown_content').toggleClass('mlab_show_user_dropdown'); 
                        $('#mlab_user_menu_dropdown').toggleClass('mlab_show_user_dropdown_tab_selected'); 
                        event.stopPropagation(); 
                    });

//Checkes if the page menu icon is cliked
                    $("#mlab_page_control_pagelist").on("click",function(event) { 
//User menu is open and needs to be closed 
                        $('#mlab_page_management').toggleClass('mlab_show');
                        event.stopPropagation(); 
                    });

//Listens for any click
                    $(document).on('click', function (event) {
// Checks if editor menu is open
                        if ($('#mlab_editor_menu_dropdown_content').hasClass('mlab_show_editor_dropdown')) {
//Editor menu is open - close it
                            $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                            $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        } 
                        
// Checks if user menu is open
                        if ($('#mlab_user_menu_dropdown_content').hasClass('mlab_show_user_dropdown')) {
//User menu is open - close it
                            $('#mlab_user_menu_dropdown_content').toggleClass('mlab_show_user_dropdown'); 
                            $('#mlab_user_menu_dropdown').toggleClass('mlab_show_user_dropdown_tab_selected'); 
                        } 
                        
// Checks if page menu is open
                        if ($('#mlab_page_management').hasClass('mlab_show')) {
//User menu is open and needs to be closed 
                            $('#mlab_page_management').toggleClass('mlab_show'); 
                        } 
                    });  

//save page button in the editor menu 
                    $("#mlab_page_save_all").on("click", function () { 
                        var temp; 
                        mlab.dt.management.page_save(temp, true); 
//Editor menu is open - close it
                        $('#mlab_editor_menu_dropdown_content').toggleClass('mlab_show_editor_dropdown'); 
                        $('#mlab_editor_menu_dropdown').toggleClass('mlab_show_editor_dropdown_tab_selected'); 
                        return false; 
                    });


                    $("[data-mlab-comp-tool='storage_plugin']").on("click", function () { 
                        var el = $(this).siblings("[data-mlab-get-info='storage_plugins']");
                        if( !el.is(":visible")) { 
                            el.html(mlab.dt.api.getStoragePluginList(mlab.dt.api.getSelectedComponent()));
                        }
                        el.slideToggle();
                    });
                    
                    $("[data-mlab-comp-tool='credentials']").on("click", function () { mlab.dt.design.component_edit_credentials(); });
                    
//prepare the menu popup for the component resizer
                    $("[data-mlab-comp-tool='comp_size']").on("click", function (event) { 
                        mlab.dt.api.closeAllPropertyDialogs();
                        var owner_element = event.currentTarget;
                        mlab.dt.api.properties_tooltip = $(owner_element).qtip({
                            solo: false,
                            content:    {text: $("#mlab_component_size_list").clone(), title: _tr["mlab_editor.init.js.qtip.comp.size.title"], button: true },
                            position:   { my: 'leftMiddle', at: 'rightMiddle', viewport: $(window)},
                            show:       { ready: true, modal: { on: true, blur: false } },
                            hide:       false,
                            style:      { classes: "mlab_zindex_top_tooltip", tip: true },
                            events:     { hide: function(event, api) { api.destroy(); mlab.dt.api.properties_tooltip = false; },
                                          visible: function() {  
                                            $("[data-mlab-comp-size='small']").on("click", function () { 
                                                mlab.dt.api.display.setSize($(".mlab_current_component"), "small");
                                                $("[data-mlab-get-info='comp_sizes']").hide();
                                            });

                                            $("[data-mlab-comp-size='medium']").on("click", function () { 
                                                mlab.dt.api.display.setSize($(".mlab_current_component"), "medium");
                                                $("[data-mlab-get-info='comp_sizes']").hide();
                                            });

                                            $("[data-mlab-comp-size='large']").on("click", function () { 
                                                mlab.dt.api.display.setSize($(".mlab_current_component"), "large");
                                                $("[data-mlab-get-info='comp_sizes']").hide();
                                            });
                                            
                                          }
                                        }
                        });
                    } );
                    
                   

//prepare the menu popup for the component aspect ratio selector
                    $("[data-mlab-comp-tool='comp_aspect']").on("click", function (event) {
                        mlab.dt.api.closeAllPropertyDialogs();
                        var owner_element = event.currentTarget;
                        mlab.dt.api.properties_tooltip = $(owner_element).qtip({
                            solo: false,
                            content:    {text: $("#mlab_component_aspect_list").clone(), title: _tr["mlab_editor.init.js.qtip.comp.aspect.title"], button: true },
                            position:   { my: 'leftMiddle', at: 'rightMiddle', viewport: $(window)},
                            show:       { ready: true, modal: { on: true, blur: false } },
                            hide:       false,
                            style:      { classes: "mlab_zindex_top_tooltip", tip: true },
                            events:     { hide: function(event, api) { api.destroy(); mlab.dt.api.properties_tooltip = false; }, 
                                          visible: function() {  
                                            $("[data-mlab-comp-aspect='4:3']").on("click", function () { 
                                                mlab.dt.api.display.setAspectRatio($(".mlab_current_component"), "4:3");
                                                $("[data-mlab-get-info='comp_aspects']").hide();
                                            });

                                            $("[data-mlab-comp-aspect='16:9']").on("click", function () { 
                                               mlab.dt.api.display.setAspectRatio($(".mlab_current_component"), "16:9");
                                                $("[data-mlab-get-info='comp_aspects']").hide();
                                            });

                                            $("[data-mlab-comp-aspect='1:1']").on("click", function () { 
                                                mlab.dt.api.display.setAspectRatio($(".mlab_current_component"), "1:1");
                                                $("[data-mlab-get-info='comp_aspects']").hide();
                                            });
                                          }
                                        }
                        });
                    });
                    
//prepare qtip for the credit of the icon use
                    $('#mlab_credit_icons').qtip({
                        hide:{ delay:500, fixed:true },//give a small delay
                        position:   { my: 'left bottom', at: 'right center', adjust: { screen: true } },
                        content: {text: function(){ return $("<div>The icons on this page are made by <a href='http://www.freepik.com' target='_blank' title='Freepik'>Freepik</a>, <a href='http://www.flaticon.com/authors/simpleicon' target='_blank' title='SimpleIcon'>SimpleIcon</a>, <a href='http://www.flaticon.com/authors/dave-gandy' target='_blank' title='Dave Gandy'>Dave Gandy</a>, <a href='http://www.flaticon.com/authors/anton-saputro' target='_blank' title='Anton Saputro'>Anton Saputro</a> and <a href='http://www.flaticon.com/authors/yannick' target='_blank' title='Yannick'>Yannick</a> from <a href='http://www.flaticon.com' target='_blank' title='Flaticon'>www.flaticon.com</a> and are licensed by <a href='http://creativecommons.org/licenses/by/3.0/' target='_blank' title='Creative Commons BY 3.0'>CC BY 3.0</a> - and many are made by the Sinett project at FFI.no</div>").html()},
                        title: { text: "Credit for icons" } },
                        style: { classes: "mlab_qtip_tooltip mlab_qtip_menu_tooltip" }
                    });

//prepare qtip for the credit of the icon use
                     $('#mlab_credit_icons').qtip({
                         hide:{ delay:500, fixed:true },//give a small delay
                         position:   { my: 'left bottom', at: 'right center', viewport: $(window) },
                         content: {text: function(){ return $("<div>The icons on this page are made by <a href='http://www.freepik.com' target='_blank' title='Freepik'>Freepik</a>, <a href='http://www.flaticon.com/authors/simpleicon' target='_blank' title='SimpleIcon'>SimpleIcon</a>, <a href='http://www.flaticon.com/authors/dave-gandy' target='_blank' title='Dave Gandy'>Dave Gandy</a>, <a href='http://www.flaticon.com/authors/anton-saputro' target='_blank' title='Anton Saputro'>Anton Saputro</a> and <a href='http://www.flaticon.com/authors/yannick' target='_blank' title='Yannick'>Yannick</a> from <a href='http://www.flaticon.com' target='_blank' title='Flaticon'>www.flaticon.com</a> and are licensed by <a href='http://creativecommons.org/licenses/by/3.0/' target='_blank' title='Creative Commons BY 3.0'>CC BY 3.0</a> - and many are made by the Sinett project at FFI.no</div>").html()},
                         title: { text: "Credit for icons" } },
                         style: { classes: "mlab_qtip_tooltip mlab_qtip_menu_tooltip", tip: true }
                     });
 
//prepare qtip for the download of app buttons
                    $.each(mlab.dt.config.compiler_service.supported_platforms, function(index, platform) {
                        $('#mlab_download_'+ platform + '_icon').qtip({
                            hide:{ delay:500, fixed:true },//give a small delay to allow the user t mouse over it.
                            content: {text: function(){ return $("[data-mlab-download-link-info='" + platform + "']").html()},
                            title: { text: _tr["mlab_editor.init.js.qtip.download.app.title"] + " " + platform } },
                            style: { classes: "mlab_qtip_tooltip mlab_qtip_menu_tooltip", tip: true }
                        });
                    });

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
    
    
