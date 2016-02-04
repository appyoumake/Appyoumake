//TODO: Change to use input
    apiKey = '';
    

    this.getHTMLElement = function(el)  {
        return $(el).find("." + this.config.custom.class_identifier);
    };

    this.onCreate = function (el) {
        this.onLoad (el);
        this.getHTMLElement(el).html('<img src="' + this.config.placeholder + '" >');
        if (apiKey != "") {
            this.api.setVariable( el, "credentials", {"apikey": apiKey} );
        }
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        var temp = this.api.getVariable(el, "credentials");
        if (typeof temp != "undefined" && typeof temp["apikey"] != "undefined") {
            apiKey = temp["apikey"];
        } else {
            alert("No YouTube API key specified, will not be able to request videos. Contact the Mlab administrator to obtain a YouTube API key");
        }
        this.getHTMLElement(el).css("pointer-events", "none");
    };

	this.onSave = function (el) {
        var temp_html = el.outerHTML;
//hack to fix bug whereby http is missing from URL in iframe tag
        temp_html = temp_html.replace('src="//', 'src="' + location.protocol + '//');
        temp_html = temp_html.replace('pointer-events: none', '');
        return temp_html;
    };

	this.onDelete = function () {
		console.log('delete');
    };
    
    this.onResize = function (el) {
        var w = $(el).innerWidth();
        var h = $(el).innerHeight();
        var aspectratio = $(el).attr("data-mlab-aspectratio").split(":");
        $(el).find("iframe").attr({"data-aspectratio" : (aspectratio[1] / aspectratio[0]), "width": w + "px", "height": h + "px"});
    }
    
    this.getContentSize = function (el) {
        return this.getHTMLElement(el).duration;
    };
    
    
/* 
* The following section is Copyright (c) 2014 by Tayfun Erbilen (http://codepen.io/tayfunerbilen/pen/rIHvD)
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
    this.initYoutube = function (el) {
/* Set up autoComplete */
        var local_el = el;

        $("#mlab_cp_youtube_search").autocomplete({
            source: function(request, response){
                var query = request.term;
                $.ajax({
                    url: location.protocol + "//suggestqueries.google.com/complete/search?hl=en&ds=yt&client=youtube&hjson=t&cp=1&q=" + query + "&key=" + apiKey + "&format=5&alt=json&callback=?",  
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
            
/* select video */
            select: function( event, ui ) {
                $.youtubeAPI(ui.item.label);
            }
        });

/* respond to search being pressed */
        $('button#mlab_cp_youtube_submit').click(function(){
            $.youtubeAPI( $('input#mlab_cp_youtube_search').val() );
        });

/* Youtube Arama Fonksiyonu */
        $.youtubeAPI = function(search_term){
            var results = $('#mlab_cp_youtube_results');
            results.html('Searching...');
            
            $.ajax({
                type: 'GET',
                url: 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=' + search_term + '&key=' + apiKey + '&max-results=5',
                dataType: 'jsonp',
                success: function( veri ) {
                    if( veri.items ) {
                        results.empty();
                        $.each( veri.items, function(i, data) {
                            results.append('<div class="youtube">\
                                <img src="' + data.snippet.thumbnails.default.url + '" alt="" />\
                                <h3><a href="javascript:void(0)" onclick="$.youtubeSelect(\'' + data.id.videoId + '\')">' + data.snippet.title + '</a></h3>\
                                <p>' + data.snippet.description + '</p>\
                            </div>\
                            <div class="mlab_dt_text_list" id="' + data.id.videoId + '"></div>');
                        });
                    } else {
                        results.html('<div class="mlab_dt_error">No vidoes found for <strong>"' + search_term + '"</strong></div>');
                    }
                }
            });
        }

// Add youtube code to app, and resize it to fill whole width
        $.youtubeSelect = function(youtube_id){
            var container = mlab.dt.components.youtube.code.getHTMLElement(local_el);
            container.html('<iframe class="mc_figure mc_interactive mc_timebased" width="560" height="315" src="//www.youtube.com/embed/' + youtube_id + '" frameborder="0" allowfullscreen ></iframe>');
            var video = $(container).find("iframe");
            video.attr('data-aspectRatio', video.height() / video.width()).removeAttr('height').removeAttr('width');
            mlab.dt.api.closeAllPropertyDialogs();
                 
        }    


    };
    
    this.store_credentials = function (credentials, params) {
        this.api.setVariable( params.component, "credentials", credentials );
        apiKey = credentials["apikey"];
        this.custom_select_video(params.component);
    };
            
    this.custom_select_video = function (el, event) {
        if (apiKey == '') {
            alert("No API key specified, please enter one first. If you do not have one, or does not know what this is, please contact your Mlab administrator");
            var that = this;
            this.api.getCredentials(this.config.credentials, function (credentials, params) { that.store_credentials(credentials, params); }, { component: el });
            return;
        }
        content = $('<form />');
        content.append( '<div class="arama">' + 
                        '    <form action="" onsubmit="return false">' + 
                        '        <p class="mlab_dt_text_info">Søk etter en youtube-video ved å skrive et søkeord i boksen og enten velg et forslag fra listen eller klikk på søk-knappen</p>' + 
                        '        <div class="ui-widget">' +  
                        '            <input id="mlab_cp_youtube_search" class="mlab_dt_input"/>' + 
                        '            <button id="mlab_cp_youtube_submit" class="mlab_dt_button">Søk</button>' + 
                        '        </div>' + 
                        '    </form>' + 
                        '</div>' +
                        '<div id="mlab_cp_youtube_results"></div>');
                
        content.append( $('<p />', {class: "mlab_dt_small_new_line" }));
        content.append( $('<div />', { text: 'Avbryt', id: "mlab_property_button_cancel", class: "pure-button  pure-button-xsmall mlab_dt_button_cancel mlab_dt_left" }) );
        content.append( $('<div />', { text: 'OK', id: "mlab_property_button_ok", class: "pure-button  pure-button-xsmall mlab_dt_button_ok mlab_dt_left" }) );

        var component = el;
        var component_id = this.config.component_name;
        var component_config = this.config;
        
        this.api.displayPropertyDialog(el, "Select YouTube video", content, null, this.initYoutube, null, null, false, event);
       
    };
