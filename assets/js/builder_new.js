// alert('test')
const $ = require('./jquery-2.1.4.js');

$(document).ready(function() {
    $('.header ul.tabs > li > a').click(function (e) {
        e.preventDefault();

        $(this).parent().siblings('li').removeClass('active');
        $(this).parent().addClass('active');
    });

    $('.list-pages .delete').click(function (e) {
        alert('Delete')
    });

    $('.list-pages .page').click(function (e) {
        alert('Open')
    });

});
