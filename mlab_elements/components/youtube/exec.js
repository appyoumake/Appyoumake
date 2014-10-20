document.mlab_code_youtube = new function() {
	
    this.config = {};
    
    this.onCreate = function (el, config, api_func) {
        this.onLoad (el, config, api_func);
        $(el).html('<img src="' + this.config.placholder + '" >');
        this.custom_select_video(el);
    };
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, api_func) {
        this.config = config;
        this.config["api_function"] = api_func;
    };

	this.onSave = function (el) {
        var temp_html = el.outerHTML;
        return temp_html;
    };
            
    this.custom_select_video = function (el) {
        
        content = $('<form />');
        content.append( '<div class="arama">' + 
                        '    <form action="" onsubmit="return false">' + 
                        '        <p class="mlab_dt_text_info">Søk etter en youtube-video ved å skrive et søkeord i boksen og enten velg et forslag fra listen eller klikk på søk-knappen</p>' + 
                        '        <div class="ui-widget">' +  
                        '            <input id="youtube" />' + 
                        '            <button id="submit">Søk</button>' + 
                        '        </div>' + 
                        '    </form>' + 
                        '</div>' +
                        '<div id="sonuc"></div>');
                
        content.append( $('<p />') );
        content.append( $('<div />', { text: 'Avbryt', id: "mlab_property_button_cancel", class: "pure-button  pure-button-xsmall mlab_dt_button_cancel_left" }) );
        content.append( $('<div />', { text: 'OK', id: "mlab_property_button_ok", class: "pure-button  pure-button-xsmall right mlab_dt_button_ok_left" }) );

        var component = el;
        var component_id = this.config.component_name;
        var component_config = this.config;
        var self = this;
        
        $(el).qtip({
            solo: true,
            style: {
                width: 400, // Overrides width set by CSS (but no max-width!)
                height: 600 // Overrides height set by CSS (but no max-height!)
            },
            content: {text: content, title: "Velg video" },
            position: { my: 'leftMiddle', at: 'rightMiddle' },
            show: { ready: true, modal: { on: true, blur: false } },
            hide: false,
            style: { classes: 'qtip-light' },
            events: { render: function(event, api) {
                            this.component = component;
                            this.component_id = component_id;
                            this.config = component_config;
                            var self = this.component;
//process URL selected
                            $("#mlab_property_uploadfiles_start").click(function() {
                                api.hide(e);
                            });

                            $('#mlab_property_button_cancel', api.elements.content).click(function(e) { 
                                api.hide(e); 
                            });
                            
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
/* 
 * The following section is Copyright (c) 2014 by Tayfun Erbilen (http://codepen.io/tayfunerbilen/pen/rIHvD)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
                            
                            /* AutoComplete */
                            $("#youtube").autocomplete({
                                source: function(request, response){
                                    /* google geliştirici kimliği (zorunlu değil) */
                                    var apiKey = 'AI39si7ZLU83bKtKd4MrdzqcjTVI3DK9FvwJR6a4kB_SW_Dbuskit-mEYqskkSsFLxN5DiG1OBzdHzYfW0zXWjxirQKyxJfdkg';
                                    /* aranacak kelime */
                                    var query = request.term;
                                    /* youtube sorgusu */
                                    $.ajax({
                                        url: "http://suggestqueries.google.com/complete/search?hl=en&ds=yt&client=youtube&hjson=t&cp=1&q="+query+"&key="+apiKey+"&format=5&alt=json&callback=?",  
                                        dataType: 'jsonp',
                                        success: function(data, textStatus, request) { 
                                           response( $.map( data[1], function(item) {
                                                return {
                                                    label: item[0],
                                                    value: item[0]
                                                }
                                            }));
                                        }
                                    });
                                },
                                /* seçilene işlem yapmak için burayı kullanabilirsin */
                                select: function( event, ui ) {
                                    $.youtubeAPI(ui.item.label);
                                }
                            });

                            /* Butona Basınca Arama */
                            $('button#submit').click(function(){
                                var value = $('input#youtube').val();
                                    $.youtubeAPI(value);
                            });

                            /* Youtube Arama Fonksiyonu */
                            $.youtubeAPI = function(kelime){
                                var sonuc = $('#sonuc');
                                sonuc.html('Arama gerçekleştiriliyor...');
                                $.ajax({
                                    type: 'GET',
                                    url: 'http://gdata.youtube.com/feeds/api/videos?q=' + kelime + '&max-results=15&v=2&alt=jsonc',
                                    dataType: 'jsonp',
                                    success: function( veri ){
                                        if( veri.data.items ){
                                            sonuc.empty();
                                            $.each( veri.data.items, function(i, data) {
                                                sonuc.append('<div class="youtube">\
                                                    <img src="' + data.thumbnail.sqDefault + '" alt="" />\
                                                    <h3><a href="javascript:void(0)" onclick="$.youtubeSelect(\'' + data.id + '\')">' + data.title + '</a></h3>\
                                                    <p>' + data.description + '</p>\
                                                </div>\
                                                <div class="youtubeOynat" id="' + data.id + '"></div>');
                                            });
                                        }
                                        else {
                                            sonuc.html('<div class="hata"><strong>' + kelime + '</strong> ile ilgili hiç video bulunamadı!</div>');
                                        }
                                    }
                                });
                            }

// Add youtube code to app, and resize it to fill whole width
                            $.youtubeSelect = function(yid){
                                var container = $(self);
                                container.html('<iframe width="560" height="315" src="//www.youtube.com/embed/' + yid + '" frameborder="0" allowfullscreen style="pointer-events: none" ></iframe>');
                                var video = $(container).find("iframe");

                                $('.mlab_current_component').qtip('hide');
                                video.attr('data-aspectRatio', video.height() / video.width()).removeAttr('height').removeAttr('width');

                                $(window).resize(function() {
                                    var newWidth = container.width();
                                    video.width(newWidth).height(newWidth * video.attr('data-aspectRatio'));
                                }).resize();                                
                            }    


                        },
                        hide: function(event, api) { api.destroy(); },
                        visible: function(event, api) { $(this).css("z-index", 99); }
            }
        });
        
    }

	this.onDelete = function () {
		console.log('delete');
    };
    
    this.getContentSize = function (el) {
        return $(el).find(".mlab_cp_youtube_video").duration;
    };

    
};