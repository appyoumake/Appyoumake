//el = element this is initialising
    
    this.onPageLoad = function (el, vars) {
        var guid = $(el).find("." + vars.config.class_identifier).attr("id");
        var trimmed_id = guid.replace(/-/g, "");
        vars.guid = guid;
        
        if (eval( "typeof this.initMap" + trimmed_id) == 'undefined') {
            eval( "this.initMap" + trimmed_id + " = function() { this.initMap(" + JSON.stringify(vars) + "); }" );
        }
        
        if (typeof (google) == "undefined" || typeof (google.maps) == "undefined") {
            $("head").append($("<script src='https://" + vars.config.map_script + "&key=" + "AIzaSyAIPKs3rxK8sgR7-aHO6s-CvMkpTG-QZUQ" + "&callback=mlab.api.components.googlemap.initMap" + trimmed_id + "'>")); 
        } else {
            eval("mlab.api.components.googlemap.initMap" + trimmed_id + "();");
        }
    };
    
    this.initMap = function(mapOptions) {
        curr_map = new google.maps.Map(document.getElementById(mapOptions.guid), mapOptions);
        if (typeof mapOptions.markers != 'undefined') { 
            for (i in mapOptions.markers) { 
                new google.maps.Marker( {
                    position: new google.maps.LatLng(mapOptions.markers[i].lat, mapOptions.markers[i].lng),  
                    map: curr_map, 
                    title: mapOptions.markers[i].title } ); 
            }
        }
        var elem = $("#" + mapOptions.guid);
        elem.hide();
        elem.get(0).offsetHeight; // no need to store this anywhere, the reference is enough
        elem.show();
        google.maps.event.trigger(curr_map, "resize");
    };
