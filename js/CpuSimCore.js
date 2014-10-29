var SIM_FLAG_NON_STABLE = false;
var SIM_FLAG_FLOATING_WIRE = false;
var SIM_NON_STABLE_MAX = 10;
var SIM_FLOATING_WIRE_MAX = 10;
var DEBUG_INDENT = "    ";
var execTimeStart = new Date().getTime();



/**
 *  Helpers
 */

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
    this.len = function() { return Math.sqrt(x*x + y*y); };
    this.dot = function(b) { return x*b.getX() + y*b.getY(); }
    
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

String.prototype.replaceAt = function(index, chr)
{
    if (index > (this.length-1)) return this;
    return this.substr(0, index) + chr + this.substr(index+chr.length);
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



/**
 *  Generic combinational logic
 */

function CombinationalBase()
{
    var savedData = null;       // not used
    var atInputData = "";
    var atOutputData = "";
    var nonStableCount = 0;
    var floatingWireCount = 0;
    var previousInputData = "";
    var previousOutputData = "";

    this.getNonStableCount = function() { return nonStableCount; }
    this.getAtInputData = function() { return atInputData; }
    this.resetPropagateState = function(__c) {
        if (atInputData=="")
            atInputData = helperGenerateBits(__c.getInputBitsCount(), "?");
        if (atOutputData=="")
            atOutputData = helperGenerateBits(__c.getOutputBitsCount(), "?");
        nonStableCount = 0;
        floatingWireCount = 0;
    }
    this.setInputData = function(__c, bits, bitStart) {
        if ((bits.length+bitStart)>__c.getInputBitsCount())
            console.log('[ERROR] setInputData too long in '+__c.getObjClass());
        var i;
        for (i=0; i<bits.length; i++) {
            atInputData = atInputData.replaceAt(bitStart+i, bits[i]);
        }
    }
    this.getOutputData = function(__c) {
        atOutputData = "";
        if (__c.isReadyToPropagate()) {
            atOutputData = __c.__getOutputData();
            if (atInputData!=previousInputData || atOutputData!=previousOutputData) {
                nonStableCount++;
                if (nonStableCount>SIM_NON_STABLE_MAX) {
                    atOutputData = -1;
                    SIM_FLAG_NON_STABLE = true;
                    console.log('[ERROR] non stable in '+__c.getObjClass());
                }
            }
            previousInputData = atInputData;
            previousOutputData = atOutputData;
        } else {
            floatingWireCount++;
            if (floatingWireCount>SIM_FLOATING_WIRE_MAX) {
                SIM_FLAG_FLOATING_WIRE = true;
                console.log('[ERROR] floating wire in '+__c.getObjClass());
            }
            atOutputData = null;
        }
        return atOutputData;
    }
    this.debug = function(__c, depth) {
        var indent = helperGenerateBits(depth, DEBUG_INDENT);
        return indent+'['+__c.getObjClass()+'] in: '+atInputData+', out: '+atOutputData+', nonStableCount: '+nonStableCount+', floatingWireCount: '+floatingWireCount+', isReadyToPropagate: '+(__c.isReadyToPropagate() ? 'yes' : 'no');
    }
}

function GateNand()
{
    var __b = new CombinationalBase();
    var objClass = "GateNand";
    var inputBitsCount = 2;
    var outputBitsCount = 1;
    var size = new Vector2d(50.0, 50.0);
    var inputBitsLocations = new Array();
    var outputBitsLocations = new Array();
    
    inputBitsLocations.push( new Vector2d(0, 14) );
    inputBitsLocations.push( new Vector2d(0, 30) );
    outputBitsLocations.push( new Vector2d(44, 22) );
    
    this.getSize = function() { return size; }
    this.getInputBitsLocations = function() { return inputBitsLocations; }
    this.getOutputBitsLocations = function() { return outputBitsLocations; }
    this.isReadyToPropagate = function() {
        var atInputData = __b.getAtInputData();
        if (atInputData.length==0)
            return false;
        if (atInputData[0]!="?" || atInputData[1]!="?")
            return true;
            return false;
    }
    this.__getOutputData = function() {
        var atInputData = __b.getAtInputData();
        var atOutputData = "";
        
        switch (atInputData) {
            case "??": atOutputData = "?"; break;
            case "?0": atOutputData = "1"; break;
            case "?1": atOutputData = helperGetRandomInt(0, 1).toString(); break;
            case "0?": atOutputData = "1"; break;
            case "00": atOutputData = "1"; break;
            case "01": atOutputData = "1"; break;
            case "1?": atOutputData = helperGetRandomInt(0, 1).toString(); break;
            case "10": atOutputData = "1"; break;
            case "11": atOutputData = "0"; break;
        }
        
        return atOutputData;
    }
    this.getNonStableCount = function() { return __b.getNonStableCount(); }
    this.getInputBitsCount = function() { return inputBitsCount; }
    this.getOutputBitsCount = function() { return outputBitsCount }
    this.getObjClass = function() { return objClass; }
    this.resetPropagateState = function() { __b.resetPropagateState(this); }
    this.setInputData = function(bits, bitStart) { __b.setInputData(this, bits, bitStart); }
    this.getOutputData = function() { return __b.getOutputData(this); }
    this.clockFallingEdge = function() { /* nothing */ }
    this.debug = function(depth) { return __b.debug(this, depth); }
}

function FullAdder()
{
    var __b = new CombinationalBase();
    var objClass = "FullAdder";
    var inputBitsCount = 3;
    var outputBitsCount = 2;
    var size = new Vector2d(70.0, 45.0);
    var inputBitsLocations = new Array();
    var outputBitsLocations = new Array();
    
    inputBitsLocations.push( new Vector2d(0, 5) );
    inputBitsLocations.push( new Vector2d(0, 15) );
    inputBitsLocations.push( new Vector2d(0, 30) );
    outputBitsLocations.push( new Vector2d(10, 38) );
    outputBitsLocations.push( new Vector2d(30, 38) );
    
    this.getSize = function() { return size; }
    this.getInputBitsLocations = function() { return inputBitsLocations; }
    this.getOutputBitsLocations = function() { return outputBitsLocations; }
    this.isReadyToPropagate = function() {
        var atInputData = __b.getAtInputData();
        var i;
        if (atInputData.length==0)
            return false;
        for (i=0; i<atInputData.length; i++)
            if (atInputData[i]=="?")
                return false;
        return true;
    }
    this.__getOutputData = function() {
        var atInputData = __b.getAtInputData();
        var atOutputData = "";
        
        switch (atInputData) {
            case "000": atOutputData = "00"; break;
            case "001": atOutputData = "01"; break;
            case "010": atOutputData = "01"; break;
            case "011": atOutputData = "10"; break;
            case "100": atOutputData = "01"; break;
            case "101": atOutputData = "10"; break;
            case "110": atOutputData = "10"; break;
            case "111": atOutputData = "11"; break;
        }
        
        return atOutputData;
    }
    this.getNonStableCount = function() { return __b.getNonStableCount(); }
    this.getInputBitsCount = function() { return inputBitsCount; }
    this.getOutputBitsCount = function() { return outputBitsCount }
    this.getObjClass = function() { return objClass; }
    this.resetPropagateState = function() { __b.resetPropagateState(this); }
    this.setInputData = function(bits, bitStart) { __b.setInputData(this, bits, bitStart); }
    this.getOutputData = function() { return __b.getOutputData(this); }
    this.clockFallingEdge = function() {  }
    this.debug = function(depth) { return __b.debug(this, depth); }
}

/*
 * add sizes and pin locations
function Adder8bit()
{
    var BITS = 8;
    var __b = new CombinationalBase();
    var objClass = "Adder"+BITS+"bit";
    var inputBitsCount = BITS*2 + 1;
    var outputBitsCount = BITS + 1;
    
    this.isReadyToPropagate = function() {
        var atInputData = __b.getAtInputData();
        var i;
        if (atInputData.length==0)
            return false;
        for (i=0; i<atInputData.length; i++)
            if (atInputData[i]=="?")
                return false;
        return true;
    }
    this.__getOutputData = function() {
        var atInputData = __b.getAtInputData();
        var atOutputData = "";
        var a, b;
        var sum;
        
        a = atInputData.toString().substr(0, BITS);
        b = atInputData.toString().substr(BITS, BITS);
        sum = helperFromBin(a) + helperFromBin(b) + parseInt(atInputData[BITS*2], 2);
        
        atOutputData = helperToBin(sum, BITS+1);
        
        return atOutputData;
    }
    this.getNonStableCount = function() { return __b.getNonStableCount(); }
    this.getInputBitsCount = function() { return inputBitsCount; }
    this.getOutputBitsCount = function() { return outputBitsCount }
    this.getObjClass = function() { return objClass; }
    this.resetPropagateState = function() { __b.resetPropagateState(this); }
    this.setInputData = function(bits, bitStart) { __b.setInputData(this, bits, bitStart); }
    this.getOutputData = function() { return __b.getOutputData(this); }
    this.clockFallingEdge = function() {  }
    this.debug = function(depth) { return __b.debug(this, depth); }
}

function Adder16bit()
{
    var BITS = 16;
    var __b = new CombinationalBase();
    var objClass = "Adder"+BITS+"bit";
    var inputBitsCount = BITS*2 + 1;
    var outputBitsCount = BITS + 1;
    
    this.isReadyToPropagate = function() {
        var atInputData = __b.getAtInputData();
        var i;
        if (atInputData.length==0)
            return false;
        for (i=0; i<atInputData.length; i++)
            if (atInputData[i]=="?")
                return false;
        return true;
    }
    this.__getOutputData = function() {
        var atInputData = __b.getAtInputData();
        var atOutputData = "";
        var a, b;
        var sum;
        
        a = atInputData.toString().substr(0, BITS);
        b = atInputData.toString().substr(BITS, BITS);
        sum = helperFromBin(a) + helperFromBin(b) + parseInt(atInputData[BITS*2], 2);
        
        atOutputData = helperToBin(sum, BITS+1);
        
        return atOutputData;
    }
    this.getNonStableCount = function() { return __b.getNonStableCount(); }
    this.getInputBitsCount = function() { return inputBitsCount; }
    this.getOutputBitsCount = function() { return outputBitsCount }
    this.getObjClass = function() { return objClass; }
    this.resetPropagateState = function() { __b.resetPropagateState(this); }
    this.setInputData = function(bits, bitStart) { __b.setInputData(this, bits, bitStart); }
    this.getOutputData = function() { return __b.getOutputData(this); }
    this.clockFallingEdge = function() {  }
    this.debug = function(depth) { return __b.debug(this, depth); }
}

function Adder24bit()
{
    var BITS = 24;
    var __b = new CombinationalBase();
    var objClass = "Adder"+BITS+"bit";
    var inputBitsCount = BITS*2 + 1;
    var outputBitsCount = BITS + 1;
    
    this.isReadyToPropagate = function() {
        var atInputData = __b.getAtInputData();
        var i;
        if (atInputData.length==0)
            return false;
        for (i=0; i<atInputData.length; i++)
            if (atInputData[i]=="?")
                return false;
        return true;
    }
    this.__getOutputData = function() {
        var atInputData = __b.getAtInputData();
        var atOutputData = "";
        var a, b;
        var sum;
        
        a = atInputData.toString().substr(0, BITS);
        b = atInputData.toString().substr(BITS, BITS);
        sum = helperFromBin(a) + helperFromBin(b) + parseInt(atInputData[BITS*2], 2);
        
        atOutputData = helperToBin(sum, BITS+1);
        
        return atOutputData;
    }
    this.getNonStableCount = function() { return __b.getNonStableCount(); }
    this.getInputBitsCount = function() { return inputBitsCount; }
    this.getOutputBitsCount = function() { return outputBitsCount }
    this.getObjClass = function() { return objClass; }
    this.resetPropagateState = function() { __b.resetPropagateState(this); }
    this.setInputData = function(bits, bitStart) { __b.setInputData(this, bits, bitStart); }
    this.getOutputData = function() { return __b.getOutputData(this); }
    this.clockFallingEdge = function() {  }
    this.debug = function(depth) { return __b.debug(this, depth); }
}
*/



/**
 *  Generic memory logic
 */

function DFlipFlopBase()
{
    var savedData = "_init_me_";
    var atInputData = "";
    var atOutputData = "";
    var nonStableCount = 0;
    var floatingWireCount = 0;
    var previousInputData = "";
    var previousOutputData = "";
    
    this.getNonStableCount = function() { return nonStableCount; }
    this.getAtInputData = function() { return atInputData; }
    this.resetPropagateState = function(__c) {
        if (savedData=="_init_me_")
            savedData = helperGenerateBitsRand(__c.getBITS());
        if (atInputData=="")
            atInputData = helperGenerateBits(__c.getInputBitsCount(), "?");
        atOutputData = savedData;
        nonStableCount = 0;
        floatingWireCount = 0;
    }
    this.isReadyToPropagate = function(__c) {
        var i;
        if (atInputData.length==0)
            return false;
        for (i=0; i<atInputData.length; i++)
            if (atInputData[i]=="?")
                return false;
        return true;
    }
    this.setInputData = function(__c, bits, bitStart) {
        if ((bits.length+bitStart)>__c.getInputBitsCount())
            console.log('[ERROR] setInputData too long in '+__c.getObjClass());
        var i;
        for (i=0; i<bits.length; i++) {
            atInputData = atInputData.replaceAt(bitStart+i, bits[i]);
        }
    }
    this.getOutputData = function(__c) {
        atOutputData = "";
        if ( ! this.isReadyToPropagate()) {
            floatingWireCount++;
            if (floatingWireCount>SIM_FLOATING_WIRE_MAX) {
                SIM_FLAG_FLOATING_WIRE = true;
                console.log('[ERROR] floating wire in '+__c.getObjClass());
            }
        }
        atOutputData = savedData;     // always return saved data
        nonStableCount++;             // flip flop is always non stable to force signal propagation in 'propagation loop''
        
        return atOutputData;
    }
    this.clockFallingEdge = function(__c) {
        if ( ! this.isReadyToPropagate()) {
            SIM_FLAG_FLOATING_WIRE = true;
            console.log('[ERROR] clockFallingEdge, floating wire in '+__c.getObjClass());
        }
        
        if (atInputData[atInputData.length-1]=="1") {   // check RESET bit
            savedData = helperGenerateBits(__c.getBITS(), "0");
        } else {
            savedData = atInputData.toString().substr(0, __c.getBITS());
        }
    }
    this.debug = function(__c, depth) {
        var indent = helperGenerateBits(depth, DEBUG_INDENT);
        return indent+'['+__c.getObjClass()+'] in: '+atInputData+', out: '+atOutputData+', savedData: '+savedData+', nonStableCount: '+nonStableCount+', floatingWireCount: '+floatingWireCount+', isReadyToPropagate: '+(__c.isReadyToPropagate() ? 'yes' : 'no');
    }
}

function DFlipFlop()
{
    var BITS = 1;
    var __b = new DFlipFlopBase();
    var objClass = "DFlipFlop";
    var inputBitsCount = BITS+1;
    var outputBitsCount = BITS;
    
    this.getBITS = function() { return BITS; }
    this.getNonStableCount = function() { return __b.getNonStableCount(); }
    this.isReadyToPropagate = function() { return __b.isReadyToPropagate(this); }
    this.getInputBitsCount = function() { return inputBitsCount; }
    this.getOutputBitsCount = function() { return outputBitsCount }
    this.getObjClass = function() { return objClass; }
    this.resetPropagateState = function() { __b.resetPropagateState(this); }
    this.setInputData = function(bits, bitStart) { __b.setInputData(this, bits, bitStart); }
    this.getOutputData = function() { return __b.getOutputData(this); }
    this.clockFallingEdge = function() { __b.clockFallingEdge(this); }
    this.debug = function(depth) { return __b.debug(this, depth); }
}

function Register8Bit()
{
    var BITS = 8;
    var __b = new DFlipFlopBase();
    var objClass = "Register"+BITS+"Bit";
    var inputBitsCount = BITS+1;
    var outputBitsCount = BITS;
    
    this.getBITS = function() { return BITS; }
    this.getNonStableCount = function() { return __b.getNonStableCount(); }
    this.isReadyToPropagate = function() { return __b.isReadyToPropagate(this); }
    this.getInputBitsCount = function() { return inputBitsCount; }
    this.getOutputBitsCount = function() { return outputBitsCount }
    this.getObjClass = function() { return objClass; }
    this.resetPropagateState = function() { __b.resetPropagateState(this); }
    this.setInputData = function(bits, bitStart) { __b.setInputData(this, bits, bitStart); }
    this.getOutputData = function() { return __b.getOutputData(this); }
    this.clockFallingEdge = function() { __b.clockFallingEdge(this); }
    this.debug = function(depth) { return __b.debug(this, depth); }
}



/**
 *  Module base template
 */

function ModuleObj()
{
    var obj = null;
    var name = "";
    var pos = new Vector2d();
    var connInBitsCount = "_not_conn_";
    var connIn = new Array();
    var connInIterator = 0;
    var connOutBitsCount = "_not_conn_";
    var connOut = new Array();
    var connOutIterator = 0;

    this.setObjClass = function(objClass) {
        if (objClass!="__input" && objClass!="__output")
            obj = new window[objClass];
    }
    this.getObj = function() { return obj; }
    this.setName = function(n) { name = n; }
    this.getName = function() { return name; }
    this.setPos = function(p) { pos = p; }
    this.getPos = function() { return pos; }
    this.getConnInCount = function() { return connIn.length; }
    this.getConnInBitsCount = function() { return connInBitsCount; }
    this.addConnIn = function(__c, connIdx) {
        var bit;
        var bitStart;
        var bitLen;
        var bitsCount = (obj===null) ? __c.getOutputBitsCount() : obj.getInputBitsCount();
        var i;
        
        if (connIn.length==0)
            connInBitsCount = helperGenerateBits(bitsCount, "0");
        connIn.push(connIdx);
        
        bitStart = __c.getModuleConnByIndex(connIdx).getObjB_bitStart();
        bitLen = __c.getModuleConnByIndex(connIdx).getObjB_bitLen();
        for (i=bitStart; i<bitStart+bitLen; i++) {
            if (i>=bitsCount)
                console.log('[ERROR] - addConnIn, trying to connect to many bits in '+__c.getObjClass()+'!');
            
            bit = parseInt( connInBitsCount.charAt(i) );
            bit++;
            if (bit>1)
                console.log('[ERROR] - addConnIn, multiple wire to one input in '+__c.getObjClass()+'!');
            
            connInBitsCount = connInBitsCount.replaceAt(i, bit+"");
        }
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
        var bitLen;
        var bitsCount = (obj===null) ? __c.getInputBitsCount() : obj.getOutputBitsCount();
        var i;
        
        if (connOut.length==0)
            connOutBitsCount = helperGenerateBits(bitsCount, "0");
        connOut.push(connIdx);
        
        bitStart = __c.getModuleConnByIndex(connIdx).getObjA_bitStart();
        bitLen = __c.getModuleConnByIndex(connIdx).getObjA_bitLen();
        for (i=bitStart; i<bitStart+bitLen; i++) {
            if (i>=bitsCount)
                console.log('[ERROR] - addConnOut, trying to connect to many bits in '+__c.getObjClass()+'!');
            
            bit = parseInt( connOutBitsCount.charAt(i) );
            bit++;
            
            connOutBitsCount = connOutBitsCount.replaceAt(i, bit+"");
        }
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
    var objA_bitLen;
    var objB_bitStart;
    var objB_bitLen;
    var objA_index;
    var objB_index;
    
    this.setObjA_name = function(oAn) { objA_name = oAn; }
    this.getObjA_name = function() { return objA_name; }
    this.setObjB_name = function(oBn) { objB_name = oBn; }
    this.getObjB_name = function() { return objB_name; }
    this.setObjA_bitStart = function(oAbs) { objA_bitStart = oAbs; }
    this.getObjA_bitStart = function() { return objA_bitStart; }
    this.setObjA_bitLen = function(oAbl) { objA_bitLen = oAbl; }
    this.getObjA_bitLen = function() { return objA_bitLen; }
    this.setObjB_bitStart = function(oBbs) { objB_bitStart = oBbs; }
    this.getObjB_bitStart = function() { return objB_bitStart; }
    this.setObjB_bitLen = function(oBbl) { objB_bitLen = oBbl; }
    this.getObjB_bitLen = function() { return objB_bitLen; }
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
    var floatingWireCount = 0;
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
        if (moduleObjs.length==0) {
            var objIn = new ModuleObj();
            var objOut = new ModuleObj();
            
            objIn.setObjClass("__input");
            objIn.setName("__input");
            
            objOut.setObjClass("__output");
            objOut.setName("__output");
            
            moduleObjs.push(objIn);
            moduleObjs.push(objOut);
        }
        
        var obj = new ModuleObj();
        obj.setObjClass(type);
        obj.setName(name);
        moduleObjs.push(obj);
    }
    this.removeModuleObj = function(name) {                        // editor API
        // TODO
        // zalozenie najpierw usuniete wszystkie polaczenia
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
    this.moveModuleObj = function(name, newPos) {                  // editor API
        var obj;
        
        obj = this.getModuleObj(name);
        if (obj!==null)
            obj.setPos(newPos);
    }
    this.addConn = function(objA_name, objB_name,                  // editor API
                            objA_bitStart, objA_bitLen, 
                            objB_bitStart, objB_bitLen) {
        var conn = new ModuleConn();
        var i, tmpIdx;
        
        if (objA_bitLen!=objB_bitLen)
            console.log('[ERROR] - addConn, bit len are not equal in '+objClass+'!');
        
        conn.setObjA_name(objA_name);
        conn.setObjB_name(objB_name);
        conn.setObjA_bitStart(objA_bitStart);
        conn.setObjB_bitStart(objB_bitStart);
        conn.setObjA_bitLen(objA_bitLen);
        conn.setObjB_bitLen(objB_bitLen);
        
        // check objA name
        tmpIdx = null;
        for (i=0; i<moduleObjs.length; i++)
            if (moduleObjs[i].getName()==objA_name)
                tmpIdx = i;
        if (tmpIdx===null)
            console.log('[ERROR] - addConn, objA_name not found in '+objClass+'!');
        conn.setObjA_index(tmpIdx);
        
        // check objB name
        tmpIdx = null;
        for (i=0; i<moduleObjs.length; i++)
            if (moduleObjs[i].getName()==objB_name)
                tmpIdx = i;
        if (tmpIdx===null)
            console.log('[ERROR] - addConn, objB_name not found in '+objClass+'!');
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
    this.isReadyToPropagate = function() {
        var i;
        if (atInputData.length==0)
            return false;
        for (i=0; i<atInputData.length; i++)
            if (atInputData[i]=="?")
                return false;
        return true;
    }
    this.setInputBitsCount = function(ib) { inputBitsCount = ib; }
    this.getInputBitsCount = function() { return inputBitsCount; }
    this.setOutputBitsCount = function(ob) { outputBitsCount = ob; }
    this.getOutputBitsCount = function() { return outputBitsCount; }
    this.setObjClass = function(oc) { objClass = oc; }
    this.getObjClass = function() { return objClass; }
    this.resetPropagateState = function() { 
        var i, obj;
        for (i=0; i<moduleObjs.length; i++) {
            obj = moduleObjs[i].getObj();
            if (obj)
                obj.resetPropagateState();
        }
        
        if (atInputData=="")
            atInputData = helperGenerateBits(inputBitsCount, "?");
        if (atOutputData=="")
            atOutputData = helperGenerateBits(outputBitsCount, "?");
        nonStableCount = 0;
        floatingWireCount = 0;
    }
    this.setInputData = function(bits, bitStart) {
        if ((bits.length+bitStart)>inputBitsCount)
            console.log('[ERROR] setInputData too long in '+objClass);
        var i;
        for (i=0; i<bits.length; i++) {
            atInputData = atInputData.replaceAt(bitStart+i, bits[i]);
        }
    }
    this.__getOutputData = function() {
        var i, j, obj;
        var dataBits;
        var subDataBits;
        var connIdx;
        var simError = false;
        var stableSignals;
        
        // 'propagation loop':
        while (true) {
            stableSignals = true;
            
            // reset state in all objects for each 'propagation loop'
            for (i=0; i<moduleObjs.length; i++) {
                obj = moduleObjs[i].getObj();
                if (obj)
                    obj.resetPropagateState();
            }
            
            for (i=0; i<moduleObjs.length; i++) {

                if (i==0) {
                    // __input
                    dataBits = atInputData;
                } else
                    if (i==1) {
                        // __output
                        continue;
                    } else {
                        // normal object
                        obj = moduleObjs[i].getObj();
                        dataBits = obj.getOutputData();
                    }
                    
                if (dataBits===null) {
                    // floating wire
                    if (SIM_FLAG_FLOATING_WIRE) {
                        simError = true;
                        break;
                    }
                    stableSignals = false;
                } else
                    if (dataBits===-1) {
                        // non stable   
                        if (SIM_FLAG_NON_STABLE) {
                            simError = true;
                            break;
                        }
                        stableSignals = false;
                    } else {
                        // normal output
                        
                        // if obj!='__input' & obj is stable (has same input/output) we don't propagate signal to other connected objects
                        if (i!=0 && moduleObjs[i].getObj().getNonStableCount()==0)
                            continue;
                        
                        // for each connection propagate signal
                        if (i!=0)
                            stableSignals = false;
                        
                        moduleObjs[i].connOutIteratorReset();
                        while ((connIdx=moduleObjs[i].connOutIteratorGetNext())!==null) {
                            subDataBits = dataBits.toString().substr(moduleConns[connIdx].getObjA_bitStart(), moduleConns[connIdx].getObjA_bitLen());
                            
                            if (moduleConns[connIdx].getObjB_index()!=1) {
                                moduleObjs[moduleConns[connIdx].getObjB_index()].getObj().setInputData(subDataBits, moduleConns[connIdx].getObjB_bitStart());
                            } else {
                                // output
                                for (j=0; j<moduleConns[connIdx].getObjB_bitLen(); j++) {
                                    atOutputData = atOutputData.replaceAt(moduleConns[connIdx].getObjB_bitStart()+j, subDataBits[j]);
                                }
                            }
                        }
                    }
            }
            
            if (stableSignals)
                break;
            
            if (simError)
                break;
        }

    }
    this.getOutputData = function() {
        if (this.isReadyToPropagate()) {
            this.__getOutputData();
            if (atInputData!=previousInputData || atOutputData!=previousOutputData) {
                nonStableCount++;
                if (nonStableCount>SIM_NON_STABLE_MAX) {
                    atOutputData = -1;
                    SIM_FLAG_NON_STABLE = true;
                    console.log('[ERROR] non stable in '+objClass);
                }
            }
            previousInputData = atInputData;
            previousOutputData = atOutputData;
        } else {
            floatingWireCount++;
            if (floatingWireCount>SIM_FLOATING_WIRE_MAX) {
                SIM_FLAG_FLOATING_WIRE = true;
                console.log('[ERROR] floating wire in '+objClass);
            }
            atOutputData = null;
        }
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
        
        debug = debug + indent + '['+objClass+'] in: '+atInputData+', out: '+atOutputData+', nonStableCount: '+nonStableCount+', floatingWireCount: '+floatingWireCount+', isReadyToPropagate: '+(this.isReadyToPropagate() ? 'yes' : 'no') + "\n";
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
                                              + moduleConns[connIdx].getObjA_bitLen() + ", "
                                              + moduleConns[connIdx].getObjB_bitStart() + ", "
                                              + moduleConns[connIdx].getObjB_bitLen() +
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
                                              + moduleConns[connIdx].getObjA_bitLen() + ", "
                                              + moduleConns[connIdx].getObjB_bitStart() + ", "
                                              + moduleConns[connIdx].getObjB_bitLen() +
                                    '] ';
                }
                debug = debug + "\n";
            }
        }
        debug = debug + indent + '}';
        
        return debug;
    }
}



