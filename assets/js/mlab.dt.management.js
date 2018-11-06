/*******************************************************************************************************************************
@copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
@license Proprietary and confidential
@author Arild Bergh/Sinett 3.0 programme (firstname.lastname@ffi.no) rewrite/implementation of all functionality
@author Cecilie Jackbo Gran/Sinett 3.0 programme (firstname.middlename.lastname@ffi.no) additional functionality

Unauthorized copying of this file, via any medium is strictly prohibited 

For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.
*******************************************************************************************************************************/

/**
 * @abstract App level functions 
 */

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
        var url = this.parent.urls.app_open.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", 'index');
        url = url.replace("_UID_", this.parent.uid);
        url = url.replace("_OPEN_MODE_", "true");
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.opening.app"], true);
        var that = this;
        var local_app_id = app_id;

        mlab.dt.management.socket.send('subscribe',{
            feed: 'app_' + mlab.dt.app.uid,
            subscriber: mlab.dt.uid,
        });
        
        $.get(url, function( data ) {
            if (data.result == "success") {
                that.index_page_process ( data.html, ( local_page_num == "0" || local_page_num == "index" || that.parent.app.page_names.length == 1 ) );
                
//set the compiler qTip to show QR code and link when hower over compile icon
//TODO: Burde endre ikonet til grønt eller noe....
//TODO: use api.elements.tooltip
//any existing compiled files for this app
                mlab.dt.app.compiled_files = data.compiled_files;
                
                $.each(mlab.dt.config.compiler_service.supported_platforms, function(index, platform) {
                    if (typeof mlab.dt.app.compiled_files[platform] != "undefined") {
//TODO: skille ut de 3 neste linjene som egen funksjon - dette skal brukes flere steder....
                        var text = document.getElementsByTagName("base")[0].href.slice(0, -1) + "_compiled/" + mlab.dt.app.compiled_files[platform];
                        $('#mlab_download_qr_link_' + platform).empty().qrcode({text: text, size: 150, background: "#ffffff", foreground: "#000000", render : "table"});
                        $('#mlab_download_link_' + platform).html("<b>URL</b>:</br>" + text);

/*                        $('#mlab_download_'+ platform + '_icon').qtip({
                            hide:{ delay:500, fixed:true },//give a small delay to allow the user t mouse over it.
                            content: {text: function(){ return $("[data-mlab-download-link-info='" + platform + "']").html()},
                                     title: { text: "Download to " + platform } },
                            style: { classes: "mlab_qtip_tooltip mlab_qtip_menu_tooltip", tip: true }
                        });*/
                    }
                });
                
                
                $("#mlab_statusbar_permanent").html(mlab.dt.app.name);
//update the list of features we have added to this app
                $("#mlab_features_list li").removeClass("mlab_item_applied");
                $(that.parent.app.curr_indexpage_html)
                    .find("#mlab_features_content [data-mlab-type]>")
                    .each(function() {
                        $("#mlab_features_list [data-mlab-feature-type='" + $(this).parent().data("mlab-type") + "']").addClass("mlab_item_applied");
                     });

//if they are opening the app with a blank page and no components on the index page, let's assume they are opening a new app, and we'll ask for the title of the page
                if (data.only_index && $("#" + that.parent.config["app"]["content_id"]).children().length == 0) {
                    var title = prompt(_tr["mlab.dt.management.js.prompt.title.front.page"], that.parent.app.curr_pagetitle);
                    if (title != null) {
                        that.parent.app.curr_pagetitle = title;
                        $("#mlab_page_control_title").text(that.parent.app.curr_pagetitle); 
                        that.parent.flag_dirty = true;
                    }
                }

//if they are not opening the index page we need to call backend again to load the page they want to open
                if (local_page_num != "0" && local_page_num != "index" && !data.only_index) {
                    that.page_open_process(data.app_id, local_page_num);
                } else {
                    if (data.lock_status == "locked") {
                        that.parent.app.locked = true;
                        $("#" + that.parent.config["app"]["content_id"]).fadeTo('slow',.6);
                        $("div.container").append('<div id="mlab_editor_disabled" style="background-color: gray; position: absolute;top:110px;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50); background-image: url(/img/page_locked.png); background-repeat: no-repeat; background-position: 95% 2%;"></div>');
                    } else {
                        that.parent.app.locked = false;
                        $("#mlab_editor_disabled").remove();
                        $("#" + that.parent.config["app"]["content_id"]).fadeTo('slow',1);
                    }

                    
                    that.parent.utils.update_status("temporary", _tr["mlab.dt.management.js.update_status.ready"], false);
                    $("#mlab_overlay").slideUp();
                    that.parent.app.locked = (data.lock_status == "locked");
                    that.parent.utils.timer_start();
                }
            } else {
                that.parent.utils.update_status("temporary", data.msg, false);
            }
            
            that.parent.utils.update_app_title_bar(mlab.dt.app.config);
            
//set the trap for the paste function so we force plain text
            $("#" + mlab.dt.config["app"]["content_id"]).on("paste", function(e) {
// stop original paste from happening
                e.preventDefault();
                
//if they are not allowed to paste into this component we quit
                var comp_id = $(".mlab_current_component").data("mlab-type");
                if (typeof mlab.dt.components[comp_id].conf.paste_allowed == "undefined" || mlab.dt.components[comp_id].conf.paste_allowed === false) {
                    return;
                } 


//obtain plain text
                var text = e.originalEvent.clipboardData.getData("text/plain");

//insert via built in exec commands
                document.execCommand("insertHTML", false, text);
//add a text in the footer to explain that the formating is lost when you paste text
                $(".mlab_editor_footer_help").text(_tr["build_app.footer.help.paste.text"]);
//hide the text after 5 seconds
                setTimeout( function() { $(".mlab_editor_footer_help").text(""); }, 5000);
              
                mlab.dt.flag_dirty = true;
            });
            

        });
    },


