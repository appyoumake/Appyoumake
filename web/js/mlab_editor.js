/* 
 * All functions used in /src/Sinett/MLAB/BuilderBundle/Resources/views/App/build_app.html.twig
 * but not the data that has to come from TWIG. Therefore, see top of that page for data structures.
 */
    
/* general variables used globally by different functions 
   (variables with data from backend are loaded from the backend in the document.ready event and enters this file as JSON structures */
// State variables
    mlab_flag_dirty = false;
    mlab_flag_server_update = false; // True if the app is in an inconsistent state and should not save
    mlab_drag_origin = 'sortable';

//PERHAPS USE THIS TOGETHER WITH ARRAY OF FIELDNAMES MATCHING APP TABLE AND RENAME TEXT FIELDS...
    mlab_flag_meta_dirty = new Array();
    
// Calculate width of text from DOM element or string. By Phil Freo <http://philfreo.com>
    $.fn.textWidth = function(text, font) {
        if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);
        $.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css('font', font || this.css('font'));
        return $.fn.textWidth.fakeEl.width();
    };

/*
 * DOMParser HTML extension
 * 2012-09-04
 * 
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*! @source https://gist.github.com/1129031 */
/*global document, DOMParser*/


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

    function mlab_run_component_code(el, comp_id, created) {
        if (typeof mlab_components[comp_id] == "undefined") {
            return;
        }
//execute the javascript if it exists, we first need to attach it to document so we can use it globally 
        if (mlab_components[comp_id].exec_browser !== false && (typeof (document["mlab_code_" + comp_id]) === "undefined")) {
            eval(mlab_components[comp_id].exec_browser);
        }

        if (typeof (document["mlab_code_" + comp_id]) !== "undefined") {
            if (created) {
                document["mlab_code_" + comp_id].onCreate(el, mlab_components[comp_id].conf, "#" + mlab_config["app"]["content_id"], mlab_config.urls.component);
            } else {
                document["mlab_code_" + comp_id].onLoad(el, mlab_components[comp_id].conf, "#" + mlab_config["app"]["content_id"], mlab_config.urls.component);
            }
        }
    }


/*********** functions to create new app or edit apps ***********/

    /**
     * Initiates and opens up the dialog box where we collect details of the new app  
     */
    function mlab_app_new() {
        $("#mlab_dialog_new_app").load(mlab_urls.new, function() {
            $( "#build_app_properties" ).tabs();
        }).dialog("open");
    }

    /**
     * Same as code for mlab_app_new, except inisde the dialog open function we hide the first tab, they can NOT base the app on anything new  
     */
    function mlab_app_update() {
        var url_temp = mlab_urls.edit.replace("_ID_", document.mlab_current_app.id);
        $("#mlab_dialog_new_app").load(url_temp, function() {
            $( "#build_app_properties" ).tabs();
        }).dialog("open");
    }

//remove locks, TODO: do automatically
    function mlab_app_remove_locks() {
        mlab_update_status("temporary", "Unlocking all pages...", true);
        $.get( mlab_urls.app_unlock );
        $("#mlab_editor_disabled").remove();
    }
    /**
     * submits data for new app from the dialog box where we collect details of the new app  
     */
    function mlab_app_submit_properties(form) {
        var frm = document.getElementById(form.attr('id'));
        formData = new FormData(frm);
        $("#mlab_dialog_new_app").dialog("close");
        mlab_update_status("callback", "Creating new app", true);

        $.ajax({
            url: form.attr( "action" ),  //Server script to process data, should be createAction in app controller 
            type: 'POST',
            success: function( data ) {
                if (data.result == 'FAILURE') {
                    mlab_update_status("temporary", data.message, false);
                } else {
//we set the current variable to the data coming back in, then if this is an added record we open the page to edit 
                    document.mlab_current_app = data.mlab_app;
                    if (data.action == 'ADD') {
                        mlab_app_open(data.mlab_app_id, data.mlab_app_page_num) ;
                    }
                }
            },
            error: function(e) {
                mlab_update_status("temporary", 'error', false);
            },
            // Form data 
            data: form.serialize(),
            dataType: "json",
        });
    }


/*********** functions to open and save pages ***********/

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
        $("#mlab_curr_pagetitle").val(document.mlab_current_app.curr_pagetitle);

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
        $("#mlab_curr_pagetitle").val(document.mlab_current_app.curr_pagetitle);

        mlab_app_update_gui_metadata();