/**
 *  Basic modules
 */

function ModuleGateAnd()
{
    var box = new Module();
    
    // configure module
    box.setObjClass('ModuleGateAnd');
    box.addModuleObj('GateNand', 'nand');                      // nand
    box.addModuleObj('GateNand', 'not');                       // not
    
    box.setInputBitsCount(2);
    box.setOutputBitsCount(1);
    
    box.addConn('__input', 'nand', 0, 2, 0, 2);
    box.addConn('nand', 'not', 0, 1, 0, 1);
    box.addConn('nand', 'not', 0, 1, 1, 1);
    box.addConn('not', '__output', 0, 1, 0, 1);
    
    this.getNonStableCount = function() { return box.getNonStableCount(); }
    this.isReadyToPropagate = function() { return box.isReadyToPropagate(); }
    this.getInputBitsCount = function() { return box.getInputBitsCount(); }
    this.getOutputBitsCount = function() { return box.getOutputBitsCount(); }
    this.getObjClass = function() { return box.getObjClass(); }
    this.resetPropagateState = function() { box.resetPropagateState(); }
    this.setInputData = function(bits, bitStart) { box.setInputData(bits, bitStart); }
    this.getOutputData = function() { return box.getOutputData(); }
    this.clockFallingEdge = function() { box.clockFallingEdge(); }
    this.debug = function(depth) { return box.debug(depth); }
}

