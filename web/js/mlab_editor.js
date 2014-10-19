/* 
 * All functions used in /src/Sinett/MLAB/BuilderBundle/Resources/views/App/build_app.html.twig
 * but not the data that has to come from TWIG. Therefore, see top of that page for data structures.
 */

/* Constants used by components to obtain environment information */
/* key issue here is that the component do not need to know anything about configuration */
    MLAB_CB_URL_APP_ABSOLUTE = 1; //various URLs that are required
    MLAB_CB_URL_APP_RELATIVE = 2;
    MLAB_CB_URL_COMPONENT_ABSOLUTE = 3;
    MLAB_CB_URL_COMPONENT_RELATIVE = 4;
    MLAB_CB_URL_TEMPLATE_ABSOLUTE = 5;
    MLAB_CB_URL_TEMPLATE_RELATIVE = 6;
    MLAB_CB_URL_UPLOAD_ABSOLUTE = 7;
    MLAB_CB_URL_UPLOAD_RELATIVE = 8;
    MLAB_CB_GET_MEDIA = 9; //get a list of uploaded media
    MLAB_CB_GET_TEMPLATE_RULES = 10; //get the object with rules, such as max charavcters, max length, etc
    MLAB_CB_GET_GUID = 11; //generates a GUID and returns it
    MLAB_CB_GET_LIBRARIES = 12; //get required libraries as specified in conf.txts
    MLAB_CB_GET_VERSION = 13; //get api version as defined below
    MLAB_CB_GET_SELECTED_COMPONENT = 14; //get currently selected component (the DIV, not the internal HTML code)
    MLAB_CB_SET_DIRTY = 15; //set the global dirty flag
    MLAB_CB_GET_EDITOR_ELEMENT = 16; //get the DIV that is the ontainer for the editable area
    MLAB_CB_GET_ENV = 17;
    MLAB_CB_CLOSE_ALL_PROPERTY_DIALOGS = 18;
    MLAB_CB_EDIT_CONTENT = 19;


/* general variables used globally by different functions 
   (variables with data from backend are loaded from the backend in the document.ready event and enters this file as JSON structures */

// State variables
    mlab_flag_dirty = false;
    mlab_counter_saving_page = 0; // counter which tells us if inside the save function we should restart the timer for 
    mlab_drag_origin = 'sortable';
    mlab_timer_save = null;
    mlab_api_version = 0.1;
    document.mlab_cp_storage = new Object();

//PERHAPS USE THIS TOGETHER WITH ARRAY OF FIELDNAMES MATCHING APP TABLE AND RENAME TEXT FIELDS...
    mlab_flag_meta_dirty = new Array();

//turn off automatic initialisation of mobile pages
    $.mobile.autoInitializePage = false;

/*********** Startup code ***********/  
    $(document).ready(function() {
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

                            if (stickyComponentTop < windowTop) {
                                $('#mlab_toolbar_components').css({ position: 'fixed', top: 0 });
                            }
                            else {
                                $('#mlab_toolbar_components').css('position','static');
                            }
                        });
                        
           } 

    });



/***********************************************************
 ******************* App level functions *******************
************************************************************/

/*
 * This function will first open the index.html file in an app, this has all the css/js/formatting etc in it.
 * Then it will open the page specified (if it is not == index | 0 )
 * @param {type} app_id
 * @param {type} page_num
 */
    function mlab_app_open(app_id, page_num) {

        var local_page_num = page_num;
        var url = mlab_urls.page_get.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", 'index');
        url = url.replace("_UID_", mlab_uid);
        mlab_update_status("callback", 'Opening app', true);

        $.get( url, function( data ) {
            if (data.result == "success") {
                mlab_index_page_process ( data.html, "index");
                
//update the list of features we have added to this app
                $("#mlab_features_list li").removeClass("mlab_features_used");
                $(document.mlab_current_app.curr_indexpage_html)
                    .find("#mlab_features_content [data-mlab-type]>")
                    .each(function() { 
                        $("#mlab_features_list [data-mlab-feature-type='" + $(this).parent().data("mlab-type") + "']").addClass("mlab_features_used");
                     });

//if they are not opening the index page we need to call backend again to load the page they want to open
                if (local_page_num != "0" && local_page_num != "index") {
                    mlab_page_open_process(data.app_id, local_page_num);
                } else {
                    $("#mlab_overlay").slideUp();
                    document.mlab_current_app.locked = (data.lock_status == "locked");
                    mlab_timer_start();
                }
            } else {
                mlab_update_status("temporary", data.msg, false);
            }

        });
    } 
    
    function mlab_app_update_metadata(el) {
        $(el).next().slideUp();
        switch ($(el).attr("id")) {
            case "mlab_edit_app_title" :
                break;

            case "mlab_edit_app_description" :
                break;
            
            case "mlab_edit_app_keywords" :
                break;
           
            case "mlab_edit_app_category1" :
                break;

            case "mlab_edit_app_category2" :
                break;
            
            case "mlab_edit_app_category3" :
                break;
                
        }

    }

