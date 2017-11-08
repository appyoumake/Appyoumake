//TODO: Change to use input
    apiKey = '';
    

    this.getHTMLElement = function(el)  {
        return $(el).find("." + this.config.custom.class_identifier);
    };

    this.onCreate = function (el) {
        this.onLoad(el);
        this.getHTMLElement(el).html('<img src="' + this.config.placeholder + '" >');
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) { 
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
        var w = $(el).width();
        var h = $(el).height();
        var aspectratio = $(el).attr("data-mlab-aspectratio").split(":");
        $(el).find("iframe").attr({"data-aspectratio" : (aspectratio[1] / aspectratio[0]), "width": w + "px", "height": h + "px"});      
    }
    
    this.getContentSize = function (el) {
        return this.getHTMLElement(el).duration;
    };
    
    this.getApiKey = function (el) {
        var temp = this.api.getVariable(el, "credentials");
        if (typeof temp != "undefined" && typeof temp["apikey"] != "undefined") {
            return temp["apikey"];
        } else {
            alert("No YouTube API key specified, will not be able to request videos. Contact the Mlab administrator to obtain a YouTube API key");
        }
    }
    
    
/* 
* The following section is Copyright (c) 2014 by Tayfun Erbilen (http://codepen.io/tayfunerbilen/pen/rIHvD)
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
    this.initYoutube = function (el) {
/* Set up autoComplete */
        var local_el = el;
        var apiKey = mlab.dt.components.youtube.code.getApiKey(el);   
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

//main search function
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
                            results.append('<a href="javascript:void(0)" onclick="$.youtubeSelect(\'' + data.id.videoId + '\')"><div class="youtube">\
                                <img src="' + data.snippet.thumbnails.default.url + '" alt="" />\
                                <h3>' + data.snippet.title + '</h3>\
                                <p>' + data.snippet.description + '</p>\
                            </div>\
                            <div class="mlab_dt_text_list" id="' + data.id.videoId + '"></div></a>');
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
//if they have already added a vide here we just replace the ID
            var iframe = container.find("iframe");
            if (iframe.length > 0) {
                iframe.attr("src", '//www.youtube.com/embed/' + youtube_id);
                mlab.dt.api.closeAllPropertyDialogs();
            } else {
                container.html('<iframe class="mc_figure mc_interactive mc_timebased" src="//www.youtube.com/embed/' + youtube_id + '" frameborder="0" allowfullscreen ></iframe>');
                mlab.dt.api.display.setAspectRatio(local_el, "16:9");
                mlab.dt.api.display.setSize(local_el, "large"); 
            }
        }
    };
    
    this.store_credentials = function (credentials, params) {
        this.api.setVariable( params.component, "credentials", credentials );
        this.custom_select_video(params.component);
    };
            
    this.custom_select_video = function (el, event) {
        
        var component = el;
        var component_id = this.config.component_name;
        var component_config = this.config;
        
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
       
        this.api.displayPropertyDialog(el, "Select YouTube video", content, null, this.initYoutube, null, null, false, event);
        
        if (this.getApiKey(el) == '') {
            var that = this;
            this.api.getCredentials(el, this.config.name, this.config.credentials, function (credentials, params) { that.store_credentials(credentials, params); }, true, { component: el });
            return;
        }
         
    };
