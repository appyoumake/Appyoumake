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
    $('.nav-pages.open > .close').click(function (e) {
        $(this).closest('.nav-pages.open').removeClass('open');
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

    $('[data-tooltip]').mouseenter(function () {
        var $target = $(this);
        // dont display tooltip if menu open
        if($target.is('[data-open-menu]:focus')) {
            return;
        }

        var targetOffsets = $target.offset(),
            $arrow = $('<span>'),
            $tooltip = $('<span class="tooltip" style="top:0; left:0"></span>')
                .text($target.data('tooltip'))
                .append($arrow);
        
        $target.after($tooltip);

        var targetScrrenCenter = targetOffsets.left + $target.innerWidth()/2,
            tooltipWidth = $tooltip.outerWidth(),
            tooltipLeft = Math.min(
                $(window).width() - tooltipWidth,
                Math.max(0, targetScrrenCenter - (tooltipWidth/2))
            ),
            arrowLeft = targetScrrenCenter - tooltipLeft - 3;

        $arrow.css('left', arrowLeft)
        $tooltip.css('top', targetOffsets.top + $target.outerHeight() + $arrow.outerHeight())
            .css('left', tooltipLeft);
    }).on('mouseleave focus', function () {
        $(this).siblings('.tooltip').remove();
    });
});