//add body content 
        $("#" + mlab_config["app"]["content_id"]).html(body.innerHTML);

        mlab_prepare_editable_area();
        $.mobile.initializePage();
    }


/**
* Function to update content of GUI elements with the current app's metadata 
*
*/
    function mlab_app_update_gui_metadata() {

//List of all pages
//... #mlab_existing_pages is a <div> which is populated with a <ul> inside a <li> element for each page
        var list = $('<ul></ul>')
        for (i in document.mlab_current_app.page_names) {
            list.append("<li><a data-mlab-page-open='" + i + "' href='javascript:mlab_page_open(" + document.mlab_current_app.id + ", \"" + i + "\");'>" + document.mlab_current_app.page_names[i] + " </a></li>");    			
        }
        $("#mlab_existing_pages").html(list);

//Various app meta data
        $("#mlab_curr_apptitle").val(document.mlab_current_app.name);
        $("#mlab_app_description").val(document.mlab_current_app.description);
        $("#mlab_app_keywords").val(document.mlab_current_app.keywords);
        $("#mlab_app_CategoryOne").val(document.mlab_current_app.categoryOne);
        $("#mlab_app_CategoryTwo").val(document.mlab_current_app.categoryTwo);
        $("#mlab_app_CategoryThree").val(document.mlab_current_app.categoryThree);
}		


/**
 * Retrieve content of a page from server and insert it
 * First line is a pattern from Symfony routing so we can get the updated version from symfony when we change it is YML file 
 */
    function mlab_page_open(app_id, page_num) {

        mlab_update_status("callback", 'Opening page', true);

        var url = mlab_urls.page_get.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_UID_", mlab_uid);

        mlab_flag_server_update = true;
        $.get( url, function( data ) {
            mlab_flag_server_update = false;
            if (data.result == "success") {
                mlab_update_status("completed");
                if (data.page_num_sent == 0 || data.page_num_sent == "index" ) {
                    mlab_index_page_process ( data.html, "index" );
                } else if (data.page_num_sent == "last" && data.page_num_real == 0) {
                    return;
                } else {
                    mlab_regular_page_process ( data.html, data.page_num_real );
                    var path = window.location.pathname.split("/");
                    path[path.length - 3] = data.app_id;
                    path[path.length - 2] = data.page_num_real;
                    history.pushState({id: data.app_id, page: data.page_num_real }, document.mlab_current_app.curr_pagetitle, path.join("/"));
                }
                mlab_update_status("permanent", "Editing " + document.mlab_current_app.name + "::" + document.mlab_current_app.curr_pagetitle);

                if (data.lock_status == "locked") {
                    $("#" + mlab_config["app"]["content_id"]).fadeTo('slow',.6);
                    $("#" + mlab_config["app"]["content_id"]).append('<div id="mlab_editor_disabled" style="background-color: gray; position: absolute;top:0;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50)"></div>');
                } else {
                    $("#" + mlab_config["app"]["content_id"]).fadeTo('slow',1);
                }

            } else {
                mlab_update_status("temporary", data.msg, false);

            }

        });
    } 

/**
 * This will update the title of the currently open page and also update relevant items other places
 */
    function mlab_update_page_title() {
        mlab_flag_dirty = true;
        document.mlab_current_app.curr_pagetitle = $("#mlab_curr_pagetitle").val();
        document.mlab_current_app.page_names[document.mlab_current_app.curr_page_num] = document.mlab_current_app.curr_pagetitle;
        mlab_update_status("permanent", "Editing " + document.mlab_current_app.name + "::" + document.mlab_current_app.curr_pagetitle);
        $("#mlab_existing_pages [data-mlab-page-open='" + document.mlab_current_app.curr_page_num + "']").text(document.mlab_current_app.curr_pagetitle + " [" + document.mlab_current_app.curr_page_num + "]");
        
    }


