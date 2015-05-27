/*
 * Various wrapper functions that call on services remotely at design time
 */

function Mlab_dt_external_services () {
    this.parent = null;
};

Mlab_dt_external_services.prototype = {
    
    
    cs_app_get : function () {
        var url = this.parent.urls.cs_get_app_status
        var i = prompt("app database ID (leave blank is OK)");
        url = url.replace("/_ID_", ((i != null && i != "") ? "/" + i : ""));
        var v = prompt("version (leave blank is OK)");
        url = url.replace("/_VERSION_", ((v != null && v != "") ? "/" + v : ""));
        var p = prompt("platform (ios or android) (leave blank is OK)");
        url = url.replace("/_PLATFORM_", ((p != null && p != "") ? "/" + p : ""));

        $.getJSON(url, function( json ) {
            if (json.result == "success") {
                alert("check javascript console");
                console.log("status of current app: ");
                console.log(json.app_status[mlab.dt.app.uid]);
            } else {
                alert("Unable to get app status");
            }
        });
    }



}