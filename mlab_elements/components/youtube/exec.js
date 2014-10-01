document.mlab_code_youtube = new function() {
	
    this.config = {};
    
    this.onCreate = function (el, config, api_func) {
        this.onLoad (el, config, api_func);
        $(el).html('<img src="data:image/png;base64,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" >').resizable({"containment": designer});
        this.custom_select_video(el);
    };
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, api_func) {
        this.config = config;
        this.config["api_function"] = api_func;
    };

	this.onSave = function (el) {
    };
            
    this.custom_select_video = function (el) {
        
        content = $('<form />');
        content.append( '<div class="arama">' + 
                        '    <form action="" onsubmit="return false">' + 
                        '        <h2>Youtube API jQuery AutoComplete</h2>' + 
                        '        <div class="ui-widget">' + 
                        '            <label for="youtube">Youtube Arama: </label>' + 
                        '            <input id="youtube" />' + 
                        '            <button id="submit">ARA</button>' + 
                        '        </div>' + 
                        '    </form>' + 
                        '</div>' +
                        '<div id="sonuc"></div>');
                
        content.append( $('<p />') );
        content.append( $('<div />', { text: 'Cancel', id: "mlab_property_button_cancel", class: "pure-button  pure-button-xsmall" }) );
        content.append( $('<div />', { text: 'OK', id: "mlab_property_button_ok", class: "pure-button  pure-button-xsmall right" }) );

        var component = el;
        var component_id = this.config.component_name;
        var component_config = this.config;
        var self = this;
        
        $(el).qtip({
            style: {
                width: 400, // Overrides width set by CSS (but no max-width!)
                height: 600 // Overrides height set by CSS (but no max-height!)
            },
            content: {text: content, title: "Velg video" },
            position: { my: 'leftMiddle', at: 'rightMiddle' },
            show: { ready: true, modal: { on: true, blur: false } },
            hide: false,
            style: { classes: 'qtip-tipped' },
            events: { render: function(event, api) {
                            this.component = component;
                            this.component_id = component_id;
                            this.config = component_config;
                            var self = this.component;
//process URL selected
                            $("#mlab_property_uploadfiles_start").click(function() {
                                alert("hi 1");
                                api.hide(e);
                            });

                            $('#mlab_property_button_cancel', api.elements.content).click(function(e) { 
                                alert("hi 2");
                                api.hide(e); 
                            });
                            
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
                        hide: function(event, api) { api.destroy(); }
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