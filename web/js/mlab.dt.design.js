
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

function Mlab_dt_design () {
    this.parent = null;
}

Mlab_dt_design.prototype = {
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
    Process the top level DIVs inside DIV with ID = this.parent.config["app"]["content_id"] (by default mlab_editable_area) so they are moveable/sortable
*/

    index_page_process : function (page, page_num, is_final_destination) {
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
            this.prepare_editable_area();
        }

        this.parent.app.curr_indexpage_html = doc;
//Page name is picked up from title tag in head
        this.parent.app.curr_pagetitle = head.getElementsByTagName("title")[0].innerText;
        this.parent.app.curr_page_num = page_num;
        $("#mlab_page_control_title").text(this.parent.app.curr_pagetitle);

        this.parent.management.app_update_gui_metadata();

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

    regular_page_process : function (page, page_num) {
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

        this.parent.management.app_update_gui_metadata();

//add body content
        $("#" + this.parent.config["app"]["content_id"]).html(body.innerHTML);

        this.prepare_editable_area();
        $.mobile.initializePage();
    },

/***********************************************************
 *********** Functions to manipulate components ***********
************************************************************/
    component_add : function (id) {
        if (this.parent.app.locked) {
            return;
        }

//if this control has to be unique we check here to see if one was already added
        if (this.parent.components[id].conf.unique && $("#" + this.parent.config["app"]["content_id"]).find("[data-mlab-type='" + id + "']").length > 0) {
            alert("You can only have one component of this type on a page");
            return;
        }

//add a DIV wrapper around all components, makes it easier to move it up/down later
        var new_comp = $("<div data-mlab-type='" + id + "' style='display: block;'>" + this.parent.components[id].html + "</div>");
        $("#" + this.parent.config["app"]["content_id"]).append(new_comp);
        new_comp.on("click", function(){mlab.dt.design.component_highlight_selected(this);})
        new_comp.on("input", function(){mlab.dt.flag_dirty = true;});
        
//process all keys if this component wants to manipulate them (i.e. the process_keypress setting exists)
        if (typeof this.parent.components[id].conf.process_keypress != "undefined" && this.parent.components[id].conf.process_keypress) {
            $(new_comp).keydown( function(e) { mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(e); } );
        }

        $('.mlab_current_component').qtip('hide');

        this.component_run_code(new_comp, id, true);
        this.component_highlight_selected(new_comp);
        window.scrollTo(0,document.body.scrollHeight);

//execute backend javascript and perform tasks like adding the permissions required to the manifest file and so on
        var url = this.parent.urls.component_added.replace("_APPID_", this.parent.app.id);
        url = url.replace("_COMPID_", id);
        var that = this;

        var request = $.ajax({
            type: "GET",
            url: url,
            dataType: "json"
        });

        request.done(function( result ) {
            if (result.result == "success") {
                that.parent.drag_origin = 'sortable';
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
        if (this.parent.components[id].hasOwnProperty("conf") && this.parent.components[id].conf.hasOwnProperty("dependencies")) {
            for (component in this.parent.components[id].conf.dependencies) {
                this.feature_add(this.parent.components[id].conf.dependencies[0], true);
            }
        }

        this.parent.flag_dirty = true;

    },

/**
 * This executes (using eval()) any code for a component that is added to the app
 * @param {type} el = html element we're working on
 * @param {type} comp_id
 * @param {type} created
 * @returns {undefined}
 */
    component_run_code : function (el, comp_id, created) {
        if (typeof this.parent.components[comp_id] == "undefined" || typeof this.parent.components[comp_id].code == "undefined") {
            return;
        }

        if (created) {
            this.parent.components[comp_id].code.onCreate(el, this.parent.components[comp_id].conf, this.parent.api);
        } else {
            this.parent.components[comp_id].code.onLoad(el, this.parent.components[comp_id].conf, this.parent.api);
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
        this.parent.flag_dirty = true;
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
        this.parent.flag_dirty = true;
    },

    component_highlight_selected : function (el) {
         $( "#" + this.parent.config["app"]["content_id"] + "> div" ).removeClass("mlab_current_component");
         $( el ).addClass("mlab_current_component");
         this.component_menu_prepare();
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
        this.parent.flag_dirty = true;
    },

/**
 * features are simply components that are not displayed with a GUI
 * they are added to a hidden div, if we are NOT working on the index page we call a backend function to add this code
 *
 * @returns {undefined}
 */

    feature_add : function (comp_id, silent) {
        if ($(this.parent.app.curr_indexpage_html).find("#mlab_features_content").length == 0) {
            $(this.parent.app.curr_indexpage_html).find("body").append("<div id='mlab_features_content' style='display: none;'></div>");
        } else {
//make sure not duplicate it
            if ($(this.parent.app.curr_indexpage_html).find("#mlab_features_content [data-mlab-type='" + comp_id + "']>").length > 0) {
                if (!silent) {
                    this.parent.utils.update_status("temporary", "Feature already added", false);
                }
                return;
            }
        }

        $(this.parent.app.curr_indexpage_html).find("#mlab_features_content").append("<div data-mlab-type='" + comp_id + "'>" + this.parent.components[comp_id].html + "</div>");


//if we are not working on the index page we need to tell the back end to update the index.html file
//otherwise this will be lost
        if (this.parent.app.curr_page_num != "0" && this.parent.app.curr_page_num != "index") {
            var url = this.parent.urls.feature_add.replace("_APPID_", this.parent.app.id);
            url = url.replace("_COMPID_", comp_id);
            if (!silent) {
                this.parent.utils.update_status("callback", 'Adding feature...', true);
            }

            var that = this;
            $.get( url, function( data ) {
                if (data.result == "success") {
                    that.parent.utils.update_status("temporary", "Feature added", false);
                    $("#mlab_features_list [data-mlab-feature-type='" + data.component_id + "']").addClass("mlab_features_used");
                } else {
                    that.parent.utils.update_status("temporary", data.msg, false);
                }

            });
        }
    },

    /*
 *
 * @param divs (html/DOM) all divs to edit
 */
    prepare_editable_area : function () {
//need to loop through all divs in the editable box after they have been added
//and set the styles for dragging/dropping so it works OK
        var that = this;
        $( "#" + that.parent.config["app"]["content_id"] + "> div" ).each(function( index ) {
            $( this ).droppable(that.parent.droppable_options)
                     .sortable(that.parent.sortable_options)
                     .on("click", function(){mlab.dt.design.component_highlight_selected(this);})
                     .on("input", function(){mlab.dt.flag_dirty = true;});

            comp_id = $( this ).data("mlab-type");
            that.component_run_code($( this ), comp_id);
            
//process all keys if this component wants to manipulate them (i.e. the process_keypress setting exists)
            if (typeof that.parent.components[comp_id].conf.process_keypress != "undefined" && that.parent.components[comp_id].conf.process_keypress) {
                $( this ).keydown( function(e) { mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(e); } );
            }
        });

//set draggable/sortable options for the editable area
        $( "#" + that.parent.config["app"]["content_id"] ).droppable(that.parent.droppable_options).sortable(that.parent.sortable_options);

    },

    /***********************************************************
 *********** Function to manipulate adaptive menus (those defined by component itself ********
************************************************************/

/* adds component specific menu when a component is added/selected */
    component_menu_prepare: function () {
        var comp = $(".mlab_current_component");
        if (comp.length < 1) {
            return;
        }
        var comp_name = comp.data("mlab-type");
        var items = new Object();
        var title = "";
        for(var index in this.parent.components[comp_name]) {
            if (index.substr(0, 7) == "custom_") {
                title = index.slice(7);
                items[index] =  { name: title.charAt(0).toUpperCase() + title.slice(1).replace("_", " "),
                                  callback: function(key, options) {
                                      this.parent.components[$('.mlab_current_component').data("mlab-type")][key]($('.mlab_current_component'));
                                  }
                                };
            }
        }
        if ((typeof this.parent.components[comp_name].conf.compatible != "undefined") && (this.parent.components[comp_name].code.hasOwnProperty("onReplace"))) {
            items["sep1"] = "---------";
            items["replace"] = {"name": "Replace control with"};
            var sub_items = new Object;
            this.parent.components[$(".mlab_current_component").data("mlab-type")].conf.compatible.forEach(function(replace_with) {
                title = replace_with.trim();
                sub_items[title] = { name: " -> " + title.replace("_", " "),
                                     callback: function(key, options) {
                                        this.parent.components[$('.mlab_current_component').data("mlab-type")].code.onReplace($('.mlab_current_component'), key, this.parent.components[key].html);
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


} // end design.prototype


