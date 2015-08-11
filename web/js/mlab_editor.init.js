/*
 * All functions used in /src/Sinett/MLAB/BuilderBundle/Resources/views/App/build_app.html.twig
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
            alert("This web app will only work in Chrome/Chromium or Firefox");
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

// individual variables used by all .dt sub functions
                flag_dirty: false,
                counter_saving_page: 0, // counter which tells us if inside the save function we should restart the timer for
                drag_origin: 'sortable',

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

            },

            this.initialise_dt_parents = function () {
                self.dt.parent = self;
                self.dt.api.parent = self.dt;
                self.dt.bestpractice.parent = self.dt;
                self.dt.design.parent = self.dt;
                self.dt.management.parent = self.dt;
                self.dt.utils.parent = self.dt;
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

//now we load components, the go into a mlab object called components,
//and for each component we need to turn the text of the
                $.get( document.mlab_temp_vars.appbuilder_root_url + document.mlab_temp_vars.app_id  + "/load_components" , function( data ) {
                    if (data.result === "success") {
                        var feature_list = $("<ul></ul>");
                        var storage_plugin_list = $("<ul></ul>");
                        mlab.dt.components = data.mlab_components;

                        for (type in mlab.dt.components) {
                            
//we need to attach the code_dt.js content to an object so we can use it as JS code
                            if (mlab.dt.components[type].code !== false) {
                                eval("mlab.dt.components['" + type + "'].code = new function() { " + mlab.dt.components[type].code + "};");

//here we create the conf object inside the newly created code object, this way we can access the configuration details inside the code
                                mlab.dt.components[type].code.config = mlab.dt.components[type].conf;

                            }
                            var c = mlab.dt.components[type];
                            if (c.accessible && !(c.is_feature || c.is_storage_plugin)) {
                                $("#mlab_toolbar_components").append(
                                        "<div data-mlab-type='" + type + "' " +
                                            "onclick='mlab.dt.design.component_add(\"" + type + "\");' " +
                                            "title='" + c.conf.tooltip + "' " +
                                            "class='mlab_button_components' " +
                                            "style='background-image: url(\"" + mlab.dt.config.urls.component + type + "/" + mlab.dt.config.component_files.ICON + "\");'>" +
                                        "</div>"
                                );
                            } else if (c.accessible && c.is_feature) {
                                feature_list.append("<li data-mlab-feature-type='" + type + "' onclick='mlab.dt.design.feature_add(\"" + type + "\", false);' title='" + $('<div/>').text(c.conf.tooltip).html() + "'>" + type.charAt(0).toUpperCase() + type.slice(1) + "</li>");
                            } else if (c.accessible && c.is_storage_plugin) {
                                storage_plugin_list.append("<li data-mlab-storage-plugin-type='" + type + "' onclick='mlab.dt.design.storage_plugin_add(\"" + type + "\", $(\".mlab_current_component\")[0]);' title='" + $('<div/>').text(c.conf.tooltip).html() + "'>" + type.charAt(0).toUpperCase() + type.slice(1) + "</li>");
                            }
                        }

//add the HTML generated in the component load loop above to their respecitve containers.
                        $("#mlab_features_list").html(feature_list);
                        $("#mlab_storage_plugin_list").html(storage_plugin_list);
                        
//now loop through all components and for those that inherit another we transfer properties
                        for (index in mlab.dt.components) {
                            if (!mlab.dt.components[index].is_feature && !mlab.dt.components[index].is_storage_plugin && typeof mlab.dt.components[index].code.config["inherit"] != "undefined") {
                                var from = mlab.dt.components[index].code.config.inherit;
                                if (typeof mlab.dt.components[from] != "undefined") {
                                    
//we copy top level objectsm and objects within the code and and code.config objects
                                    mlab.dt.components[index] = mlab.dt.utils.merge_objects(mlab.dt.components[from], mlab.dt.components[index]);
                                } else {
                                    console.log("Parent object does not exist");
                                }
                            }
                        }
                        
//finally we assign the API object to teh component, cannot do this earlier as it wolud otherwise create a loop to parents, etc 
//when trying to merge properties in the previous code block
                        for (index in mlab.dt.components) {
                            if (typeof mlab.dt.components[index].code != "undefined" && mlab.dt.components[index].code !== false) {
                                mlab.dt.components[index].code.api = mlab.dt.api;
                            }
                        }


//we always load pages using AJAX, this takes the parameters passed from the controller
                        mlab.dt.management.app_open( document.mlab_temp_vars.app_id, document.mlab_temp_vars.page_num );

//erase the temporary variable, this is used in inititalisation process only.
                        delete document.mlab_temp_vars;
                        
//prepare the menu popup for the storage plugin selector
                        $("#mlab_button_select_storage_plugin").click( function(event) {
                            
                            var div = $("#mlab_storage_plugin_list");
                            
                            div.css({ position: "absolute", top: event.pageY, left: event.pageX })
                               .fadeIn("slow");
                        } );
                        
// finally we connect to the websocket server, this returns data from server callback functions used when connectng to market or compiler services
                        var host = window.document.location.host.replace(/:.*/, '');
                        mlab.dt.services_web_socket = new WebSocket('ws://' + host + ':' + mlab.dt.config.ws_socket.port + mlab.dt.config.ws_socket.url + '/' + mlab.dt.uid);

                        mlab.dt.services_web_socket.onmessage = function (event) {
                            console.log(event);
                            data = JSON.parse(event.data);
                            switch (data.status) {
                                case "connected":
                                    $("#mlab_statusbar_compiler").text("Connected to server");
                                    break;

                                case "creating":
                                    $("#mlab_statusbar_compiler").text("Creating app remotely...");
                                    break;

                                case "created":
                                    $("#mlab_statusbar_compiler").text("App created remotely");
                                    break;

                                case "create_failed":
                                    $("#mlab_statusbar_compiler").text("Failed to create app remotely");
                                    break;

                                case "precompilation":
                                    $("#mlab_statusbar_compiler").text("Processing files...");
                                    break;

                                case "uploading":
                                    $("#mlab_statusbar_compiler").text("Uploading files to compiler...");
                                    break;

                                case "verifying":
                                    $("#mlab_statusbar_compiler").text("Verifying upload...");
                                    break;

                                case "verification_ok":
                                    $("#mlab_statusbar_compiler").text("Files uploaded OK...");
                                    break;

                                case "verification_failed":
                                    $("#mlab_statusbar_compiler").text("Files failed to upload");
                                    break;

                                case "compiling":
                                    $("#mlab_statusbar_compiler").text("Waiting for compiler...");
                                    break;

                                case "compilation_ok":
                                    $("#mlab_statusbar_compiler").text("App compiled OK...");
                                    break;

                                case "compilation_failed":
                                    $("#mlab_statusbar_compiler").text("App failed to compile");
                                    break;

                                case "receiving":
                                    $("#mlab_statusbar_compiler").text("Receiving app...");
                                    break;

                                case "ready":
                                    $("#mlab_statusbar_compiler").text("App ready!");
                                    break;

                                case "failed":
                                    $("#mlab_statusbar_compiler").text("Unable to get app: " + data.error);
                                    break;
                            }
                            
                        };

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


