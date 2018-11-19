//use this to support inheritance in audio component
    this.media_type = "audio";

    this.cbUploadCompleted = function(el, media_url) {
        var media = $(el).find(mlab.dt.components.audio.code.media_type);
        media.attr({'src': media_url});
    };
    
    
    this.preview = function (el) {
        var media = $(el).find(mlab.dt.components.audio.code.media_type);
        return { text: media.attr("src") };
    };    