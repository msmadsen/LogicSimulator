/**
 *  ------------------------------
 *   OkiWidgets v1.9 (09.01.2012)
 *  ------------------------------
 *
 *  Dostepne klasy widgetow:
 *   - OkiCheckbox       dla znacznika <input>
 *   - OkiInput          dla znacznika <input>
 *   - OkiSelect         dla znacznika <select>
 *   - OkiAutoComplete   dla znacznika <input>
 *   - OkiButton         dla znacznika <a>
 *
 *  OkiRadiobox:
 *    Znajduje znacznik <a> wystepujacy zaraz po <input type="radio" class="OkiRadiobox" />
 *    i ustawia w nim klase 'active' gdy prawdziwy radiobox jest zaznaczony.
 *    Klikniecie w <a> powoduje zmiane stanu prawdziwego radioboxa
 *    opcjonalnie
 *     - atrybut 'OkiRadiobox-onChange' umozliwia podanie funkcji po zmianie stanu radioboxa
 *
 *  OkiCheckbox:
 *    Znajduje znacznik <a> wystepujacy zaraz po <input type="checkbox" class="OkiCheckbox" />
 *    i ustawia w nim klase 'active' gdy prawdziwy checkbox jest zaznaczony.
 *    Klikniecie w <a> powoduje zmiane stanu prawdziwego checkboxa
 *    opcjonalnie
 *     - atrybut 'OkiCheckbox-onChange' umozliwia podanie funkcji po zmianie stanu checkboxa
 *
 *  OkiInput:
 *    wymagane
 *     - unikalny id
 *    opcjonalne
 *     - klasa OkiHidetxt - w atrybucie OkiHidetxt-defVal podawany jest tekst ktory znika po
 *       kliknieciu na niego
 *
 *  OkiSelect:
 *    wymagane
 *     - unikalny id
 *    opcjonalnie
 *     - w atrybucie OkiSelect-onChange="..." mozna podac kod js ktory wykona sie po zmianie
 *       wartosci w selecie zrobionym na divach
 *     - funkcja OkiSelectUpdateList(id) musi zostac wywolana jezeli po zaladowaniu dokumentu
 *       zmieni sie zawartosc prawdziwego selecta
 *       paramert to id prawdziwego selecta np OkiSelectUpdateList('moj-select')
 *     - funkcja OkiSelectApplyIn(tagIdOrClass) moze zostac wywolana jesli juz po zaladowaniu
 *       dokumenu w drzewie DOM pojawia sie nowe listy <select>, ktore trzeba ostylowac,
 *       paramentr tagIdOrClass to klasa lub ID rodzina z nowymi selectami
 *
 *  OkiAutoComplete
 *    tekst wpisany w widgeta przesylany jest do skryptu obslugujacego ajaxa
 *    poprzez parametr 'search' - nazwa zmiennej na sztywno
 *    wymagane
 *     - unikalny id
 *     - atrybut OkiAutoComplete-ajaxLoader="" okreslajacy id np ikonki ajaxowej (automatyczne ukrywanie i chowanie)
 *     - atrybut OkiAutoComplete-ajaxUrl=""  okreslajacy skrypt obslugujacy AJAXa
 *    opcjonalnie
 *     - atrybut OkiAutoComplete-ajaxParam="city=0" dodatkowe parametry przesylane do skryptu
 *     - klasa OkiHidetxt - w atrybucie OkiHidetxt-defVal podawany jest tekst ktory znika po
 *       kliknieciu na niego
 *
 *  OkiButton
 *    wymagane
 *     - unikalny id
 *
 *  <textarea> do rozwiniecia w przyszlosci na razie tylko ukrywanie tekstow domyslnych i wlaczanie errorow
 *    opcjonalnie
 *     - klasa OkiHidetxtTA - w atrybucie OkiHidetxtTA-defVal podawany jest tekst ktory znika po
 *       kliknieciu na niego
 *
 *
 *  Dostepne funkcje:
 *    OkiClearDefVal()           - czysci inputy z domyslych wartosci ustawionych w OkiHidetxt-defVal
 *                                 trzeba odpalic przez wyslaniem formularza by nie poszly teksty podpowiedzi
 *                                 jako tekst wpisany przez uzytkownika
 *    OkiClearDefValIn('id')     - to samo co wyzej tylko czyszczenie odbywa sie dla kontrolek-dzieci elementu z podanego id
 *    OkiError(id, error_class)  - funkcja dodaje klase bledu (jest tez klasa CSS wiec kontrolka zmienia wyglad)
 *                                 do kontrolki podanej w id, po kliknieciu na kontrolke klasa jest automatycznie sciagana
 *                                 pokazywany jest tez div o id: <id>_error gdzie <id> to parametr wywolania funckji
 *
 *    OkiCheckboxUpdateIn(el_id) - aktualizuje udawane checkboxy z tych prawdziwych w konkretnym divie
 *    OkiCheckboxUpdate()        - aktualizuje udawane checkboxy z tych prawdziwych a calym dokumencie
 *
 *    OkiErrorTA(id, error_class)- to samo co wyzej dla textarea
 *
 *
 *
 *  ---------------------------------------------
 *   (c) Robert Rypula - robert.rypula@gmail.com
 *       http://okinet.pl
 *  ---------------------------------------------
 */

