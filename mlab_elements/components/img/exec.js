document.mlab_code_img = new function() {
	
	this.config = {};

    this.onCreate = function (el, config, designer, url) {
        this.onLoad (el, config, designer, url);
        var comp = $(el).find('img');
        if (typeof comp.attr("src") == "undefined" || comp.attr("src") == "") {
            comp.attr("src", this.config.placeholder);
        }

        $(el).attr("data-mlab-guid", this.generate_guid());
        this.custom_upload_image(el);
    }
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, designer, url) {
        if (typeof config != "undefined") {
            for (var attrname in config) { this.config[attrname] = config[attrname]; }
        }
        this.config["component_url"] = url;
        var comp = $(el).find('img');
        comp.resizable({"containment": designer});
    };

	this.onSave = function (el) {
        var img = $(el).find('img');
        var w = img.width();
        var h = img.height();

        img.resizable( "destroy" );
        img.css({ width: w, height: h });
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
        
    }
            
	this.custom_set_title = function (el) {
        var title = prompt(this.config.custom.msg_requestlink);
        if (title != null && title != "") {
    		$(comp).find("img").attr("title", title);
        }
	};
	
	this.onDelete = function () {
		console.log('delete');
    };
    
    this.getContentSize = function (el) {
        var ctrl = $(el).find("img");
        return { "width": ctrl.width(), "height": ctrl.height() }
    };
    
    this.custom_maximize = function (el) {
        if ($(el).siblings().length > 0) {
            alert("Unable to maximise the component, there can be no other components on the page when you do this");
        } else {
            var img = $(el).find('img');
            img.resizable( "destroy" );
            img.css({ width: "100%", height: "100%" });
            img.addClass("maximize");
            img.resizable({"containment": el.parent});
        }
    };

    this.custom_restore = function (el) {
		$(el).find("img").removeClass("maximize");
    };
    
    this.custom_upload_image = function (el) {
        this.loadLibraries();
        content = $('<form />', {id: "mlab_form_properties" } );
        content.append( $('<p />', { text: "Choose picture to load" }) );
        content.append( $('<select id="mlab_cp_select_files"><option>...loading images...</option></select>') );
        content.append( $('<div />', { id: "mlab_property_uploadfiles", name: "mlab_property_uploadfiles", text: 'Velg filer', data: { allowed_types: ["jpg", "jpeg", "png", "gif"], multi: false} }) );
        content.append( $('<p /><br />') );
        content.append( $('<div />', { id: 'mlab_property_uploadfiles_start', name: 'mlab_property_uploadfiles_start', text: 'Start opplasting', class: "ajax-file-upload-green" }) );
        content.append( $('<p />') );
        content.append( $('<div />', { text: 'Cancel', id: "mlab_property_button_cancel", class: "pure-button  pure-button-xsmall" }) );
        content.append( $('<div />', { text: 'OK', id: "mlab_property_button_ok", class: "pure-button  pure-button-xsmall right" }) );

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

//upload files 
                            if ($("#mlab_property_button_ok").length > 0) {
                                var uploadObj = $("#mlab_property_uploadfiles").uploadFile({
                                    url: this.config.urls["upload"],
                                    formData: { comp_id: component_id, app_path: document.mlab_current_app.path },
                                    multiple: false,
                                    autoSubmit: false,
                                    fileName: "mlab_files",
                                    showStatusAfterSuccess: true,
                                    allowedTypes: "jpg,jpeg,png,gif",
                                    onSuccess: function(files, data, xhr) {
                                                $(this).find("img").attr("src", data.url );
                                                api.hide(); 
                                        }.bind(component),
                                    onError: function(files, status, errMsg) { 
                                        alert(errMsg); 
                                    }
                                });

                                $("#mlab_property_uploadfiles_start").click(function() {
                                    uploadObj.startUpload();
                                });
                            }
                            
                            $('#mlab_property_button_ok', api.elements.content).click(	
                                    function(e) {
                                        api.hide(e); 
                                        if (typeof (document["mlab_code_" + component_id]) !== "undefined") {
                                            document["mlab_code_" + component_id].setProperties( $("#mlab_form_properties").serializeArray(), this );
                                        }
                                    }.bind(component));
                            $('#mlab_property_button_cancel', api.elements.content).click(function(e) { api.hide(e); });
                        },
                        hide: function(event, api) { api.destroy(); }
            }
        });
        
//load existing files
        $.getJSON("/app_dev.php/app/builder/24/jpg,jpeg,png,gif/get_uploaded_files", function (data) {
            $("#mlab_cp_select_files").html(data.files);
        }); 
    }
    
    
/**
 * Generic function to create a GUID that is rfc4122 version 4 compliant
 */
    this.generate_guid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
    
};