/*
 * Calls a function on the backend that returns a URL to the file to download. 
 * If it is not compiled we will compile it first. 
 * @returns void
 */
    function mlab_app_download () {
        mlab_page_save(mlab_app_download_process);
    }
    
    function mlab_app_download_process () {
        mlab_update_status("callback", 'Retrieving app', true);
        var url = mlab_urls.app_download.replace("_ID_", document.mlab_current_app.id);
        $.get( url, function( data ) {
            mlab_update_status("completed");
            if (data.result == "success") {
                full_url = window.location.origin + data.url;
                $("#mlab_download_qr2").empty().qrcode({text: full_url, render : "table"}).show()
                        .append("<br>")
                        .append("<a href='" + full_url + "'>Download: " + full_url +"</a>")
                        .append("<br>")
                        .append("<a href='mailto:" + mlab_current_user_email + "?subject=Link&body=Download test app here: " + encodeURI(full_url) + "'>Mail link</a>");

            } else {
                $("#mlab_download_qr2").empty().append("<p>Error: " + data.msg + "</p>").show();

            }
     /*       $("#mlab_download_qr_field").qtip({
                content: {text: $("#mlab_download_qr2").html() },
                position: { my: 'top right', at: 'bottom right', target: $("#mlab_download_qr_field") },
                show: { ready: true, modal: { on: false, blur: false } },
                hide: 'unfocus',
                style: { classes: 'qtip-tipped' }});
        */	
        });
        
        mlab_timer_start();
    }

    function mlab_app_submit_to_market () {
        alert('Not implemented yet');
    }

//remove locks, just a backup if something goes wrong
    function mlab_app_remove_locks() {
        mlab_update_status("temporary", "Unlocking all pages...", true);
        $.get( mlab_urls.app_unlock );
        $("#mlab_editor_disabled").remove();
    }
    
/**
 * Function to update content of GUI elements with the current app's metadata 
 */
    function mlab_app_update_gui_metadata() {

//List of all pages
//#mlab_existing_pages is a <div> which is populated with a <ol> with a <li> element for each page
        var list = $('<ol></ol>')
        var currpage = document.mlab_current_app.curr_page_num;
        var span = "";
        if (currpage == "index") {
            currpage = 0;
        }
        for (i in document.mlab_current_app.page_names) {
            if (i > 0) {
                span = "<span class='mlab_copy_file' onclick='mlab_page_copy(\"" + i + "\");' >&nbsp;</span>";
            }
            if (i == currpage) {
                list.append("<li data-mlab-page-open='" + i + "'>" + span + document.mlab_current_app.page_names[i] + "</li>");    			
            } else {
                list.append("<li>" + span + "<a data-mlab-page-open='" + i + "' href='javascript:mlab_page_open(" + document.mlab_current_app.id + ", \"" + i + "\");'>" + document.mlab_current_app.page_names[i] + " </a></li>");    			
            }
        }
        $("#mlab_existing_pages").html(list);

//Various app meta data
        $("#mlab_edit_app_title").text(document.mlab_current_app.name);
        $("#mlab_edit_app_description").text(document.mlab_current_app.description);
        $("#mlab_edit_app_keywords").text(document.mlab_current_app.keywords);
        $("#mlab_edit_app_category1").text(document.mlab_current_app.categoryOne);
        $("#mlab_edit_app_category2").text(document.mlab_current_app.categoryTwo);
        $("#mlab_edit_app_category3").text(document.mlab_current_app.categoryThree);
    }		


/*********************************************************************************************
 *********** Functions to parse HTML for a page and insert it into the editor area ***********
 *********************************************************************************************/