// config
var OKIWIDGET_LIST_MAX_HEIGHT = 300;    // max wysokosc listy, przekroczenie wlacza scroll
var OKIWIDGET_FADE_OUT_MS = 250;        // animacja znikania listy
var OKIWIDGET_FADE_IN_MS = 100;         // animacja pojawiania sie listy
var OKIWIDGET_AUTOCOMPLETE_MS = 500;    // po tym czasie wysylanie jest zapytanie ajax dla autocomplete









// ponizej nie ruszac :)

//var code_evaled;
//
//function eval_global(codetoeval)
//{
//  // kombinacje z window.execScript dla kochanego IE
//  if (window.execScript)
//    window.execScript('code_evaled = ' + '(' + codetoeval + ')',''); else
//    code_evaled = eval(codetoeval);
//
//  return code_evaled;
//}

function eval_global(code)
{
  var dj_global = this; // global scope reference
  if (window.execScript) {
    window.execScript(code); // eval in global scope for IE
    return null; // execScript doesn’t return anything
  }
  return dj_global.eval ? dj_global.eval(code) : eval(code);
}

/* ---------------------------------------------------------------------------- */
/* ---------- Wylaczenie submita po enterze dla Chroma i Safari --------------- */
/* ---------------------------------------------------------------------------- */

$(document).ready(function () {
  $('form').each(function () {
    if ($(this).hasClass('OkiForm')) {
      $(this).submit(function() {return false;});
    }
  });
//  $('form input[type=submit]').click(function () {
//    $(this).closest("form").submit(function () { return true; });
//    alert('fs');
//    $(this).closest("form").submit();
//  });
});

/* ---------------------------------------------------------------------------- */
/* ------------------------------- Checkbox ----------------------------------- */
/* ---------------------------------------------------------------------------- */

function OkiCheckboxInit()
{
    var onChangeCode;
    
    $(".OkiCheckbox").each(function () {
        var realCheckBox = $(this);
        var fakeCheckBox = $(this).next("a");
        var fakeCheckBoxTxt = $(this).next("a").next("span");

        if (realCheckBox.is(':checked'))
            fakeCheckBox.addClass('active'); else
            fakeCheckBox.removeClass('active');

        fakeCheckBox.click(function () {
            if (realCheckBox.is(':checked')) {
                realCheckBox.attr("checked", false);
                fakeCheckBox.removeClass('active');
            } else {
                realCheckBox.attr("checked", true);
                fakeCheckBox.addClass('active');
            }
            onChangeCode = realCheckBox.attr('OkiCheckbox-onChange');
            if (onChangeCode!='')
                eval_global(onChangeCode);
        });

        fakeCheckBoxTxt.click(function () {
            if (realCheckBox.is(':checked')) {
                realCheckBox.attr("checked", false);
                fakeCheckBox.removeClass('active');
            } else {
                realCheckBox.attr("checked", true);
                fakeCheckBox.addClass('active');
            }
            onChangeCode = realCheckBox.attr('OkiCheckbox-onChange');
            if (onChangeCode!='')
                eval_global(onChangeCode);
        });
    });
}

$(document).ready(function () {
   OkiCheckboxInit();
});

function OkiCheckboxUpdate()
{
    OkiCheckboxUpdateIn('');
}

function OkiCheckboxUpdateIn(el_id)
{
    if (el_id!='') {
        el_id = '#'+el_id+' ';
    }

    $(el_id+".OkiCheckbox").each(function () {
        var realCheckBox = $(this);
        var fakeCheckBox = $(this).next("a");

        if (realCheckBox.is(':checked'))
            fakeCheckBox.addClass('active'); else
            fakeCheckBox.removeClass('active');
    });
}

/* ---------------------------------------------------------------------------- */
/* ------------------------------- Radiobox ----------------------------------- */
/* ---------------------------------------------------------------------------- */

function buildOkiRadioboxHtmlIn(contIn, okiRadioboxClass, okiRadioboxTxtClass, clearHeight)
{
    var label;
    
    $(contIn+' input:radio').each(function () {
        $(this).addClass('OkiRadiobox');
        label = $(this).next('label');
        label.after('<a class="'+okiRadioboxClass+'" href="javascript:void(0)">&nbsp;</a>'+"\n"+
                    '<span class="'+okiRadioboxTxtClass+'">'+label.html()+'</span>'+"\n"+
                    '<div class="clear" style="height: '+clearHeight+'px !important;">&nbsp;</div>'
                   );
        label.remove();
    });
}

function OkiRadioboxInit()
{
    var onChangeCode;
    
    $(".OkiRadiobox").each(function () {
        var realRadioBox = $(this);
        var fakeRadioBox = $(this).next("a");
        var fakeRadioBoxTxt = $(this).next("a").next('span');

        if (realRadioBox.is(':checked'))
            fakeRadioBox.addClass('active'); else
            fakeRadioBox.removeClass('active');

        fakeRadioBox.click(function () {
            if (!realRadioBox.is(':checked')) {
                realRadioBox.attr("checked", true);
            }
            OkiRadioboxUpdate();
            onChangeCode = realRadioBox.attr('OkiRadiobox-onChange');
            if (onChangeCode!='')
                eval_global(onChangeCode);
        });

        fakeRadioBoxTxt.click(function () {
            if (!realRadioBox.is(':checked')) {
                realRadioBox.attr("checked", true);
            }
            OkiRadioboxUpdate();
            onChangeCode = realRadioBox.attr('OkiRadiobox-onChange');
            if (onChangeCode!='')
                eval_global(onChangeCode);
        });
    });
}

