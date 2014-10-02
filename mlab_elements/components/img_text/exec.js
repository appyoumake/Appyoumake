document.mlab_code_img_text = new function() {
	
	this.config = {};

    this.onCreate = function (el, config, api_func) {
        this.onLoad (el, config, api_func);
        
        var comp = $(el).find('img');
        if (typeof comp.attr("src") == "undefined" || comp.attr("src") == "") {
            comp.attr("src", this.config.placeholder);
        }

        this.custom_upload_image(el);
    }
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, api_func) {
        this.config = config;
        this.config["api_function"] = api_func;
        $(el).find("figcaption").attr("contenteditable", "true");
        $(el).find("p").attr("contenteditable", "true");
    };

	this.onSave = function (el) {
        $(el).find("figcaption").removeAttr("contenteditable");
        $(el).find("p").removeAttr("contenteditable");
    };
	
	this.onDelete = function () {

    };
    
    this.getContentSize = function (el) {
        var ctrl = $(el).find("img");
        return { "width": ctrl.width(), "height": ctrl.height() }
    };
    
    this.selectExistingImage = function(select_box) {
        var img = $('.mlab_current_component').find('img');
        $('.mlab_current_component').qtip('hide'); 
        img.attr('src', $(select_box).val());
        this.config["api_function"](MLAB_CB_SET_DIRTY);
    };
    
    this.custom_scale_to_25_percent = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('width', '25%');
    };
    
    this.custom_scale_to_50_percent = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('width', '50%');
    };
    
    this.custom_scale_to_75_percent = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('width', '75%');
    };
    
    this.custom_position_left = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('float', 'left');
    };
    
    this.custom_position_right = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('float', 'right');
    };
    
    this.custom_upload_image = function (el) {
        this.config["api_function"](MLAB_CB_GET_LIBRARIES, this.config.name);
        var self = this;
        
        content = $('<form />', {id: "mlab_form_properties" } );
        content.append( $('<p />', { text: "Choose picture to load" }) );
        content.append( $('<select onchange="document.mlab_code_img_text.selectExistingImage(this);" id="mlab_cp_select_files"><option>...loading images...</option></select>') );
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
//load existing files
                            var existing_files = this.config["api_function"](MLAB_CB_GET_MEDIA, "jpg,jpeg,png,gif");
                            $("#mlab_cp_select_files").html(existing_files);

//upload files 
                            if ($("#mlab_property_button_ok").length > 0) {
                                var uploadObj = $("#mlab_property_uploadfiles").uploadFile({
                                    url: this.config["api_function"](MLAB_CB_URL_UPLOAD_ABSOLUTE, this.config.name),
                                    formData: { comp_id: component_id, app_path: document.mlab_current_app.path },
                                    multiple: false,
                                    showCancel: false,
                                    showAbort: false,
                                    showDone: false,
                                    autoSubmit: true,
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
        
    }
    
};