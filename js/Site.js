var TOPBG_INTERVAL;


function evalJavaScript(code)
{
    var dj_global = this; // global scope reference
    if (window.execScript) {
        window.execScript(code); // eval in global scope for IE
        return null; // execScript doesn’t return anything
    }
    return dj_global.eval ? dj_global.eval(code) : eval(code);
}

function strpos(haystack, needle, offset) 
{
    var i = (haystack + '').indexOf(needle, (offset || 0));
    return i === -1 ? false : i;
}

function explode(delimiter, string, limit) 
{
    if ( arguments.length < 2 || typeof delimiter == 'undefined' || typeof string == 'undefined' ) return null;
    if ( delimiter === '' || delimiter === false || delimiter === null) return false;
    if ( typeof delimiter == 'function' || typeof delimiter == 'object' || typeof string == 'function' || typeof string == 'object'){
        return {
            0: ''
        };
    }
    if ( delimiter === true ) delimiter = '1';
  
    // Here we go...
    delimiter += '';
    string += '';
  
    var s = string.split( delimiter );
  

    if ( typeof limit === 'undefined' ) return s;
  
    // Support for limit
    if ( limit === 0 ) limit = 1;
  
    // Positive limit
    if ( limit > 0 ){
        if ( limit >= s.length ) return s;
        return s.slice( 0, limit - 1 ).concat( [ s.slice( limit - 1 ).join( delimiter ) ] );
    }

    // Negative limit
    if ( -limit >= s.length ) return [];
  
    s.splice( s.length + limit );
    return s;
}

function number_format(number, decimals, dec_point, thousands_sep)
{
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}

function parseNumber(str)
{
    str = str + '';
    var s = str.toString();
    
    s = s.replace('pln', '');
    s = s.replace('zł', '');
    s = s.replace(',', '.');
    s = jQuery.trim(s);
    s = s.split(' ').join('');
    
    return parseFloat(s);
}

function formatNumber(i)
{
    return number_format(i, 0, ',', ' ');
}

function parsePrice(str)
{
    var s = str.toString();
    
    s = s.replace('pln', '');
    s = s.replace('zł', '');
    s = s.replace(',', '.');
    s = jQuery.trim(s);
    s = s.split(' ').join('');
    
    return parseFloat(s);
}

function formatPrice(price)
{
    return number_format(price, 2, ',', ' ');
}

function cookieCreate(name,value,min)
{
    var expires;
    
    if (min) {
        var date = new Date();
        date.setTime(date.getTime()+(min*60*1000));
        expires = "; expires="+date.toGMTString();
    } else 
        expires = "";
    
    document.cookie = name+"="+value+expires+"; path=/";
}

function cookieRead(name)
{
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') 
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ)==0) 
            return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function cookieErase(name) 
{
    cookieCreate(name, "", -1);
}

function highlight(word, idOrClass) 
{
    var rgxp = new RegExp(word, 'g');
    var repl = '<span class="highlight">' + word + '</span>';
    
    var html = $(idOrClass).html();
    html = html.toString().replace(rgxp, repl);
    $(idOrClass).html(html);
}

function highlightInObj(word, obj) 
{
    var rgxp = new RegExp(word, 'g');
    var repl = '<span class="highlight">' + word + '</span>';
    
    var html = obj.html();
    html = html.toString().replace(rgxp, repl);
    obj.html(html);
}

function animateToIn(tag, ms)
{
    $('html, body').animate({scrollTop: $(tag).offset().top}, ms);
}

function isValidEmailAddress(emailAddress)
{
    var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(emailAddress);
}

function browserBack()
{
    history.go(-1);
}

function setupMainMenuSubmenu(fadeEffect)
{
    var speed = 150;

    $('#topbar ul li ul li').each(function () {
        $(this).addClass('sub-li-flag');
    });

    $('#topbar ul li').hover(
        function () {
            $(this).find('> a').addClass('hv');
            $(this).find('> ul').addClass('show');

            /* IE7 width fix */
            var w = $(this).find('> ul').width();
            $(this).find('> ul > li').each(function () {
                $(this).width(w);
            })

            if ($(this).hasClass('sub-li-flag')) {
                $(this).find('> ul').css('left', $(this).width()+'px');
                $(this).find('> ul').css('top', '0px');
            }
        },
        function () {
            $(this).find('> a').removeClass('hv');
            if (fadeEffect)
                $(this).find('> ul').fadeOut(speed, function () { $(this).removeClass('show') }); else
                $(this).find('> ul').removeClass('show');
        }
    );
}



$(document).ready(function() {
    setupMainMenuSubmenu(true);
});
