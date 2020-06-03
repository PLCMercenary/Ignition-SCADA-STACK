//讀取
exports.ReadStatus = function (slaveid, addstart, length, func) {
    var packet;
    if (func == 0x01) {
        packet = Fc1(slaveid, parseInt(addstart, 10), length);
    }
    else if (func == 0x02) {
        packet = Fc2(slaveid, parseInt(addstart, 10), length);
    }
    else if (func == 0x03) {
        packet = Fc3(slaveid, parseInt(addstart, 10), length);
    }
    else if (func == 0x04) {
        packet = Fc4(slaveid, parseInt(addstart, 10), length);
    }
    return packet;
}
exports.WriteBitStatus = function (slaveid, addstart, value) {
    var packet = Fc5(slaveid, parseInt(addstart, 10), value);
    return packet;
}
exports.MutiWriteBitStatus = function (slaveid, addstart, length, values) {
    var packet = Fc15(slaveid, parseInt(addstart, 10), length, values);
    return packet;
}
exports.WriteByteStatus = function (slaveid, addstart, value) {
    var packet = Fc6(slaveid, parseInt(addstart, 10), value);
    return packet;
}
exports.MutiWriteByteStatus = function (slaveid, addstart, length, values) {
    var packet = Fc16(slaveid, parseInt(addstart, 10), length, values);
    return packet;
}

exports.getResCount = function (length, func) {
    switch (func) {
        case 1:
            return 6 + Math.floor((length - 1) / 8);
        case 2:
            return 6 + Math.floor((length - 1) / 8);
        case 3:
        case 4:
            return 5 + 2 * length;
        case 5:
        case 6:
        case 16:
            return 8;
    }
    return 0;
}

// ----------------------------------------------
// just like union convert in c
// https://stackoverflow.com/questions/25942516/double-to-byte-array-conversion-in-javascript
var cTool = {};
cTool.base_buffer = new ArrayBuffer(2);
cTool.int8_view = new Int8Array(cTool.base_buffer);
cTool.int16_view = new Int16Array(cTool.base_buffer);
// ----------------------------------------------
// exception table
// http://www.simplymodbus.ca/exceptions.htm
var excetion_lists = [];
excetion_lists['1'] = "Illegal Function";
excetion_lists['2'] = "Illegal Data Address";
excetion_lists['3'] = "Illegal Data Value";
excetion_lists['4'] = "Slave Device Failure";
excetion_lists['5'] = "Acknowledge";
excetion_lists['6'] = "Slave Device Busy";
excetion_lists['7'] = "Negative Acknowledge";
excetion_lists['8'] = "Memory Parity Error";
excetion_lists['9'] = "Gateway Path Unavailable";
excetion_lists['10'] = "Illegal Function";
excetion_lists['11'] = "Gateway Target Device Failed to Respond";
// ----------------------------------------------

//Decoder
exports.ModbusDecoder = function (data) {
    let value = [];
    switch (data[1]) { //FC code
        case 1:
        case 2:
            for (let idx_bytes = 3; idx_bytes < data.length - 2; idx_bytes++) {
                const tmp_byte = data[idx_bytes];
                for (let idx_bits = 0; idx_bits < 8; idx_bits++) {
                    let bit_value = (tmp_byte >> idx_bits) & 0x1 === 1 ? true : false;
                    value.push(bit_value);
                }
            }
            return value;
        case 3:
        case 4:
            for (let idx_bytes = 3; idx_bytes < data.length - 2; idx_bytes += 2) {
                cTool.int8_view[1] = data[idx_bytes];
                cTool.int8_view[0] = data[idx_bytes + 1];
                value.push(cTool.int16_view[0]);
            }
            return value;


        case 5:
        case 6:
        case 15:
        case 16:
            return true;
        default:
            return false;

    }
}


exports.GetException = function (data) {
    if ((data[1] & 0x80) == 0x80) {
        let exception = {};
        exception.code = data[2];
        exception.msg = excetion_lists[data[2]];
        return exception;
    }
    return null;
}

