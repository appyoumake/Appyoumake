document.mlab_code_googlemap = new function() {
	
	this.config = {};
    
    this.onCreate = function (el, config, api_func) {
        this.onLoad (el, config, api_func);
        
        var self = this;
        var guid = this.config["api_function"](MLAB_CB_GET_GUID);
        
        var trimmed_guid = guid.replace(/-/g, "");
        
        $(el).find("." + this.config.custom.class_identifier).attr("id", guid);
        
        $("#" + guid).after("<script id='script_" + guid + "'>" +
                            "function mlab_cp_googlemap_" + trimmed_guid + "() { \n" +
                            "    var myOptions = " + JSON.stringify(document.mlab_code_googlemap.config.custom.map_options) + ";\n" +
                            "    if (typeof(document.mlab_cp_storage.googlemap) == 'undefined') { \n" +
                            "        document.mlab_cp_storage.googlemap = new Object(); \n" +
                            "    } \n" +
                            "    document.mlab_cp_storage.googlemap['" + guid + "'] = new google.maps.Map(document.getElementById('" + guid + "'), myOptions);\n" + 
                            "} \n" +
                            "</script>");
        if (typeof (google) == "undefined" || typeof (google.maps) == "undefined") {
                $("head").append($("<script src='" + this.config.custom.map_script + "&callback=mlab_cp_googlemap_" + trimmed_guid + "'>")); 
        }
//    var temp_browser = (navigator.userAgent||navigator.vendor||window.opera);
//    var temp_env = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(temp_browser.substr(0,4));
        
    };
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, api_func) {
        this.config = config;
        this.config["api_function"] = api_func;
        this.config["api_function"](MLAB_CB_GET_LIBRARIES, this.config.name);
    };

//
	this.onSave = function (el) {
        var temp_el = el.cloneNode(true);
        $(temp_el).find("." + this.config.custom.class_identifier)[0].innerHTML = "";
        var temp_html = $(temp_el)[0].outerHTML + "\n";
        return temp_html;
    };
    
    this.getContentSize = function (el) {
        var ctrl = $(el).find("." + this.class_identifier);
        return { "width": ctrl.width(), "height": ctrl.height() }
    };
            
	this.onDelete = function () {
		console.log('delete');
    };
    
    this.updateMap = function (id) {
        
    };
    
    this.searchMap = function (id, search_term) {
	/*var temp_point = search_term.split(" ");
	var new_pos = new google.maps.LatLng(parseFloat(temp_point[0]), parseFloat(temp_point[1]));
	map.setCenter(new_pos);
	console.dir(temp_point);*/
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode( {'address': search_term}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    document.mlab_cp_storage.googlemap[id].setCenter(results[0].geometry.location);
                } else {
                    console.log("Not found: " + status); 
                }
            });
    };

    this.toggleElement = function(id, control, status) {
        setting = new Object();
        setting[control] = status;
        document.mlab_cp_storage.googlemap[id].setOptions( setting );
    }
    
    this.custom_edit_map = function (el) {
        var guid = $(el).find("div").attr("id");
        content = $('<div />');
        content.append( '<label for="mlab_cp_googlemap_zoom_control">Show zoom control</label>');
        content.append( '<input id="mlab_cp_googlemap_zoom_control" type="checkbox" onclick="document.mlab_code_googlemap.toggleElement(\'' + guid + '\', \'zoomControl\', $(this).is(\':checked\'));">');
        content.append( '<label for="mlab_cp_googlemap_zoom_level">Choose zoom level</label>');
        content.append( '<select id="mlab_cp_googlemap_zoom_level"><option>1</option><option>4</option><option>8</option><option>12</option><option>16</option></select>');
        content.append( '<label for="mlab_cp_googlemap_type_control">Show map type switcher</label>');
        content.append( '<input id="mlab_cp_googlemap_type_control" type="checkbox" onclick="document.mlab_code_googlemap.toggleElement(\'' + guid + '\', \'mapTypeControl\', $(this).is(\':checked\'));">');
        content.append( '<label for="mlab_cp_googlemap_center">Centre map on:</label>');
        content.append( '<input id="mlab_cp_googlemap_center" type="text" onkeyup="document.mlab_code_googlemap.searchMap(\'' + guid + '\', $(this).val());" >');
        content.append( '<button class="mlab_button_ok_right" onclick="">OK</button>');

        var component = el;
        var component_id = this.config.component_name;
        var component_config = this.config;
        
        $(el).qtip({
            content: {text: content, title: "Last opp bilde" },
            position: { my: 'leftMiddle', at: 'rightMiddle' },
            show: { ready: true, modal: { on: true, blur: false } },
            hide: false,
            style: { classes: 'qtip-tipped' },
            events: { render: function(event, api) {
                            this.component = component;
                            this.component_id = component_id;
                            this.config = component_config;
                            
                            $('#mlab_cp_video_button_ok', api.elements.content).click(	
                                    function(e) {
                                        api.hide(e); 
                                    }.bind(component));
                      },
                      hide: function(event, api) { api.destroy(); }
            }
        });
   };
    
    
};