/*
 * Calls a function on the backend that returns a URL to the file to download.
 * If it is not compiled we will compile it first.
 * @returns void
 */
    app_download  : function () {
        that = this;
        this.page_save( function() { that.app_download_process(); } );
    },

    app_download_process  : function () {
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.retrieving.app"], true);
        var url = this.parent.urls.app_download.replace("_ID_", this.parent.app.id);
        var that = this;
        $.get( url, function( data ) {
            that.parent.utils.update_status("completed");
            if (data.result == "success") {
                full_url = window.location.origin + data.url;
                $("#mlab_download_qr2").empty().qrcode({text: full_url, render : "table"}).show()
                        .append("<br>")
                        .append("<a href='" + full_url + "'>" + _tr["mlab.dt.management.js.app_download_process.1"] + ": " + full_url +"</a>")
                        .append("<br>")
                        .append("<a href='mailto:" + that.parent.user_email + "?subject=Link&body=" + _tr["mlab.dt.management.js.app_download_process.2"] + ": " + encodeURI(full_url) + "'>" + _tr["mlab.dt.management.js.app_download_process.3"] + "</a>");

            } else {
                $("#mlab_download_qr2").empty().append("<p>" + _tr["mlab.dt.management.js.app_download_process.4"] + ": " + data.msg + "</p>").show();

            }
     /*       $("#mlab_download_qr_field").qtip({
                content: {text: $("#mlab_download_qr2").html() },
                position: { my: 'top right', at: 'bottom right', target: $("#mlab_download_qr_field") },
                show: { ready: true, modal: { on: false, blur: false } },
                hide: 'unfocus',
                style: { classes: 'qtip-tipped', tip: true }});
        */
        });

        that.parent.utils.timer_start();
    },

    app_submit_to_market  : function () {
        alert(_tr["mlab.dt.management.js.app_submit_to_market"]);
    },

//remove locks, just a backup if something goes wrong
    app_remove_locks : function () {
        this.parent.utils.update_status("temporary", _tr["mlab.dt.management.js.update_status.unlocking.pages"], true);
        $.get( this.parent.urls.app_unlock );
        $("#" + this.parent.config["app"]["content_id"]).fadeTo('slow',1);
        $("#mlab_editor_disabled").remove();
        this.parent.app.locked = false;
    },