$(document).ready(function () {
    OkiRadioboxInit();
});

function OkiRadioboxUpdate()
{
    OkiRadioboxUpdateIn('');
}

function OkiRadioboxUpdateIn(el_id)
{
    if (el_id!='') {
        el_id = '#'+el_id+' ';
    }

    $(el_id+".OkiRadiobox").each(function () {
        var realRadioBox = $(this);
        var fakeRadioBox = $(this).next("a");

        if (realRadioBox.is(':checked'))
            fakeRadioBox.addClass('active'); else
            fakeRadioBox.removeClass('active');
    });
}

/* ---------------------------------------------------------------------------- */
/* --------------------------------- Input ------------------------------------ */
/* ---------------------------------------------------------------------------- */

function OkiInputBuild()
{
  $('.OkiInput').each(function (i) {

    var idDiv = $(this).attr('id')+'_OkiInputDiv';
    var cl = ' '+$(this).attr('class')+' ';
    cl_div = cl.replace('OkiInput ', ' ').replace('OkiHidetxt ', ' ');
    cl_inp = $(this).hasClass('OkiHidetxt') ? 'OkiHidetxt' : '';

    var st = $(this).attr('style');

    var div = '<div id="'+idDiv+'" class="'+cl_div+'"  style="'+st+'">'+
              '   <span><span><b>&nbsp;</b></span></span>'+
              '</div>';

    $(this).attr('autocomplete', 'off');

    $(this).after(div);   // dodaj szkielet udawanego inputa zaraz ZA prawdziwym
    $("#"+idDiv+" > span > span").append($(this).clone());  // dodaj inputa
    $(this).remove();
    $("#"+idDiv+" > span > span > input").attr('style', '');
    $("#"+idDiv+" > span > span > input").attr('class', cl_inp);

    // dodanie focusowania dla inputa po kliknieciu gdziekolwiek na duzy div
    $("#"+idDiv).click(function () {
      $("#"+idDiv+" > span > span > input").focus();
    });
  });
}


$(document).ready(function () {
  OkiInputBuild();
});




/* ---------------------------------------------------------------------------- */
/* ----------------------------- AutoComplete --------------------------------- */
/* ---------------------------------------------------------------------------- */

var OkiAutoComplete_timer;
var OkiAutoComplete_timerMs = OKIWIDGET_AUTOCOMPLETE_MS;

/**
 *  Funkcja przyjmuje jako parametr obiekt AutoComplete
 *  i wybiera na liscie element podany w atrybucie curpos.
 */
function OkiAutoCompleteChoose(obj, copyText)
{
  var objInp = obj.find('> span > span > input');
  var curpos = parseInt(objInp.attr('curpos'));     // pozycja kursora
  obj.find('> ul > li > a').removeClass('active');
  
  if (obj.find('> ul > li').size()==0) {
    return;
  }

  // przeskrolowanie listy do wybieranego elementu
  var aTag = obj.find('> ul > li > a');
  var listElementHeight = aTag.height() + parseInt(aTag.css('padding-top')) + parseInt(aTag.css('padding-bottom'));
  obj.find('> ul').scrollTop( listElementHeight*(curpos) );

  // odczytanie napisu z elementu z pozycji kursora
  var selElem = obj.find('> ul > li:nth-child('+(curpos+1)+') > a');
  selElem.addClass('active');
  if (copyText) {
    // wywal wyroznienia <b></b>
    var eltxt = selElem.html();
    eltxt = eltxt.replace(/<b>/g, "");
    eltxt = eltxt.replace(/<\/b>/g, "");
    eltxt = eltxt.replace(/<B>/g, "");
    eltxt = eltxt.replace(/<\/B>/g, "");


    if (eltxt.indexOf('/')>=0)
      eltxt = eltxt.substring(eltxt.indexOf('/')+2);   // tylko dla nabudowe.pl
    

    objInp.val(eltxt);
  }
}

/**
 *  Przygotowuje nowa liste do dzialania.
 *  Ustawia zdarzenia klikniecia w elementy oraz ustawia
 *  atrybuty porzadkowe, wylacza linki ('javascript:void' a <a>)
 */
function OkiAutoCompleteSetupListElements(obj)
{
  var objInp = obj.find('> span > span > input');

  objInp.attr('curpos', 0);

  // dodanie atrybutu porzadkowego i wylaczenie linkow
  obj.find('> ul > li > a').each(function (i) {
    $(this).attr('pos', i);
    $(this).attr('href', 'javascript:void(0)');
  });

  /**
   *  Zdarzenie generowane po kliknieciu w element listy
   */
  obj.find(" > ul > li > a").click(function() {
    var p3 = $(this).parent().parent().parent();
    p3.find('> span > span > input').attr('curpos', $(this).attr('pos'));  // ustawienie aktualnej pozycji z atrybutu porzadkowego elementu listy
    p3.find('> ul').fadeOut(OKIWIDGET_FADE_OUT_MS);
    p3.addClass('OkiAutoComplete-dontshow-on-click');  // zabezpiecza przed wywolaniem akcji click dla div'a ktora ponownie wyswietlila by liste
    OkiAutoCompleteChoose(p3, true);
  });
}