function ModuleGateNot()
{
    var box = new Module();
    
    // configure module
    box.setObjClass('ModuleGateNot');
    box.addModuleObj('GateNand', 'not');                       // not
    
    box.setInputBitsCount(1);
    box.setOutputBitsCount(1);
    
    box.addConn('__input', 'not', 0, 1, 0, 1);
    box.addConn('__input', 'not', 0, 1, 1, 1);
    box.addConn('not', '__output', 0, 1, 0, 1);
    
    this.getNonStableCount = function() { return box.getNonStableCount(); }
    this.isReadyToPropagate = function() { return box.isReadyToPropagate(); }
    this.getInputBitsCount = function() { return box.getInputBitsCount(); }
    this.getOutputBitsCount = function() { return box.getOutputBitsCount(); }
    this.getObjClass = function() { return box.getObjClass(); }
    this.resetPropagateState = function() { box.resetPropagateState(); }
    this.setInputData = function(bits, bitStart) { box.setInputData(bits, bitStart); }
    this.getOutputData = function() { return box.getOutputData(); }
    this.clockFallingEdge = function() { box.clockFallingEdge(); }
    this.debug = function(depth) { return box.debug(depth); }
}

function ModuleGateOr()
{
    var box = new Module();
    
    // configure module
    box.setObjClass('ModuleGateOr');
    box.addModuleObj('GateNand', 'notTop');                          // not
    box.addModuleObj('GateNand', 'notBottom');                       // not
    box.addModuleObj('GateNand', 'nand');                            // nand
    
    box.setInputBitsCount(2);
    box.setOutputBitsCount(1);
    
    box.addConn('__input', 'notTop', 0, 1, 0, 1);
    box.addConn('__input', 'notTop', 0, 1, 1, 1);
    box.addConn('__input', 'notBottom', 1, 1, 0, 1);
    box.addConn('__input', 'notBottom', 1, 1, 1, 1);
    
    box.addConn('notTop', 'nand', 0, 1, 0, 1);
    box.addConn('notBottom', 'nand', 0, 1, 1, 1);
    
    box.addConn('nand', '__output', 0, 1, 0, 1);
    
    this.getNonStableCount = function() { return box.getNonStableCount(); }
    this.isReadyToPropagate = function() { return box.isReadyToPropagate(); }
    this.getInputBitsCount = function() { return box.getInputBitsCount(); }
    this.getOutputBitsCount = function() { return box.getOutputBitsCount(); }
    this.getObjClass = function() { return box.getObjClass(); }
    this.resetPropagateState = function() { box.resetPropagateState(); }
    this.setInputData = function(bits, bitStart) { box.setInputData(bits, bitStart); }
    this.getOutputData = function() { return box.getOutputData(); }
    this.clockFallingEdge = function() { box.clockFallingEdge(); }
    this.debug = function(depth) { return box.debug(depth); }
}

