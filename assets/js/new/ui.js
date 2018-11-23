//set the left position of the toolboxes, must be done when layout is ready
$(window).load(function() {
    var main_navbar = $("#mlab_navbar");
    var left = main_navbar[0].getBoundingClientRect().left
    main_navbar.find(".toolbox").each(function(index) { 
        $(this).css("left", (left - $(this).parent()[0].getBoundingClientRect().left) + "px") 
    } ) ;
});

// Init UI elements
$(document).ready(function() {
    
    //alert("Hi Constantin, why are you using z-index everywhere? Is it really required?");
//set active tab on click
    $('.header ul.tabs > li > a').click(function (e) {
        e.preventDefault();
        $(this).parent().siblings('li').removeClass('active');
        $(this).parent().addClass('active');
    });

//delete pages when click delete icon
    $('.list-pages .delete, .list-pages .delete-alt').click(function (e) {
        alert('Delete')
    });

//
    $('.pages-wrapper .close').click(function (e) {
        $(this).closest('.deleted-open').removeClass('deleted-open');
        $('[data-open-deleted]').removeClass('selected');
    });

    $('.toolbox-btn').click(function (e) {
        // alert('Open')
    });

    mlab.dt.ui.initialiseDropdownButtons(".toolbox-menu");

//prepare tooltip display for all buttons
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

    $('[data-action]').click(function () {
        mlab.dt.utils.runActions($(this).data("action"));
    });
        

    $('[data-open-page]').click(ui.openPage);
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



var ui = {

    props: new Proxy({}, {
        set: function(obj, prop, value) {

            if(typeof ui.watch[prop] !== 'undefined') {
                ui.watch[prop](value, obj[prop]);
            }

            obj[prop] = value;

            return true;
        }
    }),

    updateAppTableOfContents: function(content) {
        var $tableOfContents = this.render.tableOfContents(content);
        var $active = $('.nav-pages .active');
        var $list = $active.find('.list-pages');

        $list.html($tableOfContents.children());
        $active.scrollTop($active.prop('scrollHeight'));
    },

    openPage: function(e) {
        alert(`opening page ${$(this).data('open-page')}`)
    },

    watch: {
        tableOfContents: function (newVar, oldVar) {
            ui.updateAppTableOfContents(newVar);
        }
    },

    render: {
        tableOfContents: function (toc) {
            $list = $('<list>');

            for (var i = 0; i < toc.length; i++) {
                $list.append(ui.render[toc[i].type](toc[i]))
            }

            return $list;
        },

        page: function (pageTOC) {
            $page = $('<div>').attr('data-open-page', '')
                .html(`<div class="preview"><img src="https://via.placeholder.com/100x150/FFFFFF/000000"></div><p>${pageTOC.title}</p>`)
                .data('open-page', pageTOC.pageNumber)
                .click(ui.openPage);

            return $('<li class="display-alt"></li>').html($page);
        },

        section: function (sectionTOC) {
            $section = $('<div>').attr('data-open-page', '')
                .html(`<div class="preview"><img src="https://via.placeholder.com/100x150/FFFFFF/000000"></div><p>${pageTOC.title}</p>`);

            return $('<li class="display-alt"></li>').html($section);
        }
    }
};
    