//to save a page we need to reassemble it, 
//first clone current body from the editor (and give it a new ID!)
//clean it up using the onSave function for each component
//then pick up doc variable which has empty body, then insert the cleaned elements
//finally convert to text to send back

    function mlab_page_save() {

//cannot save if locked
        if ($("#mlab_editor_disabled").length > 0) {
            console.log('Page locked, did not save');
            return false;
        }

//this is called from a timer, so we also need to check if an app has been created, etc
//also if any changes have occurred
        if (document.mlab_current_app.curr_page_num == undefined || document.mlab_current_app.id == undefined) {
            return false;
        }

        if (!mlab_flag_dirty) {
            return false;
        }

        if (mlab_flag_server_update) {
            console.log('Previous server update not completed, did not save');
            return false;
        }

        mlab_update_status("callback", "Storing page", true);
        var curr_el = $("#" + mlab_config["app"]["content_id"] + " .mlab_current_component");
        curr_el.removeClass("mlab_current_component");
        var app_id = document.mlab_current_app.id;
        var page_num = document.mlab_current_app.curr_page_num;
        var page_content = "";
        var url = mlab_urls.page_save.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", page_num);

//this loop is a: picking up the cleaned HTML for each component, 
//(this is done by calling the onSave unction which strips away anything we are not interested in)
// and b: checking if the component transgresses any of the rules for the template
        var rules = document.mlab_current_app.template_config.components;
        var component_categories = new Object();
        var template_best_practice_msg = new Array();

        $("#" + mlab_config["app"]["content_id"]).children("div").each(function() {
            var comp_id = $(this).data("mlab-type");
            if (typeof (document["mlab_code_" + comp_id]) !== "undefined") {
                document["mlab_code_" + comp_id].onSave(this);
                page_content = page_content + $(this)[0].outerHTML + "\n";
                document["mlab_code_" + comp_id].onLoad(this, mlab_components[comp_id].conf, "#" + mlab_config["app"]["content_id"], mlab_config.urls.component);
            } else {
                page_content = page_content + $(this)[0].outerHTML + "\n";
            }

//run the template check
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
                            var size = document["mlab_code_" + comp_id].getContentSize(this);
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
        });

// final template "best practices", we see if there are too many or too few of certain categories of components on a page
        for (category in rules) {
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

//if this is the index pmlab_existing_pagesage we add the full HTML page, if not we only require a very simple header/footer
        if (page_num == 0 || page_num == "index" ) {
            var final_doc = document.mlab_current_app.curr_indexpage_html;
            final_doc.getElementById(mlab_config["app"]["content_id"]).innerHTML = page_content;
            final_doc.title = document.mlab_current_app.curr_pagetitle;
            var html = (new XMLSerializer()).serializeToString(final_doc);
        } else {
            var html = "<!DOCTYPE html>\n<html><head><title>" + document.mlab_current_app.curr_pagetitle + "</title></head><body>" + page_content + "</body></html>";
        }

        curr_el.addClass("mlab_current_component");

//finlly we submit the data to the server
        mlab_flag_server_update = true;
        $.post( url, {html: html}, function( data ) {
            mlab_flag_server_update = false;

            if (data.result == "success") {
                mlab_update_status("temporary", "Saved page", false);
                mlab_flag_dirty = false;

//after a page is saved we retrieve the metadata for this 
//TODO: Fix url
//TODO: move to WebSOCKET listener for compiler jobs when this is done
                $.get( "/app_dev.php/app/builder/" + document.mlab_temp_app_id  + "/" + document.mlab_temp_page_num + "/" + document.mlab_current_app.app_checksum + "/load_metadata" , function( data ) {
                    
//we may have a result saying nochange
                    if (data.result === "file_changes") {
//load in metadata and (possibly new) checksum of app into variables, then upate display
                        console.log("App files were changed");
                        document.mlab_current_app.app_checksum = data.mlab_app_checksum;
                        document.mlab_current_app.page_names = data.mlab_app.page_names;
                        
                    } else if (data.result === "no_file_changes") {
                        console.log("No change to app files");

                    } else {
                        return;
                    }
                    
                    document.mlab_current_app.name = data.mlab_app.name;
                    document.mlab_current_app.description = data.mlab_app.description;
                    document.mlab_current_app.keywords = data.mlab_app.keywords;
                    document.mlab_current_app.categoryOne = data.mlab_app.categoryOne;
                    document.mlab_current_app.categoryTwo = data.mlab_app.categoryTwo;
                    document.mlab_current_app.categoryThree = data.mlab_app.categoryThree;
                    mlab_app_update_gui_metadata();

                });

            } else {
                mlab_update_status("temporary", "Unable to save page: " + data.msg, false);
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
    }

    /**
    * Creates a new file on the server and opens it
    */
    function mlab_page_new() {

        //TODO fix concurrency issues
        mlab_page_save();

        var title = prompt("Please enter the title of the new page");
        if (title != null) {
            mlab_update_status("callback", "Storing page", true);
            var url = mlab_urls.page_new.replace("_ID_", document.mlab_current_app.id);
            url = url.replace("_UID_", mlab_uid);
            mlab_flag_server_update = true;
            $.post( url, {}, function( data ) {
                mlab_flag_server_update = false;
                if (data.result == "success") {
                    mlab_update_status("completed");
                    $("#" + mlab_config["app"]["content_id"]).empty();
                    document.mlab_current_app.curr_pagetitle = title;
                    document.mlab_current_app.curr_page_num = data.page_num_real;
                    $("#mlab_curr_pagetitle").val(title);
                    mlab_update_status("permanent", "Editing " + document.mlab_current_app.name + "::" + document.mlab_current_app.curr_pagetitle);

// Saving the new page to keep the title
//TODO: Check if need this, added by Bård before Gol
/*                        document.mlab_current_app.page_names[document.mlab_current_app.curr_page_num] = title;
                    mlab_flag_dirty = true;
                    mlab_page_save(); */

                } else {
                    mlab_update_status("temporary", data.msg, false);
                }

            });
        }

       }

/**
 * Creates a new file on the server and opens it
 */
       function mlab_page_copy() {
        if (document.mlab_current_app.curr_page_num == "0" || document.mlab_current_app.curr_page_num == "index") {
            alert("You can not copy the index page");
            return;
        }

        var url = mlab_urls.page_copy.replace("_ID_", document.mlab_current_app.id);
        url = url.replace("_PAGE_NUM_", document.mlab_current_app.curr_page_num);
        url = url.replace("_UID_", mlab_uid);

        mlab_flag_server_update = true;
        $.get( url, function( data ) {
            mlab_flag_server_update = false;
            if (data.result == "success") {
                mlab_regular_page_process ( data.html, data.page_num );
            } else {
                alert(data.msg);
            }

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

        mlab_update_status("callback", "Deleting page", true);

        var url = mlab_urls.page_delete.replace("_ID_", document.mlab_current_app.id);
        url = url.replace("_PAGE_NUM_", document.mlab_current_app.curr_page_num);
        url = url.replace("_UID_", mlab_uid);

        $.get( url, function( data ) {
            if (data.result == "success") {
                mlab_update_status("completed");
                mlab_regular_page_process ( data.html, data.page_num );
            } else {
                mlab_update_status("temporary", data.msg, false);
            }

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
        mlab_page_save();
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
    }

/*********** General functions to manipulate components ***********/
    function mlab_component_add(id) {
        
        var new_comp = $("<div data-mlab-type='" + id + "' style='display: block;'>" + mlab_components[id].html + "</div>");
        $("#" + mlab_config["app"]["content_id"]).append(new_comp);
        new_comp.on("click", function(){mlab_highlight_selected(this);})
        new_comp.on("input", function(){mlab_flag_dirty = true;});
        new_comp.children().attr("contenteditable", "true");

        mlab_run_component_code(mlab_components[id], id, true);

//execute backend javascript and perform tasks like adding the permissions required to the manifest file and so on
//this is ONLY done if exec_server = true 
        if (mlab_components[id].exec_server !== false) {
            var url = mlab_urls.component_added.replace("_APPID_", document.mlab_current_app.id);
            url = url.replace("_COMPID_", id);
            var new_component = ui.draggable;
            var request = $.ajax({
                type: "GET",
                url: url,
                dataType: "json"
            });

            request.done(function( result ) {
                if (result.result == "success") {
                    mlab_drag_origin = 'sortable';
                    console.log("success");
                } else {
                    alert(result.msg + "'\n\nLegg til komponenten igjen.");
                    $(new_component).remove();
                }
            });

            request.fail(function( jqXHR, textStatus ) {
                alert("En feil oppsto: '" + jqXHR.responseText + "'\n\nLegg til komponenten igjen."); 
                $(new_component).remove(); 
            });
        }

//finally we add dependencies, i.e. components that this component depends on
        if (mlab_components[id].hasOwnProperty("conf") && mlab_components[id].conf.hasOwnProperty("dependencies")) {
            for (component in mlab_components[id].conf.dependencies) {
                mlab_feature_add(mlab_components[id].conf.dependencies[0], true);
            }
        }

        mlab_highlight_selected(new_comp);

        mlab_flag_dirty = true;

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

    function mlab_highlight_selected(el) {
         $( "#" + mlab_config["app"]["content_id"] + " div" ).removeClass("mlab_current_component");
         $( el ).addClass("mlab_current_component");
         mlab_menu_prepare();
    }

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

/* prepares the features menu for the current app */
    function mlab_menu_features_prepare() {
        var items = new Object();
        var title = "";
        for(var index in mlab_components) {
            if (mlab_components[index].conf["category"] == "feature") {
                items[index] =  { name: index.charAt(0).toUpperCase() + index.slice(1),
                                  callback: function(key, options) {
                                      mlab_feature_add(key, false);
                                  }
                                };
            }
        }            
        $.contextMenu( 'destroy', '#mlab_button_features' );

        if (Object.keys(items).length < 1) {
            return;
        }

        $.contextMenu({
            selector: '#mlab_button_features', 
            className: 'mlab_menu_features_title',
            trigger: 'left',
            items: items
        });

        $('.mlab_menu_features_title').attr('data-menutitle', "Add property");
    }

    function mlab_component_delete() {
        $(".mlab_current_component").remove();
        mlab_flag_dirty = true;
    }

//features are simply components that are not displayed with a GUI.
//they are added to a hidden div, if we are NOT working on the index page we call a backend function to add this code
    function mlab_feature_add(comp_id, silent){
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


        if (document.mlab_current_app.curr_page_num != "0" && document.mlab_current_app.curr_page_num != "index") {
            var url = mlab_urls.feature_add.replace("_APPID_", document.mlab_current_app.id);
            url = url.replace("_COMPID_", comp_id);
            if (!silent) {
                mlab_update_status("callback", 'Adding feature...', true);
            }

            $.get( url, function( data ) {
                if (data.result == "success") {
                    mlab_update_status("temporary", "Feature added", false);
                    $("#mlab_app_info").append("<br>" + mlab_components[data.component_id].conf.tooltip);
                } else {
                    mlab_update_status("temporary", data.msg, false);
                }

            });
        } 
    }
/*
 * 
 * @param divs (html/DOM) all divs to edit
 */
    function mlab_prepare_editable_area(divs) {
//need to loop through all divs in the editable box after they have been added 
//and set the styles for dragging/dropping so it works OK
        $( "#" + mlab_config["app"]["content_id"] + " div" ).each(function( index ) {
            $( this ).droppable(droppable_options)
                     .sortable(sortable_options)
                     .on("click", function(){mlab_highlight_selected(this);})
                     .on("input", function(){mlab_flag_dirty = true;});
//DEL                         .css("position", "relative")
//DEL                         .prepend("<div class='mlab_drag_handle' />")

            comp_id = $( this ).data("mlab-type");
            mlab_run_component_code($( this ), comp_id);
//TODO major hack, find out why these events are added here, when not added when drag'n'drop 
            // $( this ).off("click mousedown remove");
        });

//set draggable/sortable options for the editable area 
        $( "#" + mlab_config["app"]["content_id"] ).droppable(droppable_options).sortable(sortable_options);

    }


// APP FUNCTIONS, build, new, etc

/*
 * This function will first open the index.html file in an app, this has all the css/js/formatting etc in it.
 * Then it will open the page specified (if it is not == index | 0 )
 * @param {type} app_id
 * @param {type} page_num
 */
    function mlab_app_open(app_id, page_num) {
//TODO: Check if this is needed, and if it really does what we expect it to do. Added by Bård before Gol            
        if (app_id < 0) {
           app_id = document.mlab_current_app.id;
        }

        var local_page_num = page_num;
        var url = mlab_urls.page_get.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", 'index');
        url = url.replace("_UID_", mlab_uid);
        mlab_update_status("callback", 'Opening app', true);

        mlab_flag_server_update = true;
        $.get( url, function( data ) {
            mlab_flag_server_update = false;
            if (data.result == "success") {
                mlab_index_page_process ( data.html, "index");
                $("#mlab_app_info").empty();
                $(document.mlab_current_app.curr_indexpage_html)
                    .find("#mlab_features_content [data-mlab-type]>")
                    .each(function() { 
                        $("#mlab_app_info").append("<br>" + mlab_components[$(this).parent().data("mlab-type")].conf.tooltip);
                     });

                if (local_page_num != "0" && local_page_num != "index") {
                    mlab_page_open(data.app_id, local_page_num);
                }
            } else {
                mlab_update_status("temporary", data.msg, false);
            }

        });
    } 

    function mlab_app_test_local () {
        alert('Not implemented yet');
    }

/*
 * Calls a function on the backend that returns a URL to the file to download. 
 * If it is not compiled we will compile it first. 
 * @returns void
 */
    function mlab_app_download () {
        mlab_page_save();
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
    }

    function mlab_app_submit_to_market () {
        alert('Not implemented yet');
    }

/*********** Utility functions ***********/  
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
            $("#mlab_statusbar_temporary").text(content).show();
            window.setInterval(mlab_clear_status, 3000);
        } else if (state == "callback") {
            $("#mlab_statusbar_temporary").text(content).show();
        } else if (state == "completed") {
            $("#mlab_statusbar_temporary").hide();
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
        $.get( "/app_dev.php/app/builder/" + document.mlab_temp_app_id  + "/" + document.mlab_temp_page_num + "/load_variables" , function( data ) {
            
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

                        if (mlab_drag_origin === 'draggable') {
                            mlab_drag_origin = 'sortable';

//replace the cloned drag item with relevant HTML code from the component 
                            var id = $(ui.draggable[0]).data("mlab-type");
                            ui.draggable.empty().append(mlab_components[id].html);
                            ui.draggable.removeAttr('class style title'); //can do this because it is what is inside the div that will have classes etc 
                            ui.draggable.on("click", function(){mlab_highlight_selected(this);});
                            ui.draggable.on("input", function(){mlab_flag_dirty = true;});

                            mlab_run_component_code(ui.draggable, id, true);

//execute backend javascript and perform tasks like adding the permissions required to the manifest file and so on
//this is ONLY done if exec_server = true 
                            if (mlab_components[id].exec_server !== false) {
                                var url = mlab_urls.component_added.replace("_APPID_", document.mlab_current_app.id);
                                url = url.replace("_COMPID_", id);
                                var new_component = ui.draggable;
                                var request = $.ajax({
                                    type: "GET",
                                    url: url,
                                    dataType: "json"
                                });

                                request.done(function( result ) {
                                    if (result.result == "success") {
                                        mlab_drag_origin = 'sortable';
                                        console.log("success");
                                    } else {
                                        alert(result.msg + "'\n\nLegg til komponenten igjen.");
                                        $(new_component).remove();
                                    }
                                });

                                request.fail(function( jqXHR, textStatus ) {
                                    alert("En feil oppsto: '" + jqXHR.responseText + "'\n\nLegg til komponenten igjen."); 
                                    $(new_component).remove(); 
                                });
                            }

//finally we add dependencies, i.e. components that this component depends on
                            if (mlab_components[id].hasOwnProperty("conf") && mlab_components[id].conf.hasOwnProperty("dependencies")) {
                                for (component in mlab_components[id].conf.dependencies) {
                                    mlab_feature_add(mlab_components[id].conf.dependencies[0], true);
                                }
                            }

                        }
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
                $.get( "/app_dev.php/app/builder/" + document.mlab_temp_app_id  + "/load_components" , function( data ) {
                    if (data.result === "success") {
                        mlab_components = data.mlab_components;
                   		for (type in mlab_components) {
                            var c = mlab_components[type];
                            if (c.accessible && !c.is_feature) {
                                $("#mlab_toolbar_components").append(
                                        "<div data-mlab-type='" + type + "' " +
                                            "onclick='mlab_component_add(\"" + type + "\");' " +
                                            "title='" + c.tooltip + "' " +
                                            "class='mlab_button_components' " + 
                                            "style='background-image: url(\"" + mlab_config.urls.component + type + "/" + mlab_config.component_files.ICON + "\");'>" + 
                                        "</div>"
                                );
                            }
                        }

                        mlab_menu_features_prepare();

                        
//we always load pages using AJAX, this takes the parameters passed from the controller
                        mlab_app_open( document.mlab_temp_app_id, document.mlab_temp_page_num );
                        var tm = parseInt(mlab_config["save_interval"]);
                        if (tm === 0) { tm = 60; }
                        window.setInterval(mlab_page_save, tm * 1000);
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

    });