function ModuleGateNor()
{
    var box = new Module();
    
    // configure module
    box.setObjClass('ModuleGateNor');
    box.addModuleObj('GateNand', 'notTop');                          // not
    box.addModuleObj('GateNand', 'notBottom');                       // not
    box.addModuleObj('GateNand', 'nand');                            // nand
    box.addModuleObj('GateNand', 'not');                             // not
    
    box.setInputBitsCount(2);
    box.setOutputBitsCount(1);
    
    box.addConn('__input', 'notTop', 0, 1, 0, 1);
    box.addConn('__input', 'notTop', 0, 1, 1, 1);
    box.addConn('__input', 'notBottom', 1, 1, 0, 1);
    box.addConn('__input', 'notBottom', 1, 1, 1, 1);
    
    box.addConn('notTop', 'nand', 0, 1, 0, 1);
    box.addConn('notBottom', 'nand', 0, 1, 1, 1);
    
    box.addConn('nand', 'not', 0, 1, 0, 1);
    box.addConn('nand', 'not', 0, 1, 1, 1);
    
    box.addConn('not', '__output', 0, 1, 0, 1);
    
    this.getNonStableCount = function() { return box.getNonStableCount(); }
    this.isReadyToPropagate = function() { return box.isReadyToPropagate(); }
    this.getInputBitsCount = function() { return box.getInputBitsCount(); }
    this.getOutputBitsCount = function() { return box.getOutputBitsCount(); }
    this.getObjClass = function() { return box.getObjClass(); }
    this.resetPropagateState = function() { box.resetPropagateState(); }
    this.setInputData = function(bits, bitStart) { box.setInputData(bits, bitStart); }
    this.getOutputData = function() { return box.getOutputData(); }
    this.clockFallingEdge = function() { box.clockFallingEdge(); }
    this.debug = function(depth) { return box.debug(depth); }
}

