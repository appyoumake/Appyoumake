document.mlab_code_img = new function() {
	
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
    };

	this.onSave = function (el) {
        $(el).find("figcaption").removeAttr("contenteditable");
        var temp_html = el.outerHTML;
        $(el).find("figcaption").attr("contenteditable", "true");
        return temp_html;
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
    
    this.custom_scale_to_100_percent = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css('width', '100%');
    };
    
    this.custom_position_left = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css({'float': 'left', 'margin-left': '', 'margin-right': ''});
    };
    
    this.custom_position_right = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css({'float': 'right', 'margin-left': '', 'margin-right': ''});
    };
    
    this.custom_position_centre = function (el) {
        var fig = $('.mlab_current_component').find('figure');
        fig.css({'float': 'none', 'margin-left': 'auto', 'margin-right': 'auto'});
    };
    
    
    this.custom_upload_image = function (el) {
        this.config["api_function"](MLAB_CB_GET_LIBRARIES, this.config.name);
        var self = this;
        
        content = $('<form />', {id: "mlab_form_properties" } );
        content.append( $('<p />', { text: "Velg ønsket bilde fra listen eller klikk 'velg fil' for å søke frem et bilde", class: "mlab_dt_text_info" }) );
        content.append( $('<select onchange="document.mlab_code_img.selectExistingImage(this);" id="mlab_cp_img_select_image" class="mlab_dt_select"><option>...laster bilde...</option></select>') );
        content.append( $('<div />', { id: "mlab_cp_image_uploadfiles", class: "mlab_dt_button_upload_files_left", name: "mlab_cp_image_uploadfiles", text: 'Velg fil', data: { allowed_types: ["jpg", "jpeg", "png", "gif"], multi: false} }) );
        content.append( $('<div />', { class: "mlab_dt_large_new_line" }) );
        content.append( $('<div />', { text: 'Avbryt', id: "mlab_cp_image_button_cancel", class: "pure-button  pure-button-xsmall mlab_dt_button_cancel_left" }) );
       // content.append( $('<div />', { class: "mlab_dt_button_new_line" }) );
        content.append( $('<div />', { text: 'OK', id: "mlab_cp_image_button_ok", class: "pure-button  pure-button-xsmall right mlab_dt_button_ok_left" }) );

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
//load existing files
                            var existing_files = this.config["api_function"](MLAB_CB_GET_MEDIA, "jpg,jpeg,png,gif");
                            $("#mlab_cp_img_select_image").html(existing_files);

//upload files 
                            if ($("#mlab_cp_image_button_ok").length > 0) {
                                var uploadObj = $("#mlab_cp_image_uploadfiles").uploadFile({
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

                                $("#mlab_cp_image_uploadfiles_start").click(function() {
                                    uploadObj.startUpload();
                                });
                            }
                            
                            $('#mlab_cp_image_button_ok', api.elements.content).click(	
                                    function(e) {
                                        api.hide(e); 
                                        if (typeof (document["mlab_code_" + component_id]) !== "undefined") {
                                            document["mlab_code_" + component_id].setProperties( $("#mlab_form_properties").serializeArray(), this );
                                        }
                                    }.bind(component));
                            $('#mlab_cp_image_button_cancel', api.elements.content).click(function(e) { api.hide(e); });
                            
                            //Adding mlab style 
                            //$('#mlab_property_button_ok').addClass('mlab_dt_button_ok_left'); 
                            //$('#mlab_property_button_cancel').addClass('mlab_dt_button_cancel_left');
                            //$('#mlab_property_uploadfiles').addClass('mlab_dt_button_upload_files_left');
                            $('.new_but_line').addClass('mlab_dt_button_new_line');
                            $('.new_big_line').addClass('mlab_dt_large_new_line');
                            $('.new_small_line').addClass('mlab_dt_small_new_line');
                            $('.qtip-titlebar').addClass('mlab_dt_text_title_bar');
                            $('.info').addClass('mlab_dt_text_info');
                            $('.ajax-file-upload-filename').addClass('mlab_dt_text_filename');
                            $('.ajax-file-upload-statusbar').addClass('mlab_dt_progress_bar');
                            
                        },
                        hide: function(event, api) { api.destroy(); }
            }
        });
        
    }
    
};