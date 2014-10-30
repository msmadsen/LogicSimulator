var SIM_FLAG_NON_STABLE = false;
var PIN_SIZE = 8;
var SIM_SWITCH_DELAY = 2000;                                        // ms
var SIM_CLOCK_FREQUENCY = 0.2;                                      // Hz
var SIM_CLOCK_HALFCYCLE_TIME = (1000.0/SIM_CLOCK_FREQUENCY) / 2.0;  // ms
var DEBUG_INDENT = "    ";
var execTimeStart = new Date().getTime();

var OBJ_GATENAND = 0;
var OBJ_INPUT = 1;
var OBJ_OUTPUT = 2;
var OBJ_WIRELINK = 3;
var OBJ_CLOCK = 4;
var OBJ_HIGHT = 5;
var OBJ_LOW = 6;


/**
 *  Helpers
 */

String.prototype.replaceAt = function(index, chr)
{
    if (index > (this.length-1)) return this;
    return this.substr(0, index) + chr + this.substr(index+chr.length);
}

function Vector2d(_x, _y)
{
    var x = (typeof(_x)==='undefined') ? 0.0 : parseFloat(_x);
    var y = (typeof(_y)==='undefined') ? 0.0 : parseFloat(_y);

    this.getIntX = function() { return Math.round(x); }
    this.getIntY = function() { return Math.round(y); }
    this.getFormatedX = function() { return helperNumberFormat(x, 2, '.', ' ') }
    this.getFormatedY = function() { return helperNumberFormat(y, 2, '.', ' ') }
    this.getX = function() { return x; }
    this.getY = function() { return y; }
    this.setX = function(xx) { x = parseFloat(xx); }
    this.setY = function(yy) { y = parseFloat(yy); }
    this.add = function(b) { return new Vector2d((x+b.getX()), (y+b.getY())); };
    this.sub = function(b) { return new Vector2d((x-b.getX()), (y-b.getY())); };
    this.mul = function(b) { return new Vector2d((x*parseFloat(b)), (y*parseFloat(b))); };
    this.div = function(b) { return new Vector2d((x/parseFloat(b)), (y/parseFloat(b))); };
    this.addScalar = function(b) { return new Vector2d(x+parseFloat(b), y+parseFloat(b)); };
    this.subScalar = function(b) { return new Vector2d(x-parseFloat(b), y-parseFloat(b)); };
    this.len = function() { return Math.sqrt(x*x + y*y); };
    this.dot = function(b) { return x*b.getX() + y*b.getY(); }
    this.clone = function() { return new Vector2d(x, y); }
    
    this.norm = function() {
        var len = this.len();
        if (len==0.0)
            return;
        x = x / len;
        y = y / len;
    }
    
    this.cos = function(b) { 
        var vecA = new Vector2d(x, y);
        var vecB = b;
        vecA.norm();
        vecB.norm();
        return vecA.dot(vecB); 
    }
    
    this.swapAxes = function()
    {
        var tmp;
        tmp = x;
        x = y;
        y = tmp;
    }
    
    this.getAngleToVec = function(b) {
        var angle = Math.acos(this.cos(b)) * 180.0/Math.PI;
        
        return parseFloat(Math.round(angle*1000))/1000.0;
    }
    
    this.getAngleToCoorSysZero = function() {
        var len = this.len();
        var angle;
        
        if (len<=0.001) len = 0.001;

        if (x>=0.0 && y<0.0)
            angle = Math.asin(x/len) * 180.0/Math.PI;
        if (x>=0.0 && y>=0.0)
            angle = Math.asin(y/len) * 180.0/Math.PI + 90.0;
        if (x<0.0 && y>=0.0)
            angle = Math.asin(-x/len) * 180.0/Math.PI + 180.0;
        if (x<0.0 && y<0.0)
            angle = Math.asin(-y/len) * 180.0/Math.PI + 270.0;
        
        return parseFloat(Math.round(angle*1000))/1000.0;
    }
    
    this.unitAngle = function(angle) {
        x = Math.sin(angle*(Math.PI/180.0));
        y = -Math.cos(angle*(Math.PI/180.0));
    }

    this.isInTriangle = function(A, B, C) {
        // code from: http://www.blackpawn.com/texts/pointinpoly/default.html
        var v0, v1, v2;
        var dot00, dot01, dot02, dot11, dot12;
        var invDenom;
        var u, v;

        // Compute vectors
        v0 = C.sub(A);
        v1 = B.sub(A);
        v2 = this.sub(A);

        // Compute dot products
        dot00 = v0.dot(v0);
        dot01 = v0.dot(v1);
        dot02 = v0.dot(v2);
        dot11 = v1.dot(v1);
        dot12 = v1.dot(v2);

        // Compute barycentric coordinates
        invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);
        u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        // Check if point is in triangle
        return (u >= 0.0) && (v >= 0.0) && (u + v < 1.0);
    }
    
    this.isInRect = function(rectTL, rectWH) {
        var tmp;
        if ( ! (rectTL.getX()<this.getX() && rectTL.getY()<this.getY()))
            return false;
        tmp = rectTL.add(rectWH);
        if ( ! (this.getX()<tmp.getX() && this.getY()<tmp.getY()))
            return false; 
       return true;
    }
    
    this.rotate90Left = function(center, objSize) {
        var tmp = new Vector2d(x, y);
        var halfObjSize = new Vector2d(objSize.getX()/2.0, objSize.getY()/2.0);
        var tmpX, tmpY;
        
        tmp = tmp.sub(center);
        tmp = tmp.add(halfObjSize);
        tmpX = tmp.getX();
        tmpY = tmp.getY();
        tmp.setX(tmpY);
        tmp.setY(-tmpX);
        tmp = tmp.sub(halfObjSize);
        tmp = tmp.add(center);
        
        return tmp;
    }
    
    this.rotate90Right = function(center, objSize) {
        var tmp = new Vector2d(x, y);
        var halfObjSize = new Vector2d(objSize.getX()/2.0, objSize.getY()/2.0);
        var tmpX, tmpY;
        
        tmp = tmp.sub(center);
        tmp = tmp.add(halfObjSize);
        tmpX = tmp.getX();
        tmpY = tmp.getY();
        tmp.setX(-tmpY);
        tmp.setY(tmpX);
        tmp = tmp.sub(halfObjSize);
        tmp = tmp.add(center);
        
        return tmp;
    }
    
    this.toString = function() {
        return helperNumberFormat(x, 3, '.', ' ')+' '+helperNumberFormat(y, 3, '.', ' ');
    }
}