/* this function processes the index page that was retrieved.
 * 
 * It does the following:
    Remove old HTML from the editing div (mlab_editor_chrome)
    Remove old stylesheets from previously edited page from *this page*
    Add new stylesheets from page that is opened for editing to *this page*
    Extract BODY and insert content into mlab_editor_chrome
    Process the top level DIVs inside DIV with ID = mlab_config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    function mlab_index_page_process (page, page_num) {
        var comp_id, temp_comp, temp_link;
        var temp_stylesheets = "";
        var start_dir = mlab_config.urls.app + document.mlab_current_app.path + "/" + document.mlab_current_app.version + mlab_config.cordova.asset_path;

//parse doc into a variable 
        var doc = (new DOMParser()).parseFromString(page,"text/html");

//check if it has editable area, if not we cannot continue
        if (doc.getElementById(mlab_config["app"]["content_id"]) == null) {
            alert("This app does not have an editable area called " + mlab_config["app"]["content_id"] + ", unable to open app. Check with the system administrator for further information.")
            return;
        }

//set the base href to the folder of the app
        document.getElementsByTagName("base")[0].href = start_dir;

//remove old stuff 
        $("#mlab_editor_chrome").empty();
        $("link[rel=stylesheet][href^='css']").remove();

//store different parts of doc for easy access/manipulation
        var head = doc.getElementsByTagName("head")[0];
        var body = doc.getElementsByTagName("body")[0].cloneNode(true);
        var divs = doc.getElementById(mlab_config["app"]["content_id"]).cloneNode(true).childNodes;
        var stylesheets = head.getElementsByTagName("link");

//insert stylesheets 
        for ( var i = 0; i < stylesheets.length; i++) {
            temp_link = stylesheets[i].getAttribute("href");
            temp_stylesheets = temp_stylesheets + "<link rel='stylesheet' href='" + temp_link + "' type='text/css'>" + "\n";
        }
        $("head link[rel='stylesheet']").last().after(temp_stylesheets); 

//here we insert the body MINUS the editable area (which was just removed) which is stored in the divs variable, into the editor_chrome
        $("#mlab_editor_chrome").append(body.innerHTML);

//now we need to make the internal code editable
        mlab_prepare_editable_area();

//assign vars to current app var, we remove all elements that are editable so we have clean HTML to add our edited content to 
//this HTML chunk will include HTML header + all body content outside the editable area, plus the empty div for the editable area 
        var content = doc.getElementById(mlab_config["app"]["content_id"]);
        while (content.firstChild) {
            content.removeChild(content.firstChild);
        }
        document.mlab_current_app.curr_indexpage_html = doc;
//Page name is picked up from title tag in head
        document.mlab_current_app.curr_pagetitle = head.getElementsByTagName("title")[0].innerText;
        document.mlab_current_app.curr_page_num = page_num;
        $("#mlab_page_control_title").text(document.mlab_current_app.curr_pagetitle);

        mlab_app_update_gui_metadata();

//finally we need to initialise the jQuery mobile stuff on the page we loaded, otherwise it will not display correctly
        $.mobile.initializePage();

//JS to fix the toolbars in a jQuery mobile page
        var border_width = (parseInt($("#mlab_editor_chrome").css("margin-bottom")) * 2) + parseInt($("#mlab_editor_chrome").css("border-bottom-width"));
        $("[data-role=header]").css( {"position": "absolute", "z-index": 0} );
        $("[data-role=footer]").css( { "position": "absolute", "bottom": ($("[data-role=footer]").height() + border_width) + "px" } );
        $("[data-role=page]").css( {"width": "100%", "height": "100%", "min-height": "", "position": "absolute", "margin": "0", "padding": "0", "padding-top": $("[data-role=header]").height() + "px", "padding-bottom": $("[data-role=footer]").height() + "px" } );

//TODO: hack de luxe, refreshes images that for some reason can't be seen
        $("#panel_left").css("background-image", $("#panel_left").css("background-image"));
        $("#panel_right").css("background-image", $("#panel_right").css("background-image"));

    }


/* this function processes a regular page that was retrieved.
 * 
 * It does the following:
    Remove old HTML from the internal editing div (mlab_config["app"]["content_id"])
    Extract title and save it to JS var
    Extract BODY and insert content into mlab_config["app"]["content_id"]
    Process the top level DIVs inside DIV with ID = mlab_config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    function mlab_regular_page_process (page, page_num) {
        var comp_id, temp_comp, temp_link;
        var start_dir = mlab_config.urls.app + document.mlab_current_app.path + "/" + document.mlab_current_app.version + mlab_config.cordova.asset_path;

//remove old stuff 
        $("#" + mlab_config["app"]["content_id"]).html("");

//a page may have failed to save, in this case we create an empty page here, then everything works
        if (page == "") {
            page = mlab_config["app"]["html_header"].replace("%TITLE%", "Title") + mlab_config["app"]["html_footer"];
            page = page.replace(/\\n/g, "\n");
        }
//
//parse doc into variables 
        var doc = (new DOMParser()).parseFromString(page,"text/html");
        var head = doc.getElementsByTagName("head")[0];
        var body = doc.getElementsByTagName("body")[0].cloneNode(true);

//Page name is picked up from title tag in head
        document.mlab_current_app.curr_pagetitle = head.getElementsByTagName("title")[0].innerText;
        document.mlab_current_app.curr_page_num = page_num;
        $("#mlab_page_control_title").text(document.mlab_current_app.curr_pagetitle);

        mlab_app_update_gui_metadata();

//add body content 
        $("#" + mlab_config["app"]["content_id"]).html(body.innerHTML);

        mlab_prepare_editable_area();
        $.mobile.initializePage();
    }


/***********************************************************
 ************** Functions to manipulate pages **************
************************************************************/

/*
 * Open previous or next page depending on direction. If on first or last page does nothing
 * @param {type} direction
 * @returns {undefined}
 */
    function mlab_page_move_to(direction) {
        var curr_num = 0;
        (document.mlab_current_app.curr_page_num == "index") ? curr_num = 0 : curr_num = parseInt(document.mlab_current_app.curr_page_num);
        if ( direction < 0 && curr_num > 0 ) {
            curr_num--;
        } else if ( direction > 0 ) {
            curr_num++;
        } else {
            return;
        }
        mlab_page_open(document.mlab_current_app.id, curr_num);
        
    }
    
/**
 * Retrieve content of a page from server and insert it into the editor area
 * First line is a pattern from Symfony routing so we can get the updated version from symfony when we change it is YML file 
 */
    function mlab_page_open(app_id, page_num) {
        mlab_page_save( function() { mlab_page_open_process(app_id, page_num); } );
    } 
    
    function mlab_page_open_process(app_id, page_num) {

        mlab_update_status("callback", 'Opening page', true);

        var url = mlab_urls.page_get.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_UID_", mlab_uid);

        $.get( url, function( data ) {
            if (data.result == "success") {
                mlab_update_status("completed");
                mlab_update_status("permanent", document.mlab_current_app.name);
                $("#mlab_page_control_title").text(document.mlab_current_app.curr_pagetitle);
                if (data.page_num_sent == 0 || data.page_num_sent == "index" ) {
                    mlab_index_page_process ( data.html, "index" );
                } else if (data.page_num_sent == "last" && data.page_num_real == 0) {
                    mlab_timer_start();
                    return;
                } else {
                    mlab_regular_page_process ( data.html, data.page_num_real );
                    var path = window.location.pathname.split("/");
                    path[path.length - 3] = data.app_id;
                    path[path.length - 2] = data.page_num_real;
                    history.pushState({id: data.app_id, page: data.page_num_real }, document.mlab_current_app.curr_pagetitle, path.join("/"));
                }

                if (data.lock_status == "locked") {
                    document.mlab_current_app.locked = true;
                    $("#" + mlab_config["app"]["content_id"]).fadeTo('slow',.6);
                    $("div.container").append('<div id="mlab_editor_disabled" style="background-color: gray; position: absolute;top:110px;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50); background-image: url(/img/page_locked.png); background-repeat: no-repeat; background-position: 95% 2%;"></div>');
                } else {
                    document.mlab_current_app.locked = false;
                    $("#mlab_editor_disabled").remove();
                    $("#" + mlab_config["app"]["content_id"]).fadeTo('slow',1);
                }
                
                if ( $("#mlab_overlay").is(':visible') ) {
                    $("#mlab_overlay").slideUp();
                }
                
                mlab_timer_start();
                
            } else {
                mlab_update_status("temporary", data.msg, false);

            }

        } );
        
    } 

