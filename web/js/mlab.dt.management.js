

/***********************************************************
 ******************* App level functions *******************
************************************************************/

function Mlab_dt_management () {
    this.parent = null;
}

Mlab_dt_management.prototype = {
    

/*
 * This function will first open the index.html file in an app, this has all the css/js/formatting etc in it.
 * Then it will open the page specified (if it is not == index | 0 )
 * @param {type} app_id
 * @param {type} page_num
 */
    app_open : function (app_id, page_num) {

        var local_page_num = page_num;
        var url = this.parent.urls.page_get.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", 'index');
        url = url.replace("_UID_", this.parent.uid);
        this.parent.utils.update_status("callback", 'Opening app', true);
        var that = this;
        $.get(url, function( data ) {
            if (data.result == "success") {
                that.index_page_process ( data.html, "index", ( local_page_num == "0" && local_page_num == "index" ) );

//update the list of features we have added to this app
                $("#mlab_features_list li").removeClass("mlab_features_used");
                $(that.parent.app.curr_indexpage_html)
                    .find("#mlab_features_content [data-mlab-type]>")
                    .each(function() {
                        $("#mlab_features_list [data-mlab-feature-type='" + $(this).parent().data("mlab-type") + "']").addClass("mlab_features_used");
                     });

//if they are not opening the index page we need to call backend again to load the page they want to open
                if (local_page_num != "0" && local_page_num != "index") {
                    that.page_open_process(data.app_id, local_page_num);
                } else {
                    $("#mlab_overlay").slideUp();
                    that.parent.app.locked = (data.lock_status == "locked");
                    that.parent.utils.timer_start();
                }
            } else {
                that.parent.utils.update_status("temporary", data.msg, false);
            }

        });
    },

    app_update_metadata : function (el) {
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

    },

/*
 * Calls a function on the backend that returns a URL to the file to download.
 * If it is not compiled we will compile it first.
 * @returns void
 */
    app_download  : function () {
        this.page_save(mlab_app_download_process);
    },

    app_download_process  : function () {
        this.parent.utils.update_status("callback", 'Retrieving app', true);
        var url = this.parent.urls.app_download.replace("_ID_", this.parent.app.id);
        var that = this;
        $.get( url, function( data ) {
            that.parent.utils.update_status("completed");
            if (data.result == "success") {
                full_url = window.location.origin + data.url;
                $("#mlab_download_qr2").empty().qrcode({text: full_url, render : "table"}).show()
                        .append("<br>")
                        .append("<a href='" + full_url + "'>Download: " + full_url +"</a>")
                        .append("<br>")
                        .append("<a href='mailto:" + that.parent.user_email + "?subject=Link&body=Download test app here: " + encodeURI(full_url) + "'>Mail link</a>");

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

        that.parent.utils.timer_start();
    },

    app_submit_to_market  : function () {
        alert('Not implemented yet');
    },

//remove locks, just a backup if something goes wrong
    app_remove_locks : function () {
        this.parent.utils.update_status("temporary", "Unlocking all pages...", true);
        $.get( this.parent.urls.app_unlock );
        $("#mlab_editor_disabled").remove();
    },

/**
 * Function to update content of GUI elements with the current app's metadata
 */
    app_update_gui_metadata : function () {

//List of all pages
//#mlab_existing_pages is a <div> which is populated with a <ol> with a <li> element for each page
        var list = $('<ol></ol>')
        var currpage = this.parent.app.curr_page_num;
        var span = "";
        if (currpage == "index") {
            currpage = 0;
        }
        for (i in this.parent.app.page_names) {
            if (i > 0) {
                span = "<span class='mlab_copy_file' title='Kopier side " + i + "' onclick='mlab_page_copy(\"" + i + "\");' >&nbsp;</span>";
            }

            if (i == 0){ //index
                span = "<span class='mlab_not_copy_file'>&nbsp;</span>";
            }

            if (i == currpage) {
                list.append("<li data-mlab-page-open='" + i + "'>" + span + this.parent.app.page_names[i] + "</li>");
            } else {
                list.append("<li>" + span + "<a data-mlab-page-open='" + i + "' href='javascript:mlab_page_open(" + this.parent.app.id + ", \"" + i + "\");'>" + this.parent.app.page_names[i] + "</a></li>");
            }
        }
        $("#mlab_existing_pages").html(list);

//Various app meta data
        $("#mlab_edit_app_title").text(this.parent.app.name);
        $("#mlab_edit_app_description").text(this.parent.app.description);
        $("#mlab_edit_app_keywords").text(this.parent.app.keywords);
        $("#mlab_edit_app_category1").text(this.parent.app.categoryOne);
        $("#mlab_edit_app_category2").text(this.parent.app.categoryTwo);
        $("#mlab_edit_app_category3").text(this.parent.app.categoryThree);
    },


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
    Process the top level DIVs inside DIV with ID = this.parent.config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    index_page_process  : function (page, page_num, is_final_destination) {
        var comp_id, temp_comp, temp_link;
        var temp_stylesheets = "";
        var start_dir = this.parent.config.urls.app + this.parent.app.path + "/" + this.parent.app.version + this.parent.config.cordova.asset_path;

//parse doc into a variable
        var doc = (new DOMParser()).parseFromString(page,"text/html");

//check if it has editable area, if not we cannot continue
        if (doc.getElementById(this.parent.config["app"]["content_id"]) == null) {
            alert("This app does not have an editable area called " + this.parent.config["app"]["content_id"] + ", unable to open app. Check with the system administrator for further information.")
            return;
        }

//set the base href to the folder of the app
        document.getElementsByTagName("base")[0].href = start_dir;

//remove old stuff
        $("#mlab_editor_chrome").empty();
        $("link[rel=stylesheet][href^='css']").remove();

//store different parts of doc for easy access/manipulation
        var head = doc.getElementsByTagName("head")[0];
        var divs = doc.getElementById(this.parent.config["app"]["content_id"]).cloneNode(true).childNodes;

//assign vars to current app var, we remove all elements that are editable so we have clean HTML to add our edited content to
//this HTML chunk will include HTML header + all body content outside the editable area, plus the empty div for the editable area
        var content = doc.getElementById(this.parent.config["app"]["content_id"]);
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
            $("#" + this.parent.config["app"]["content_id"]).html(divs);
            this.parent.design.prepare_editable_area();
        }

        this.parent.app.curr_indexpage_html = doc;
//Page name is picked up from title tag in head
        this.parent.app.curr_pagetitle = head.getElementsByTagName("title")[0].innerText;
        this.parent.app.curr_page_num = page_num;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);

        this.app_update_gui_metadata();

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
    Remove old HTML from the internal editing div (this.parent.config["app"]["content_id"])
    Extract title and save it to JS var
    Extract BODY and insert content into this.parent.config["app"]["content_id"]
    Process the top level DIVs inside DIV with ID = this.parent.config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    regular_page_process  : function (page, page_num) {
        var comp_id, temp_comp, temp_link;
        var start_dir = this.parent.config.urls.app + this.parent.app.path + "/" + this.parent.app.version + this.parent.config.cordova.asset_path;

//remove old stuff
        $("#" + this.parent.config["app"]["content_id"]).html("");

//a page may have failed to save, in this case we create an empty page here, then everything works
        if (page == "") {
            page = this.parent.config["app"]["html_header"].replace("%TITLE%", "Title") + this.parent.config["app"]["html_footer"];
            page = page.replace(/\\n/g, "\n");
        }
//
//parse doc into variables
        var doc = (new DOMParser()).parseFromString(page,"text/html");
        var head = doc.getElementsByTagName("head")[0];
        var body = doc.getElementsByTagName("body")[0].cloneNode(true);

//Page name is picked up from title tag in head
        this.parent.app.curr_pagetitle = head.getElementsByTagName("title")[0].innerText;
        this.parent.app.curr_page_num = page_num;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);

        this.app_update_gui_metadata();

//add body content
        $("#" + this.parent.config["app"]["content_id"]).html(body.innerHTML);

        this.parent.design.prepare_editable_area();
        $.mobile.initializePage();
    },


/***********************************************************
 ************** Functions to manipulate pages **************
************************************************************/

/*
 * Open previous or next page depending on direction. If on first or last page does nothing
 * @param {type} direction
 * @returns {undefined}
 */
    page_move_to : function (direction) {
        var curr_num = 0;
        (this.parent.app.curr_page_num == "index") ? curr_num = 0 : curr_num = parseInt(this.parent.app.curr_page_num);
        if ( direction < 0 && curr_num > 0 ) {
            curr_num--;
        } else if ( direction > 0 ) {
            curr_num++;
        } else {
            return;
        }
        this.page_open(this.parent.app.id, curr_num);

    },

/**
 * Retrieve content of a page from server and insert it into the editor area
 * First line is a pattern from Symfony routing so we can get the updated version from symfony when we change it is YML file
 */
    page_open : function (app_id, page_num) {
        this.page_save( function() { this.page_open_process(app_id, page_num); } );
    },

    page_open_process : function (app_id, page_num) {

        this.parent.utils.update_status("callback", 'Opening page', true);

        var url = this.parent.urls.page_get.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_UID_", this.parent.uid);
        var that = this;

        $.get( url, function( data ) {
            if (data.result == "success") {
                that.parent.utils.update_status("completed");
                that.parent.utils.update_status("permanent", that.parent.app.name);
                $("#mlab_page_control_title").text(that.parent.app.curr_pagetitle);
                if (data.page_num_sent == 0 || data.page_num_sent == "index" ) {
                    that.index_page_process ( data.html, "index", true );
                } else if (data.page_num_sent == "last" && data.page_num_real == 0) {
                    that.parent.utils.timer_start();
                    if ( $("#mlab_overlay").is(':visible') ) {
                        $("#mlab_overlay").slideUp();
                    }
                    return;
                } else {
                    that.parent.design.regular_page_process ( data.html, data.page_num_real );
                    var path = window.location.pathname.split("/");
                    path[path.length - 3] = data.app_id;
                    path[path.length - 2] = data.page_num_real;
                    history.pushState({id: data.app_id, page: data.page_num_real }, that.parent.app.curr_pagetitle, path.join("/"));
                }

                if (data.lock_status == "locked") {
                    that.parent.app.locked = true;
                    $("#" + that.parent.config["app"]["content_id"]).fadeTo('slow',.6);
                    $("div.container").append('<div id="mlab_editor_disabled" style="background-color: gray; position: absolute;top:110px;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50); background-image: url(/img/page_locked.png); background-repeat: no-repeat; background-position: 95% 2%;"></div>');
                } else {
                    that.parent.app.locked = false;
                    $("#mlab_editor_disabled").remove();
                    $("#" + that.parent.config["app"]["content_id"]).fadeTo('slow',1);
                }

                if ( $("#mlab_overlay").is(':visible') ) {
                    $("#mlab_overlay").slideUp();
                }

                that.parent.utils.timer_start();

            } else {
                that.parent.utils.update_status("temporary", data.msg, false);

            }

        } );

    },

/**
 * This will update the title of the currently open page and also update relevant items other places
 */
    page_update_title : function () {
        if (this.parent.app.locked) {
            alert("Page is locked, you cannot update the title");
            return;
        }

        this.parent.flag_dirty = true;
        this.parent.app.curr_pagetitle = $("#mlab_page_control_title").text();
        this.parent.app.page_names[this.parent.app.curr_page_num] = this.parent.app.curr_pagetitle;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);
        if (this.parent.app.curr_page_num == "index") {
            $("#mlab_existing_pages [data-mlab-page-open='0']").html(this.parent.app.curr_pagetitle);
        } else {
            $("#mlab_existing_pages [data-mlab-page-open='" + this.parent.app.curr_page_num + "']").html("<span class='mlab_copy_file' onclick='this.page_copy(\"" + this.parent.app.curr_page_num + "\");' >&nbsp;</span>" + this.parent.app.curr_pagetitle);
        }


    },


/**
 * This is the save function, it is called in three possible ways:
 * 1: When a user clicks the save button
 * 2: When the save timer (this.parent.utils.timer_save) kicks in
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
    page_save : function (fnc) {
        this.parent.utils.timer_stop();
        var require_save = true;
        var res = false;
        this.parent.counter_saving_page++;

//cannot save if locked
        if ($("#mlab_editor_disabled").length > 0) {
            console.log('Page locked, did not save');
            require_save = false;
        }

//this is called from a timer, so we also need to check if an app has been created, etc
//also if any changes have occurred
        if (this.parent.app.curr_page_num == undefined || this.parent.app.id == undefined) {
            require_save = false;
        }

        if (!this.parent.flag_dirty) {
            require_save = false;
        }

        if ((!require_save) && (typeof fnc != 'undefined')) {
            return fnc();
        } else if (!require_save) {
            return false;
        }

//prepare various variables
        this.parent.utils.update_status("callback", "Storing page", true);
        var curr_el = $("#" + this.parent.config["app"]["content_id"] + " .mlab_current_component");
        curr_el.removeClass("mlab_current_component");
        var app_id = this.parent.app.id;
        var page_num = this.parent.app.curr_page_num;
        var page_content = "";
        var component_categories = new Object();
        var template_best_practice_msg = new Array();
        var url = this.parent.urls.page_save.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_CHECKSUM_", this.parent.app.app_checksum);

//this loop is a: picking up the cleaned HTML for each component,
//(this is done by calling the onSave unction which strips away anything we are not interested in)
// and b: checking if the component transgresses any of the rules for the template
        var that = this;
        $("#" + that.parent.config["app"]["content_id"]).children("div").each(function() {
            var comp_id = $(this).data("mlab-type");
            if (typeof that.parent.components[comp_id].code !== "undefined" && typeof that.parent.components[comp_id].code.onSave !== "undefined") {
                page_content = page_content + that.parent.components[comp_id].code.onSave(this);
            } else {
                page_content = page_content + $(this)[0].outerHTML + "\n";
            }

//run the template checks
            that.parent.bestpractice.component_check_content(this, comp_id, component_categories, template_best_practice_msg);
        });

        this.parent.bestpractice.page_check_content(component_categories, template_best_practice_msg);

//if this is the index page we add the full HTML page, if not we only require a very simple header/footer
        if (page_num == 0 || page_num == "index" ) {
            var final_doc = this.parent.app.curr_indexpage_html;
            final_doc.getElementById(this.parent.config["app"]["content_id"]).innerHTML = page_content;
            final_doc.title = this.parent.app.curr_pagetitle;
            var html = (new XMLSerializer()).serializeToString(final_doc);
        } else {
            var html = "<!DOCTYPE html>\n<html><head><title>" + this.parent.app.curr_pagetitle + "</title></head><body>" + page_content + "</body></html>";
        }

        curr_el.addClass("mlab_current_component");

//finally we submit the data to the server, the callback function will further execute the function specified in the fnc argument, if any
        var that = this;
        $.post( url, {html: html}, function( data ) {

//if this counter = 0 then noone else have called it in the meantime and it is OK to restart timer
            that.parent.counter_saving_page--;

            if (data.result == "success") {
                that.parent.utils.update_status("temporary", "Saved page", false);
                that.parent.flag_dirty = false;

//if a function was specified we now execute it, inisde this function the this.parent.utils.timer_save timer will be restarted
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
                        that.parent.app.app_checksum = data.app_info.mlab_app_checksum;
                        that.parent.app.page_names = data.app_info.mlab_app.page_names;

                    } else if (data.app_info.result === "no_file_changes") {
                        console.log("No changes to app files");

                    } else {
                        if (that.parent.counter_saving_page == 0 && (typeof fnc == 'undefined')) {
                            that.parent.utils.timer_start();
                        }
                        return;
                    }

                    that.parent.app.name = data.app_info.mlab_app.name;
                    that.parent.app.description = data.app_info.mlab_app.description;
                    that.parent.app.keywords = data.app_info.mlab_app.keywords;
                    that.parent.app.categoryOne = data.app_info.mlab_app.categoryOne;
                    that.parent.app.categoryTwo = data.app_info.mlab_app.categoryTwo;
                    that.parent.app.categoryThree = data.app_info.mlab_app.categoryThree;
                    that.app_update_gui_metadata();

                };

            } else { //failed
                that.parent.utils.update_status("temporary", "Unable to save page: " + data.msg, false);
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
                                that.page_save(fnc);
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
            if (that.parent.counter_saving_page == 0 && (typeof fnc == 'undefined')) {
                that.parent.utils.timer_start();
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
    },

/**
* Creates a new file on the server and opens it
*/
    page_new : function () {
        var title = prompt("Please enter the title of the new page");
        if (title != null) {
            this.page_save( function() { this.page_new_process( title ); } );
        }
    },

    page_new_process : function (title) {
        this.parent.utils.update_status("callback", "Storing page", true);
        var url = this.parent.urls.page_new.replace("_ID_", this.parent.app.id);
        url = url.replace("_UID_", this.parent.uid);

        $.post( url, {}, function( data ) {
            if (data.result == "success") {
                this.parent.utils.update_status("completed");
                $("#" + this.parent.config["app"]["content_id"]).empty();
                this.parent.app.curr_pagetitle = title;
                this.parent.app.curr_page_num = data.page_num_real;
                $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);
                this.parent.app.page_names[this.parent.app.curr_page_num] = title;
                this.app_update_gui_metadata();

                this.parent.flag_dirty = true;

            } else {
                this.parent.utils.update_status("temporary", data.msg, false);
            }

            this.parent.utils.timer_start();

        });
     },