function ModuleGateXor()
{
    var box = new Module();
    
    // configure module
    box.setObjClass('ModuleGateXor');
    box.addModuleObj('GateNand', '1col');
    box.addModuleObj('GateNand', '2col_1');
    box.addModuleObj('GateNand', '2col_2');
    box.addModuleObj('GateNand', '3col');
    
    box.setInputBitsCount(2);
    box.setOutputBitsCount(1);
    
    box.addConn('__input', '2col_1', 0, 1, 0, 1);
    box.addConn('__input', '1col', 0, 1, 0, 1);

    box.addConn('__input', '1col', 1, 1, 1, 1);
    box.addConn('__input', '2col_2', 1, 1, 1, 1);
    
    box.addConn('1col', '2col_1', 0, 1, 1, 1);
    box.addConn('1col', '2col_2', 0, 1, 0, 1);
    
    box.addConn('2col_1', '3col', 0, 1, 0, 1);
    box.addConn('2col_2', '3col', 0, 1, 1, 1);
    
    box.addConn('3col', '__output', 0, 1, 0, 1);
    
    this.getNonStableCount = function() { return box.getNonStableCount(); }
    this.isReadyToPropagate = function() { return box.isReadyToPropagate(); }
    this.getInputBitsCount = function() { return box.getInputBitsCount(); }
    this.getOutputBitsCount = function() { return box.getOutputBitsCount(); }
    this.getObjClass = function() { return box.getObjClass(); }
    this.resetPropagateState = function() { box.resetPropagateState(); }
    this.setInputData = function(bits, bitStart) { box.setInputData(bits, bitStart); }
    this.getOutputData = function() { return box.getOutputData(); }
    this.clockFallingEdge = function() { box.clockFallingEdge(); }
    this.debug = function(depth) { return box.debug(depth); }
}

