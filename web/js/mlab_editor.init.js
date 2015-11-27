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
            alert(_tr["app.builder.mlab.js.alert.browser.support"]);
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

            },

            this.initialise_dt_parents = function () {
                self.dt.parent = self;
                self.dt.api.parent = self.dt;
                self.dt.api.display.parent = self.dt.api;
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

//any existing compiled files for this app
                mlab.dt.app.compiled_files = data.mlab_compiled_files;
                
//configuration stuff from parameter.yml
                mlab.dt.config = data.mlab_config;

//URLs can be changed using routes in MLAB, make sure we always use the latest from Symfony and don't have hardwired ones
                mlab.dt.urls = data.mlab_urls;


/**** Finished preparing variables, now we set up rest of environment ****/



//check if the doc is modified, if so warn user, also unlock file
                window.onbeforeunload = function() {
                    var url = mlab.dt.urls.editor_closed.replace("_UID_", mlab.dt.uid);
                    $.ajax({ url: url, async: false });

                    if (mlab.dt.flag_dirty) { return _tr["app.builder.mlab.js.alert.unsaved"] ; }
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
                                            "class='mlab_button_components' " +
                                            "style='background-image: url(\"" + mlab.dt.config.urls.component + type + "/" + mlab.dt.config.component_files.ICON + "\");'>" +
                                        "</div>" + 
                                        "<div class='mlab_component_tooltip'>" +
                                            c.conf.tooltip + " <a class='mlab_component_tooltip_more_link' href='#'>Mer...</a>" +
                                            "<div class='mlab_component_extended_tooltip'>" +
                                                c.conf.extended_tooltip +
                                            "</div>" +
                                         "</div>"
                                );
                            } else if (c.accessible && c.is_feature) {
                                feature_list.append("<li data-mlab-feature-type='" + type + "' onclick='mlab.dt.design.feature_add(\"" + type + "\", false);' title='" + $('<div/>').text(c.conf.tooltip).html() + "'>" + type.charAt(0).toUpperCase() + type.slice(1) + "</li>");
                            } else if (c.accessible && c.is_storage_plugin) {
                                storage_plugin_list.append("<li data-mlab-storage-plugin-type='" + type + "' onclick='mlab.dt.design.storage_plugin_add(\"" + type + "\", $(\".mlab_current_component\")[0]);' title='" + $('<div/>').text(c.conf.tooltip).html() + "'>" + type.charAt(0).toUpperCase() + type.slice(1) + "</li>");
                            }
                        }
                        
//When the component tooltips link is clicked the exteded help tekst for the component will show in the tooltip box
                        $( ".mlab_component_tooltip_more_link" ).on( "click", function() {
                            var extendedText = $(this).parent().find('.mlab_component_extended_tooltip').html();
                            mlab.dt.mlab_component_cur_tooltip.qtip('option', 'content.text', extendedText);
                        });
                      
//add the HTML generated in the component load loop above to their respecitve containers.
                        $("#mlab_features_list").html(feature_list);
                        $("#mlab_storage_plugin_list").html(storage_plugin_list);
                        
//now loop through all components and for those that inherit another we transfer properties
                        console.log(mlab.dt.components);
                        mlab.dt.utils.process_inheritance(mlab.dt.components);
                        console.log(mlab.dt.components);
                        
//finally we assign the API object to teh component, cannot do this earlier as it wolud otherwise create a loop to parents, etc 
//when trying to merge properties in the previous code block
                        for (index in mlab.dt.components) {
                            if (typeof mlab.dt.components[index].code != "undefined" && mlab.dt.components[index].code !== false) {
                                mlab.dt.components[index].code.api = mlab.dt.api;
                            }
                        }

//set the component qTip tooltip
//TODO use api.elements.tooltip
                        $('.mlab_button_components').each(function() {
                            $(this).qtip({
                            content: { text: $(this).next('.mlab_component_tooltip') },
                            position: { my: 'leftcenter', at: 'rightMiddle', adjust: { x: -14, y: -4, } },
                            events: {show: function(){ mlab.dt.mlab_component_cur_tooltip =  $(this);}
                            //,   hidden: function() { mlab.dt.mlab_component_cur_tooltip.qtip('option', 'content.text', "testy"); } 
                                },
                            hide:{ delay:500, fixed:true },//give a small delay to allow the user t mouse over it.
                            style: { "background-color": "white", color: "blue", classes: "mlab_qtip_tooltip" } } ) ;         
                        });
                                

            
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
                        
//prepare the menu popup for the component resizer
                        $("#mlab_button_component_size").click( function(event) {
                            var div = $("#mlab_component_size_list");
                            div.css({ position: "absolute", top: event.pageY, left: event.pageX })
                               .fadeIn("slow");
                        } );
                        
//prepare the menu popup for the component aspect ratio selector
                        $("#mlab_button_component_aspect").click( function(event) {
                            var div = $("#mlab_component_aspect_list");
                            div.css({ position: "absolute", top: event.pageY, left: event.pageX })
                               .fadeIn("slow");
                        } );
                        