/**
 * Creates a new file on the server and opens it
 */
    page_copy : function (page_num) {
        if (page_num == "0" || page_num == "index") {
            alert("You can not copy the index page");
            return;
        }

        this.page_save( function() { this.page_copy_process(page_num); } );
    },

    page_copy_process : function (page_num) {

        var url = this.parent.urls.page_copy.replace("_ID_", this.parent.app.id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_UID_", this.parent.uid);
        this.parent.utils.update_status("callback", "Copying page", true);
        var that = this;

        $.get( url, function( data ) {
            that.parent.utils.update_status("completed");
            if (data.result == "success") {
                that.parent.app.curr_pagetitle = data.page_title;
                $("#mlab_page_control_title").text(data.page_title);
                that.parent.app.page_names[data.page_num_real] = data.page_title;
                that.regular_page_process ( data.html, data.page_num_real );
            } else {
                alert(data.msg);
            }
            that.parent.utils.timer_start();
        });
    },

    page_delete  : function () {
        if (this.parent.app.curr_page_num == "0" || this.parent.app.curr_page_num == "index") {
            alert("You can not delete the index page");
            return;
        }

        if (!confirm("Are you sure you want to delete this page? This cannot be undone!")) {
            return;
        }

        this.parent.utils.timer_stop();
        this.parent.utils.update_status("callback", "Deleting page", true);

        var url = this.parent.urls.page_delete.replace("_ID_", this.parent.app.id);
        url = url.replace("_PAGE_NUM_", this.parent.app.curr_page_num);
        url = url.replace("_UID_", this.parent.uid);
        var that = this;

        $.get( url, function( data ) {
            that.parent.utils.update_status("completed");
            if (data.result == "success") {
                $("#mlab_existing_pages [data-mlab-page-open='" + that.parent.app.curr_page_num + "']").remove();
                that.parent.app.page_names.splice(that.parent.app.curr_page_num, 1);
                that.regular_page_process ( data.html, data.page_num_real );

                if (that.parent.app.curr_page_num == "index") {
                    $("#mlab_existing_pages [data-mlab-page-open='" + that.parent.app.curr_page_num + "']").html(that.parent.app.curr_pagetitle);
                } else {
                    $("#mlab_existing_pages [data-mlab-page-open='" + that.parent.app.curr_page_num + "']").html("<span class='mlab_copy_file' onclick='mlab.dt.management.page_copy(\"" + that.parent.app.curr_page_num + "\");' >&nbsp;</span>" + that.parent.app.curr_pagetitle);
                }

            } else {
                that.parent.utils.update_status("temporary", data.msg, false);
            }

            that.parent.utils.timer_start();
        });
    },

    /**
     * Simple function to open a new window with current page in it
     * Given that we use an jquery mobile framework with an index file and loading pages into the index file,
     * we need to pass the relevant file name and have matching code in the mlab.js file to deal with this
     * @param {type} index
     * @returns {undefined}
     */
    page_preview : function () {
        this.page_save(this.page_preview_process);
    },

    page_preview_process : function () {
        if (this.parent.app.curr_page_num == 0 || this.parent.app.curr_page_num == "index" ) {
            page_name = ""
        } else {
            page_name = ("000" + this.parent.app.curr_page_num).slice(-3) + ".html";
        }
        var w = $(window).width() * 0.25;
        var h = $(window).height() * 0.75;
        var res = window.open(this.parent.config["urls"]["app"] + this.parent.app.path + "/" + this.parent.app.version + "/" + this.parent.config["cordova"]["asset_path"] + "/index.html?openpage=" + page_name,'targetWindow','toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=' + w + ',height=' + h + ',left=' + w);
        if (res == undefined) {
            alert("Cannot open new window, change your settings to allow popup windows");
        }
        this.parent.utils.timer_start();
    }

}// end management.prototype