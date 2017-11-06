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
        
        var guid = this.api.getGUID();
        var trimmed_guid = guid.replace(/-/g, "");
        
        $(el).find("." + this.config.custom.class_identifier).attr("id", guid);
        
        this.api.setScript(el,  "function mlab_cp_googlemap_" + trimmed_guid + "() { \n" +
                                "    var myOptions = mlab.dt.api.getAllVariables($('#" + guid + "').parent()); \n" + 
                                "    if (typeof myOptions == 'undefined') {\n" +
                                "        myOptions = " + JSON.stringify(this.config.custom.map_options) + ";\n" +
                                "    }  \n" +
                                "    curr_map = new google.maps.Map(document.getElementById('" + guid + "'), myOptions);\n" + 
                                "    var new_markers = []; \n" + 
                                "    mlab.dt.api.setTempVariable('" + this.config.name + "', 'maps" + guid + "', curr_map); \n" + 
                                "    if (typeof myOptions.markers != 'undefined') { \n" + 
                                "        for (i in myOptions.markers) { \n" + 
                                "            var marker = new google.maps.Marker( {   \n" + 
                                "                position: new google.maps.LatLng(myOptions.markers[i].lat, myOptions.markers[i].lng),   \n" + 
                                "                map: curr_map,   \n" + 
                                "                title: myOptions.markers[i].title } );   \n" + 
                                "                new_markers.push({lat: myOptions.markers[i].lat, lng: myOptions.markers[i].lng, title: myOptions.markers[i].title, marker: marker}); \n" + 
                                "        }  \n" + 
                                "        mlab.dt.api.setTempVariable('" + this.config.name + "', 'markers" + guid + "', new_markers); \n" +
                                "    }  \n" + 
                                "} ");

        if (typeof (google) == "undefined" || typeof (google.maps) == "undefined") {
            $("head").append($("<script src='" + location.protocol + "//" + this.config.custom.map_script + "&key=" + "AIzaSyAIPKs3rxK8sgR7-aHO6s-CvMkpTG-QZUQ" + "&callback=mlab_cp_googlemap_" + trimmed_guid + "'>")); 
        }
        
    };
    
//el = element this is initialising
	this.onLoad = function (el) {
        el.find("." + this.config.custom.class_identifier).css("pointer-events", "none");
        var guid = $(el).find("." + this.config.custom.class_identifier).attr("id");
        var trimmed_guid = guid.replace(/-/g, "");
        if (typeof (google) == "undefined" || typeof (google.maps) == "undefined") {
            $("head").append($("<script src='" + location.protocol + "//" + this.config.custom.map_script + "&key=" + "AIzaSyAIPKs3rxK8sgR7-aHO6s-CvMkpTG-QZUQ" + "&callback=mlab_cp_googlemap_" + trimmed_guid + "'>")); 
        } else {
            eval("mlab_cp_googlemap_" + trimmed_guid + "();");
        }

    };


    this.onResize = function (el) {
        var w = $(el).width();
        var h = $(el).height();
        
        $(el).find(".mlab_cp_googlemap_canvas").css({"width": w + "px", "height": h + "px"});
        if (typeof (google) != "undefined" && typeof (google.maps) != "undefined") {
            var guid = $(el).find("." + this.config.custom.class_identifier).attr("id");
            var curr_map = this.api.getTempVariable(this.config.name, "maps" + guid);
            google.maps.event.trigger(curr_map, "resize");
        }
    }
    