/**
 *  Obudowuje inputa divami
 */
function OkiAutoCompleteBuild(obj)
{
  var id = obj.attr('id');
  var cl = obj.attr('class');
  var st = obj.attr('style');
  var axld = obj.attr('OkiAutoComplete-ajaxLoader');
  $("#"+axld).hide();

  var div = '<div id="'+id+'_OkiAutoCompleteDiv" class="'+cl+'" style="'+st+'" >'+
            '  <span><span><b>&nbsp;</b></span></span>'+
            '  <ul>'+
            '  </ul>'+
            '</div>';

  obj.attr('autocomplete', 'off');

  obj.after(div);   // dodaj udawanego inputa zaraz ZA prawdziwym
  obj.attr('class', (obj.hasClass('OkiHidetxt')) ? 'OkiHidetxt' : '' );
  obj.attr('style', '' );
  $("#"+id+"_OkiAutoCompleteDiv > span > span").append(obj.clone());  // dodaj inputa
  obj.remove();

  // dodanie focusowania dla inputa po kliknieciu gdziekolwiek na duzy div
  $("#"+id+"_OkiAutoCompleteDiv").click(function () {
    $("#"+id+"_OkiAutoCompleteDiv > span > span > input").focus();
  });
}

/**
 *  Obsluga klikniecia w inputa czyli pokazanie listy
 */

function OkiAutoCompleteInputClick(obj)
{
  // jezeli nie ma elementow w liscie to wyswietl maly box
  var aTag = obj.find('> ul > li > a');
  var listElementCount = aTag.size();
  if (listElementCount==0) {
    return; // ostatecznie nic nie wyswietlaj ;]
    obj.find('> ul').addClass('empty');
  } else {
    obj.find('> ul').removeClass('empty');
  }

  // Zabezpiecza przed pokazaniem sie ponownie listy po wyborze elementu na
  // liscie kliknieciem. W momencie klikniecia generuja sie dwa zdarzenia
  // onClick: dla elementu listy i dla calego diva bedacego kontenerem.
  if (obj.hasClass('OkiAutoComplete-dontshow-on-click')) {
    obj.removeClass('OkiAutoComplete-dontshow-on-click');
    return;
  }

  // wygaszenie wszystkich innych selectow i pokazanie
  // listy aktualnego wraz z aktywowaniem input'a
  obj.removeClass('OkiAutoComplete-hideme');
  $('.OkiAutoComplete-hideme > ul').fadeOut(OKIWIDGET_FADE_OUT_MS);
  obj.find('> ul').fadeIn(OKIWIDGET_FADE_IN_MS);
  obj.find('> span > span > input').focus();

  // okreslenie wysokosci listy
  var listElementHeight = aTag.height() + parseInt(aTag.css('padding-top')) + parseInt(aTag.css('padding-bottom'));
  var listHeight = listElementCount*listElementHeight;

  // jezeli lista jest wyzsza od OKIWIDGET_LIST_MAX_HEIGHTpx dodaj scroll
  if (listHeight>=OKIWIDGET_LIST_MAX_HEIGHT) {
      obj.find('> ul').css('overflow-y', 'scroll');
      obj.find('> ul').css('height', OKIWIDGET_LIST_MAX_HEIGHT+'px');
  } else {
      obj.find('> ul').css('overflow-y', 'auto');
      obj.find('> ul').css('height', 'auto');
  }
}

/**
 *  Funckja inicjalizucje wszystkie inputy w dokumencie
 *  dodajac obsluge zdarzenien oraz usupelniajac brakujace
 *  atrybuty potrzebne do poprawnej pracy kontrolek.
 */
function OkiAutoCompleteInit()
{
  /**
   *  Wygasza wszystkie listy z klasa OkiAutoComplete-hideme
   *  po kliknieciu gdziekolwiek w dokumencie
   */
  $(document).click(function () {
    $('.OkiAutoComplete-hideme > ul').fadeOut(OKIWIDGET_FADE_OUT_MS);
  });


  /**
   *  Obudowanie inputa divami
   */
  $(".OkiAutoComplete").each(function () {
    OkiAutoCompleteBuild($(this));
  });


  /**
   *  Selektor znajduje wszystkie wystapienia klasy OkiAutoComplete
   *  i dodaje w nich zdarzenia i atrybuty potrzebne do dzialania
   */
  $(".OkiAutoComplete").each(function () {

    /**
     *  Zdarzenie generowane po kliknieciu na inputa
     */
    $(this).click(function () {
      OkiAutoCompleteInputClick($(this));
    });

    /**
     *  Po opuszczeniu inputa wyczysc ajaxowe zapytanie czekajace w Timerze
     */
    $(this).focusout(function () {
      clearTimeout(OkiAutoComplete_timer);
    });


    /**
     *  Zdarzenie generowane po opuszczeniu selecta przez myszke
     */
    $(this).mouseleave(function () {
      $(this).addClass('OkiAutoComplete-hideme');                      // dodaj klase ukryj-mnie
    });


    /**
     *  Zdarzenie obslugi klawiszy dla selecta
     */
    $(this).find('> span > span > input').keyup(function (e) {

      var normalChar = false;
      var p3 = $(this).parent().parent().parent();
      var curpos = parseInt($(this).attr('curpos'));  // pozycja aktualna
      var maxpos = p3.find('> ul > li').size();       // rozmiar listy

      // sterowanie kursorem itp
      switch (e.keyCode) {
        case 38:curpos = ((curpos-1)<0) ? (maxpos-1) : (curpos-1);  // strzalka do gory
                break;
        case 40:curpos = (curpos+1) % maxpos;                       // strzalka w dol
                break; 
        case 13:p3.find('> ul').fadeOut(OKIWIDGET_FADE_OUT_MS);     // enter
                break;
        default:normalChar = true;
      }

      // przypisz pozycje aktualna
      $(this).attr('curpos', curpos);

      // wybierz nowy element po zmianach
      if (!normalChar) {
        OkiAutoCompleteChoose(p3, true);
      } else {
        clearTimeout(OkiAutoComplete_timer);
        OkiAutoComplete_timer = setTimeout('OkiAutoCompleteAjaxSearch($("#'+p3.attr('id')+'"));', OkiAutoComplete_timerMs);
      }

    });
  });
}

