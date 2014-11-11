
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

if (typeof Mlab == "undefined") {
    Mlab = function () {
        var self = this;
        var documentOb = $(document);
        var designMode = true;
    }
}

if (typeof Mlab.dt == "undefined") {
    Mlab.dt = function () {
        var self = this;
        var config = new Object();
        
// State variables used by all .dt sub functions
        this.flag_dirty = false;
        this.counter_saving_page = 0; // counter which tells us if inside the save function we should restart the timer for
        this.drag_origin = 'sortable';
        this.timer_save = null;
    }
}


Mlab.dt.design = function () {
    
}

Mlab.dt.design.prototype = {
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
    Process the top level DIVs inside DIV with ID = mlab_config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    index_page_process : function (page, page_num, is_final_destination) {
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
        var divs = doc.getElementById(mlab_config["app"]["content_id"]).cloneNode(true).childNodes;

//assign vars to current app var, we remove all elements that are editable so we have clean HTML to add our edited content to
//this HTML chunk will include HTML header + all body content outside the editable area, plus the empty div for the editable area
        var content = doc.getElementById(mlab_config["app"]["content_id"]);
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
            $("#" + mlab_config["app"]["content_id"]).html(divs);
            mlab_prepare_editable_area();
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

    },


/* this function processes a regular page that was retrieved.
 *
 * It does the following:
    Remove old HTML from the internal editing div (mlab_config["app"]["content_id"])
    Extract title and save it to JS var
    Extract BODY and insert content into mlab_config["app"]["content_id"]
    Process the top level DIVs inside DIV with ID = mlab_config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    regular_page_process : function (page, page_num) {
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
    }, 

/***********************************************************
 *********** Functions to manipulate components ***********
************************************************************/
    component_add : function (id) {
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

    },

/**
 * This executes (using eval()) any code for a component that is added to the app
 * @param {type} el = html element we're working on
 * @param {type} comp_id
 * @param {type} created
 * @returns {undefined}
 */
    component_run_code : function (el, comp_id, created) {
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
        mlab_flag_dirty = true;
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
        mlab_flag_dirty = true;
    },

    component_highlight_selected : function (el) {
         $( "#" + mlab_config["app"]["content_id"] + "> div" ).removeClass("mlab_current_component");
         $( el ).addClass("mlab_current_component");
         mlab_menu_prepare();
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
        mlab_flag_dirty = true;
    },

/**
 * features are simply components that are not displayed with a GUI
 * they are added to a hidden div, if we are NOT working on the index page we call a backend function to add this code
 *
 * @returns {undefined}
 */

    feature_add : function (comp_id, silent) {
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
    
} // end design.prototype 