function helperToBin(n, width)
{
    var bits;
    bits = n.toString(2);
    
    if (bits.length>width) {
        bits = bits.substr(bits.length-width, width);
    } else {
        bits = helperGenerateBits(width-bits.length, "0") + bits;
    }
   
    return bits;
}

function helperConsole(txt)
{
    $('#console').append('<div>'+txt+'</div>');
}

function helperFromBin(bits)
{
    bits = bits + "";
    return parseInt(bits, 2);
}

function helperNumberFormat(number, decimals, dec_point, thousands_sep) 
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

function helperExecTimeStart()
{
    execTimeStart = new Date().getTime();
}

function helperExecTimeEnd()
{
    var end = new Date().getTime();
    var time = end - execTimeStart;
    return helperNumberFormat((time/1000.0), 3, '.', '');
}

function helperSpeedTestStart()
{
    return new Date().getTime();
}

function helperSpeedTestEnd(ts)
{
    var end = new Date().getTime();
    var time = end - ts;
    return time/1000.0;
}

function helperGetRandomInt(min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function helperGenerateBits(len, what)
{
    var ret = "";
    for (var i=0; i<len; i++)
        ret = ret + what;
    return ret;
}

function helperGenerateBitsRand(len)
{
    var ret = "";
    for (var i=0; i<len; i++)
        ret = ret + (helperGetRandomInt(1, 100)>50 ? "1" : "0");
    return ret;
}

function helperSetupBitsNESWLocations(__c)
{
    var i, j;
    var arrNESWLoc;
    var arrBitLoc;
    var s, hs;
    var pin = new Vector2d();
    var a = new Vector2d();
    var b = new Vector2d();
    var c = new Vector2d();

    s = __c.getSize();
    hs = s.mul(0.5);

    for (j=0; j<2; j++) {

        // choose input/output
        switch (j) {
            case 0: arrNESWLoc = __c.getInputBitsNESWLocations();
                    arrBitLoc = __c.getInputBitsLocations();
                    break;
            case 1: arrNESWLoc = __c.getOutputBitsNESWLocations();
                    arrBitLoc = __c.getOutputBitsLocations();
                    break;
        }
        
        arrNESWLoc.length = 0;

        for (i=0; i<arrBitLoc.length; i++) {
            pin.setX( arrBitLoc[i].getX() + PIN_SIZE*0.5 );
            pin.setY( arrBitLoc[i].getY() + PIN_SIZE*0.5 );

            // N
            a.setX(0.0);       a.setY(0.0);
            b.setX(s.getX());  b.setY(0.0);
            c.setX(hs.getX()); c.setY(hs.getY());
            if (pin.isInTriangle(a, b, c)) {
                arrNESWLoc.push(0);
                continue;
            }

            // E
            a.setX(s.getX());  a.setY(0.0);
            b.setX(s.getX());  b.setY(s.getY());
            c.setX(hs.getX()); c.setY(hs.getY());
            if (pin.isInTriangle(a, b, c)) {
                arrNESWLoc.push(1);
                continue;
            }

            // S
            a.setX(0.0);       a.setY(s.getY());
            b.setX(s.getX());  b.setY(s.getY());
            c.setX(hs.getX()); c.setY(hs.getY());
            if (pin.isInTriangle(a, b, c)) {
                arrNESWLoc.push(2);
                continue;
            }

            // W
            a.setX(0.0);       a.setY(0.0);
            b.setX(0.0);       b.setY(s.getY());
            c.setX(hs.getX()); c.setY(hs.getY());
            if (pin.isInTriangle(a, b, c)) {
                arrNESWLoc.push(3);
                continue;
            }

            // default is N
            arrNESWLoc.push(0);
        }
    }
}
function helperSetupBitsTmpCoordinates(__c)
{
    var i;
    var arrBitsTmpCoord;

    // generate place (create Vec objects) for input bits tmp coordinates
    arrBitsTmpCoord = __c.getInputBitsTmpCoordinates();
    for (i=0; i<__c.getInputBitsCount(); i++) {
        arrBitsTmpCoord.push(new Vector2d());      // pin loc
        arrBitsTmpCoord.push(new Vector2d());      // pin NESW loc
    }

    // generate place (create Vec objects) for output bits tmp coordinates
    arrBitsTmpCoord = __c.getOutputBitsTmpCoordinates();
    for (i=0; i<__c.getOutputBitsCount(); i++) {
        arrBitsTmpCoord.push(new Vector2d());      // pin loc
        arrBitsTmpCoord.push(new Vector2d());      // pin NESW loc
    }
}


/**
 *  Generic combinational logic
 */

function CombinationalBase()
{
    var inputWaiting;
    var input;
    var output;
    var outputPrevoius;
    var changed;
    var switchingTimeStart;    // in ms
    var switchingTimeFinish;   // in ms
    // --------
    var savedData = null;       // for memory?
    var state = 0;
    var objSpec = null;
    var objClass = "";
    var objClassCode = -1;
    var inputBitsCount = 0;
    var outputBitsCount = 0;
    var size;
    var inputBitsLocations = new Array();
    var outputBitsLocations = new Array();
    var inputBitsTmpCoordinates = new Array();
    var outputBitsTmpCoordinates = new Array();
    var inputBitsNESWLocations = new Array();
    var outputBitsNESWLocations = new Array();

    this.configureAs = function(type) {
        if (objClassCode!=-1) {
            helperConsole('[ERROR] configureAs already fired in '+this.getObjClass());
            return;
        }
        switch (type) {
            case OBJ_GATENAND: objSpec = new GateNand(this);  break;
            case OBJ_INPUT:    objSpec = new Input(this);     break;
            case OBJ_OUTPUT:   objSpec = new Output(this);    break;
            case OBJ_WIRELINK: objSpec = new WireLink(this);  break;
            case OBJ_CLOCK:    objSpec = new Clock(this);     break;
            case OBJ_HIGHT:    objSpec = new Hight(this);     break;
            case OBJ_LOW:      objSpec = new Low(this);       break;
        }
        
        objSpec.configure();
        objClassCode = type;
        this.reset();
        helperSetupBitsNESWLocations(this);
        helperSetupBitsTmpCoordinates(this);
    }
    this.getSwitchingTimeProgress = function(now) {
        if (now>=switchingTimeFinish)
            return 1.0
        if (switchingTimeStart==switchingTimeFinish)
            return 1.0;
        return (now-switchingTimeStart) / (switchingTimeFinish-switchingTimeStart)
    }
    this._computeOutput = function() {
        var tmp = "";
        switch (objClassCode) {
            case OBJ_GATENAND: tmp = objSpec.computeOutput(); break;
            case OBJ_INPUT:    tmp = objSpec.computeOutput(); break;
            case OBJ_OUTPUT:   tmp = objSpec.computeOutput(); break;
            case OBJ_WIRELINK: tmp = objSpec.computeOutput(); break;    
            case OBJ_CLOCK:    tmp = objSpec.computeOutput(); break;
            case OBJ_HIGHT:    tmp = objSpec.computeOutput(); break;
            case OBJ_LOW:      tmp = objSpec.computeOutput(); break;
        }
        output = tmp;
    }
    this.setInput = function(bits, bitStart) {
        var now = (new Date()).getTime();
        var switchingTime = 0;
        var newInputWaiting = inputWaiting;
        if ((bits.length+bitStart)>this.getInputBitsCount())
            helperConsole('[ERROR] setInputData too long in '+this.getObjClass());
        var i;
        for (i=0; i<bits.length; i++) {
            newInputWaiting = newInputWaiting.replaceAt(bitStart+i, bits[i]);
        }
        
        if (newInputWaiting!=inputWaiting) {      // new signal at input
            inputWaiting = newInputWaiting;
            switch (objClassCode) {
                case OBJ_GATENAND: switchingTime = SIM_SWITCH_DELAY; break;
            }
            switchingTimeStart = now;
            switchingTimeFinish = now + switchingTime;
        }
    }
    this.timeLapse = function() {
        var now = (new Date()).getTime();
        var clockHalfTicksFromPreviousCheck;
        
        switch (objClassCode) {
            case OBJ_CLOCK:    clockHalfTicksFromPreviousCheck = objSpec.getClockHalfTicksFromPreviousCheck(now);
                               if (clockHalfTicksFromPreviousCheck>=1.0 && clockHalfTicksFromPreviousCheck<2.0) {
                                   objSpec.toggle();
                               } else
                                   if (clockHalfTicksFromPreviousCheck>=2.0) {
                                       helperConsole("Symulation is too slow to catch clock ticks!!!!! - "+helperNumberFormat(clockHalfTicksFromPreviousCheck, 2, '.', ''));
                                       //now = 1.0/0.0;                                                              // TODO: better error handling
                                   }
                               break;
        }
        
        if (now>=switchingTimeFinish) {
            input = inputWaiting;
            this._computeOutput();

            if (output!=outputPrevoius)         // !!! this if speeds up simulation 100x times !!!
                changed = true;
            outputPrevoius = output;
        }
    }
    this.toggle = function () {
        switch (objClassCode) {
            case OBJ_INPUT:    objSpec.toggle(); break;
        }
    }
    this.setHeight = function () {
        switch (objClassCode) {
            case OBJ_INPUT:    objSpec.setHeight(); break;
        }
    }
    this.setLow = function () {
        switch (objClassCode) {
            case OBJ_INPUT:    objSpec.setLow(); break;
        }
    }
    this.getOutput = function() { return output; }
    this.getInput = function() { return input; }
    this.getInputWaiting = function() { return inputWaiting; }
    this.hasChanged = function() { return changed; }
    this.clearChanged = function() { changed = false; }
    this.getSize = function() { return size; }
    this.setSize = function(s) { size = s; }
    this.getInputBitsLocations = function() { return inputBitsLocations; }
    this.getOutputBitsLocations = function() { return outputBitsLocations; }
    this.getInputBitsTmpCoordinates = function() { return inputBitsTmpCoordinates; }
    this.getOutputBitsTmpCoordinates = function() { return outputBitsTmpCoordinates; }
    this.getInputBitsNESWLocations = function() { return inputBitsNESWLocations; }
    this.getOutputBitsNESWLocations = function() { return outputBitsNESWLocations; }
    this.setState = function(s) { state = s; }
    this.getState = function() { return state; }
    this.getInputBitsCount = function() { return inputBitsCount; }
    this.setInputBitsCount = function(ibc) { inputBitsCount = ibc; }
    this.getOutputBitsCount = function() { return outputBitsCount }
    this.setOutputBitsCount = function(obc) { outputBitsCount = obc; }
    this.getObjClass = function() { return objClass; }
    this.setObjClass = function(oc) { objClass = oc; }
    this.getObjClassCode = function() { return objClassCode; }
    this.clockFallingEdge = function() { }
    this.debug = function(depth) {
        var now = (new Date()).getTime();
        var indent = helperGenerateBits(depth, DEBUG_INDENT);
        return indent+'['+this.getObjClass()+'] inputWaiting: '+inputWaiting+', input: '+input+', output: '+output+', state: '+state+', switchingTimeProgress: '+this.getSwitchingTimeProgress(now)+', changed: '+(changed ? 'yes' : 'no');
    }
    this.reset = function() {
        var now = (new Date()).getTime();
        
        inputWaiting = helperGenerateBits(inputBitsCount, "?");
        input = inputWaiting;
        outputPrevoius = null;
        switchingTimeStart = now;
        switchingTimeFinish = now;
        this._computeOutput();
        changed = true;
    }
}


function GateNand(__p)
{
    var p = __p;

    this.configure = function() {
        p.setObjClass("GateNand");
        p.setSize(new Vector2d(64.0, 64.0)); 
        p.setInputBitsCount(2);
        p.getInputBitsLocations().push( new Vector2d(0, 20) );
        p.getInputBitsLocations().push( new Vector2d(0, 36) );
        p.setOutputBitsCount(1);
        p.getOutputBitsLocations().push( new Vector2d(56, 28) );
    }
    this.computeOutput = function() {
        var tmp;
        var newState = 0;
        switch (p.getInput()) {
            case "??": tmp = "1"; newState = 0; break;
            case "?0": tmp = "1"; newState = 0; break;
            case "?1": tmp = "1"; newState = 1; break;
            case "0?": tmp = "1"; newState = 0; break;
            case "00": tmp = "1"; newState = 0; break;
            case "01": tmp = "1"; newState = 1; break;
            case "1?": tmp = "1"; newState = 2; break;
            case "10": tmp = "1"; newState = 2; break;
            case "11": tmp = "0"; newState = 3; break;
        }
        p.setState(newState);
        return tmp;
    }
}


function Input(__p)
{
    var p = __p;
    
    this.configure = function() {
        p.setObjClass("Input");
        p.setSize(new Vector2d(32.0, 32.0)); 
        p.setInputBitsCount(0);
        p.setOutputBitsCount(1);
        p.getOutputBitsLocations().push( new Vector2d(24, 12) );
    }
    this.computeOutput = function() {
        return (p.getState()==1) ? "1" : "0";
    }
    this.toggle = function() {
        if (p.getState()==1)
            p.setState(0); else
            p.setState(1);
        p.clearChanged();
    }
    this.setHight = function() {
        p.setState(1);
        p.clearChanged();
    }
    this.setLow = function() {
        p.setState(0);
        p.clearChanged();
    }
}


function Output(__p)
{
    var p = __p;
    
    this.configure = function() {
        p.setObjClass("Output");
        p.setSize(new Vector2d(32.0, 32.0)); 
        p.setInputBitsCount(1);
        p.getInputBitsLocations().push( new Vector2d(0, 12) );
        p.setOutputBitsCount(0);
    }
    this.computeOutput = function() {
        if (p.getInput()=="1")
            p.setState(1); else 
            p.setState(0);
        return "";
    }
}


function WireLink(__p)
{
    var p = __p;
    
    this.configure = function() {
        p.setObjClass("WireLink");
        p.setSize(new Vector2d(16.0, 16.0)); 
        p.setInputBitsCount(1);
        p.getInputBitsLocations().push( new Vector2d(0, 4) );
        p.setOutputBitsCount(1);
        p.getOutputBitsLocations().push( new Vector2d(8, 4) );
    }
    this.computeOutput = function() {
        return p.getInput();
    }
}


function Clock(__p)
{
    var p = __p;
    var clockTimeStart;
    var clockHalfTicksFromPreviousCheck;
    
    this.configure = function() {
        p.setObjClass("Clock");
        p.setSize(new Vector2d(32.0, 32.0)); 
        p.setInputBitsCount(0);
        p.setOutputBitsCount(1);
        p.getOutputBitsLocations().push( new Vector2d(24, 12) );
        clockTimeStart = (new Date()).getTime();
        clockHalfTicksFromPreviousCheck = 0;
    }
    this.computeOutput = function() {
        return (p.getState()==1) ? "1" : "0";
    }
    this.toggle = function() {
        if (p.getState()==1)
            p.setState(0); else
            p.setState(1);
        p.clearChanged();
    }
    this.setHight = function() {
        p.setState(1);
        p.clearChanged();
    }
    this.setLow = function() {
        p.setState(0);
        p.clearChanged();
    }
    this.getClockFullHalfTicks = function(now) {
        return Math.floor( (now-clockTimeStart)/SIM_CLOCK_HALFCYCLE_TIME );
    }
    this.getClockHalfTicksFromPreviousCheck = function(now) {
        var ht = this.getClockFullHalfTicks(now);
        var diff = ht - clockHalfTicksFromPreviousCheck;
        clockHalfTicksFromPreviousCheck = ht;
        return diff;
    }
}


/**
 *  Module base template
 */

function ModuleObj()
{
    var obj = null;
    var name = "";
    var pos = new Vector2d();
    var selected = 0;
    var rotation = 0;
    var connInBitsCount = "_not_conn_";
    var connIn = new Array();
    var connInIterator = 0;
    var connOutBitsCount = "_not_conn_";
    var connOut = new Array();
    var connOutIterator = 0;

    this.setObjClass = function(objClass) {
        obj = new CombinationalBase();
        switch (objClass) {
            case "GateNand" : obj.configureAs(OBJ_GATENAND); break;
            case "Input"    : obj.configureAs(OBJ_INPUT); break;
            case "Output"   : obj.configureAs(OBJ_OUTPUT); break;
            case "WireLink" : obj.configureAs(OBJ_WIRELINK); break;
            case "Clock"    : obj.configureAs(OBJ_CLOCK); break;
            case "Hight"    : obj.configureAs(OBJ_HIGHT); break;
            case "Low"      : obj.configureAs(OBJ_LOW); break;
        }
    }
    this.rotate = function(rot) {
        switch (rotation) {
            case 0: switch (rot) {
                        case 0: break;
                        case 1: this.rotate90('right'); break;
                        case 2: this.rotate90('right'); this.rotate90('right'); break;
                        case 3: this.rotate90('left'); break;
                    } break;
            case 1: switch (rot) {
                        case 0: this.rotate90('left'); break;
                        case 1: break;
                        case 2: this.rotate90('right'); break;
                        case 3: this.rotate90('right'); this.rotate90('right'); break;
                    } break;
            case 2: switch (rot) {
                        case 0: this.rotate90('left'); this.rotate90('left'); break;
                        case 1: this.rotate90('left'); break;
                        case 2: break;
                        case 3: this.rotate90('right'); break;
                    } break;
            case 3: switch (rot) {
                        case 0: this.rotate90('right'); break;
                        case 1: this.rotate90('right'); this.rotate90('right'); break;
                        case 2: this.rotate90('left'); break;
                        case 3: break;
                    } break;
        }
    }
    this.rotate90 = function(side) {
        var iLoc, iLocC;
        var oLoc, oLocC;
        var sizeCenter = new Vector2d(obj.getSize().getX()/2.0, obj.getSize().getY()/2.0);
        var posObjCenter = pos.add(sizeCenter);
        var newPos = new Vector2d();
        var coordinateOffset = new Vector2d();
        var i;
        
        if (side!='left' && side!='right')
            return;
        
        iLoc = obj.getInputBitsLocations();
        iLocC = obj.getInputBitsCount();
        oLoc = obj.getOutputBitsLocations();
        oLocC = obj.getOutputBitsCount();
        
        // rotate obj position in module but keep pin's rendering location
        obj.getSize().swapAxes();
        newPos.setX( posObjCenter.getX() - sizeCenter.getY() );
        newPos.setY( posObjCenter.getY() - sizeCenter.getX() );
        coordinateOffset = pos.sub(newPos);
        pos = newPos.clone();
        for (i=0; i<iLocC; i++)
            iLoc[i] = iLoc[i].add(coordinateOffset);     // add correction
        for (i=0; i<oLocC; i++)
            oLoc[i] = oLoc[i].add(coordinateOffset);     // add correction
        
        // rotate pins
        sizeCenter = new Vector2d(obj.getSize().getX()/2.0, obj.getSize().getY()/2.0);
        posObjCenter = pos.add(sizeCenter);
        switch (side) {
            case 'left' : rotation = (rotation==0) ? 3 : (rotation-1);
                          for (i=0; i<iLocC; i++)
                              iLoc[i] = iLoc[i].rotate90Left(sizeCenter, new Vector2d(PIN_SIZE, PIN_SIZE));
                          for (i=0; i<oLocC; i++)
                              oLoc[i] = oLoc[i].rotate90Left(sizeCenter, new Vector2d(PIN_SIZE, PIN_SIZE));
                          break;
            case 'right': rotation = (rotation + 1) % 4;
                          for (i=0; i<iLocC; i++)
                              iLoc[i] = iLoc[i].rotate90Right(sizeCenter, new Vector2d(PIN_SIZE, PIN_SIZE));
                          for (i=0; i<oLocC; i++)
                              oLoc[i] = oLoc[i].rotate90Right(sizeCenter, new Vector2d(PIN_SIZE, PIN_SIZE));
                          break;
        }
        
        // rebuild pin directions (for bezier curves)
        helperSetupBitsNESWLocations(obj);
    }
    this.getObj = function() { return obj; }
    this.setName = function(n) { name = n; }
    this.getName = function() { return name; }
    this.setPos = function(p) { pos = p; }
    this.getPos = function() { return pos; }
    this.setSelected = function(s) { selected = s; }
    this.getSelected = function() { return selected; }
    this.setRotation = function(r) { rotation = r; }
    this.getRotation = function() { return rotation; }
    this.getConnInCount = function() { return connIn.length; }
    this.getConnInBitsCount = function() { return connInBitsCount; }
    this.addConnIn = function(__c, connIdx) {
        var bit;
        var bitStart;
        var bitsCount = (obj===null) ? __c.getOutputBitsCount() : obj.getInputBitsCount();
        
        if (connIn.length==0)
            connInBitsCount = helperGenerateBits(bitsCount, "0");
        connIn.push(connIdx);
        
        bitStart = __c.getModuleConnByIndex(connIdx).getObjB_bitStart();
        
        if (bitStart>=bitsCount)
            helperConsole('[ERROR] - addConnIn, trying to connect to many bits in '+__c.getObjClass()+'!');

        bit = parseInt( connInBitsCount.charAt(bitStart) );
        bit++;
        if (bit>1)
            helperConsole('[ERROR] - addConnIn, multiple wire to one input in '+__c.getObjClass()+'!');

        connInBitsCount = connInBitsCount.replaceAt(bitStart, bit+"");
    }
    this.connInIteratorReset = function() { connInIterator = 0; }
    this.connInIteratorGetNext = function() {
        return (connInIterator==connIn.length) ? null : connIn[connInIterator++];
    }
    this.getConnOutCount = function() { return connOut.length; }
    this.getConnOutBitsCount = function() { return connOutBitsCount; }
    this.addConnOut = function(__c, connIdx) {
        var bit;
        var bitStart;
        var bitsCount = (obj===null) ? __c.getInputBitsCount() : obj.getOutputBitsCount();
        
        if (connOut.length==0)
            connOutBitsCount = helperGenerateBits(bitsCount, "0");
        connOut.push(connIdx);
        
        bitStart = __c.getModuleConnByIndex(connIdx).getObjA_bitStart();
        if (bitStart>=bitsCount)
            helperConsole('[ERROR] - addConnOut, trying to connect to many bits in '+__c.getObjClass()+'!');

        bit = parseInt( connOutBitsCount.charAt(bitStart) );
        bit++;

        connOutBitsCount = connOutBitsCount.replaceAt(bitStart, bit+"");
    }
    this.connOutIteratorReset = function() { connOutIterator = 0; }
    this.connOutIteratorGetNext = function() {
        return (connOutIterator==connOut.length) ? null : connOut[connOutIterator++];
    }
    
    this.debug = function(depth) {
        if (obj!==null)
            return obj.debug(depth);
        return "";
    }
}

function ModuleConn()
{
    var objA_name;
    var objB_name;
    var objA_bitStart;
    var objB_bitStart;
    var objA_index;
    var objB_index;
    
    this.setObjA_name = function(oAn) { objA_name = oAn; }
    this.getObjA_name = function() { return objA_name; }
    this.setObjB_name = function(oBn) { objB_name = oBn; }
    this.getObjB_name = function() { return objB_name; }
    this.setObjA_bitStart = function(oAbs) { objA_bitStart = oAbs; }
    this.getObjA_bitStart = function() { return objA_bitStart; }
    this.setObjB_bitStart = function(oBbs) { objB_bitStart = oBbs; }
    this.getObjB_bitStart = function() { return objB_bitStart; }
    this.setObjA_index = function(oAi) { objA_index = oAi; }
    this.getObjA_index = function() { return objA_index; }
    this.setObjB_index = function(oBi) { objB_index = oBi; }
    this.getObjB_index = function() { return objB_index; }
}

function Module()
{
    var savedData = null;      // not used;
    var atInputData = "";
    var atOutputData = "";
    var nonStableCount = 0;
    var previousInputData = "";
    var previousOutputData = "";
    var objClass = "";
    var inputBitsCount = 0;
    var outputBitsCount = 0;
    var moduleObjs = new Array();
    var moduleConns = new Array();
    
    this.getNonStableCount = function() { return nonStableCount; }
    this.getModuleObjByIndex = function(idx) { return moduleObjs[idx]; }
    this.getModuleConnByIndex = function(idx) { return moduleConns[idx]; }
    this.getModuleObjs = function() { return moduleObjs; }
    this.getModuleConns = function() { return moduleConns; }
    this.addModuleObj = function(type, name) {                     // editor API
        var obj = new ModuleObj();
        obj.setObjClass(type);
        obj.setName(name);
        moduleObjs.push(obj);
    }
    this.removeModuleObj = function(name) {                        // editor API
        // TODO
        // zalozenie najpierw usuniete wszystkie polaczenia ?
    }
    this.getModuleObj = function(name) {                           // editor API
        var i;
        var tmpIdx = null;
        for (i=0; i<moduleObjs.length; i++)
            if (moduleObjs[i].getName()==name)
                tmpIdx = i;
        if (tmpIdx===null)
            return null;
        return moduleObjs[tmpIdx];
    }
    this.addConn = function(objA_name, objB_name,                  // editor API
                            objA_bitStart, objB_bitStart) {
        var conn = new ModuleConn();
        var i, tmpIdx;
        
        conn.setObjA_name(objA_name);
        conn.setObjB_name(objB_name);
        conn.setObjA_bitStart(objA_bitStart);
        conn.setObjB_bitStart(objB_bitStart);
        
        // check objA name
        tmpIdx = null;
        for (i=0; i<moduleObjs.length; i++)
            if (moduleObjs[i].getName()==objA_name)
                tmpIdx = i;
        if (tmpIdx===null)
            helperConsole('[ERROR] - addConn, objA_name not found in '+objClass+'!');
        conn.setObjA_index(tmpIdx);
        
        // check objB name
        tmpIdx = null;
        for (i=0; i<moduleObjs.length; i++)
            if (moduleObjs[i].getName()==objB_name)
                tmpIdx = i;
        if (tmpIdx===null)
            helperConsole('[ERROR] - addConn, objB_name not found in '+objClass+'!');
        conn.setObjB_index(tmpIdx);
        
        // add connection do array
        moduleConns.push(conn);
        
        // find connected objects and add new connection index
        moduleObjs[conn.getObjB_index()].addConnIn(this, moduleConns.length-1);
        moduleObjs[conn.getObjA_index()].addConnOut(this, moduleConns.length-1);
    }
    
    this.removeConn = function(idx) {                              // editor API
        // TODO
    }
    this.setInputBitsCount = function(ib) { inputBitsCount = ib; }
    this.getInputBitsCount = function() { return inputBitsCount; }
    this.setOutputBitsCount = function(ob) { outputBitsCount = ob; }
    this.getOutputBitsCount = function() { return outputBitsCount; }
    this.setObjClass = function(oc) { objClass = oc; }
    this.getObjClass = function() { return objClass; }
    this.setInputData = function(bits, bitStart) {
        if ((bits.length+bitStart)>inputBitsCount)
            helperConsole('[ERROR] setInputData too long in '+objClass);
        var i;
        for (i=0; i<bits.length; i++) {
            atInputData = atInputData.replaceAt(bitStart+i, bits[i]);
        }
    }
    this.__getOutputData = function() {
        var i;
        var dataBits;
        var bitToPropagate;
        var connIdx;
        var connObj;
        var objA, objB;
        
        // 'propagation loop': 
        for (i=0; i<moduleObjs.length; i++) {

            objA = moduleObjs[i].getObj();
            
            objA.timeLapse();

            if (objA.hasChanged()) {    // propagate only if object has new data at output
                dataBits = objA.getOutput();
                
                // TODO prevent propagating same as previous output (!!!)
                
                // for each connection propagate signal
                moduleObjs[i].connOutIteratorReset();
                while ((connIdx=moduleObjs[i].connOutIteratorGetNext())!==null) {
                    connObj = moduleConns[connIdx];
                    objB = moduleObjs[connObj.getObjB_index()].getObj();
                    
                    bitToPropagate = dataBits.toString().charAt(connObj.getObjA_bitStart());
                    objB.setInput(bitToPropagate, connObj.getObjB_bitStart());
                }
                
                objA.clearChanged();
            }

        }
    }
    this.getOutputData = function() {
        this.__getOutputData();
        if (atInputData!=previousInputData || atOutputData!=previousOutputData) {
            nonStableCount++;
            if (nonStableCount>SIM_NON_STABLE_MAX) {
                nonStableCount--;
                SIM_FLAG_NON_STABLE = true;
            }
        } else {
            nonStableCount = 0;
        }
        previousInputData = atInputData;
        previousOutputData = atOutputData;

        return atOutputData;
    }
    this.clockFallingEdge = function() {
        var i, obj;
        for (i=0; i<moduleObjs.length; i++) {
            obj = moduleObjs[i].getObj();
            if (obj)
                obj.clockFallingEdge();
        }
    }
    this.debug = function(depth) {
        var indent = helperGenerateBits(depth, DEBUG_INDENT);
        var indent2 = helperGenerateBits(depth+1, DEBUG_INDENT);
        var i, j;
        var debug = "";
        var connIdx;
        var intexToShow = new Array();
        
        for (i=2; i<moduleObjs.length; i++) {
            if (i==2) {
                intexToShow.push(0);
            }

            intexToShow.push(i);
            
            if (i==moduleObjs.length-1) {
                intexToShow.push(1);
            }
        }
        
        debug = debug + indent + '['+objClass+'] in: '+atInputData+', out: '+atOutputData+', nonStableCount: '+nonStableCount + "\n";
        debug = debug + indent + '{' + "\n";
        debug = debug + indent + DEBUG_INDENT + 'active elements count: ' + (moduleObjs.length-2) + "\n";  // minus __input and __output
        for (j=0; j<intexToShow.length; j++) {
            i = intexToShow[j];
            
            // generic obj info
            if (i==0) {
                debug = debug + indent2 + "[__input]" + ", name: '" + moduleObjs[i].getName() + "'" + "\n";
            } else
                if (i==1) {
                    debug = debug + indent2 + "[__output]" + ", name: '" + moduleObjs[i].getName() + "'" + "\n";
                } else {
                    debug = debug + moduleObjs[i].debug(depth+1) + ", name: '" + moduleObjs[i].getName() + "'" + "\n";
                }
            
            // in info
            if (i!=0) {
                debug = debug + indent + DEBUG_INDENT + DEBUG_INDENT + 
                        "connInCount: " + moduleObjs[i].getConnInCount() + ', ' +
                        "connInBitsCount: [" + moduleObjs[i].getConnInBitsCount() + '], ' +
                        "connectedFrom: ";

                moduleObjs[i].connInIteratorReset();
                while ((connIdx=moduleObjs[i].connInIteratorGetNext())!==null) {
                    debug = debug + '[' + "'" + moduleConns[connIdx].getObjA_name() + "', "
                                              + moduleConns[connIdx].getObjA_bitStart() + ", "
                                              + moduleConns[connIdx].getObjB_bitStart() +
                                    '] ';
                }
                debug = debug + "\n";
            }
            
            // out info
            if (i!=1) {
                debug = debug + indent + DEBUG_INDENT + DEBUG_INDENT + 
                        "connOutCount: " + moduleObjs[i].getConnOutCount() + ', ' +
                        "connOutBitsCount: [" + moduleObjs[i].getConnOutBitsCount() + '], ' +
                        "connectedTo: ";
                moduleObjs[i].connOutIteratorReset();
                while ((connIdx=moduleObjs[i].connOutIteratorGetNext())!==null) {
                    debug = debug + '[' + "'" + moduleConns[connIdx].getObjB_name() + "', "
                                              + moduleConns[connIdx].getObjA_bitStart() + ", "
                                              + moduleConns[connIdx].getObjB_bitStart() +
                                    '] ';
                }
                debug = debug + "\n";
            }
        }
        debug = debug + indent + '}';
        
        return debug;
    }
}