function highlightWords(line, word)
{
  var regex = new RegExp( '(' + word + ')', 'gi' );
  return line.replace( regex, "<b>$1</b>" );
}


function OkiAutoCompleteMarkString(obj, searchTXT)
{
  var atxt;

  obj.find('> ul > li > a').each(function () {
    atxt = $(this).html();
    atxt = highlightWords(atxt, searchTXT);
    $(this).html(atxt);
  });
}

/**
 *  Wyszukiwanie ajaxem danych
 */
function OkiAutoCompleteAjaxSearch(obj)
{
  var objInp = obj.find('> span > span > input');
  var searchTXT = objInp.val();
  var param = objInp.attr('OkiAutoComplete-ajaxParam');
  if (param == null) param = '';
  if (param!='') param = param + '&';

  $("#"+objInp.attr('OkiAutoComplete-ajaxLoader')).show();

  if (searchTXT.length==0) {
    $("#"+objInp.attr('OkiAutoComplete-ajaxLoader')).hide();
    //obj.find('> ul').fadeOut(OKIWIDGET_FADE_OUT_MS);
  } else {
    $.ajax({
      url:   objInp.attr('OkiAutoComplete-ajaxUrl'),
      data: param+'search='+searchTXT,
      type: "POST",
      success: function(data) {

        if (data.replace(/\s/g, "")=='')
          obj.find('> ul').fadeOut(OKIWIDGET_FADE_OUT_MS);

        obj.find('> ul').html(data);
        OkiAutoCompleteMarkString(obj, searchTXT);
        OkiAutoCompleteSetupListElements(obj);
        OkiAutoCompleteChoose(obj);
        OkiAutoCompleteInputClick(obj);
        obj.addClass('OkiAutoComplete-hideme');       // dodaj klase ukryj-mnie
        $("#"+objInp.attr('OkiAutoComplete-ajaxLoader')).hide();
      }
    });
  }
}

$(document).ready(function () {
  OkiAutoCompleteInit();
});


/* ----------------------------------------------------------------------------- */
/* --------------------------------- Button ------------------------------------ */
/* ----------------------------------------------------------------------------- */

function OkiButtonBuild()
{
  $('.OkiButton').each(function (i) {

    $(this).removeClass('OkiButton');
    $(this).html('<span><span><em>'+$(this).html()+'</em></span></span>');

  });
}

$(document).ready(function () {
  OkiButtonBuild();
});




/* ----------------------------------------------------------------------------- */
/* --------------------------------- Select ------------------------------------ */
/* ----------------------------------------------------------------------------- */

/**
 *  Funkcja przyjmuje jako parametr obiekt select'a
 *  i ustawia na liscie element podany w atrybucie curpos.
 *  Przepisywana jest tez do inputa wartosc wybranego elementu
 *  (do atrybutu selval) oraz tekst widoczny userowi (do atrybutu value)
 *
 *  bool onChange - gry true wywolywany jest kod z atrybutu onChangeOkiSelect
 *  bool onClick - gry true wywolywany jest kod z onClick prawdziwego selecta
 */
function OkiSelectChoose(obj, onChange, onClick)
{
  var objInp = obj.find('> span > span > input');
  var curpos = parseInt(objInp.attr('curpos'));     // pozycja kursora
  obj.find('> ul > li > a').removeClass('active');
  
  if (obj.find('> ul > li').size()==0) {
    return;
  }

  // przeskrolowanie listy do wybieranego elementu
  var aTag = obj.find('> ul > li > a');
  var listElementHeight = aTag.height() + parseInt(aTag.css('padding-top')) + parseInt(aTag.css('padding-bottom'));
  obj.find('> ul').scrollTop( listElementHeight*(curpos) );

  // odczytanie wartosci i napisu z elementu z pozycji kursora
  var selElem = obj.find('> ul > li:nth-child('+(curpos+1)+') > a');
  selElem.addClass('active');
  objInp.val(selElem.html());
  objInp.attr('selval', selElem.attr('value'));

  // skopiuj wybor do prawdziwego selecta
  var realSelId = obj.attr('id').replace('_OkiSelectDiv', '');
  if (realSelId != null && realSelId != '') {
    $('#'+realSelId+' option:selected').removeAttr('selected');
    $('#'+realSelId+' option[value='+selElem.attr('value')+']').attr('selected','selected');

    // wywolanie funkcji z atrybutu onChangeOkiSelect
    // nie dziala zwykle zdarzenie onChange w prawdziwym selekcie :/
    var codetoevalChange;
    if (onChange) {
      codetoevalChange = $("#"+realSelId).attr('OkiSelect-onChange');
      eval_global( codetoevalChange );
    }

    var codetoevalClick;
    if (onClick) {
      codetoevalClick = $("#"+realSelId+' option[value='+selElem.attr('value')+']').attr('onClick');
      eval_global( codetoevalClick );
    }
  }
}