/**
 * This will update the title of the currently open page and also update relevant items other places
 */
    function mlab_page_update_title() {
        if (document.mlab_current_appd) {
            alert("Page is locked, you cannot update the title");
            return;
        }

        mlab_flag_dirty = true;
        document.mlab_current_app.curr_pagetitle = $("#mlab_page_control_title").text();
        document.mlab_current_app.page_names[document.mlab_current_app.curr_page_num] = document.mlab_current_app.curr_pagetitle;
        $("#mlab_page_control_title").text(document.mlab_current_app.curr_pagetitle);
        if (document.mlab_current_app.curr_page_num == "index") {
            $("#mlab_existing_pages [data-mlab-page-open='0']").html(document.mlab_current_app.curr_pagetitle);
        } else {
            $("#mlab_existing_pages [data-mlab-page-open='" + document.mlab_current_app.curr_page_num + "']").html("<span class='mlab_copy_file' onclick='mlab_page_copy(\"" + document.mlab_current_app.curr_page_num + "\");' >&nbsp;</span>" + document.mlab_current_app.curr_pagetitle);
        }
        
        
    }


/**
 * This is the save function, it is called in three possible ways:
 * 1: When a user clicks the save button
 * 2: When the save timer (mlab_timer_save) kicks in
 * 3: When a function that has to save the page first is executed.
 * 
 * In case 3 th fnc argument is specified and when the save is completed and the AJAX callback function is called this function will be executed.
 * This way we are sure that page related variables are not outdated if the save function takes a long time to complete on the server.
 * 
 * to save a page we need to reassemble it, 
 * first clone current body from the editor (and give it a new ID!)
 * clean it up using the onSave function for each component
 * then pick up doc variable which has empty body, then insert the cleaned elements
 * finally convert to text to send back
 * @param {type} fnc
 * @returns {undefined}
 */
    function mlab_page_save(fnc) {
        window.clearTimeout(mlab_timer_save);
        var require_save = true;
        var res = false;
        mlab_counter_saving_page++;
        
//cannot save if locked
        if ($("#mlab_editor_disabled").length > 0) {
            console.log('Page locked, did not save');
            require_save = false;
        }

//this is called from a timer, so we also need to check if an app has been created, etc
//also if any changes have occurred
        if (document.mlab_current_app.curr_page_num == undefined || document.mlab_current_app.id == undefined) {
            require_save = false;
        }

        if (!mlab_flag_dirty) {
            require_save = false;
        }

        if ((!require_save) && (typeof fnc != 'undefined')) { 
            return fnc();
        } else if (!require_save) {
            return false;
        }

//prepare various variables
        mlab_update_status("callback", "Storing page", true);
        var curr_el = $("#" + mlab_config["app"]["content_id"] + " .mlab_current_component");
        curr_el.removeClass("mlab_current_component");
        var app_id = document.mlab_current_app.id;
        var page_num = document.mlab_current_app.curr_page_num;
        var page_content = "";
        var component_categories = new Object();
        var template_best_practice_msg = new Array();
        var url = mlab_urls.page_save.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_CHECKSUM_", document.mlab_current_app.app_checksum);

//this loop is a: picking up the cleaned HTML for each component, 
//(this is done by calling the onSave unction which strips away anything we are not interested in)
// and b: checking if the component transgresses any of the rules for the template
        $("#" + mlab_config["app"]["content_id"]).children("div").each(function() {
            var comp_id = $(this).data("mlab-type");
            if (typeof (document["mlab_code_" + comp_id]) !== "undefined" && typeof (document["mlab_code_" + comp_id].onSave) !== "undefined") {
                page_content = page_content + document["mlab_code_" + comp_id].onSave(this);
            } else {
                page_content = page_content + $(this)[0].outerHTML + "\n";
            }

//run the template checks
            mlab_component_check_content(this, comp_id, component_categories, template_best_practice_msg);
        });

        mlab_page_check_content(component_categories, template_best_practice_msg);

//if this is the index page we add the full HTML page, if not we only require a very simple header/footer
        if (page_num == 0 || page_num == "index" ) {
            var final_doc = document.mlab_current_app.curr_indexpage_html;
            final_doc.getElementById(mlab_config["app"]["content_id"]).innerHTML = page_content;
            final_doc.title = document.mlab_current_app.curr_pagetitle;
            var html = (new XMLSerializer()).serializeToString(final_doc);
        } else {
            var html = "<!DOCTYPE html>\n<html><head><title>" + document.mlab_current_app.curr_pagetitle + "</title></head><body>" + page_content + "</body></html>";
        }

        curr_el.addClass("mlab_current_component");

//finally we submit the data to the server, the callback function will further execute the function specified in the fnc argument, if any
        $.post( url, {html: html}, function( data ) {
            
//if this counter = 0 then noone else have called it in the meantime and it is OK to restart timer
            mlab_counter_saving_page--;
            
            if (data.result == "success") {
                mlab_update_status("temporary", "Saved page", false);
                mlab_flag_dirty = false;
                
//if a function was specified we now execute it, inisde this function the mlab_timer_save timer will be restarted
//if no function was specified AND no-one else has initiated the save function, then OK to restart timer
                if (typeof fnc != 'undefined') {
                    res = fnc();
                } 
                
//process metadata information that has come back
                if (typeof data.app_info != "undefined") {
//we may have a result saying nochange
                    if (data.app_info.result === "file_changes") {
//load in metadata and (possibly new) checksum of app into variables, then upate display
                        console.log("App files were changed");
                        document.mlab_current_app.app_checksum = data.app_info.mlab_app_checksum;
                        document.mlab_current_app.page_names = data.app_info.mlab_app.page_names;
                        
                    } else if (data.app_info.result === "no_file_changes") {
                        console.log("No changes to app files");

                    } else {
                        if (mlab_counter_saving_page == 0 && (typeof fnc == 'undefined')) {
                            mlab_timer_start();
                        }
                        return;
                    }
                    
                    document.mlab_current_app.name = data.app_info.mlab_app.name;
                    document.mlab_current_app.description = data.app_info.mlab_app.description;
                    document.mlab_current_app.keywords = data.app_info.mlab_app.keywords;
                    document.mlab_current_app.categoryOne = data.app_info.mlab_app.categoryOne;
                    document.mlab_current_app.categoryTwo = data.app_info.mlab_app.categoryTwo;
                    document.mlab_current_app.categoryThree = data.app_info.mlab_app.categoryThree;
                    mlab_app_update_gui_metadata();

                };

            } else { //failed
                mlab_update_status("temporary", "Unable to save page: " + data.msg, false);
                if (typeof fnc != 'undefined') {
//if this save attempt was a part of another operation we will ask if they want to try again, cancel or continue without saving
//(the change may have been minimal and they want to start a new app let's say)
                    $( "#mlab_dialog_confirm" ).dialog({
                        resizable: false,
                        height:140,
                        modal: true,
                        buttons: {
                            "Retry": function() {
                                $( this ).dialog( "close" );
                                mlab_page_save(fnc);
                                return;
                            },
                            "Continue": function() {
                                $( this ).dialog( "close" );
                                res = fnc();
                            },
                            Cancel: function() {
                                $( this ).dialog( "close" );
                            }
                        }
                    });
                    return res;
                }
            }
            
//if this was not called from a function AND the save function has not been called by others, then we restart the save timer.
            if (mlab_counter_saving_page == 0 && (typeof fnc == 'undefined')) {
                mlab_timer_start();
            }
            
        });

//above we have counted the number of issues relating to the template "best practices" configuration, time to display the error message, if any
        if (template_best_practice_msg.length > 0) {
            $("#mlab_statusbar_permanent").qtip( {
                content: {text: "<ul><li>" + template_best_practice_msg.join("</li><li>") + "</li></ul>" },
                position: { my: 'topMiddle', at: 'bottomMiddle' },
                show: { ready: true, modal: { on: false, blur: false } },
                hide: 'unfocus',
                style: { "background-color": "white", color: "blue", classes: "mlab_qtip_info" } } ) ;
        } else {
             $(".mlab_qtip_info").remove();
        }
        
        return res;
    }
    
