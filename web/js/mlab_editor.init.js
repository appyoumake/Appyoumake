/*
 * All functions used in /src/Sinett/MLAB/BuilderBundle/Resources/views/App/build_app.html.twig
 * but not the data that has to come from TWIG. Therefore, see top of that page for data structures.
 */


/**
 * Standard initialisation of Mlab object which is referred to in several JS files, 
 * as these files can come down in different order, we must make sure we can use it here.
 */

if (typeof Mlab == "undefined") {
    Mlab = function () {
        var self = this;
        var documentOb = $(document);
    }
}

/* general variables used globally by different functions
   (variables with data from backend are loaded from the backend in the document.ready event and enters this file as JSON structures */

// State variables
    mlab_flag_dirty = false;
    mlab_counter_saving_page = 0; // counter which tells us if inside the save function we should restart the timer for
    mlab_drag_origin = 'sortable';
    mlab_timer_save = null;

//turn off automatic initialisation of mobile pages
    $.mobile.autoInitializePage = false;


/*********** Startup code ***********/
    $(document).ready(function() {
        console.log(bowser);
		if (bowser.gecko || bowser.chrome) {

        } else {
            alert("This web app will only work in Chrome/Chromium or Firefox");
            $("body").append('<div id="mlab_editor_disabled" style="background-color: gray; position: absolute;top:0;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50)"></div>');
        }

//here we pick up variables from the backend, if successful we go on, if not we must exit
        $.get( document.mlab_appbuilder_root_url + document.mlab_temp_app_id  + "/" + document.mlab_temp_page_num + "/load_variables" , function( data ) {

            if (data.result === "success") {
//unique ID for this tab/window, used to lock pages
                mlab_uid = data.mlab_uid;


//we use the email of the user to send them links to apps
                mlab_current_user_email = data.mlab_current_user_email;

//current app/page information, this will be updated when they create a new app or edit properties
                document.mlab_current_app = data.mlab_app;
                document.mlab_current_app.curr_page_num = data.mlab_app_page_num;
//checksum of current file
                document.mlab_current_app.app_checksum = data.mlab_app_checksum;

//configuration stuff from parameter.yml
                mlab_config = data.mlab_config;

//URLs can be changed using routes in MLAB, make sure we always use the latest and don't have hardwired ones
                mlab_urls = data.mlab_urls;

//constants/paths which are defined in parameteres.yml, a single object called mlab_config with everything in parameters.yml as sub objects
// so to get path of cordova executables we use mlab_config.cordova.bin_path, etc

                droppable_options = {
                    drop: function( event, ui ) {
                        mlab_flag_dirty = true;
                    }
                };

                sortable_options = {
                    placeholder: "mlab_component_placeholder",
                    revert: false,
                    helper: "clone",
                    cancel: "[contenteditable]",
                    stop: function(event, ui){
//make editable after dragging to sort
                        if (mlab_drag_origin == 'sortable' && ui.item.data("contenteditable") == "true") {
                            ui.item.attr("contenteditable", "true");
                        };
                        mlab_flag_dirty = true;
                    }
                };

/**** Finished preparing variables, now we set up rest of environment ****/

//check if the doc is modified, if so warn user, also unlock file
                window.onbeforeunload = function() {
                    var url = mlab_urls.editor_closed.replace("_UID_", mlab_uid);
                    $.ajax({ url: url, async: false });

                    if (mlab_flag_dirty) { return 'You have unsaved changes, do you want to lose these?'; }
                };

//when finally quit we tell the back end to delete all locks for this instance
                $( "#mlab_dialog_new_app" ).dialog({
                    title: "{% trans %}App details{% endtrans %}",
                    autoOpen: false,
                    show: { effect: "blind", duration: 500 },
                    hide: { effect: "blind", duration: 500 },
                    width: 900,
                    height: 500,
                    modal: true
                });

//set a scroll bar http://rocha.la/jQuery-slimScroll
//should be flexible: $("#mlab_editor_chrome").innerHeight()
                $("#" + mlab_config["app"]["content_id"]).slimScroll({
                    color: '#fff',
                    size: '10px',
                    height: '700px'
                });


//now we load components
                $.get( document.mlab_appbuilder_root_url + document.mlab_temp_app_id  + "/load_components" , function( data ) {
                    if (data.result === "success") {
                        var feature_list = $("<ul></ul>");
                        mlab_components = data.mlab_components;
                   		for (type in mlab_components) {
                            var c = mlab_components[type];
                            if (c.accessible && !c.is_feature) {
                                $("#mlab_toolbar_components").append(
                                        "<div data-mlab-type='" + type + "' " +
                                            "onclick='mlab_component_add(\"" + type + "\");' " +
                                            "title='" + c.conf.tooltip + "' " +
                                            "class='mlab_button_components' " +
                                            "style='background-image: url(\"" + mlab_config.urls.component + type + "/" + mlab_config.component_files.ICON + "\");'>" +
                                        "</div>"
                                );
                            } else if (c.accessible && c.is_feature) {
                                feature_list.append("<li data-mlab-feature-type='" + type + "' onclick='mlab_feature_add(\"" + type + "\", false);' title='" + $('<div/>').text(c.conf.tooltip).html() + "'>" + type.charAt(0).toUpperCase() + type.slice(1) + "</li>");
                            }
                        }

                        $("#mlab_features_list").html(feature_list);

//we always load pages using AJAX, this takes the parameters passed from the controller
                        mlab_app_open( document.mlab_temp_app_id, document.mlab_temp_page_num );

                    } else {
                        alert("Unable to load components from the server, cannot continue, will return to front page");
                        document.location.href = document.mlab_appbuilder_root_url;
                    }
                });

            } else {
                alert("Unable to load variables from the server, cannot continue, will return to front page");
                document.location.href = document.mlab_appbuilder_root_url;
            }

        });

          //get componetnt meny to stick to the top when scrollin dwon
          if (!!$('#mlab_toolbar_components').offset()) { // make sure ".sticky" element exists
          var stickyComponentTop = $('#mlab_toolbar_components').offset().top;

                        $(document).scroll(function(){ // scroll event
                            var windowTop = $(window).scrollTop(); // returns number

                            if (stickyComponentTop-40 < windowTop) {
                                $('#mlab_toolbar_components').css({ position: 'fixed', top: -40 });
                            }
                            else {
                                $('#mlab_toolbar_components').css('position','static');
                            }
                        });

           }

           //get componetnt meny to stick to the top when scrollin dwon
          if (!!$('#mlab_toolbar_for_components').offset()) { // make sure ".sticky" element exists
          var stickyComponentTop = $('#mlab_toolbar_for_components').offset().top;

                        $(document).scroll(function(){ // scroll event
                            var windowTop = $(window).scrollTop(); // returns number

                            if (stickyComponentTop-40 < windowTop) {
                                $('#mlab_toolbar_for_components').css({ position: 'fixed', top: 0, left: 655 });
                            }
                            else {
                                $('#mlab_toolbar_for_components').css('position','static');
                            }
                        });

           }



    });