//we need to manipulate content for reopening the map either in design mode or at runtime.
//therefore we need to generate new Google Maps API calls based on the current map settings (zoom level, controls displayed, etc
//we also need to delete the script inside the DIV which has a script_GUID id.

	this.onSave = function (el) {
        
//prepare some local vars
        var guid = $(el).find("." + this.config.custom.class_identifier).attr("id");
        var curr_map = this.api.getTempVariable(this.config.name, "maps" + guid);
        var temp_markers = this.api.getTempVariable(this.config.name, "markers" + guid);
        var map_centre = this.api.getTempVariable(this.config.name, "map_centre" + guid);
        if (typeof map_centre == "undefined") {
            var lat = 0;
            var long = 0;
        } else {
            var lat = map_centre.lat();
            var long = map_centre.lng();
        }
            
        var clean_markers = [];
        
        for (i in temp_markers) {
            clean_markers.push({  
                lat: temp_markers[i].lat, 
                lng: temp_markers[i].lng, 
                title: temp_markers[i].title});
        }

//assemble all the map configuration details
        var map_options = { zoom: curr_map.getZoom(), 
                            center: { lat: lat, lng: long },
                            mapTypeId: 'roadmap',
                            zoomControl: curr_map.zoomControl,
                            scaleControl: curr_map.scaleControl,
                            mapTypeControl: curr_map.mapTypeControl,
                            panControl: curr_map.panControl,
                            markers : clean_markers,
                            config : {class_identifier: this.config.custom.class_identifier, map_script: this.config.custom.map_script}
                        };
                        
        this.api.setAllVariables(el, map_options);
        
        var local_el = $(el).clone();
        local_el.find("." + this.config.custom.class_identifier).css("pointer-events", "").html("Retrieving map ... ");
        
        return local_el[0].outerHTML;
        
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
        var that = this;
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode( {'address': search_term}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    that.api.getTempVariable(that.config.name, "maps" + id).setCenter(results[0].geometry.location);
                } else {
                    console.log("Not found: " + status); 
                }
            });
        this.api.setDirty();
    };
    
    this.moveToCentre = function (guid, search_term) {
        var map_centre = this.api.getTempVariable(this.config.name, "map_centre" + guid);
        that.api.getTempVariable(that.config.name, "maps" + guid).setCenter(map_centre);
    };
    
    this.setMapCenter = function (id) {
        var curr_map = this.api.getTempVariable(this.config.name, "maps" + id);
        this.api.setTempVariable(this.config.name, "map_centre" + id, curr_map.getCenter());
        mlab.dt.api.properties_tooltip.qtip().tooltip.find("[data-mlab-cp-googlemap-info='centre']").text( "Current centre: " + $("#mlab_cp_googlemap_center").val() );
        this.api.setDirty();
    };
    
    
    this.setMapControl = function(id, control, status) {
        setting = new Object();
        setting[control] = status;
        this.api.getTempVariable(this.config.name, "maps" + id).setOptions( setting );
        this.api.setDirty();
    };

    this.setMapZoom = function(id, zoom) {
        this.api.getTempVariable(this.config.name, "maps" + id).setZoom( zoom );
        this.api.setDirty();
    };
    
    this.setMarker = function(id, title, center) {
        if (typeof(title) == "undefined") {
            var title = prompt("Enter a label for this map marker", $("#mlab_cp_googlemap_center").val());
            if (null === title) {
                return;
            }
        }
        
        var curr_map = this.api.getTempVariable(this.config.name, "maps" + id);
        
        if (typeof(center) == "undefined") {
            var center = curr_map.getCenter();
        }
        
        var marker = new google.maps.Marker({
            position: center,
            map: curr_map,
            title: title
        });
        
//store the marker position and title
        var my_markers = this.api.getTempVariable(this.config.name, "markers" + id);
        if (typeof my_markers == "undefined") {
            my_markers = [];
        }
        my_markers.push({  
                lat: marker.position.lat(), 
                lng: marker.position.lng(), 
                title: title,
                marker: marker
           });
           
        this.api.setTempVariable(this.config.name, "markers" + id, my_markers);
        $("#mlab_cp_googlemap_markers").append($('<option></option>').val(my_markers.length - 1).html(title));
        this.api.setDirty();
        
    };
    
    this.removeMarker = function(id) {
        if (null === $("#mlab_cp_googlemap_markers").val()) {
            return;
        }
        
        var i = parseInt($("#mlab_cp_googlemap_markers").val());
        $("#mlab_cp_googlemap_markers option[value=" + i + "]").remove();
        
        var my_markers = this.api.getTempVariable(this.config.name, "markers" + id);
        my_markers[i].marker.setMap(null);
        my_markers.splice(i, 1);
        this.api.setTempVariable(this.config.name, "markers" + id, my_markers);
        
        this.api.setDirty();
    };
    
    this.custom_edit_map = function (el, event) {
        var guid = $(el).find("." + this.config.custom.class_identifier).attr("id");
        var options = "";
        var options_markers = "";
        
        var curr_map = this.api.getTempVariable(this.config.name, "maps" + guid);
        var count_edit_attempts = parseInt(this.api.getTempVariable(this.config.name, "edit_counter" + guid));
        if (isNaN(count_edit_attempts)) {
            count_edit_attempts = 1;
        } else {
            count_edit_attempts++;
        }
        
//if map is not ready yet, try again later, each time wait a bit longer, but only try 5 times
        if (typeof curr_map == "undefined") {
            if (count_edit_attempts > 5) {
                return;
            }
            that = this;
            window.setTimeout(function(){ that.custom_edit_map(el, event); }, count_edit_attempts * 500);
            this.api.setTempVariable(this.config.name, "edit_counter" + guid, count_edit_attempts)
            return;
        }
        var z = curr_map.getZoom();
        var s = "";
        for (var o = 1; o <= 16; o++) {
            if (z == o) {
                options = options + "<option value='" + o + "' selected >" + o + "</option>";
            } else {
                options = options + "<option value='" + o + "'>" + o + "</option>";
            }
        }

        var my_markers = this.api.getTempVariable(this.config.name, "markers" + guid);
        
        if (typeof my_markers != "undefined") {
            for (i in my_markers) {
                var t = my_markers[i].title;
                options_markers = options_markers + "<option value='" + i + "'>" + t + "</option>";
            }
        }

        content = $('<div />');
        
        content.append( '<fieldset class="mlab_dt_group"><legend class="mlab_dt_text_headline">' + 'Search map' + '</legend>' +
                        '<label class="mlab_dt_label" for="mlab_cp_googlemap_center">Search map:</label>' + 
                        '<input class="mlab_dt_input" id="mlab_cp_googlemap_center" type="text" onkeyup="mlab.dt.components.googlemap.code.searchMap(\'' + guid + '\', $(this).val());" >' + 
                        '</fieldset>' );
                
        content.append( '<fieldset class="mlab_dt_group"><legend class="mlab_dt_text_headline">' + 'Centre map' + '</legend>' +
                        '<label class="mlab_dt_label" data-mlab-cp-googlemap-info="centre" onclick="mlab.dt.components.googlemap.code.moveToCentre(\'' + guid + '\');">Current centre: Not selected</label>' + 
                        '<button class="mlab_dt_button mlab_dt_left" onclick="mlab.dt.components.googlemap.code.setMapCenter(\'' + guid + '\');">Centre at current location</button>' + 
                        '</fieldset>' );

        content.append( '<fieldset class="mlab_dt_group"><legend class="mlab_dt_text_headline">' + 'Markers' + '</legend>' +
                        '<button class="mlab_dt_button mlab_dt_left" onclick="mlab.dt.components.googlemap.code.setMarker(\'' + guid + '\');">Add marker here</button>' + 
                        '<br><select class="mlab_dt_select" id="mlab_cp_googlemap_markers" size="5">' + options_markers + '</select>' +
                        '<button class="mlab_dt_button mlab_dt_left" onclick="mlab.dt.components.googlemap.code.removeMarker(\'' + guid + '\');">Remove Marker</button>' + 
                        '</fieldset>' );
        
        content.append( '<fieldset class="mlab_dt_group"><legend class="mlab_dt_text_headline">' + 'Map attributes' + '</legend>' +
                        '<label class="mlab_dt_label" for="mlab_cp_googlemap_zoom_control">Show zoom control</label>' + 
                        '<input class="mlab_dt_input" id="mlab_cp_googlemap_zoom_control" type="checkbox" onclick="mlab.dt.components.googlemap.code.setMapControl(\'' + guid + '\', \'zoomControl\', $(this).is(\':checked\'));" ' + ((curr_map.zoomControl) ? "checked" : "") + '>' + 
                        '<label class="mlab_dt_label" for="mlab_cp_googlemap_zoom_level">Choose zoom level</label>' + 
                        '<select class="mlab_dt_select" id="mlab_cp_googlemap_zoom_level" onclick="mlab.dt.components.googlemap.code.setMapZoom(\'' + guid + '\', parseInt($(this).val()));">' + options + '</select>' + 
                        '<label class="mlab_dt_label" for="mlab_cp_googlemap_type_control">Show map type switcher</label>' + 
                        '<input class="mlab_dt_input" id="mlab_cp_googlemap_type_control" type="checkbox" onclick="mlab.dt.components.googlemap.code.setMapControl(\'' + guid + '\', \'mapTypeControl\', $(this).is(\':checked\'));" ' + ((curr_map.mapTypeControl) ? "checked" : "") + '>' + 
                        '<label class="mlab_dt_label" for="mlab_cp_googlemap_pan_control">Show pan control</label>' + 
                        '<input class="mlab_dt_input" id="mlab_cp_googlemap_pan_control" type="checkbox" onclick="mlab.dt.components.googlemap.code.setMapControl(\'' + guid + '\', \'panControl\', $(this).is(\':checked\'));" ' + ((curr_map.panControl) ? "checked" : "") + '>' + 
                        '<label class="mlab_dt_label" for="mlab_cp_googlemap_type_control">Show scale control</label>' + 
                        '<input class="mlab_dt_input" id="mlab_cp_googlemap_type_control" type="checkbox" onclick="mlab.dt.components.googlemap.code.setMapControl(\'' + guid + '\', \'scaleControl\', $(this).is(\':checked\'));" ' + ((curr_map.scaleControl) ? "checked" : "") + '>' +
                        '</fieldset>' );

        content.append( '<button class="mlab_dt_button_ok mlab_dt_right" onclick="mlab.dt.api.closeAllPropertyDialogs();">OK</button>');

        var component = el;
        var component_id = this.config.component_name;
        var component_config = this.config;
        
        this.api.displayPropertyDialog(el, "Edit map", content, null, null, null, null, false, event);
        
   };
   
   
   