// final template "best practices", we see if there are too many or too few of certain categories of components on a page
    function mlab_page_check_content(component_categories, template_best_practice_msg) {
        
        var rules = document.mlab_current_app.template_config.components;
        for (var category in rules) {
            if (rules[category].hasOwnProperty("max")) {
                if (component_categories[category] > rules[category].max.count) {
                    if ($.inArray(rules[category].max.message, template_best_practice_msg) < 0) {
                        template_best_practice_msg.push(rules[category].max.message);
                    }
                }
            }
            if (rules[category].hasOwnProperty("min")) {
                if (component_categories[category] < rules[category].min.count) {
                    if ($.inArray(rules[category].min.message, template_best_practice_msg) < 0) {
                        template_best_practice_msg.push(rules[category].min.message);
                    }
                }
            }
        };
    }

/**
* Creates a new file on the server and opens it
*/
    function mlab_page_new() {
        var title = prompt("Please enter the title of the new page");
        if (title != null) {
            mlab_page_save( function() { mlab_page_new_process( title ); } );
        }
    }
    
    function mlab_page_new_process(title) {
            mlab_update_status("callback", "Storing page", true);
            var url = mlab_urls.page_new.replace("_ID_", document.mlab_current_app.id);
            url = url.replace("_UID_", mlab_uid);
            
            $.post( url, {}, function( data ) {
                if (data.result == "success") {
                    mlab_update_status("completed");
                    $("#" + mlab_config["app"]["content_id"]).empty();
                    document.mlab_current_app.curr_pagetitle = title;
                    document.mlab_current_app.curr_page_num = data.page_num_real;
                    $("#mlab_page_control_title").text(document.mlab_current_app.curr_pagetitle);
                    document.mlab_current_app.page_names[document.mlab_current_app.curr_page_num] = title;
                    mlab_app_update_gui_metadata();

                    mlab_flag_dirty = true;

                } else {
                    mlab_update_status("temporary", data.msg, false);
                }
                
                mlab_timer_start();

            });
        

       }

