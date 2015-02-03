/*
 * 
0: Add add marker functionality, + ability to remove them
1: In onSave need to generate clean code for reopening in design mode AND runtime
	Need to read options values and save these to an options object in the code we generate
2: DT: Add code to add it to header
   RT: Add the google.maps.event.addDomListener(window, 'load', initialize);, but probably need it for onpage?
	http://stackoverflow.com/questions/9896285/jquery-mobile-1-0-1-google-maps-doesnt-show-the-map-first-time-after-reload-ref
3: Use the check to see if in mobile to check it

 */
    
    this.onCreate = function (el) {
        this.api.getLibraries(this.config.name);
        
        var guid = this.api.getGUID();
        var trimmed_guid = guid.replace(/-/g, "");
        
        $(el).find("." + this.config.custom.class_identifier).attr("id", guid);
        
        $("#" + guid).after("<script id='script_" + guid + "'>" +
                            "function mlab_cp_googlemap_" + trimmed_guid + "() { \n" +
                            "    var myOptions = " + JSON.stringify(document.mlab_code_googlemap.config.custom.map_options) + ";\n" +
                            "    if (typeof(document.mlab_cp_storage.googlemap) == 'undefined') { \n" +
                            "        document.mlab_cp_storage.googlemap = new Object(); \n" +
                            "    } \n" +
                            "    if (typeof(document.mlab_cp_storage.googlemap.maps) == 'undefined') { \n" +
                            "        document.mlab_cp_storage.googlemap.maps = new Object(); \n" +
                            "    } \n" +
                            "    document.mlab_cp_storage.googlemap.maps['" + guid + "'] = new google.maps.Map(document.getElementById('" + guid + "'), myOptions);\n" + 
                            "} \n" +
                            "</script>");
        if (typeof (google) == "undefined" || typeof (google.maps) == "undefined") {
            $("head").append($("<script src='" + this.config.custom.map_script + "&callback=mlab_cp_googlemap_" + trimmed_guid + "'>")); 
        }
        
    };
    
//el = element this is initialising, config = global config from conf.yml
//the code for initialising the app is already inside the component, here we just add the 
	this.onLoad = function (el) {
        this.api.getLibraries(this.config.name);
        
    };