/**
 * Function to update content of GUI elements with the current app's metadata
 */
    app_update_gui_metadata : function (only_list) {

//List of all pages
//#mlab_existing_pages is a <div> which is populated with a <ol> with a <li> element for each page
        var list = $('<ol></ol>'),
            span = ""
            curr_filename = this.page_filenum2filename(this.parent.app.curr_page_num);
        
//loop through list of pages in this app and display them
        for (i in this.parent.app.page_names) {
            if (i == 0){ //always index.html file 
                page_num = 0;
                span = "<span class='mlab_not_copy_file'>&nbsp;</span>";
            } else {
                page_num = parseInt(this.parent.app.page_names[i]["filename"]);
                span = "<span class='mlab_copy_file' title='" + _tr["mlab.dt.management.js.app_update_gui_metadata.copy.pages"] + " \"" + this.parent.app.page_names[i]["title"] + "\"' onclick='mlab.dt.management.page_copy(\"" + page_num + "\");' >&nbsp;</span>";
            }

            if (this.parent.app.page_names[i]["filename"] == curr_filename) {
                list.append("<li data-mlab-page-num='" + page_num + "' data-mlab-page-open='" + page_num + "'>" + span + this.parent.app.page_names[i]["title"] + "</li>");
            } else {
                list.append("<li data-mlab-page-num='" + page_num + "'>" + span + "<a data-mlab-page-open='" + page_num + "' href='javascript:mlab.dt.management.page_open(" + this.parent.app.id + ", \"" + page_num + "\");'>" + this.parent.app.page_names[i]["title"] + "</a></li>");
            }
        }

        $("#mlab_existing_pages").html(list);
        
//make page list sortable to reset pages
        $("#mlab_existing_pages ol").sortable({
                items: "> li:gt(0)",
                update: function(event, ui) {
                   mlab.dt.management.page_reorder(event, ui);
                }
            }).disableSelection();

        if (only_list) { return; }
        
//Various app meta data
        $("#mlab_edit_app_title").text(this.parent.app.name);
        $("#mlab_edit_app_description").text(this.parent.app.description);
        $("#mlab_edit_app_keywords").text(this.parent.app.keywords);
        $("#mlab_edit_app_tags").text(this.parent.app.tags);
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

    index_page_process  : function (page, is_final_destination) {
        var comp_id, temp_comp, temp_link;
        var temp_stylesheets = "";
        var start_dir = this.parent.config.urls.app + this.parent.app.path + "/" + this.parent.app.active_version + "/";

//parse doc into a variable
        var doc = (new DOMParser()).parseFromString(page,"text/html");

//check if it has editable area, if not we cannot continue
        if (doc.getElementById(this.parent.config["app"]["content_id"]) == null) {
            alert(_tr["mlab.dt.management.js.index_page_process.alert.1"] + " " + this.parent.config["app"]["content_id"] + ", " + _tr["mlab.dt.management.js.index_page_process.alert.2"]);
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

//insert stylesheets, but not when preview it, hence we look for the presence of the RT stylesheet
//TODO use variable instead
        for ( var i = 0; i < stylesheets.length; i++) {
            temp_link = stylesheets[i].getAttribute("href");
            if(temp_link.indexOf("style_rt.css") < 0){
                temp_stylesheets = temp_stylesheets + "<link rel='stylesheet' href='" + temp_link + "' type='text/css'>" + "\n";
            }
        }
        $("head link[rel='stylesheet']").last().after(temp_stylesheets);

//here we insert the body MINUS the editable area (which was just removed) which is stored in the divs variable, into the editor_chrome
        $("#mlab_editor_chrome").append(body.innerHTML);

//Page name is picked up from title tag in head
        this.parent.app.curr_pagetitle = head.getElementsByTagName("title")[0].innerText;
//        must be called before this.parent.design.prepare_editable_area()
        this.parent.app.curr_page_num = 0;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);

//now we need to make the internal code editable, but only if they actually want to edit this page
        if (is_final_destination) {
            $("#" + this.parent.config["app"]["content_id"]).html(divs);
            this.parent.api.getAllLibraries();
            this.parent.design.prepare_editable_area();
        }

        this.parent.app.curr_indexpage_html = doc;
        this.app_update_gui_metadata();

//finally we need to initialise the jQuery mobile stuff on the page we loaded, otherwise it will not display correctly
        try {
            $.mobile.initializePage();
        }
        catch(err) {
            console.log(err.message);
        }
        
        mlab.dt.api.display.updateDisplay();

//JS to fix the toolbars in a jQuery mobile page
        var border_width = (parseInt($("#mlab_editor_chrome").css("margin-bottom")) * 2) + parseInt($("#mlab_editor_chrome").css("border-bottom-width"));
        $("[data-role=header]").css( {"position": "absolute", "z-index": 0} );
        $("[data-role=footer]").css( { "position": "absolute", "bottom": ($("[data-role=footer]").height() + border_width) + "px" } );
        $("[data-role=page]").css( {"width": "100%", "height": "100%", "min-height": "", "position": "absolute", "margin": "0", "padding": "0", "padding-top": $("[data-role=header]").height() + "px", "padding-bottom": $("[data-role=footer]").height() + "px" } );

//TODO: hack de luxe, refreshes images that for some reason can't be seen
        $("#panel_left").css("background-image", $("#panel_left").css("background-image"));
        $("#panel_right").css("background-image", $("#panel_right").css("background-image"));

//stop links from being opened up in design mode, links always have this data attribute
        $("#" + this.parent.config["app"]["content_id"]).find("[data-mlab-islink='1']").click(function(e) { e.preventDefault(); });

    },


/* this function processes a regular page that was retrieved.
 *
 * It does the following:
    Remove old HTML from the internal editing div (this.parent.config["app"]["content_id"])
    Extract title and save it to JS var
    Extract BODY and insert content into this.parent.config["app"]["content_id"]
    Process the top level DIVs inside DIV with ID = this.parent.config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    regular_page_process: function (page, page_num) {
        var comp_id, temp_comp, temp_link;
        var start_dir = this.parent.config.urls.app + this.parent.app.path + "/" + this.parent.app.active_version + "/";

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
        var body = doc.getElementsByClassName("mlab_main_body_content")[0].cloneNode(true);

//Page name is picked up from title tag in head
        this.parent.app.curr_pagetitle = head.getElementsByTagName("title")[0].innerText;
        this.parent.app.curr_page_num = page_num;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);

        this.app_update_gui_metadata();

//add body content
        $("#" + this.parent.config["app"]["content_id"]).html(body.innerHTML);
        this.parent.api.getAllLibraries();
        this.parent.design.prepare_editable_area();
        
        try {
            $.mobile.initializePage();
        }
        catch(err) {
            console.log(err.message);
        }
        mlab.dt.api.display.updateDisplay()
//stop links from being opened up in design mode, links always have this data attribute
        $("#" + this.parent.config["app"]["content_id"]).find("[data-mlab-islink='1']").click(function(e) { e.preventDefault(); });
    },


/***********************************************************
 ************** Functions to manipulate pages **************
************************************************************/

/*
 * Utility function to find index in mlab.dt.app.page_names by filename
 * @param string|int filename/number 
 * @returns int index
 */
    page_filenum2index : function (page_id) {
        if (typeof page_id != "number") {
            page_id = parseInt(page_id);
        } 
        if (page_id == 0) {
            page_id = "index.html"
        } else {
            page_id = ("000" + page_id).slice(-3) + ".html"
        }
        for (var i in this.parent.app.page_names) {
            if (this.parent.app.page_names[i].filename == page_id) {
                return i;
            }
        }
    },

/*
 * Utility function to create a filename from a number
 * @param string|int filename/number 
 * @returns int index
 */
    page_filenum2filename : function (page_id) {
        if (typeof page_id != "number") {
            page_id = parseInt(page_id);
        } 
        if (page_id == 0) {
            return "index.html"
        } else {
            return ("000" + page_id).slice(-3) + ".html"
        }
    },


/*
 * Move the selected page to a new position int he app, this is done on backend by renaming the actual file
 * So if you want to move page 2 to 10, 3 - 9  will be minus one, 2 will be 10
 * @param {type} event jquery event info
 * @param {type} ui jquery ui info
 * @returns {undefined}
 */
    page_reorder : function (event, ui) {
        
//bail if it has not been moved
        if (ui.item.find("a").data("mlab-page-open") == parseInt(mlab.dt.app.page_names[ui.item.index()].filename)) {
            console.log("not moved");
            return;
        }
        that = this;
//turn off automatic saving before moving file
        this.page_save( function() { mlab.dt.utils.timer_stop(); that.page_reorder_process(event, ui); }, undefined, true );
    },

    page_reorder_process : function (event, ui) {
        var app_id = this.parent.app.id;
        var from_page = ui.item.data("mlab-page-num"); //the filenames are stored in the data tag mlab-page-num
        var to_page = parseInt(mlab.dt.app.page_names[ui.item.index()].filename); //calculate the page it will push down by using the new index of the moved item and look up filename in internal page_names array 
        var that = this;

        var url = this.parent.urls.page_reorder.replace("_ID_", app_id);
        url = url.replace("_FROM_PAGE_", from_page);
        url = url.replace("_TO_PAGE_", to_page);
        url = url.replace("_UID_", this.parent.uid);
        
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.reordering.page"], true);

        $.get(url, function( data ) {
            that.parent.utils.update_status("completed");
            if (data.result == "success") {
//update the list of pages to the new order, the page numbers have changed so we need to do that
                that.parent.app.page_names = data.page_names;
            } else {
                alert("Unable to move page");
            }
            that.app_update_gui_metadata();
            mlab.dt.utils.timer_start(); 
        });
    },

/**
 * Retrieve content of a page from server and insert it into the editor area
 * First line is a pattern from Symfony routing so we can get the updated version from symfony when we change it is YML file
 */
    page_open : function (app_id, page_num) {
        that = this;
        this.page_save( function() { that.page_open_process(app_id, page_num); } );
    },

    page_open_process : function (app_id, page_num) {

        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.opening.page"], true);

        var url = this.parent.urls.page_get.replace("_ID_", app_id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_UID_", this.parent.uid);
        
//here we hide the tools for components until they select a control
        if (typeof this.parent.qtip_tools != "undefined") {
            $(this.parent.qtip_tools).qtip('hide');
            this.parent.qtip_tools = undefined
            if (typeof this.parent.api.properties_tooltip != "undefined") {
                $(this.parent.api.properties_tooltip).qtip('hide');
                this.parent.api.properties_tooltip = undefined;
            }
        }

        
        var that = this;

        $.get( url, function( data ) {
            if (data.result == "success") {
                that.parent.utils.update_status("completed");
                that.parent.utils.update_status("permanent", that.parent.app.name);
                $("#mlab_page_control_title").text(that.parent.app.curr_pagetitle);
                if (data.page_num_sent == 0 || data.page_num_sent == "index" ) {
                    that.index_page_process ( data.html, true );
                } else if (data.page_num_sent == "last" && data.page_num_real == 0) {
                    that.parent.utils.timer_start();
                    if ( $("#mlab_overlay").is(':visible') ) {
                        $("#mlab_overlay").slideUp();
                    }
                    return;
                } else {
                    that.regular_page_process ( data.html, data.page_num_real );
                }
                
                var path = window.location.pathname.split("/");
                path[path.length - 3] = data.app_id;
                path[path.length - 2] = data.page_num_real;
                history.pushState({id: data.app_id, page: data.page_num_real }, that.parent.app.curr_pagetitle, path.join("/"));

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
                
//turn off clickability of links
                $("#mlab_editable_area").find("a").click(function(e) { e.preventDefault(); });

                that.parent.utils.timer_start();

            } else {
                that.parent.utils.update_status("temporary", data.msg, false);

            }

        } );

    },

/**
 * Call a backend python script that uses OpenOffice to convert PPT and DOC to individual pages
 */
    file_import : function () {
        that = this;
        this.page_save( function() { that.file_import_process(); } );
    },

    file_import_process : function () {
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.importing.file"], true);

        var form = $('#mlab_form_import_file')[0]; // You need to use standard javascript object here
        var formData = new FormData(form);

        $.ajax({
            url: this.parent.urls.file_import,
            data: formData,
            type: 'POST',
            contentType: false, 
            processData: false, 
            success: function( json ) {
                    that.parent.utils.update_status("completed");
                    console.log("Status returned: " + json.app_status);
                    if (json.result == "success") {
                        mlab.dt.utils.update_status("temporary", "", false);
                        that.parent.app.page_names = data.page_names;
                        that.app_update_gui_metadata();
                    }
                }
        });
    },

/**
 * This will update the title of the currently open page and also update relevant items other places
 */
    page_update_title : function () {
        if (this.parent.app.locked) {
            alert(_tr["mlab.dt.management.js.page_update_title.alert.page.locked"]);
            return;
        }

        var page_index = this.page_filenum2index(this.parent.app.curr_page_num);
        
        this.parent.flag_dirty = true;
        this.parent.app.curr_pagetitle = $("#mlab_page_control_title").text();
        this.parent.app.page_names[page_index]["title"] = this.parent.app.curr_pagetitle;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);
        this.app_update_gui_metadata(true);

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
    page_save : function (fnc, override, no_display_update) {
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
        if (typeof this.parent.app.curr_page_num == "undefined" || typeof this.parent.app.id == "undefined") {
            require_save = false;
        }

        if (!this.parent.flag_dirty && typeof override == "undefined") {
            require_save = false;
        }

        if ((!require_save) && (typeof fnc != 'undefined')) {
            return fnc();
        } else if (!require_save) {
            this.parent.utils.timer_start();
            return false;
        }

//prepare various variables
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.storing.page"], true);
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
        if (page_num == 0) {
            var final_doc = this.parent.app.curr_indexpage_html;
            final_doc.getElementById(this.parent.config["app"]["content_id"]).innerHTML = page_content;
            final_doc.title = this.parent.app.curr_pagetitle;
            var html = (new XMLSerializer()).serializeToString(final_doc);
        } else {
            var html = page_content;
        }

        curr_el.addClass("mlab_current_component");

//finally we submit the data to the server, the callback function will further execute the function specified in the fnc argument, if any
        var that = this;
        $.post( url, {title: this.parent.app.curr_pagetitle, html: html, _sender: this.parent.uid}, function( data ) {

//if this counter = 0 then noone else have called it in the meantime and it is OK to restart timer
            that.parent.counter_saving_page--;

            if (data.result == "success") {
                that.parent.utils.update_status("temporary", _tr["mlab.dt.management.js.update_status.saved.page"], false);
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
                    that.parent.app.tags = data.app_info.mlab_app.tags;
                    if (!no_display_update) {
                        that.app_update_gui_metadata();
                    }

                };

            } else { //failed
                that.parent.utils.update_status("temporary", _tr["mlab.dt.management.js.update_status.unable.save.page"] + ": " + data.msg, false);
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
                            "Cancel": function() {
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
                position: { my: 'topMiddle', at: 'bottomMiddle', viewport: $(window) },
                show: { ready: true },
                hide: { event: 'unfocus' },
                style: { "background-color": "white", color: "blue", classes: "mlab_qtip_info", tip: true } } ) ;
            
                //hides the qTip after 5 seconds
                window.setTimeout(function () { $(".mlab_qtip_info").remove();}, 5000);
           
        } else {
             $(".mlab_qtip_info").remove();
        }

        return res;
    },

/**
* Creates a new file on the server and opens it
*/
    page_new : function () {
        var title = prompt(_tr["mlab.dt.management.js.page_new.prompt.title.new.page"]);
        if (title != null) {
            that = this;
            this.page_save( function() { that.page_new_process( title ); } );
        }
    },

    page_new_process : function (title) {
        $("body").css("cursor", "wait");
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.storing.page"], true);
        var url = this.parent.urls.page_new.replace("_ID_", this.parent.app.id);
        url = url.replace("_UID_", this.parent.uid);

//here we hide the tools for components until they select a control
        if (typeof this.parent.qtip_tools != "undefined") {
            $(this.parent.qtip_tools).qtip('hide');
            this.parent.qtip_tools = undefined
            if (typeof this.parent.api.properties_tooltip != "undefined") {
                $(this.parent.api.properties_tooltip).qtip('hide');
                this.parent.api.properties_tooltip = undefined;
            }
        }

        var that = this;
        $.post( url, {_sender: this.parent.uid, title}, function( data ) {
            if (data.result == "success") {
//prepare variables
                that.parent.app.page_names.push({title: title, filename: ("000" + data.page_num_real).slice(-3) + ".html"});
                that.parent.app.curr_pagetitle = title;
                that.parent.app.curr_page_num = data.page_num_real;
                
//update page content area and HTML display of meta data
                $("#" + that.parent.config["app"]["content_id"]).empty();
                $("#mlab_page_control_title").text(that.parent.app.curr_pagetitle);
                that.app_update_gui_metadata();

//update staus
                that.parent.utils.update_status("completed");
                that.parent.flag_dirty = true;

            } else {
                that.parent.utils.update_status("temporary", data.msg, false);
            }

            $("body").css("cursor", "default");
            that.parent.utils.timer_start();

        });
     },

/**
* Creates a new file on the server, does NOT open it but calls a callback function with the id of the page
* title string, title of page
* cb: callback function
*/
    page_new_in_background : function (title, cb) {
        $("body").css("cursor", "wait");
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.storing.page"], true);
        var url = this.parent.urls.page_new.replace("_ID_", this.parent.app.id);
        url = url.replace("_UID_", this.parent.uid) + "/0/" + encodeURI(title);

        var that = this;
        $.post( url, {}, function( data ) {
            if (data.result == "success") {
//update staus
                that.parent.utils.update_status("completed");
                that.parent.flag_dirty = true;
            } else {
                that.parent.utils.update_status("temporary", data.msg, false);
            }
            cb(data);
            $("body").css("cursor", "default");
            that.parent.utils.timer_start();

        });
     },

/**
 * Creates a new file on the server and opens it
 */
    page_copy : function (page_num) {
        if (page_num == "0" || page_num == "index") {
            alert(_tr["mlab.dt.management.js.page_copy.alert.not.copy.index.page"]);
            return;
        }
        that = this;
        this.page_save( function() { that.page_copy_process(page_num); } );
    },

    page_copy_process : function (page_num) {
        var url = this.parent.urls.page_copy.replace("_ID_", this.parent.app.id);
        url = url.replace("_PAGE_NUM_", page_num);
        url = url.replace("_UID_", this.parent.uid);
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.copying.page"], true);
        var that = this;

        $.get( url, function( data ) {
            that.parent.utils.update_status("completed");
            if (data.result == "success") {
                that.parent.app.curr_pagetitle = data.page_title;
                $("#mlab_page_control_title").text(data.page_title);
                that.parent.app.page_names.push({title: data.page_title, filename: ("000" + data.page_num_real).slice(-3) + ".html"});
                that.regular_page_process ( data.html, data.page_num_real );
            } else {
                alert(data.msg);
            }
            that.parent.utils.timer_start();
        });
    },

    page_delete  : function () {
        if (this.parent.app.curr_page_num == 0) {
            alert(_tr["mlab.dt.management.js.page_copy.alert.not.delete.index.page"]);
            return;
        }

        if (!confirm(_tr["mlab.dt.management.js.page_copy.alert.sure.delete"])) {
            return;
        }

        this.parent.utils.timer_stop();
        this.parent.utils.update_status("callback", _tr["mlab.dt.management.js.update_status.deleting.page"], true);

        var that = this,
            url = this.parent.urls.page_delete.replace("_ID_", this.parent.app.id);
        url = url.replace("_PAGE_NUM_", this.parent.app.curr_page_num);
        url = url.replace("_UID_", this.parent.uid);

        $.get( url, function( data ) {
            that.parent.utils.update_status("completed");
            if (data.result == "success") {
                $("#mlab_existing_pages [data-mlab-page-num='" + data.page_num_sent).remove();
                
                that.parent.app.page_names.splice(that.page_filenum2index(that.parent.app.curr_page_num), 1);
                that.regular_page_process ( data.html, data.page_num_real );
                that.app_update_gui_metadata(true);
                that.parent.utils.update_app_title_bar(data.appConfig)

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
        that = this;
        this.page_save( function() { 
            that.page_preview_process(); 
        } );
    },

    page_preview_process : function () {
        var url = this.parent.urls.app_preview.replace("_APPID_", this.parent.app.id);
        var w = $(window).width() * 0.25;
        var h = $(window).height() * 0.75;
        var res = window.open(url,'targetWindow','toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=' + w + ',height=' + h + ',left=' + w);
        if (res == undefined) {
            alert(_tr["mlab.dt.management.js.page_preview_process.alert.cannot.open.new.window"]);
        }
        
    },
    
    socket: {
        
        connection: null,

        send: function (type, data) {
            this.connect().then(function(ws){
                var json = Object.assign({}, {_type: type}, data);
                return ws.send(JSON.stringify({data: json}))
            })
        },
        
        connect: function () {
            var socketObject = this;
            
            return new Promise(function(resolve, reject) {
                
                if(socketObject.connection) {
                    resolve(socketObject.connection);
                }
                
                socketObject.connection = new WebSocket(mlab.dt.config.ws_socket.url_client);
                
                socketObject.connection.onopen = function() {
//                    window.onbeforeunload = function() {
//
//                    };
                    
                    resolve(socketObject.connection);
                };
                socketObject.connection.onerror = function(err) {
                    reject(err);
                };
                
                socketObject.connection.onclose = function(e) {
//                    alert('kosio');
                };
                
                socketObject.connection.onmessage = function (event) {
                    var data = JSON.parse(event.data);
                    socketObject.messages[data.data._type](data.data)
                };
            });
        },
        
        messages: {
            error: function(data, obj) {
                console.error('Socket error: ' + data.message);
            },
            
            app_pages_update: function(data, obj) {
                if(data._sender == mlab.dt.uid) {
                    return;
                }
                
                mlab.dt.app.page_names = data.pages;
                mlab.dt.management.app_update_gui_metadata();
            },
            app_build_update: function(data, obj) {
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
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.connected"]);
                        break;

                    case "creating":
                        $("#mlab_progressbar").val(10);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.creating"]);
                        //createApp is called, this creates the empty app
                        break;

                    case "created":
                        $("#mlab_progressbar").val(15);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.created"]);
                        break;

                    case "precompilation":
                        $("#mlab_progressbar").val(20);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.precompilation"]);
                        break;

                    case "uploading":
                        $("#mlab_progressbar").val(25);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.uploading"]);
                        break;

                    case "verifying":
                        $("#mlab_progressbar").val(30);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.verifying"]);
                        break;

                    case "verification_ok":
                        $("#mlab_progressbar").val(35);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.verification_ok"]);
                        break;

                    case "compiling":
                        $("#mlab_progressbar").val(40);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.compiling"]);
                        break;

                    case "compilation_ok":
                        $("#mlab_progressbar").val(80);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.compilation_ok"]);
                        break;

                    case "failed":
                    case "precompilation_failed":
                    case "compilation_failed":
                    case "verification_failed":
                    case "create_failed":
                        $("#mlab_statusbar_compiler").text("");
                        $("#mlab_download_" + data.platform + "_icon").removeClass('mlab_download_' + data.platform + '_icon_grey');
                        $("#mlab_download_" + data.platform + "_icon").find("img").hide();
                        $("#mlab_progressbar").hide();
                        mlab.dt.utils.update_status("temporary", data.fail_text, false);
                        break;

                    case "receiving":
                        $("#mlab_progressbar").val(90);
                        $("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.receiving"]);
                        break;

                    case "ready":
                        $("#mlab_progressbar").val(100);
                        $("#mlab_statusbar_compiler").text("");
                        $("#mlab_download_" + data.platform + "_icon").removeClass('mlab_download_' + data.platform + '_icon_grey');
                        $("#mlab_download_" + data.platform + "_icon").find("img").hide();
                        $("#mlab_progressbar").hide();

//inserting the QR code and url to the compiled app in the menu
                        if (typeof data.filename != "undefined" && data.filename != null && data.filename != "") {
                            mlab.dt.app.compiled_files[data.platform] = data.filename;
                            var text = document.getElementsByTagName("base")[0].href.slice(0, -1) + "_compiled/" + data.filename;
                            $("#mlab_download_qr_link_" + data.platform).empty().qrcode({text: text, size: 150, background: "#ffffff", foreground: "#000000", render : "table"});
                            $("#mlab_download_link_" + data.platform).html("<b>URL</b>:</br>" + text);
                            mlab.dt.utils.update_status("temporary", _tr["mlab_editor.init.js.compiling.ready"], false);
                        } else {
                            mlab.dt.utils.update_status("temporary", _tr["mlab_editor.init.js.compiling.failed"], false);
                        }
                        break;

                }
                
            },
        },
    }, //end socket object
    
    market: {

        login : function () {
        
        },
        
        submit_app_details : function () {
        
        },
        
        upload_app_file : function () {
        
        },
        
        publish_app : function () {
        
        },
        
        unpublish_app : function () {
        
        },
        
    },
    
//these are the compiler functions we call. At the front end we only use two functions, info about current app and get_app
//in the background (i.e. on the PHP server) get_app calls lots of different functions to actually prepare app, upload files, compile and retrieve app
    compiler: {

        get_app_status : function () {
            var url = mlab.dt.urls.cmp_get_app_status.replace("_WINDOW_UID_", mlab.dt.uid);
            var i = prompt(_tr["mlab.dt.management.js.compiler.get_app_status.prompt.db.id"]);
            url = url.replace("/_ID_", ((i != null && i != "") ? "/" + i : ""));
            var v = prompt(_tr["mlab.dt.management.js.compiler.get_app_status.prompt.version"]);
            url = url.replace("/_VERSION_", ((v != null && v != "") ? "/" + v : ""));
            var p = prompt(_tr["mlab.dt.management.js.compiler.get_app_status.prompt.platform"]);
            url = url.replace("/_PLATFORM_", ((p != null && p != "") ? "/" + p : ""));

            $( document ).ajaxError(function(event, jqXHR, ajaxSettings) {
                if (jqXHR.status === 0) {
                    alert('Not connect.\n Verify Network.');
                } else if (jqXHR.status == 404) {
                    alert('Requested page not found. [404]');
                } else if (jqXHR.status == 500) {
                    alert('Internal Server Error [500].');
/*                } else if (exception === 'parsererror') {
                    alert('Requested JSON parse failed.');
                } else if (exception === 'timeout') {
                    alert('Time out error.');
                } else if (exception === 'abort') {
                    alert('Ajax request aborted.');*/
                } else {
                    alert('Uncaught Error.\n' + jqXHR.responseText);
                }
                mlab.dt.utils.update_status("temporary", jqXHR.responseText, false);
            });
            
            $.ajax({
                url: url,
                dataType: 'json',
                success: function( json ) {
                    if (json.result == "success") {
                        console.log("Status returned: ");
                        console.log(json.app_status);
                    } else {
                        alert(_tr["mlab.dt.management.js.compiler.get_app_status.alert.unable.get.app.status"]);
                        mlab.dt.utils.update_status("temporary", "", false);
                    }
                }
                
            });

        },
        
        /**
         * downloads a complte copy of prepared (i.e. finished precompile process) source code, so Mlab ise just used as an editor
         * @returns {undefined}
         */
        get_app_source : function () {
            var url = mlab.dt.urls.cmp_get_app_source.replace("_WINDOW_UID_", mlab.dt.uid);
            url = url.replace("_ID_", mlab.dt.app.id);
            url = url.replace("_VERSION_", mlab.dt.app.active_version);


            $( document ).ajaxError(function(event, jqXHR, ajaxSettings) {
                if (jqXHR.status === 0) {
                    alert('Not connect.\n Verify Network.');
                } else if (jqXHR.status == 404) {
                    alert('Requested page not found. [404]');
                } else if (jqXHR.status == 500) {
                    alert('Internal Server Error [500].');
/*                } else if (exception === 'parsererror') {
                    alert('Requested JSON parse failed.');
                } else if (exception === 'timeout') {
                    alert('Time out error.');
                } else if (exception === 'abort') {
                    alert('Ajax request aborted.');*/
                } else {
                    alert('Uncaught Error.\n' + jqXHR.responseText);
                }
                mlab.dt.utils.update_status("temporary", jqXHR.responseText, false);
            });
            
            $.ajax({
                url: url,
                dataType: 'json',
                success: function( json ) {
                    if (json.result == "success") {
                        var iframe = $("<iframe/>").attr({
                            src: json.url,
                            style: "visibility:hidden;display:none"
                        }).appendTo("body");

                    } else {
                        alert(_tr["mlab.dt.management.js.compiler.get_app_status.alert.unable.get.app.status"]);
                        mlab.dt.utils.update_status("temporary", "", false);
                    }
                }
                
            });

        },
        
        /**
         * 
         * @returns {undefined}
         */
        upload_website : function () {
            var url = mlab.dt.urls.cmp_upload_website.replace("_WINDOW_UID_", mlab.dt.uid);
            url = url.replace("_ID_", mlab.dt.app.id);
            url = url.replace("_VERSION_", mlab.dt.app.active_version);

            $( document ).ajaxError(function(event, jqXHR, ajaxSettings) {
                if (jqXHR.status === 0) {
                    alert('Not connect.\n Verify Network.');
                } else if (jqXHR.status == 404) {
                    alert('Requested page not found. [404]');
                } else if (jqXHR.status == 500) {
                    alert('Internal Server Error [500].');
/*                } else if (exception === 'parsererror') {
                    alert('Requested JSON parse failed.');
                } else if (exception === 'timeout') {
                    alert('Time out error.');
                } else if (exception === 'abort') {
                    alert('Ajax request aborted.');*/
                } else {
                    alert('Uncaught Error.\n' + jqXHR.responseText);
                }
                mlab.dt.utils.update_status("temporary", jqXHR.responseText, false);
            });
            
            $.ajax({
                url: url,
                dataType: 'json',
                success: function( json ) {
                    if (json.result == "success") {
                        console.log("Status returned: ");
                        console.log(json.app_status);
                    } else {
                        alert(_tr["mlab.dt.management.js.compiler.get_app_status.alert.unable.get.app.status"]);
                        mlab.dt.utils.update_status("temporary", "", false);
                    }
                }
                
            });

        },        
    
//sets up a websocket connect to get information back during the compilation process
        get_app : function (platform) {
//            mlab.dt.management.socket.setup(mlab.dt.management.compiler.get_app_callback, platform);
            mlab.dt.management.compiler.get_app_callback(platform);
        },
        
//callback function that is used when the websocket connection (see get_app above) is completed
//this is where we start the actual process
        get_app_callback: function (platform) {
            var url = mlab.dt.urls.cmp_get_app_process.replace("_WINDOW_UID_", mlab.dt.uid);
            url = url.replace("_ID_", mlab.dt.app.id);
            url = url.replace("_VERSION_", mlab.dt.app.active_version);
            url = url.replace("_PLATFORM_", platform);
            var caption_finished = _tr["mlab.dt.management.js.compiler.get_app.status.creating.app"];
            $("#mlab_statusbar_compiler").text(caption_finished);
            $("#mlab_download_" + platform + "_icon").find('img').show();
            $("#mlab_download_" + platform + "_icon").addClass("mlab_download_" + platform + "_icon_grey");
            $("#mlab_progressbar").show();
            $("#mlab_progressbar").val(2);
            $.getJSON(url, function( json ) {
                if (json.result != "success") {
                    $("#mlab_statusbar_compiler").text("");
                    $("#mlab_progressbar").hide();
                    mlab.dt.utils.update_status("temporary", _tr["mlab.dt.management.js.update_status.unable.contact.server"], false);
                    $("#mlab_download_" + platform + "_icon").find('img').hide();
                    $("#mlab_download_" + platform + "_icon").removeClass("mlab_download_" + platform + "_icon_grey");
                    
                    
                }
            });
            
        }
    }

}// end management.prototype