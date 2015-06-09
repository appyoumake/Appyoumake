document.mlab_code_cl2 = new function() {

this.config = {};	 

    this.onCreate = function (el, config, designer, url) {
	this.createPopUp(el);
	this.onLoad (el, config, designer, url);
    };

    //el = element this is initialising, config = global config from conf.txt
this.onLoad = function (el, config, designer, url) {
        this.config = config;
	};
    
this.onSave = function (el) {
    };


    this.custom_add_link = function (el) {
        var link = prompt(this.config.custom.msg_requestlink);
        var page_name = "";
        if (link != null && link != "") {
            var num = parseInt(link);
            if (parseInt(link) > 0 && num < 1000) {
                var page_name = ("000" + document.mlab_current_app.curr_page_num).slice(-3) + ".html";
            } else if (/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(link)) {
                page_name = link.trim();
            }
            document.execCommand("createlink", false, page_name);
        }
        if (page_name == "") {
            alert(this.config.custom.msg_wronglink);
        }
    };

    this.custom_remove_link = function (el) {
document.execCommand("unlink", false, false);
    };
    


this.loadLibraries = function () {
        if ("required_libs" in this.config) {
            for (i in this.config.required_libs) {
                if (this.config.required_libs[i].substr(-3) == ".js") {
                    if ($("script[src*='" + this.config.required_libs[i] + "']").length < 1) {
                        $("head").append($("<script src='" + this.config.component_url + this.config.name + "/js/" + this.config.required_libs[i] +"'>")); 
                    }
                } else if (this.config.required_libs[i].substr(-4) == ".css") {
                    if ($("link[href*='" + this.config.required_libs[i] + "']").length < 1) {
                        $("head").append($("<link rel='stylesheet' type='text/css' href='" + this.config.component_url + this.config.name + "/css/" + this.config.required_libs[i] +"'>")); 
                    }
                }
            }
        }
        
    };       


this.createPopUp = function(el) {
	this.loadLibraries();
        content = $('<form id = number></form>');
        content.append($('<form id = inputfelter></form>'));
        content.append($("<button id = input >Legg til input</button>"));
	content.append($('<form id = formler></form>'));
 	content.append($("<button id = formula >Legg til formel</button><br>"));
        content.append($("<button id = submit >Submit</button>"));
    $(el).qtip({
    content: {text: content},
    show: { ready: true, modal: { on: true, blur: false } },
            hide: false,
            style: { classes: 'qtip-tipped' },
            events: { render: function(event, api) {
                            $('#input').click(function(e) {
                            $(content).find("#inputfelter").append($('<input id = first type=text value=input><br>'));
                            });
			$('#formula').click(function(e) {
                            $(content).find("#formler").append($('<input id = first type=text value=output><input id = first type=text value=formel><br>'));
                            });
			$('#submit').click(function(e) {
                            api.hide(e);
                            });        
                                },
                    hide: function(event, api) { api.destroy();}
        }
    });



};


};