/**
 * Creates a new file on the server and opens it
 */
    function mlab_page_copy(page_num) {
        if (page_num == "0" || page_num == "index") {
            alert("You can not copy the index page");
            return;
        }

        mlab_page_save( function() { mlab_page_copy_process(page_num); } );
    }
       
    function mlab_page_copy_process(page_num) {

        var url = mlab_urls.page_copy.replace("_ID_", document.mlab_current_app.id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_UID_", mlab_uid);
        mlab_update_status("callback", "Copying page", true);
        
        $.get( url, function( data ) {
            mlab_update_status("completed");
            if (data.result == "success") {
                document.mlab_current_app.curr_pagetitle = data.page_title;
                $("#mlab_page_control_title").text(data.page_title);
                document.mlab_current_app.page_names[data.page_num_real] = data.page_title;
                mlab_regular_page_process ( data.html, data.page_num_real );
            } else {
                alert(data.msg);
            }
            mlab_timer_start();
        });
    }

    function mlab_page_delete () {
        if (document.mlab_current_app.curr_page_num == "0" || document.mlab_current_app.curr_page_num == "index") {
            alert("You can not delete the index page");
            return;
        }

        if (!confirm("Are you sure you want to delete this page? This cannot be undone!")) {
            return;
        }
        
        window.clearTimeout(mlab_timer_save);
        mlab_update_status("callback", "Deleting page", true);

        var url = mlab_urls.page_delete.replace("_ID_", document.mlab_current_app.id);
        url = url.replace("_PAGE_NUM_", document.mlab_current_app.curr_page_num);
        url = url.replace("_UID_", mlab_uid);

        $.get( url, function( data ) {
            mlab_update_status("completed");
            if (data.result == "success") {
                $("#mlab_existing_pages [data-mlab-page-open='" + document.mlab_current_app.curr_page_num + "']").remove();
                document.mlab_current_app.page_names.splice(document.mlab_current_app.curr_page_num, 1);
                mlab_regular_page_process ( data.html, data.page_num_real );
                
                if (document.mlab_current_app.curr_page_num == "index") {
                    $("#mlab_existing_pages [data-mlab-page-open='" + document.mlab_current_app.curr_page_num + "']").html(document.mlab_current_app.curr_pagetitle);
                } else {
                    $("#mlab_existing_pages [data-mlab-page-open='" + document.mlab_current_app.curr_page_num + "']").html("<span class='mlab_copy_file' onclick='mlab_page_copy(\"" + document.mlab_current_app.curr_page_num + "\");' >&nbsp;</span>" + document.mlab_current_app.curr_pagetitle);
                }
                
            } else {
                mlab_update_status("temporary", data.msg, false);
            }

            mlab_timer_start();
        });
    }

    /**
     * Simple function to open a new window with current page in it
     * Given that we use an jquery mobile framework with an index file and loading pages into the index file, 
     * we need to pass the relevant file name and have matching code in the mlab.js file to deal with this
     * @param {type} index
     * @returns {undefined}
     */
    function mlab_page_preview() {
        mlab_page_save(mlab_page_preview_process);
    }
    
    function mlab_page_preview_process() {
        if (document.mlab_current_app.curr_page_num == 0 || document.mlab_current_app.curr_page_num == "index" ) {
            page_name = ""
        } else {
            page_name = ("000" + document.mlab_current_app.curr_page_num).slice(-3) + ".html";
        }
        var w = $(window).width() * 0.25;
        var h = $(window).height() * 0.75;
        var res = window.open(mlab_config["urls"]["app"] + document.mlab_current_app.path + "/" + document.mlab_current_app.version + "/" + mlab_config["cordova"]["asset_path"] + "/index.html?openpage=" + page_name,'targetWindow','toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=' + w + ',height=' + h + ',left=' + w);
        if (res == undefined) {
            alert("Cannot open new window, change your settings to allow popup windows");
        }
        mlab_timer_start();
    }

/***********************************************************
 *********** Functions to manipulate components ***********
************************************************************/
    function mlab_component_add(id) {
        if (document.mlab_current_app.locked) {
            return;
        }
        
//if this control has to be unique we check here to see if one was already added
        if (mlab_components[id].conf.unique && $("#" + mlab_config["app"]["content_id"]).find("[data-mlab-type='" + id + "']").length > 0) {
            alert("You can only have one component of this type on a page");
            return;
        }
        
        var new_comp = $("<div data-mlab-type='" + id + "' style='display: block;'>" + mlab_components[id].html + "</div>");
        $("#" + mlab_config["app"]["content_id"]).append(new_comp);
        new_comp.on("click", function(){mlab_component_highlight_selected(this);})
        new_comp.on("input", function(){mlab_flag_dirty = true;});
        
        $('.mlab_current_component').qtip('hide');

        mlab_component_run_code(new_comp, id, true);
        mlab_component_highlight_selected(new_comp);
        window.scrollTo(0,document.body.scrollHeight);

//execute backend javascript and perform tasks like adding the permissions required to the manifest file and so on
        var url = mlab_urls.component_added.replace("_APPID_", document.mlab_current_app.id);
        url = url.replace("_COMPID_", id);
        var request = $.ajax({
            type: "GET",
            url: url,
            dataType: "json"
        });

        request.done(function( result ) {
            if (result.result == "success") {
                mlab_drag_origin = 'sortable';
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
        if (mlab_components[id].hasOwnProperty("conf") && mlab_components[id].conf.hasOwnProperty("dependencies")) {
            for (component in mlab_components[id].conf.dependencies) {
                mlab_feature_add(mlab_components[id].conf.dependencies[0], true);
            }
        }

        mlab_flag_dirty = true;

    }
    
/**
 * This executes (using eval()) any code for a component that is added to the app
 * @param {type} el = html element we're working on
 * @param {type} comp_id
 * @param {type} created
 * @returns {undefined}
 */
    function mlab_component_run_code(el, comp_id, created) {
        if (typeof mlab_components[comp_id] == "undefined") {
            return;
        }
//execute the javascript if it exists, we first need to attach it to document so we can use it globally 
        if (mlab_components[comp_id].exec_browser !== false && (typeof (document["mlab_code_" + comp_id]) === "undefined")) {
            eval(mlab_components[comp_id].exec_browser);
        }

        if (typeof (document["mlab_code_" + comp_id]) !== "undefined") {
            if (created) {
                document["mlab_code_" + comp_id].onCreate(el, mlab_components[comp_id].conf, mlab_component_request_info);
            } else {
                document["mlab_code_" + comp_id].onLoad(el, mlab_components[comp_id].conf, mlab_component_request_info);
            }
        } 
    }

    function mlab_component_moveup() {
        $el = $(".mlab_current_component");
        if ($el.length == 0) {
            return;
        }
        $el.fadeOut(500, function(){
            $el.insertBefore($el.prev());
            $el.fadeIn(500);
        });
        mlab_flag_dirty = true;
    }

    function mlab_component_movedown() {
        $el = $(".mlab_current_component");
        if ($el.length == 0) {
            return;
        }
        $el.fadeOut(500, function(){
            $el.insertAfter($el.next());
            $el.fadeIn(500);
        });
        mlab_flag_dirty = true;
    }

    function mlab_component_highlight_selected(el) {
         $( "#" + mlab_config["app"]["content_id"] + "> div" ).removeClass("mlab_current_component");
         $( el ).addClass("mlab_current_component");
         mlab_menu_prepare();
    }
    
    function mlab_component_delete() {
        var sel_comp = $(".mlab_current_component").prev();
        if (sel_comp.length == 0) {
            sel_comp = $(".mlab_current_component").next();
        }
        $(".mlab_current_component").remove();
        if (sel_comp.length > 0) {
            sel_comp.addClass("mlab_current_component");
        }
        mlab_flag_dirty = true;
    }
    
/**
 * Runs the "best practices" check for a single component, can check if video is too long, if there is too much text, etc, etc
 * @param {type} comp
 * @param {type} comp_id
 * @param {type} component_categories
 * @param {type} template_best_practice_msg
 * @returns {undefined}
 */
    function mlab_component_check_content(comp, comp_id, component_categories, template_best_practice_msg) {
        var rules = document.mlab_current_app.template_config.components;
        if (mlab_components[comp_id].hasOwnProperty("conf") && mlab_components[comp_id].conf.hasOwnProperty("category")) {
            var comp_category = mlab_components[comp_id].conf.category;  

            if (!component_categories.hasOwnProperty(comp_category)) {
                component_categories[comp_category] = 1;
            } else {
                component_categories[comp_category]++;
            }

            if (document.hasOwnProperty("mlab_code_" + comp_id)) {
                if (document["mlab_code_" + comp_id].hasOwnProperty("getContentSize")) {
//can only do this if component supprts the getContentSize function
                    if (document["mlab_code_" + comp_id].hasOwnProperty("getContentSize")) {
                        var size = document["mlab_code_" + comp_id].getContentSize(comp);
                        if (rules.hasOwnProperty(comp_category)) {
                            if (rules[comp_category].hasOwnProperty("max")) {
                                if (size > rules[comp_category].max.size) {
                                    if ($.inArray(rules[comp_category].max.message, template_best_practice_msg) < 0) {
                                        template_best_practice_msg.push(rules[comp_category].max.message);
                                    }
                                }
                            }
                            if (rules[comp_category].hasOwnProperty("min")) {
                                if (size < rules[comp_category].min.size) {
                                    if ($.inArray(rules[comp_category].min.message, template_best_practice_msg) < 0) {
                                        template_best_practice_msg.push(rules[comp_category].min.message);
                                    }
                                }
                            }
                        } 
                    }
                }
            }
        }
    }

/**
 * features are simply components that are not displayed with a GUI
 * they are added to a hidden div, if we are NOT working on the index page we call a backend function to add this code
 * 
 * @returns {undefined}
 */

    function mlab_feature_add(comp_id, silent) {
        if ($(document.mlab_current_app.curr_indexpage_html).find("#mlab_features_content").length == 0) {
            $(document.mlab_current_app.curr_indexpage_html).find("body").append("<div id='mlab_features_content' style='display: none;'></div>");
        } else {
//make sure not duplicate it
            if ($(document.mlab_current_app.curr_indexpage_html).find("#mlab_features_content [data-mlab-type='" + comp_id + "']>").length > 0) {
                if (!silent) {
                    mlab_update_status("temporary", "Feature already added", false);
                }
                return;
            }
        }

        $(document.mlab_current_app.curr_indexpage_html).find("#mlab_features_content").append("<div data-mlab-type='" + comp_id + "'>" + mlab_components[comp_id].html + "</div>");


//if we are not working on the index page we need to tell the back end to update the index.html file
//otherwise this will be lost
        if (document.mlab_current_app.curr_page_num != "0" && document.mlab_current_app.curr_page_num != "index") {
            var url = mlab_urls.feature_add.replace("_APPID_", document.mlab_current_app.id);
            url = url.replace("_COMPID_", comp_id);
            if (!silent) {
                mlab_update_status("callback", 'Adding feature...', true);
            }

            $.get( url, function( data ) {
                if (data.result == "success") {
                    mlab_update_status("temporary", "Feature added", false);
                    $("#mlab_features_list [data-mlab-feature-type='" + data.component_id + "']").addClass("mlab_features_used");
                } else {
                    mlab_update_status("temporary", data.msg, false);
                }

            });
        } 
    }    


/***********************************************************
 *********** Functions to manipulate adaptive menus ********
************************************************************/

/* adds component specific menu when a component is added/selected */
    function mlab_menu_prepare() {
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


/***********************************************************
 ******************* Utility functions *********************
************************************************************/

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

    (function(DOMParser) {
        "use strict";

        var
          DOMParser_proto = DOMParser.prototype
        , real_parseFromString = DOMParser_proto.parseFromString
        ;

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
    }(DOMParser));
    
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
 * Switches the editor area between landscape and portrait
 * @returns {undefined}
 * not used for the editor anymore
 
    function mlabRotateEditor() {
        var h = $("#mlab_editor_chrome").height();
        var w = $("#mlab_editor_chrome").width();
        $("#mlab_editor_chrome").height(w).width(h);

        if (w <= h) {
            $("#mlab_button_rotate").addClass("portret");
        } else {
            $("#mlab_button_rotate").removeClass("portret");
        }
    }
*/

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

function mlab_component_request_info(type, param) {
    switch (type) {
        case MLAB_CB_URL_APP_ABSOLUTE :
            return window.location.origin + mlab_config.urls.app;
            break;
            
        case MLAB_CB_URL_APP_RELATIVE :
            return mlab_config.urls.app;
            break;
            
        case MLAB_CB_URL_COMPONENT_ABSOLUTE :
            return window.location.origin + mlab_config.urls.component;
            break;
            
        case MLAB_CB_URL_COMPONENT_RELATIVE :
            return mlab_config.urls.component;
            break;
            
        case MLAB_CB_URL_TEMPLATE_ABSOLUTE :
            return window.location.origin + mlab_config.urls.template;
            break;
            
        case MLAB_CB_URL_TEMPLATE_RELATIVE :
            return mlab_config.urls.template;
            break;
            
        case MLAB_CB_URL_UPLOAD_ABSOLUTE :
            return window.location.origin + mlab_urls.component_upload_file.replace("_APPID_", document.mlab_current_app.id).replace("_COMPID_", param);
            break;
            
        case MLAB_CB_URL_UPLOAD_RELATIVE :
            return mlab_urls.component_upload_file.replace("_APPID_", document.mlab_current_app.id).replace("_FILETYPES_", param);
            break;
            
//here we obtain a list of files already uploaded, non-async so we can return data and do not need to know whcih HTML element to put it in
        case MLAB_CB_GET_MEDIA :
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
            break;
            
//return rules for current template, could be used to track when user has typed in too much text (for instance) 
//to do preemptive checks (we do post-save check)
        case MLAB_CB_GET_TEMPLATE_RULES :
            return document.mlab_current_app.template_config.components;
            break;
            
//create a GUID that is rfc4122 version 4 compliant
        case MLAB_CB_GET_GUID :
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
            break;
            
//loads all js/css files required at design time for a component
        case MLAB_CB_GET_LIBRARIES :
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
            break;
            
        case MLAB_CB_GET_VERSION :
            return mlab_api_version;
            break;
            
        case MLAB_CB_GET_SELECTED_COMPONENT :
            return $('.mlab_current_component');
            break;
 
        case MLAB_CB_SET_DIRTY :
            mlab_flag_dirty = true;
            break;
            
        case MLAB_CB_GET_EDITOR_ELEMENT :
            return mlab_config.content_id;
            break;
            
/**
 * adapted from jQuery.browser.mobile (http://detectmobilebrowser.com/)
 * License for case MLAB_CB_GET_ENV :
 * This is free and unencumbered software released into the public domain.
 * For more information, please refer to the UNLICENSE.
 **/
        case MLAB_CB_GET_ENV :
            var temp_browser = (navigator.userAgent||navigator.vendor||window.opera);
            var temp_env = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(temp_browser.substr(0,4));
            return temp_env;
            break;
            
        case MLAB_CB_CLOSE_ALL_PROPERTY_DIALOGS :
            $('.mlab_current_component').qtip('hide');
            break;

        case MLAB_CB_EDIT_CONTENT :
            $(param).attr('contenteditable', 'true').focus();
            var range = document.createRange();
            var sel = window.getSelection();
            range.selectNodeContents($(param)[0]);
            sel.removeAllRanges();
            sel.addRange(range);
            break;
            
    }
    
}