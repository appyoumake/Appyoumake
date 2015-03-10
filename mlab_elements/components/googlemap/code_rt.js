//el = element this is initialising
	this.onPageLoad = function (el) {
//LOAD OPTIONS HERE        
        var myOptions = this.api.getAllVariables(el);
        var markers = JSON.stringify(markers);
        if (!$.browser.mobile) { 
            if (typeof(document.mlab_cp_storage.googlemap) == 'undefined') { 
                document.mlab_cp_storage.googlemap = new Object(); 
            } 
            if (typeof(document.mlab_cp_storage.googlemap.maps) == 'undefined') { 
                document.mlab_cp_storage.googlemap.maps = new Object(); 
            } 
            document.mlab_cp_storage.googlemap.maps['" + guid + "'] = new google.maps.Map(document.getElementById('" + guid + "'), myOptions); 
            for (i in markers) { 
                mlab.dt.components.googlemap.setMarker('" + guid + "', markers[i][0], new google.maps.LatLng(markers[i][1], markers[i][2]) ); 
            } 
        } else { 
            var temp_map = new google.maps.Map(document.getElementById('" + guid + "'), myOptions); 
            for (i in markers) { 
                new google.maps.Marker({  
                    position: new google.maps.LatLng(markers[i][1], markers[i][2]),  
                    map: temp_map,  
                    title: markers[i][0]  
               });  
            } 
        } 
        if (typeof (google) == 'undefined' || typeof (google.maps) == 'undefined') { 
            $('head').append($('<script src="' + this.config.custom.map_script + '&callback=this.initMap">'));
        } 
    };
