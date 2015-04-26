//el = element this is initialising
    
	this.onPageLoad = function (el, vars) {
        
        var id = $(el).find("." + vars.class_identifier).attr("id");
        
        if (typeof (eval( "this.initMap" + id)) == "undefined") {
            eval( "this.initMap" + id + " = function() { this.initMap(" + JSON.stringify(vars) + "); }" );
        }
        
        if (typeof (google) == "undefined" || typeof (google.maps) == "undefined") {
            $("head").append($("<script src='http://maps.google.com/maps/api/js?v=3&callback=this.initMap" + id + "'>")); 
        } else {
            eval("this.initMap" + id + "();");
        }
    };
    
    this.initMap = function(mapOptions) {
        
        curr_map = new google.maps.Map(document.getElementById('" + guid + "'), mapOptions);
        if (typeof mapOptions.markers != 'undefined') { 
            for (i in myOptions.markers) { 
                new google.maps.Marker( {
                    position: new google.maps.LatLng(mapOptions.markers[i].lat, mapOptions.markers[i].lng),  
                    map: curr_map, 
                    title: mapOptions.markers[i].title } ); 
            }
        }
        
    };
        
        
        
        
        
        
        
        
        
        
        
        var markers = JSON.stringify(markers);
        var temp_map = new google.maps.Map(document.getElementById('" + guid + "'), myOptions); 
        for (i in markers) { 
            new google.maps.Marker({  
                position: new google.maps.LatLng(markers[i][1], markers[i][2]),  
                map: temp_map,  
                title: markers[i][0]  
           });  
        } 

    };