//確認CRC
exports.CheckCRC = function (buff) {
    var CRCFull = 0xFFFF;
    var CRCHigh = 0xFF;
    var CRCLow = 0xFF;
    var CRCLSB;
    var len = buff.length;
    for (i = 0; i < (len - 2); i++) {
        CRCFull = CRCFull ^ buff[i];
        for (j = 0; j < 8; j++) {
            CRCLSB = CRCFull & 0x0001;
            CRCFull = (CRCFull >> 1) | 0x0000;
            if (CRCLSB === 1) {
                CRCFull = CRCFull ^ 0xA001;
            }
        }
        CRCLow = CRCFull & 0xFF;
        CRCHigh = (CRCFull >> 8) & 0xFF;
    }
    if (buff[len - 2] == CRCLow && buff[len - 1] == CRCHigh)
        return true;
    else
        return false;
}
//產生CRC
CreateCRC = function (buff) {
    var CRCFull = 0xFFFF;
    var CRCHigh = 0xFF;
    var CRCLow = 0xFF;
    var CRCLSB;
    var len = buff.length;
    for (i = 0; i < (len - 2); i++) {
        CRCFull = CRCFull ^ buff[i];
        for (j = 0; j < 8; j++) {
            CRCLSB = CRCFull & 0x0001;
            CRCFull = (CRCFull >> 1) | 0x0000;
            if (CRCLSB === 1) {
                CRCFull = CRCFull ^ 0xA001;
            }
        }
        CRCLow = CRCFull & 0xFF;
        CRCHigh = (CRCFull >> 8) & 0xFF;
    }
    buff[len - 2] = CRCLow;
    buff[len - 1] = CRCHigh;
}
//Fc1
function Fc1(id, addstart, length) {
    let packet = new Buffer(8);
    BuildPacketWithLen(id, 1, addstart, length, packet);
    return packet;
}
//Fc2
function Fc2(id, addstart, length) {
    let packet = new Buffer(8);
    BuildPacketWithLen(id, 2, addstart, length, packet);
    return packet;
}
//Fc3
function Fc3(id, addstart, length) {
    let packet = new Buffer(8);
    BuildPacketWithLen(id, 3, addstart, length, packet);
    return packet;
}
//Fc4
function Fc4(id, addstart, length) {
    let packet = new Buffer(8);
    BuildPacketWithLen(id, 4, addstart, length, packet);
    return packet;
}
//Fc5
function Fc5(id, addstart, value) {
    let packet = new Buffer(8);
    if (value == true) {
        packet[4] = 0xFF;
        packet[5] = 0x00;
    }
    else if (value == false) {
        packet[4] = 0x00;
        packet[5] = 0x00;
    }
    BuildPacket(id, 5, addstart, packet);
    return packet;
}
//Fc6
function Fc6(id, addstart, value) {
    let packet = new Buffer(8);

    cTool.int16_view[0] = value;
    packet[4] = cTool.int8_view[1];
    packet[5] = cTool.int8_view[0];

    BuildPacket(id, 6, addstart, packet);
    return packet;
}
//Fc16
function Fc16(id, addstart, length, values) {
    let packet = new Buffer(9 + 2 * length);
    packet[6] = length * 2;
    for (let idx_pkg = 7, idx_values = 0; idx_pkg < packet.length - 2; idx_pkg += 2, idx_values++) {
        cTool.int16_view[0] = values[idx_values];
        packet[idx_pkg] = cTool.int8_view[1];
        packet[idx_pkg + 1] = cTool.int8_view[0];
    }
    BuildPacketWithLen(id, 16, addstart, length, packet);
    return packet;
}

function bools2buffer(iBools) {
    let buffer_length = Math.floor((iBools.length - 1) / 8) + 1;
    let rValue = new Buffer(buffer_length);
    for (let i = 0; i < iBools.length; i++) {
        let byte_idx = Math.floor(i / 8);
        let bit_idx = i % 8;

        if (iBools[i])
            rValue[byte_idx] |= 1 << bit_idx;
        else
            rValue[byte_idx] &= ~(1 << bit_idx);
    }

    return rValue;
}

//Fc15 
function Fc15(id, addstart, length, values) {
    var value_bytes = Math.floor((length - 1) / 8) + 1;
    var packet = new Buffer(9 + value_bytes);
    packet[6] = value_bytes;

    let bytes = bools2buffer(values);
    for (var i = 0; i < value_bytes; i++) {
        packet[7 + i] = bytes[i];
    }
    BuildPacketWithLen(id, 15, addstart, length, packet);
    return packet;
}
//Build Packet
function BuildPacketWithLen(id, func, addstart, len, packet) {
    packet[0] = id;
    packet[1] = func;

    cTool.int16_view[0] = addstart;
    packet[2] = cTool.int8_view[1];
    packet[3] = cTool.int8_view[0];

    cTool.int16_view[0] = len;
    packet[4] = cTool.int8_view[1];
    packet[5] = cTool.int8_view[0];
    CreateCRC(packet);
    return packet;
}
function BuildPacket(id, func, addstart, packet) {
    packet[0] = id;
    packet[1] = func;

    cTool.int16_view[0] = addstart;
    packet[2] = cTool.int8_view[1];
    packet[3] = cTool.int8_view[0];
    CreateCRC(packet);
    return packet;
}