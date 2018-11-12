//use this to support inheritance in audio component
    this.media_type = "audio";

    this.cbUploadCompleted = function(el, media_url) {
        var media = $(el).find('audio');
        media.attr({'src': media_url});
    };