// finally we connect to the websocket server, this returns data from server callback functions used when connectng to market or compiler services
                        var host = window.document.location.host.replace(/:.*/, '');
                        mlab.dt.services_web_socket = new WebSocket(mlab.dt.config.ws_socket.url_client + mlab.dt.config.ws_socket.path_client + '/' + mlab.dt.uid);
                        
                        mlab.dt.services_web_socket.onmessage = function (event) {
                            console.log(event);
                            data = JSON.parse(event.data);
                            switch (data.status) {
                                
//1: When click on menu, then it should indicate that the app is requested ( mlab.dt.management.js  -  compiler: {  get_app :)
//2: When the request has been processed by the PHP backend it should indicate one stage has passed (? -  case "connected"?)
//3: Then it should indicate that precompilation has taken place (may not be required, so a numeric is not good) (case "precompilation")
//4: createApp is called, this creates the empty app (case "creating"....case "created"?)
//5: Then files are uploaded (lengthy) (case "uploading"? (hoppe vider på case "verifying" og  case "verification_ok"- tar tid----)
//6: App upload finished, compilation starts (case "compiling"...case "compilation_ok")
//7: App is being (case "receiving":)
//8: App is ready (case "ready")

//Sette en grå versjon av iconet om siste versjon er kopilert?
// kan Andoid og iOS kopileres på samme tid?
// hva om man lagrer en ny versjon mens kompiler

                                case "connected":
                                    $("#mlab_progressbar").val(5);
                                    $("#mlab_statusbar_compiler").text("Creating app...connected to server");
                                    break;

                                case "creating":
                                    $("#mlab_progressbar").val(10);
                                    $("#mlab_statusbar_compiler").text("Creating app remotely...");
                                    //createApp is called, this creates the empty app
                                    break;

                                case "created":
                                    $("#mlab_progressbar").val(15);
                                    $("#mlab_statusbar_compiler").text("App created remotely");
                                    break;

                                case "create_failed":
                                    $("#mlab_statusbar_compiler").text("Failed to create app remotely");
                                    $("#mlab_download_android_icon").toggleClass('mlab_download_android_icon');
                                    $("#mlab_progressbar").hide();
                                    $("#mlab_download_android_icon").spin(false);
                                    //komme med en alert boks?
                                    $("#mlab_statusbar_compiler").text(" ");
                                    break;

                                case "precompilation":
                                    $("#mlab_progressbar").val(20);
                                    $("#mlab_statusbar_compiler").text("Processing files...");
                                    break;

                                case "uploading":
                                    $("#mlab_progressbar").val(25);
                                    $("#mlab_statusbar_compiler").text("Uploading files to compiler...");
                                    break;

                                case "verifying":
                                    $("#mlab_progressbar").val(30);
                                    $("#mlab_statusbar_compiler").text("Verifying upload...");
                                    break;

                                case "verification_ok":
                                    $("#mlab_progressbar").val(35);
                                    $("#mlab_statusbar_compiler").text("Files uploaded OK...");
                                    break;

                                case "verification_failed":
                                    $("#mlab_statusbar_compiler").text("Files failed to upload");
                                    $("#mlab_download_android_icon").toggleClass('mlab_download_android_icon');
                                    $("#mlab_progressbar").hide();
                                    $("#mlab_download_android_icon").spin(false);
                                    //komme med en alert boks?
                                    $("#mlab_statusbar_compiler").text(" ");
                                    break;

                                case "compiling":
                                    $("#mlab_progressbar").val(40);
                                    $("#mlab_statusbar_compiler").text("Waiting for compiler...");
                                    break;

                                case "compilation_ok":
                                    $("#mlab_progressbar").val(80);
                                    $("#mlab_statusbar_compiler").text("App compiled OK...");
                                    break;

                                case "compilation_failed":
                                    $("#mlab_statusbar_compiler").text("App failed to compile");
                                    $("#mlab_download_android_icon").toggleClass('mlab_download_android_icon');
                                    $("#mlab_progressbar").hide();
                                    $("#mlab_download_android_icon").spin(false);
                                    //komme med en alert boks?
                                    $("#mlab_statusbar_compiler").text(" ");
                                    break;

                                case "receiving":
                                    $("#mlab_progressbar").val(90);
                                    $("#mlab_statusbar_compiler").text("Receiving app...");
                                    break;

                                case "ready":
                                    $("#mlab_progressbar").val(100);
                                    //$("#mlab_download_android_icon").toggleClass('mlab_download_android_icon');
                                    $("#mlab_progressbar").hide();
                                    //TODO finne ut hvilken knapp som er trykket på å sette spinneren der
                                    $("#mlab_download_" + data.platform + "_icon").spin(false);
                                    
//inserting the QR code and url to the compiled app in the menu
                                    if (typeof data.filename != "undefined" && data.filename != null && data.filename != "") {
                                        mlab.dt.app.compiled_files[data.platform] = data.filename;
                                        var text = document.getElementsByTagName("base")[0].href.slice(0, -1) + "_compiled/" + data.filename;
                                        $("#mlab_download_qr_link_" + data.platform).empty().qrcode({text: text, size: 150, background: "#ffffff", foreground: "#000000", render : "table"});
                                        $("#mlab_download_link_" + data.platform).html("<b>URL</b>:</br>" + text);
                                    }     
                                    
                                    $("#mlab_statusbar_compiler").text("App ready! Links are found in the menu");
                                    //hvor lenge skal teksten stå??
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
