/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



/**
     * Object used for changing settings at runtime
     */
    
    var mlab_set_display_settings = {

        /**
         * This function toggles the text size of an html element between 100% and 130%
         * @param {string} elementId The id of the HTML element where the text size will be toggled
         */
        pageTextSizeToggle: function (elementId) {

            if ($("#" + elementId).hasClass('mlab_large_text')) {
                $("#" + elementId).removeClass('mlab_large_text');
                $("#" + elementId).css("font-size", "100%");
            } else {
                $("#" + elementId).addClass('mlab_large_text'); 
                $("#" + elementId).css("font-size", "130%");
            }
        },
        
        /**
        * This function toggles the text and background color of an html element
         * @param {string} elementId The id of the HTML element where the color of the background and the text will be toggled
         * @param {string} defaultBackgroundColor The default background color of the HTML element
         * @param {string} defaultTextColor The default text color of the HTML element
         * @param {string} toggleBackgroundColor The background color used to toggle with
         * @param {string} toggleTextColor The text color used to toggle with
        */
        pageColorToggle: function (elementId, defaultBackgroundColor, defaultTextColor, toggleBackgroundColor, toggleTextColor) {

            if ($("#" + elementId).hasClass('mlab_color_toggle')) {
                $("#" + elementId).removeClass('mlab_color_toggle');
                $("#" + elementId).css("background-color", defaultBackgroundColor);
                $("#" + elementId).css("color", defaultTextColor);
            } else {
                $("#" + elementId).addClass('mlab_color_toggle'); 
                $("#" + elementId).css("background-color", toggleBackgroundColor);
                $("#" + elementId).css("color", toggleTextColor);
            }
        },
        
    }