/**
 *  Przygotowuje nowa liste do dzialania.
 *  Ustawia zdarzenia klikniecia w elementy oraz ustawia
 *  atrybuty porzadkowe, wylacza linki ('javascript:void' a <a>)
 */
function OkiSelectSetupListElements(obj)
{
  var objInp = obj.find('> span > span > input');

  var curpos = objInp.attr('curpos');               // pozycja wybranego elementu na liscie
  if (!curpos == null || curpos=='')
    objInp.attr('curpos', 0);                       // gdy nie bylo ustaw na 0

  objInp.attr('strpos', '');                        // ciag wyszukiwania elementow na liscie

  // dodanie atrybutu porzadkowego i wylaczenie linkow
  obj.find('> ul > li > a').each(function (i) {
    $(this).attr('pos', i);
    $(this).attr('href', 'javascript:void(0)');
  });


  /**
   *  Zdarzenie generowane po kliknieciu w element listy
   */
  obj.find(" > ul > li > a").click(function() {
    var p3 = $(this).parent().parent().parent();
    p3.find('> span > span > input').attr('curpos', $(this).attr('pos'));  // ustawienie aktualnej pozycji z atrybutu porzadkowego elementu listy
    p3.find('> span > span > input').attr('strpos', '');                   // wyczysc ciag wyszukiwania
    p3.find('> ul').fadeOut(OKIWIDGET_FADE_OUT_MS);
    p3.addClass('OkiSelect-dontshow-on-click');  // zabezpiecza przed wywolaniem akcji click dla div'a ktora ponownie wyswietlila by liste
    OkiSelectChoose(p3, true, true);
  });
}

/**
 *  Funckja inicjalizucje wszystkie selecty w dokumencie
 *  dodajac obsluge zdarzenien oraz usupelniajac brakujace
 *  atrybuty potrzebne do poprawnej pracy kontrolek.
 */
