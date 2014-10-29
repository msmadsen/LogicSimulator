// TODO:
//     + debug zwraca stringa zeby mozna bylo doklejac
//     + przetestowanie bramek
//     + dorobic rejestry implementujace interface
//     -/+ przetestowanie rejestrow
//     + podpiac szablon (DarkBox) do modulu
//     + dopisac funkcje w module do obslugi interface'u
//     + dorobic debug dla connection                               [! piorytet !]
//     + zmienic connInCount na connInBitsCount                     [! piorytet !]
//     + dodac petle propagujaca sygnaly w module
//     - dorobic do rejestrow kluczowanie zegara
//     - dorobic elastyczny template dla bramek (wiele bitow dla and/not etc)
//     - dorobic RAM ROM multiplexer sumator negatorU2 mnozenie dzielenie comparator dekoder
//     + zamienic clockTick na clockRisingEdge/clockFallingEdge
//     + [BUG] isReadtToPropagate na poczatku (gdy atInput == "") zwraca true a nie powinno
//     + [BUG? :)] nie mozna kluczowac zegara, dorobic do rejestrow pin enableClock
//
// TODO kiedys:
//     - pozycje obiektow x y i wymiary modulow
//     - lista punktow polaczenia ktore sa po drodze


function test()
{
    var t = new Adder24bit();
    var i;
    var inBits;
    var outBits;
    var error = true;
    var a, b;
    
    helperExecTimeStart();
    for (i=0; i<100000; i++) {
        error = true;
        
        a = helperGetRandomInt(0, 16777215);
        b = helperGetRandomInt(0, 16777215);
        inBits = helperToBin(a, 24) + helperToBin(b, 24) + "0";

        t.resetPropagateState();
        t.setInputData(inBits, 0);
        outBits = t.getOutputData();
        t.clockFallingEdge();

        if ((a+b)==helperFromBin(outBits))
            error = false;
       
        /*
        console.log('IN: ' + inBits + ' OUT: ' + outBits);
        console.log(a + ' + ' + b + ' = ' + (a+b));
        console.log( ((a+b)==helperFromBin(outBits)) ? 'OK' : '[!] ERROR [!]' );
        console.log('-----------------------');
        */
        
        if (error)
            break;
    }

    if (error)
        $('#console').append( 'error' + '<br/>' );
    $('#console').append( 'Execution time: ' + helperExecTimeEnd() + 'sek' + '<br/>' );
}


function testFullAdder()
{
    var t = new FullAdder();
    var i, j;
    var inBits;
    var outBits;
    
    /*
        software is 17x faster
     
        module:   1.200 sek   ~        6.7 tys sumowan / sek
        software: 0.070 sek   ~  114 000.0 tys sumowan / sek
    */

    helperExecTimeStart();
    for (j=0; j<1000; j++)
        for (i=0; i<8; i++) {
            inBits = i.toString(2);
            inBits = helperGenerateBits(3-inBits.length, "0") + inBits;

            t.resetPropagateState();
            t.setInputData(inBits, 0);
            outBits = t.getOutputData();
            t.clockFallingEdge();

            //console.log('IN: ' + inBits + ' OUT: ' + outBits);
        }

    $('#console').append( 'Execution time: ' + helperExecTimeEnd() + 'sek' + '<br/>' );
}
