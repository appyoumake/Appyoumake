document.mlab_code_video = new function() {
	
	this.config = {};
    
    this.onCreate = function (el, config, api_func) {
        this.onLoad (el, config, api_func);
    };
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, api_func) {
        this.config = config;
        this.config["api_function"] = api_func;
        if ($(el).find('video').attr("poster") == "") {
        	$(el).find('video').attr("poster", this.config.placholder);
        } 
    };

	this.onSave = function (el) {
        var temp_html = el.outerHTML;
        return temp_html;
    };
            
	this.onDelete = function () {
		console.log('delete');
    };
    
    this.getContentSize = function (el) {
        return $(el).find("video").duration;
    };
    
    this.selectExistingVideo = function(select_box) {
        var img = $('.mlab_current_component').find('img');
        $('.mlab_current_component').qtip('hide'); 
        img.attr('src', $(select_box).val());
        this.config["api_function"](MLAB_CB_SET_DIRTY);
    };
    


    this.custom_upload_image = function (el) {
        this.config["api_function"](MLAB_CB_GET_LIBRARIES, this.config.name);
        var self = this;
        
        content = $('<form />', {id: "mlab_form_properties" } );
        content.append( $('<p />', { text: "Choose video to load" }) );
        content.append( $('<select onchange="document.mlab_code_video.selectExistingVideo(this);" id="mlab_cp_video_select_video"><option>...loading images...</option></select>') );
        content.append( $('<div />', { id: "mlab_cp_video_uploadfiles", name: "mlab_cp_video_uploadfiles", text: 'Velg filer', data: { allowed_types: ["jpg", "jpeg", "png", "gif"], multi: false} }) );
        content.append( $('<p /><br />') );
        content.append( $('<div />', { id: 'mlab_cp_video_uploadfiles_start', name: 'mlab_cp_video_uploadfiles_start', text: 'Start opplasting', class: "ajax-file-upload-green" }) );
        content.append( $('<p />') );
        content.append( $('<div />', { text: 'Cancel', id: "mlab_cp_video_button_cancel", class: "pure-button  pure-button-xsmall" }) );
        content.append( $('<div />', { text: 'OK', id: "mlab_cp_video_button_ok", class: "pure-button  pure-button-xsmall right" }) );

        var component = el;
        var component_id = this.config.component_name;
        var component_config = this.config;
        
        $(el).qtip({
            content: {text: content, title: "Last opp video" },
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
                            $("#mlab_cp_video_select_video").html(existing_files);

//upload files 
                            if ($("#mlab_cp_video_button_ok").length > 0) {
                                var uploadObj = $("#mlab_cp_video_uploadfiles").uploadFile({
                                    url: this.config["api_function"](MLAB_CB_URL_UPLOAD_ABSOLUTE, this.config.name),
                                    formData: { comp_id: component_id, app_path: document.mlab_current_app.path },
                                    multiple: false,
                                    showCancel: false,
                                    showAbort: false,
                                    showDone: false,
                                    autoSubmit: true,
                                    fileName: "mlab_files",
                                    showStatusAfterSuccess: true,
                                    allowedTypes: "mp4",
                                    onSuccess: function(files, data, xhr) {
                                                $(this).find("source").attr("src", data.url );
                                                $(this).find("video").attr("poster", data.url_placeholder );
                                                api.hide(); 
                                        }.bind(component),
                                    onError: function(files, status, errMsg) { 
                                        alert(errMsg); 
                                    }
                                });

                                $("#mlab_cp_video_uploadfiles_start").click(function() {
                                    uploadObj.startUpload();
                                });
                            }
                            
                            $('#mlab_cp_video_button_ok', api.elements.content).click(	
                                    function(e) {
                                        api.hide(e); 
                                        if (typeof (document["mlab_code_" + component_id]) !== "undefined") {
                                            document["mlab_code_" + component_id].setProperties( $("#mlab_form_properties").serializeArray(), this );
                                        }
                                    }.bind(component));
                            $('#mlab_cp_video_button_cancel', api.elements.content).click(function(e) { api.hide(e); });
                        },
                        hide: function(event, api) { api.destroy(); }
            }
        });
        
    }

    
};