function OkiSelectInitIn(tagIdOrClass)
{
  /**
   *  Wygasza wszystkie listy z klasa OkiSelect-hideme
   *  po kliknieciu gdziekolwiek w dokumencie
   */
  $(document).click(function () {
    $('.OkiSelect-hideme > ul').fadeOut(OKIWIDGET_FADE_OUT_MS);
  });


  /**
   *  Selektor znajduje wszystkie wystapienia klasy OkiSelect
   *  i dodaje w nich zdarzenia i atrybuty potrzebne do dzialania
   */
  $(tagIdOrClass+" .OkiSelectDiv").each(function () {

    // atrybut readolny dla inputa
    var objInp = $(this).find('> span > span > input');
    objInp.attr('readonly', 'readonly');
    objInp.attr('autocomplete', 'off');


    if ( ! $(this).find('> ul').hasClass('OkiSelect-ListSetupDone')) {
      // dolaczenie logiki i zdarzen dla nowych elementow w liscie
      OkiSelectSetupListElements($(this));
      // pierwsze wybranie elementu
      OkiSelectChoose($(this), false, false);
    }


    /**
     *  Zdarzenie generowane po kliknieciu na selecta
     */
    $(this).click(function () {
      // jezeli nie ma elementow w liscie to nie wyswietlaj dolnego boxa
      var aTag = $(this).find('> ul > li > a');
      var listElementCount = aTag.size();
      if (listElementCount==0) {
        $(this).find('> ul').addClass('empty');
      } else {
        $(this).find('> ul').removeClass('empty');
      }


      // Zabezpiecza przed pokazaniem sie ponownie listy po wyborze elementu na
      // liscie kliknieciem. W momencie klikniecia generuja sie dwa zdarzenia
      // onClick: dla elementu listy i dla calego diva bedacego kontenerem.
      if ($(this).hasClass('OkiSelect-dontshow-on-click')) {
        $(this).removeClass('OkiSelect-dontshow-on-click');
        return;
      }

      // wygaszenie wszystkich innych selectow i pokazanie
      // listy aktualnego wraz z aktywowaniem input'a
      $(this).removeClass('OkiSelect-hideme');
      $('.OkiSelect-hideme > ul').fadeOut(OKIWIDGET_FADE_OUT_MS);
      $(this).find('> ul').fadeIn(OKIWIDGET_FADE_IN_MS);
      $(this).find('> span > span > input').focus();

      // okreslenie wysokosci listy
      var listElementHeight = aTag.height() + parseInt(aTag.css('padding-top')) + parseInt(aTag.css('padding-bottom'));
      var listHeight = listElementCount*listElementHeight;

      // jezeli lista jest wyzsza od OKIWIDGET_LIST_MAX_HEIGHTpx dodaj scroll
      if (listHeight>=OKIWIDGET_LIST_MAX_HEIGHT) {
          $(this).find('> ul').css('overflow-y', 'scroll');
          $(this).find('> ul').css('height', OKIWIDGET_LIST_MAX_HEIGHT+'px');
      }

    });


    /**
     *  Zdarzenie generowane po opuszczeniu selecta przez myszke
     */
    $(this).mouseleave(function () {
      $(this).addClass('OkiSelect-hideme');                      // dodaj klase ukryj-mnie
      $(this).find('> span > span > input').attr('strpos', '');  // wyczysc ciag wyszukiwania
    });



//    $(this).find('> span > span > input').keydown(function (e) {
//      if (e.keyCode==13)
//        $(this).closest('form').submit(function () { return false; });
//    });

    /**
     *  Zabezpiecza przed scrolowaniem strony przy wybieraniu elementu listy strzalkami
     *  Blad ten pojawial sie w Chromie i Safari
     */
    $(this).find('> span > span > input').keydown(function (e) {

      if (e.keyCode==38 || e.keyCode==40)
        $(this).attr('readonly', ''); else
        $(this).attr('readonly', 'readonly');
    });
    

    /**
     *  Zdarzenie obslugi klawiszy dla selecta
     */
    $(this).find('> span > span > input').keyup(function (e) {

      //$("#keyup").append(e.keyCode);
      var p3 = $(this).parent().parent().parent();
      var curpos = parseInt($(this).attr('curpos'));  // pozycja aktualna
      var maxpos = p3.find('> ul > li').size();       // rozmiar listy
      var strpos = $(this).attr('strpos');            // ciag wyszukiwania
      var onClick = false;

      // obsluga klawiszy nietypowych
      switch (e.keyCode) {
        case 38:curpos = ((curpos-1)<0) ? (maxpos-1) : (curpos-1);      // strzalka do gory
                break; 
        case 40:curpos = (curpos+1) % maxpos;                           // strzalka w dol
                break;
        case  8:strpos = strpos.substring(0, strpos.length-1);          // backspace
                break; 
        case 13:onClick = true;                                         // enter
                strpos = '';
                p3.find('> ul').fadeOut(OKIWIDGET_FADE_OUT_MS);
                break; 
      }

      // przechodzi backspace, enter, A-Z oraz 0-9
      if (e.keyCode==8 || e.keyCode==32 || (e.keyCode>=65 && e.keyCode<=90) || (e.keyCode>=48 && e.keyCode<=57)) {

        // dodaj nowy znak chyba ze jest to backspace
        if (e.keyCode!=8)
          strpos = strpos + String.fromCharCode(e.keyCode);

        // gdyby nie znaleziono wybranym bedzie pierwszy z listy
        curpos = 0;

        // szukaj po kazdym elemencie listy wpisanego ciagu
        p3.find('> ul > li > a').each(function (i) {
          var aTagLowerCase = $(this).html().toLocaleUpperCase();
          var strposLowerCase = strpos.toLocaleUpperCase();
          var indexOf = aTagLowerCase.indexOf(strposLowerCase);
          if (indexOf==0) {
            curpos = i;
            return false;
          }
        });
      }

      // przypisz pozycje aktualna oraz ciag wyszukiwanai
      $(this).attr('curpos', curpos);
      $(this).attr('strpos', strpos);

      // wybierz nowy element po zmianach
      OkiSelectChoose(p3, true, onClick);
    });
  });
}

function OkiSelectInit()
{
  OkiSelectInitIn('');
}

/**
 *  Kopiuje zawartosc listy prawdziwego selecta do
 *  tego udawanego. Przydaje sie gdy prawdziwy select
 *  zmienil zawartosc juz po zaladowaniu dokumentu
 *  i trzeba zrobic update w udawanym.
 *
 *  W parametrze ID prawdziwego selecta
 */
function OkiSelectUpdateList(id)
{
  $("#"+id+"_OkiSelectDiv").find('> span > span > input').attr('curpos', 0);

  $("#"+id+"_OkiSelectDiv ul li").remove();

  $("#"+id+" option").each(function (i) {
    if ($(this).attr('selected'))
      $("#"+id+"_OkiSelectDiv").find('> span > span > input').attr('curpos', i);
    element = '<li><a value="'+$(this).val()+'">'+$(this).text()+'</a></li>';
    $("#"+id+"_OkiSelectDiv > ul").append(element);
  });
  OkiSelectSetupListElements($("#"+id+"_OkiSelectDiv"));
  OkiSelectChoose($("#"+id+"_OkiSelectDiv"), false, false);

  // TODO - wywalic wszystko zwiazane z budowa diva z Init do Build
  $("#"+id+"_OkiSelectDiv > ul").addClass('OkiSelect-ListSetupDone');
}

/**
 *  Szuka prawdziwych selectow w konkretnym rodzicu z klasa OkiSelect
 *  i generuje za nimi strukture divow udajaca selecta
 */