function ModuleGateXnor()
{
    var box = new Module();
    
    // configure module
    box.setObjClass('ModuleGateXnor');
    box.addModuleObj('GateNand', '1col');
    box.addModuleObj('GateNand', '2col_1');
    box.addModuleObj('GateNand', '2col_2');
    box.addModuleObj('GateNand', '3col');
    box.addModuleObj('GateNand', 'not');
    
    box.setInputBitsCount(2);
    box.setOutputBitsCount(1);
    
    box.addConn('__input', '2col_1', 0, 1, 0, 1);
    box.addConn('__input', '1col', 0, 1, 0, 1);

    box.addConn('__input', '1col', 1, 1, 1, 1);
    box.addConn('__input', '2col_2', 1, 1, 1, 1);
    
    box.addConn('1col', '2col_1', 0, 1, 1, 1);
    box.addConn('1col', '2col_2', 0, 1, 0, 1);
    
    box.addConn('2col_1', '3col', 0, 1, 0, 1);
    box.addConn('2col_2', '3col', 0, 1, 1, 1);
    
    box.addConn('3col', 'not', 0, 1, 0, 1);
    box.addConn('3col', 'not', 0, 1, 1, 1);
    
    box.addConn('not', '__output', 0, 1, 0, 1);
    
    this.getNonStableCount = function() { return box.getNonStableCount(); }
    this.isReadyToPropagate = function() { return box.isReadyToPropagate(); }
    this.getInputBitsCount = function() { return box.getInputBitsCount(); }
    this.getOutputBitsCount = function() { return box.getOutputBitsCount(); }
    this.getObjClass = function() { return box.getObjClass(); }
    this.resetPropagateState = function() { box.resetPropagateState(); }
    this.setInputData = function(bits, bitStart) { box.setInputData(bits, bitStart); }
    this.getOutputData = function() { return box.getOutputData(); }
    this.clockFallingEdge = function() { box.clockFallingEdge(); }
    this.debug = function(depth) { return box.debug(depth); }
}

