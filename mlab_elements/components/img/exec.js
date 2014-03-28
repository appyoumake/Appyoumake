document.mlab_code_img = new function() {
	
	this.config = {component_name: "img"};
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, designer) {
        if (typeof config != "undefined") {
            for (var attrname in config) { this.config[attrname] = config[attrname]; }
        }
        var comp = $(el).find('img');
        if (typeof comp.attr("src") == "undefined" || comp.attr("src") == "") {
            comp.attr("src", this.config.placeholder);
        }
        comp.resizable({"containment": designer});
    };

	this.onSave = function (el) {
        var img = $(el).find('img');
        var w = img.width();
        var h = img.height();

        img.resizable( "destroy" );
        img.css({ width: w, height: h });
    };
            
	this.custom_set_title = function (el) {
        var title = prompt(this.config.custom.msg_requestlink);
        if (title != null && title != "") {
    		$(comp).find("img").attr("title", title);
        }
	};
	
	this.filesUploaded = function ( files, data, comp ) {
		$(comp).find("img").attr("src", data.url );
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
            alert("Unable to maximise the component, there can be no other components on the page to do this");
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
        content = $('<form />', {id: "mlab_form_properties" });
        content.append($('<p />', { text: "Velg et bilde som skal lastes opp her" }));

        content.append( $('<label />', { 'text': 'Tittel:', 'for': "mlab_property_title" }) );
        content.append( $('<input />', { id: "mlab_property_title", name: "mlab_property_title" }) );
        content.append( $('<p /><br />') );
        content.append( $('<div />', { id: "mlab_property_uploadfiles", name: "mlab_property_uploadfiles", text: 'Velg filer', data: { allowed_types: ["jpg", "jpeg", "png", "gif"], multi: false} }) );
        content.append( $('<p /><br />') );
        content.append( $('<div />', { id: 'mlab_property_uploadfiles_start', name: 'mlab_property_uploadfiles_start', text: 'Start opplasting', class: "ajax-file-upload-green" }) );
        content.append( $('<p />') );
        content.append( $('<div />', { text: 'Avbryt', id: "mlab_property_button_cancel", class: "pure-button  pure-button-xsmall" }) );
        content.append( $('<div />', { text: 'OK', id: "mlab_property_button_ok", class: "pure-button  pure-button-xsmall right" }) );

        var component = el;
        var component_id = this.config.component_name;
        $(el).qtip({
            content: {text: content, title: "Last opp bilde" },
            position: { my: 'leftMiddle', at: 'rightMiddle' },
            show: { ready: true, modal: { on: true, blur: false } },
            hide: false,
            style: { classes: 'qtip-tipped' },
            events: { render: function(event, api) {
                            this.component = component;
                            this.component_id = component_id;

//upload files 
                            if ($("#mlab_property_button_ok").length > 0) {
                                var url = "{{ path('app_builder_component_upload', {'comp_id': '_COMPID_', 'app_id': '_APPID_'} ) }}";
                                url = url.replace("_APPID_", document.mlab_current_app.id);
                                url = url.replace("_COMPID_", component_id);

                                var uploadObj = $("#mlab_property_uploadfiles").uploadFile({
                                    url: url,
                                    formData: { comp_id: component_id, app_path: document.mlab_current_app.path },
                                    multiple: false,
                                    autoSubmit: false,
                                    fileName: "mlab_files",
                                    showStatusAfterSuccess: true,
                                    allowedTypes: "jpg,jpeg,png,gif",
                                    onSuccess: function(files, data, xhr) {
                                                document["mlab_code_" + component_id].filesUploaded( files, data, this );
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
    }
    
};