//we need to manipulate content for reopening the map either in design mode or at runtime.
//therefore we need to generate new Google Maps API calls based on the current map settings (zoom level, controls displayed, etc
//we also need to delete the script inside the DIV which has a script_GUID id.
	this.onSave = function (el) {
//prepare some local vars
        var temp_el = el.cloneNode(true);
        var guid = $(el).find("." + this.config.custom.class_identifier).attr("id");
        var trimmed_guid = guid.replace(/-/g, "");
        var markers = [];
        

//remove script and html for map from cloned element
        $(temp_el).find("#script_" + guid).remove();
        $(temp_el).find("#" + guid)[0].innerHTML = "";
        var html = $(temp_el)[0].outerHTML + "\n";        
        
//assemble all the map configuration details
        var map_options = "{zoom: " + document.mlab_cp_storage.googlemap.maps[guid].getZoom() + ", " + 
                           "center: { lat: " + document.mlab_cp_storage.googlemap.maps[guid].getCenter().lat() + ", lng: " + document.mlab_cp_storage.googlemap.maps[guid].getCenter().lng() + "}, " +
                           "mapTypeId: 'roadmap', " + 
                           "zoomControl: " + document.mlab_cp_storage.googlemap.maps[guid].zoomControl + ", " + 
                           "scaleControl: " + document.mlab_cp_storage.googlemap.maps[guid].scaleControl + ", " + 
                           "mapTypeControl: " + document.mlab_cp_storage.googlemap.maps[guid].mapTypeControl + ", " +
                           "panControl: " + document.mlab_cp_storage.googlemap.maps[guid].panControl + " }";
        
        if (typeof(document.mlab_cp_storage.googlemap.markers) != "undefined") {
            for (i in document.mlab_cp_storage.googlemap.markers[guid]) {
                markers.push([document.mlab_cp_storage.googlemap.markers[guid][i].title, document.mlab_cp_storage.googlemap.markers[guid][i].position.lat(), document.mlab_cp_storage.googlemap.markers[guid][i].position.lng()]);
            }
        }

//generate script for DT and RT
        var script = "<script id='script_" + guid + "'>" +
                     "    (function(a){(jQuery.browser=jQuery.browser||{}).mobile=/(android|bb\\d+|meego).+mobile|avantgo|bada\\\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\\-(n|u)|c55\\/|capi|ccwa|cdm\\-|cell|chtm|cldc|cmd\\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\\-s|devi|dica|dmob|do(c|p)o|ds(12|\\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\\-|_)|g1 u|g560|gene|gf\\-5|g\\-mo|go(\\.w|od)|gr(ad|un)|haie|hcit|hd\\-(m|p|t)|hei\\-|hi(pt|ta)|hp( i|ip)|hs\\-c|ht(c(\\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\\-(20|go|ma)|i230|iac( |\\-|\\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\\/)|klon|kpt |kwc\\-|kyo(c|k)|le(no|xi)|lg( g|\\/(k|l|u)|50|54|\\-[a-w])|libw|lynx|m1\\-w|m3ga|m50\\/|ma(te|ui|xo)|mc(01|21|ca)|m\\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\\-2|po(ck|rt|se)|prox|psio|pt\\-g|qa\\-a|qc(07|12|21|32|60|\\-[2-7]|i\\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\\-|oo|p\\-)|sdk\\/|se(c(\\-|0|1)|47|mc|nd|ri)|sgh\\-|shar|sie(\\-|m)|sk\\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\\-|v\\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\\-|tdg\\-|tel(i|m)|tim\\-|t\\-mo|to(pl|sh)|ts(70|m\\-|m3|m5)|tx\\-9|up(\\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\\-|your|zeto|zte\\-/i.test(a.substr(0,4))})(navigator.userAgent||navigator.vendor||window.opera);" +
                     "    var markers = " + JSON.stringify(markers) + ";\n" +
                     
                     "    function mlab_cp_googlemap_" + trimmed_guid + "() { \n" +
                     "        var myOptions = " + map_options + ";\n" +
                     "        if (!$.browser.mobile) { \n " +
                     "            if (typeof(document.mlab_cp_storage.googlemap) == 'undefined') { \n" +
                     "                document.mlab_cp_storage.googlemap = new Object(); \n" +
                     "            } \n" +
                     "            if (typeof(document.mlab_cp_storage.googlemap.maps) == 'undefined') { \n" +
                     "                document.mlab_cp_storage.googlemap.maps = new Object(); \n" +
                     "            } \n" +
                     "            document.mlab_cp_storage.googlemap.maps['" + guid + "'] = new google.maps.Map(document.getElementById('" + guid + "'), myOptions);\n" + 
                     "            for (i in markers) { \n" +
                     "                document.mlab_code_googlemap.setMarker('" + guid + "', markers[i][0], new google.maps.LatLng(markers[i][1], markers[i][2]) ); \n" +
                     "            } \n" +
                     "        } else { \n" +
                     "            var temp_map = new google.maps.Map(document.getElementById('" + guid + "'), myOptions);\n" + 
                     "            for (i in markers) { \n" +
                     "                new google.maps.Marker({ \n" + 
                     "                    position: new google.maps.LatLng(markers[i][1], markers[i][2]), \n " + 
                     "                    map: temp_map, \n " + 
                     "                    title: markers[i][0] \n " + 
                     "               }); \n " + 
                     "            } \n" +
                     "        } \n" +
                     "    } \n" +
                     "    if (!$.browser.mobile) { \n" +
                     "        if (typeof (google) == 'undefined' || typeof (google.maps) == 'undefined') { \n " + 
                     "            $('head').append($('<script src=\"" + this.config.custom.map_script + "&callback=mlab_cp_googlemap_" + trimmed_guid + "\">')) \n" +
                     "        } \n" +
                     "    } \n" +
                     "</script>";

        return html + "\n" + script;
        
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
    
    this.setMapCenter = function (id, search_term) {
	/*var temp_point = search_term.split(" ");
	var new_pos = new google.maps.LatLng(parseFloat(temp_point[0]), parseFloat(temp_point[1]));
	map.setCenter(new_pos);
	console.dir(temp_point);*/
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode( {'address': search_term}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    document.mlab_cp_storage.googlemap.maps[id].setCenter(results[0].geometry.location);
                } else {
                    console.log("Not found: " + status); 
                }
            });
        this.api.setDirty();
    };

    this.setMapControl = function(id, control, status) {
        setting = new Object();
        setting[control] = status;
        document.mlab_cp_storage.googlemap.maps[id].setOptions( setting );
        this.api.setDirty();
    };

    this.setMapZoom = function(id, zoom) {
        document.mlab_cp_storage.googlemap.maps[id].setZoom( zoom );
        this.api.setDirty();
    };
    
    this.setMarker = function(id, text, center) {
        if (typeof(text) == "undefined") {
            var text = prompt("Enter a label for this map marker");
            if (null === text) {
                return;
            }
        }
        
        if (typeof(center) == "undefined") {
            var center = document.mlab_cp_storage.googlemap.maps[id].getCenter();
        }
        
        var marker = new google.maps.Marker({
            position: center,
            map: document.mlab_cp_storage.googlemap.maps[id],
            title: text
        });
        
        if (typeof (document.mlab_cp_storage.googlemap.markers) == "undefined") {
            document.mlab_cp_storage.googlemap.markers = new Object();
        }
        if (typeof (document.mlab_cp_storage.googlemap.markers[id]) == "undefined") {
            document.mlab_cp_storage.googlemap.markers[id] = new Array();
        }
         
        document.mlab_cp_storage.googlemap.markers[id].push(marker);
        $("#mlab_cp_googlemap_markers").append("<option value='" + id + "'>" + text + "</option>");
        this.api.setDirty();
    }
    
    this.removeMarker = function(id) {
        if (null === $("#mlab_cp_googlemap_markers").val()) {
            return;
        }
        var i = parseInt($("#mlab_cp_googlemap_markers").val());
        document.mlab_cp_storage.googlemap.markers[id][i].setMap(null);
        document.mlab_cp_storage.googlemap.markers[id].splice(i, 1);
        $("#mlab_cp_googlemap_markers option[value=" + i + "]").remove();
        this.api.setDirty();
    }
    
    this.custom_edit_map = function (el) {
        var guid = $(el).find("div").attr("id");
        var options = "";
        var markers = "";
        var z = document.mlab_cp_storage.googlemap.maps[guid].getZoom();
        var s = "";
        for (var o = 1; o <= 16; o++) {
            if (z == o) {
                options = options + "<option value='" + o + "' selected >" + o + "</option>";
            } else {
                options = options + "<option value='" + o + "'>" + o + "</option>";
            }
        }

        if (typeof(document.mlab_cp_storage.googlemap.markers) != "undefined") {
            for (i in document.mlab_cp_storage.googlemap.markers[guid]) {
                var t = document.mlab_cp_storage.googlemap.markers[guid][i].title;
                markers = markers + "<option value='" + i + "'>" + t + "</option>";
            }
        }

        content = $('<div />');
        content.append( '<label for="mlab_cp_googlemap_zoom_control">Show zoom control</label>');
        content.append( '<input id="mlab_cp_googlemap_zoom_control" type="checkbox" onclick="document.mlab_code_googlemap.setMapControl(\'' + guid + '\', \'zoomControl\', $(this).is(\':checked\'));" ' + ((document.mlab_cp_storage.googlemap.maps[guid].zoomControl) ? "checked" : "") + '>');
        content.append( '<label for="mlab_cp_googlemap_zoom_level">Choose zoom level</label>');
        content.append( '<select id="mlab_cp_googlemap_zoom_level" onclick="document.mlab_code_googlemap.setMapZoom(\'' + guid + '\', parseInt($(this).val()));">' + options + '</select>');
        content.append( '<label for="mlab_cp_googlemap_type_control">Show map type switcher</label>');
        content.append( '<input id="mlab_cp_googlemap_type_control" type="checkbox" onclick="document.mlab_code_googlemap.setMapControl(\'' + guid + '\', \'mapTypeControl\', $(this).is(\':checked\'));" ' + ((document.mlab_cp_storage.googlemap.maps[guid].mapTypeControl) ? "checked" : "") + '>');
        content.append( '<label for="mlab_cp_googlemap_pan_control">Show pan control</label>');
        content.append( '<input id="mlab_cp_googlemap_pan_control" type="checkbox" onclick="document.mlab_code_googlemap.setMapControl(\'' + guid + '\', \'panControl\', $(this).is(\':checked\'));" ' + ((document.mlab_cp_storage.googlemap.maps[guid].panControl) ? "checked" : "") + '>');
        content.append( '<label for="mlab_cp_googlemap_type_control">Show scale control</label>');
        content.append( '<input id="mlab_cp_googlemap_type_control" type="checkbox" onclick="document.mlab_code_googlemap.setMapControl(\'' + guid + '\', \'scaleControl\', $(this).is(\':checked\'));" ' + ((document.mlab_cp_storage.googlemap.maps[guid].scaleControl) ? "checked" : "") + '>');
        content.append( '<label for="mlab_cp_googlemap_center">Centre map on:</label>');
        content.append( '<input id="mlab_cp_googlemap_center" type="text" onkeyup="document.mlab_code_googlemap.setMapCenter(\'' + guid + '\', $(this).val());" value="' + document.mlab_cp_storage.googlemap.maps[guid].getCenter() + '">');
        content.append( '<label for="mlab_cp_googlemap_markers">Centre map on:</label>');
        content.append( '<button class="mlab_button_left" onclick="document.mlab_code_googlemap.setMarker(\'' + guid + '\');">Add marker at current centre</button>');
        content.append( '<br><select id="mlab_cp_googlemap_markers" size="5">' + markers + '</select>');
        content.append( '<button class="mlab_button_left" onclick="document.mlab_code_googlemap.removeMarker(\'' + guid + '\');">Remove Marker</button>');
        content.append( '<button class="mlab_button_ok_right" onclick="$(\'.mlab_current_component\').qtip(\'hide\');">OK</button>');

        var component = el;
        var component_id = this.config.component_name;
        var component_config = this.config;
        
        $(el).qtip({
            solo: true,
            content: {text: content, title: "Last opp bilde" },
            position: { my: 'leftMiddle', at: 'rightMiddle' },
            show: { ready: true, modal: { on: true, blur: false } },
            hide: false,
            style: { classes: 'qtip-light' },
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
    
  