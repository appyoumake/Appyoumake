// Init UI elements
$(document).ready(function() {
    $('.header ul.tabs > li > a').click(function (e) {
        e.preventDefault();

        $(this).parent().siblings('li').removeClass('active');
        $(this).parent().addClass('active');
    });

    $('.list-pages .delete, .list-pages .delete-alt').click(function (e) {
        alert('Delete')
    });

    $('[data-open-page]').click(function (e) {
        alert('Open')
    });


    
    $('[data-open-deleted]').click(function (e) {
        $pagesNav = $('.nav-pages .pages-wrapper');
        $pagesNav.toggleClass('deleted-open');
        $pagesNav.is('.deleted-open') ? $(this).addClass('selected') : $(this).removeClass('selected');
    });

    $('.pages-wrapper .close').click(function (e) {
        $(this).closest('.deleted-open').removeClass('deleted-open');
        $('[data-open-deleted]').removeClass('selected');
    });



    $('.toolbox-btn').click(function (e) {
        // alert('Open')
    });

    mlab.dt.ui.initialiseDropdownButtons(".toolbox-menu");

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

    $('[data-open-modal]').click(function () {
        $modal = $('#' + $(this).data('open-modal'));
        $modal.show();
        $overlay = $('<div class="modal-overlay"></div>');

        var close = function() {
            $modal.hide();
            $overlay.remove();
        };

        $overlay.click(close);
        $modal.find('[data-close-modal]').click(close);

        $('body').append($overlay);
    });


    $('input[type=radio][name=pages-list-display]').change(function() {
        $('.nav-pages .active .list-pages').attr('class', 'list-pages ' + this.value);
    });


    $('[data-new-page]').click(function () {
        console.log('new page');
        mlab.dt.management.page_new();
    });


    $('[data-new-section]').click(function () {
        alert('new section');
    });
    
//ARILD THURSDAY


//END ARILD THURSDAY
    
});

//ARILD THURSDAY

function Mlab_dt_ui () {
    this.parent = null;
    
    this.toolbar_template = `<div class='toolbox-menu'>
            <button data-open-menu data-tooltip='' class='toolbox-btn btn-lg'>
                <i class='far fa-file'></i> %%CATEGORY%%
            </button>
            <div class='menu'>
                %%COMPONENTS%%
            </div>
        </div>`;
};

Mlab_dt_ui.prototype = {
    
    initialiseDropdownButtons : function(selector) {
        $(selector + ' [data-open-menu]').click(function (e) {
            var $menuOpener = $(this);
            var $toolboxMenu = $menuOpener.closest('.toolbox-menu');
            var $menu = $toolboxMenu.find('.menu');
            var menuOffsetLeft = $menu.offset().left;

            if(menuOffsetLeft < 0) {
                $menu.css('left', menuOffsetLeft*-1 + 35);
            } else if(($('body').width() - (menuOffsetLeft + $menu.outerWidth())) < 0) {
                $menu.css('left', '-200%');
            }

            $toolboxMenu.addClass('open');

            $(window).bind("click.closeMenu", function(e) {
                if(e.target !== $menuOpener[0] && $toolboxMenu.find(e.target).length === 0) {
                    $(this).unbind("click.closeMenu");
                    $('.toolbox-menu').removeClass('open');
                }
            });
        })
    },
    
    displayComponents : function (components_html) {
        var html;
        //Puts all components under the same category and adds an accordion to the categroy collapsed or expanded depending on the coockie state 
        for  (var category in components_html) {
            html = this.toolbar_template.replace("%%CATEGORY%%", components_html[category]["name"]);
            html = html.replace("%%COMPONENTS%%", components_html[category]["components"].join(""));
            $("#mlab_toolbar_components").append(html);
        } 

        this.initialiseDropdownButtons("#mlab_toolbar_components");

    
    },
    
}

//EMD ARILD THURSDAY