function ModuleFullAdder()
{
    var box = new Module();
    
    // configure module
    box.setObjClass('ModuleFullAdder');
    box.addModuleObj('ModuleGateXor', 'xor_1');
    box.addModuleObj('ModuleGateXor', 'xor_2');
    box.addModuleObj('ModuleGateAnd', 'and_t');
    box.addModuleObj('ModuleGateAnd', 'and_b');
    box.addModuleObj('ModuleGateOr', 'or');
    
    box.setInputBitsCount(3);
    box.setOutputBitsCount(2);
    
    box.addConn('__input', 'xor_1', 0, 2, 0, 2);
    box.addConn('__input', 'xor_2', 2, 1, 1, 1);
    box.addConn('__input', 'and_b', 0, 1, 0, 1);
    box.addConn('__input', 'and_b', 1, 1, 1, 1);
    box.addConn('__input', 'and_t', 2, 1, 1, 1);
   
    box.addConn('xor_1', 'xor_2', 0, 1, 0, 1);
    box.addConn('xor_1', 'and_t', 0, 1, 0, 1);
    
    box.addConn('and_t', 'or', 0, 1, 0, 1);
    box.addConn('and_b', 'or', 0, 1, 1, 1);
    
    box.addConn('xor_2', '__output', 0, 1, 1, 1);
    box.addConn('or', '__output', 0, 1, 0, 1);
    
    this.getNonStableCount = function() { return box.getNonStableCount(); }
    this.isReadyToPropagate = function() { return box.isReadyToPropagate(); }
    this.getInputBitsCount = function() { return box.getInputBitsCount(); }
    this.getOutputBitsCount = function() { return box.getOutputBitsCount(); }
    this.getObjClass = function() { return box.getObjClass(); }
    this.resetPropagateState = function() { box.resetPropagateState(); }
    this.setInputData = function(bits, bitStart) { box.setInputData(bits, bitStart); }
    this.getOutputData = function() { return box.getOutputData(); }
    this.clockFallingEdge = function() { box.clockFallingEdge(); }
    this.debug = function(depth) { return box.debug(depth); }
}

