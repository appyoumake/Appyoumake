// alert('test')
const $ = require('./jquery-2.1.4.js');

$(document).ready(function() {
    $('.header ul.tabs > li > a').click(function (e) {
        e.preventDefault();

        $(this).parent().siblings('li').removeClass('active');
        $(this).parent().addClass('active');
    });

    $('.list-pages .delete, .list-pages .delete-alt').click(function (e) {
        alert('Delete')
    });

    $('.list-pages .page').click(function (e) {
        alert('Open')
    });

    /* Fix toolbox menu arrow positon and visibility*/
    $('.toolbox .toolbox-menu [data-open-menu]').focus(function (e) {
        var $toolboxMenu = $(this).closest('.toolbox-menu');
        var $menu = $toolboxMenu.find('.menu');
        var menuOffsetLeft = $menu.offset().left;

        if(menuOffsetLeft < 0) {
            $menu.css('left', 0);
        } else if(($(window).width() - (menuOffsetLeft + $menu.outerWidth())) < 0) {
            $menu.css('right', 0);
        }

        $toolboxMenu.addClass('open');
    }).blur(function() {
        $(this).closest('.toolbox-menu').removeClass('open');
    })

    $('.toolbox-btn').click(function (e) {
        // alert('Open')

    });
});
