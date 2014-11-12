/*
 * All functions used in /src/Sinett/MLAB/BuilderBundle/Resources/views/App/build_app.html.twig
 * but not the data that has to come from TWIG. Therefore, see top of that page for data structures.
 */



/* general variables used globally by different functions
   (variables with data from backend are loaded from the backend in the document.ready event and enters this file as JSON structures */


//turn off automatic initialisation of mobile pages
    $.mobile.autoInitializePage = false;


/*********** Startup code ***********/
    $(document).ready(function() {
		if (bowser.gecko || bowser.chrome) {

        } else {
            alert("This web app will only work in Chrome/Chromium or Firefox");
            $("body").append('<div id="mlab_editor_disabled" style="background-color: gray; position: absolute;top:0;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50)"></div>');
        }

//initialise the Mlab object, then create an global instance of it
//the MLAB object contains several other objects loaded in different files
        Mlab = function () {
            this.designMode = true;
            this.dt = function () {
                var self = this;

//variables used for: general config, path info, app info, page details
                this.uid = 0;
                this.config = new Object();
                this.paths = new Object();
                this.app = new Object();
                this.page = new Object();

// individual variables used by all .dt sub functions
                this.flag_dirty = false;
                this.counter_saving_page = 0; // counter which tells us if inside the save function we should restart the timer for
                this.drag_origin = 'sortable';
                
// drag'n'drop definitions used by jQuery
                this.droppable_options = {
                    drop: function( event, ui ) {
                        mlab.dt.flag_dirty = true;
                    }
                },

                this.sortable_options = {
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
                this.api = new Mlab_dt_api();
                this.api.parent = this;

                this.bestpractice = new Mlab_dt_bestpractice();
                this.bestpractice.parent = this;

                this.design = new Mlab_dt_design();
                this.design.parent = this;

                this.manage = new Mlab_dt_management();
                this.manage.parent = this;

                this.utils = new Mlab_dt_utils();
                this.utils.parent = this;
            }
            
//runtime api is at the top level
            this.api = new Mlab_api();
            this.api.parent = this;
        }

        mlab = new Mlab();

//here we pick up variables from the backend, if successful we go on, if not we must exit
        $.get( document.mlab_temp_vars.appbuilder_root_url + document.mlab_temp_vars.app_id  + "/" + document.mlab_temp_vars.page_num + "/load_variables" , function( data ) {

            if (data.result === "success") {
//unique ID for this tab/window, used to lock pages
                mlab.dt.uid = data.mlab_uid;

//we use the email of the user to send them links to apps
                mlab.dt.user_email = data.mlab_current_user_email;

//current app/page information, this will be updated when they create a new app or edit properties
                mlab.dt.app = data.mlab_app;
                mlab.dt.app.curr_page_num = data.mlab_app_page_num;
//checksum of current file
                mlab.dt.app.app_checksum = data.mlab_app_checksum;

//configuration stuff from parameter.yml
                mlab.dt.config = data.mlab_config;

//URLs can be changed using routes in MLAB, make sure we always use the latest from Symfony and don't have hardwired ones
                mlab.dt.urls = data.mlab_urls;


/**** Finished preparing variables, now we set up rest of environment ****/

//check if the doc is modified, if so warn user, also unlock file
                window.onbeforeunload = function() {
                    var url = mlab.dt.urls.editor_closed.replace("_UID_", mlab.dt.uid);
                    $.ajax({ url: url, async: false });

                    if (mlab.dt.flag_dirty) { return 'You have unsaved changes, do you want to lose these?'; }
                };

//set a scroll bar http://rocha.la/jQuery-slimScroll
//should be flexible: $("#mlab_editor_chrome").innerHeight()
                $("#" + mlab.dt.config["app"]["content_id"]).slimScroll({
                    color: '#fff',
                    size: '10px',
                    height: '700px'
                });


//now we load components
                $.get( document.mlab_temp_vars.appbuilder_root_url + document.mlab_temp_vars.app_id  + "/load_components" , function( data ) {
                    if (data.result === "success") {
                        var feature_list = $("<ul></ul>");
                        mlab.dt.components = data.mlab_components;
                   		for (type in mlab.dt.components) {
                            var c = mlab.dt.components[type];
                            if (c.accessible && !c.is_feature) {
                                $("#mlab_toolbar_components").append(
                                        "<div data-mlab-type='" + type + "' " +
                                            "onclick='mlab_component_add(\"" + type + "\");' " +
                                            "title='" + c.conf.tooltip + "' " +
                                            "class='mlab_button_components' " +
                                            "style='background-image: url(\"" + mlab.dt.config.urls.component + type + "/" + mlab.dt.config.component_files.ICON + "\");'>" +
                                        "</div>"
                                );
                            } else if (c.accessible && c.is_feature) {
                                feature_list.append("<li data-mlab-feature-type='" + type + "' onclick='mlab.dt.design.feature_add(\"" + type + "\", false);' title='" + $('<div/>').text(c.conf.tooltip).html() + "'>" + type.charAt(0).toUpperCase() + type.slice(1) + "</li>");
                            }
                        }

                        $("#mlab_features_list").html(feature_list);

//we always load pages using AJAX, this takes the parameters passed from the controller
                        mlab.dt.app.app_open( document.mlab_temp_vars.app_id, document.mlab_temp_vars.page_num );
                        
//erase the temporary variable, this is used in inititalisation process only.
                        delete document.mlab_temp_vars;
                    } else {
                        alert("Unable to load components from the server, cannot continue, will return to front page");
                        document.location.href = document.mlab_temp_vars.appbuilder_root_url;
                    }
                });

            } else {
                alert("Unable to load variables from the server, cannot continue, will return to front page");
                document.location.href = document.mlab_temp_vars.appbuilder_root_url;
            }

        });

    });


