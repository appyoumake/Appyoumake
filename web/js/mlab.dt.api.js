


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


    mlab_api_version = 0.1;
    document.mlab_cp_storage = new Object();

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