function ModuleAdder24bit()
{
    var BITS = 24;
    var pos;
    var box = new Module();
    
    // configure module
    box.setObjClass('ModuleAdder'+BITS+'bit');
    for (pos=0; pos<BITS; pos++) {
        box.addModuleObj('ModuleFullAdder', 'pos_'+pos);
    }
    
    box.setInputBitsCount(BITS*2 + 1);
    box.setOutputBitsCount(BITS + 1);
    
    pos = 0;
    box.addConn('__input', 'pos_0', BITS*2, 1, 2, 1);                  // carry in
    box.addConn('__input', 'pos_0', (BITS-1)-pos, 1, 0, 1);            // A
    box.addConn('__input', 'pos_0', (BITS*2-1)-pos, 1, 1, 1);          // B
    box.addConn('pos_0', '__output', 1, 1, BITS-pos, 1);  // sum
    
    for (pos=1; pos<BITS; pos++) {
        box.addConn('pos_'+(pos-1), 'pos_'+pos, 0, 1, 2, 1);                  // carry in
        box.addConn('__input', 'pos_'+pos, (BITS-1)-pos, 1, 0, 1);            // A
        box.addConn('__input', 'pos_'+pos, (BITS*2-1)-pos, 1, 1, 1);          // B
        box.addConn('pos_'+pos, '__output', 1, 1, BITS-pos, 1);               // sum
    }
    
    box.addConn('pos_'+(BITS-1), '__output', 0, 1, 0, 1);                      // carry out
    
    this.getNonStableCount = function() { return box.getNonStableCount(); }
    this.isReadyToPropagate = function() { return box.isReadyToPropagate(); }
    this.getInputBitsCount = function() { return box.getInputBitsCount(); }
    this.getOutputBitsCount = function() { return box.getOutputBitsCount(); }
    this.getObjClass = function() { return box.getObjClass(); }
    this.resetPropagateState = function() { box.resetPropagateState(); }
    this.setInputData = function(bits, bitStart) { box.setInputData(bits, bitStart); }
    this.getOutputData = function() { return box.getOutputData(); }
    this.clockFallingEdge = function() { box.clockFallingEdge(); }
    this.debug = function(depth) { return box.debug(depth); }
}

function ModuleDLatch()
{
    var box = new Module();
    
    // configure module
    box.setObjClass('ModuleDLatch');
    box.addModuleObj('GateNand', 'set');                       // not
    box.addModuleObj('GateNand', 'reset');                     // not
    box.addModuleObj('GateNand', 'topNand');
    box.addModuleObj('GateNand', 'bottomNand');
    box.setInputBitsCount(2);
    box.setOutputBitsCount(1);
    box.addConn('__input', 'set', 0, 1, 0, 1);
    box.addConn('__input', 'set', 0, 1, 1, 1);
    box.addConn('__input', 'reset', 1, 1, 0, 1);
    box.addConn('__input', 'reset', 1, 1, 1, 1);
    
    box.addConn('set', 'topNand', 0, 1, 0, 1);
    box.addConn('reset', 'bottomNand', 0, 1, 0, 1);
    
    box.addConn('topNand', 'bottomNand', 0, 1, 1, 1);
    box.addConn('bottomNand', 'topNand', 0, 1, 1, 1);
    
    box.addConn('topNand', '__output', 0, 1, 0, 1);
    
    this.getNonStableCount = function() { return box.getNonStableCount(); }
    this.isReadyToPropagate = function() { return box.isReadyToPropagate(); }
    this.getInputBitsCount = function() { return box.getInputBitsCount(); }
    this.getOutputBitsCount = function() { return box.getOutputBitsCount(); }
    this.getObjClass = function() { return box.getObjClass(); }
    this.resetPropagateState = function() { box.resetPropagateState(); }
    this.setInputData = function(bits, bitStart) { box.setInputData(bits, bitStart); }
    this.getOutputData = function() { return box.getOutputData(); }
    this.clockFallingEdge = function() { box.clockFallingEdge(); }
    this.debug = function(depth) { return box.debug(depth); }
}