/*
 *
 * @param divs (html/DOM) all divs to edit
 */
    function mlab_prepare_editable_area() {
//need to loop through all divs in the editable box after they have been added
//and set the styles for dragging/dropping so it works OK
        $( "#" + mlab_config["app"]["content_id"] + "> div" ).each(function( index ) {
            $( this ).droppable(droppable_options)
                     .sortable(sortable_options)
                     .on("click", function(){mlab_component_highlight_selected(this);})
                     .on("input", function(){mlab_flag_dirty = true;});

            comp_id = $( this ).data("mlab-type");
            mlab_component_run_code($( this ), comp_id);
        });

//set draggable/sortable options for the editable area
        $( "#" + mlab_config["app"]["content_id"] ).droppable(droppable_options).sortable(sortable_options);

    }


/**
 * This function is used to display status information, this can be permanent, temporary, or until callback is called, and may have a progress bar
 * If state is completed we get rid of temporary info and any gauges
 *
 * @param {type} state
 * @param {type} content
 * @returns {undefined}
*/
    function mlab_update_status(state, content, display_progress) {
        if (state == "permanent") {
            $("#mlab_statusbar_permanent").text(content);
            return;
        } else if (state == "temporary") {
            $("#mlab_statusbar_temporary").text(content);
            window.setInterval(mlab_clear_status, 3000);
        } else if (state == "callback") {
            $("#mlab_statusbar_temporary").text(content);
        } else if (state == "completed") {
            $("#mlab_statusbar_temporary").text('');
            $("#mlab_statusbar_progressbar").hide();
            return;
        }

        if (typeof display_progress != "undefined" && display_progress == true) {
            $("#mlab_statusbar_progressbar").show();
        } else if (typeof display_progress != "undefined" && display_progress == false) {
            $("#mlab_statusbar_progressbar").hide();
        }
    }

/**
 * Simple wrapper function to clear a temporary status
 * @returns {undefined} */
    function mlab_clear_status() {
        mlab_update_status("completed");
    }

/**
 * Create a timer to save the current page and stores it in a global variable
 * we call window.clearTimeout(mlab_timer_save) to stop it should it be required
 * @returns {undefined}
 */
function mlab_timer_start() {
    var tm = parseInt(mlab_config["save_interval"]);
    if (tm < 60) { tm = 60; }
    mlab_timer_save = window.setTimeout(mlab_page_save, tm * 1000);
    console.log("Restartet timer");
}