function OkiSelectBuildSelectsIn(tagIdOrClass)
{
  $(tagIdOrClass+' .OkiSelect').each(function () {

    var id = $(this).attr('id');
    var cl = $(this).attr('class').replace('OkiSelect', '');
    var st = $(this).attr('style');

    var div = '<div id="'+id+'_OkiSelectDiv" class="'+cl+' OkiSelectDiv" style="display: block !important; '+st+'" >'+
              '  <span><span><b>&nbsp;</b><input type="text" /></span></span>'+
              '  <ul>'+
              '  </ul>'+
              '</div>';

    $(this).after(div);   // dodaj udawanego selecta zaraz ZA prawdziwym
    OkiSelectUpdateList(id);  // skopiuj elementy listy do diva

    $(this).hide();
  });
}

/**
 *  Szuka prawdziwych selectow z klasa OkiSelect
 *  i generuje za nimi strukture divow udajaca selecta
 */
function OkiSelectBuildSelects()
{
  OkiSelectBuildSelectsIn('');
}

function OkiSelectApplyIn(tagIdOrClass)
{
  OkiSelectBuildSelectsIn(tagIdOrClass);      // zbudowanie divow dla selectow i ukrycie tych prawdziwych
  OkiSelectInit();                            // przypisanie zdarzen i calej logiki dla divow    
}

function OkiSelectApply()
{
    OkiSelectApplyIn('');
}


$(document).ready(function () {
    OkiSelectApply();               // tutaj wszystko sie zaczyna
});



/* ---------------------------------------------------------------------------- */
/* ---------------------------- Funkcje pomocnicze ---------------------------- */
/* ---------------------------------------------------------------------------- */

$(document).ready(function () {
  // ukrywanie tekstu podpowiedzi
  $(".OkiHidetxt").each(function () {if ($(this).val()=="") {$(this).val( $(this).attr('OkiHidetxt-defVal') );}});
  $('.OkiHidetxt').focusin(function() {if ($(this).val()==$(this).attr("OkiHidetxt-defVal")) $(this).val("");});
  $('.OkiHidetxt').focusout(function() {if ($(this).val()=="") $(this).val($(this).attr("OkiHidetxt-defVal"));});

  // ukrywanie tekstu podpowiedzi dla textarea
  $(".OkiHidetxtTA").each(function () {if ($(this).val()=="") $(this).val( $(this).attr('OkiHidetxtTA-defVal') );});
  $('.OkiHidetxtTA').focusin(function() {if ($(this).val()==$(this).attr("OkiHidetxtTA-defVal")) $(this).val("");});
  $('.OkiHidetxtTA').focusout(function() {if ($(this).val()=="") $(this).val($(this).attr("OkiHidetxtTA-defVal"));});
});


/**
 *  Czysci domyslne teksty z inputow tak by nie poszly do bazy niewypelnione pola
 *  (wersja z filtrem - mozna okreslic w ktorym elemencie kontrolki sa czyszczone,
 *  a nie jak w przypadku funkcji OkiClearDefVal() dla calego dokumentu)
 */
function OkiClearDefValIn(el_id)
{
  var realVal;
  var defVal;

  if (el_id!='') {
    el_id = '#'+el_id+' ';
  }

  $(el_id+".OkiHidetxt").each(function () {
    realVal = $(this).val();
    defVal = $(this).attr('OkiHidetxt-defVal');
    if (realVal==defVal)
      $(this).val('');
  });

  $(el_id+".OkiHidetxtTA").each(function () {
    realVal = $(this).val();
    defVal = $(this).attr('OkiHidetxtTA-defVal');
    if (realVal==defVal)
      $(this).val('');
  });
}

/**
 *  Czysci domyslne teksty z inputow tak by nie poszly do bazy niewypelnione pola
 */
function OkiClearDefVal()
{
  OkiClearDefValIn('');
}


/**
 *  Dodaje klase podana z parametru oraz dodaje zdarzenie
 *  ktore po kliknieciu w element wylacza ta klase
 *  Parametry to id prawdziwej kontrolki oraz klasa ktora zostanie dodana
 *  do udawanego diva (jest to tez styl CSS)
 */
function OkiError(id, error_class /*,error_div*/)
{
  var obj;

  if ($("#"+id).attr('autocomplete')=='off') {
     obj = $("#"+id).parent().parent().parent();
  } else {
     obj = $("#"+id).next();
  }

  obj.addClass(error_class);
  obj.one("click", function() {
    $(this).removeClass(error_class);
  });
  obj.one("focus", function () {
    $(this).removeClass(error_class);
  });

  $("#"+id+"_error").show();
}

/**
 *  To samo co wyzej ale dla textarea
 */
function OkiErrorTA(id, error_class)
{
  var obj = $("#"+id);
  
  obj.addClass(error_class);
  obj.one("click", function(){
    $(this).removeClass(error_class);
  });
  obj.one("focus", function () {
    $(this).removeClass(error_class);
  });

  $("#"+id+"_error").show();
}

/**
 *  Dla zwyklych inputow
 */

function formError(id, error_class)
{
  var obj = $("#"+id);

  obj.addClass(error_class);
  obj.one("click", function(){
    $(this).removeClass(error_class);
  });
  obj.one("focus", function () {
    $(this).removeClass(error_class);
  });

  $("#"+id+"_error").show();
}
