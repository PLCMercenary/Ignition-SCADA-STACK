module.exports = function (RED) {

    var modbus_rtu = require('./modbus_rtu.js');

    function isBool(iValue) {
        return typeof (iValue) === "boolean";
    }

    function isNumber(iValue) {
        return typeof (iValue) === "number";
    }

    function PollingNode(n) {
        RED.nodes.createNode(this, n);
        this.timeouts = n.timeouts;
        this.interval = n.interval;
        this.rules = n.rules;
        this.disable_polling = n.disable_polling;
        var node = this;

        var rx_buffer = [];
        var write_request_list = [];
        this.on("input", function (msg) {

            // 通訊input
            if (Buffer.isBuffer(msg.response)) {
                for (let index = 0; index < msg.response.length; index++) {
                    const element = msg.response[index];
                    rx_buffer.push(element);
                }
            }

            // control polling behavior on continuou, step or stop.
            if (msg.poll != null) {
                if (msg.poll === "start") {
                    enable_polling = true;
                    //node.disable_polling = false;
                    task_type = "start";
                }
                else if (msg.poll === "stop") {
                    enable_polling = false;
                    //node.disable_polling = true;
                    task_type = "stop";

                }
                else if (msg.poll === "once") {
                    enable_polling = true;
                    task_type = "once";
                }
            }

            // write command input
            if (msg.write) {
                if (Number(msg.write.address) != 'NaN') {
                    //console.log(typeof(msg.write.data));
                    //console.log(Array.isArray(msg.write.data));
                    if (Array.isArray(msg.write.data)) {
                        if (msg.write.data.length) {
                            if (msg.write.data.every(isBool)) {
                                // FC15
                                let write = {};
                                write.rule = msg.write;

                                write.pkgs = [];
                                let numbers = msg.write.data.length;

                                let idx_start = 0;
                                // For a write command, the limit is 1968 coils or 123 registers.
                                while (numbers > 1968) {
                                    let addr = msg.write.address + idx_start;
                                    let values = msg.write.data.slice(idx_start, idx_start + 1968);
                                    let pkg = {};
                                    pkg.bytes = modbus_rtu.MutiWriteBitStatus(slave_id, addr, values.length, values);
                                    pkg.response = {};

                                    pkg.slave_id = slave_id;
                                    pkg.fc_code = 15;
                                    pkg.addr_start = addr;
                                    pkg.regs_num = 1968;
                                    pkg.values = values;

                                    write.pkgs.push(pkg);

                                    idx_start += 1968;
                                    numbers -= 1968;
                                }
                                let addr = msg.write.address + idx_start;
                                let values = msg.write.data.slice(idx_start);
                                let pkg = {};
                                pkg.bytes = modbus_rtu.MutiWriteBitStatus(slave_id, addr, values.length, values);
                                pkg.response = {};

                                pkg.slave_id = slave_id;
                                pkg.fc_code = 16;
                                pkg.addr_start = addr;
                                pkg.regs_num = values.length;
                                pkg.values = values;

                                write.pkgs.push(pkg);
                                write_request_list.push(write);
                            }
                            else if (msg.write.data.every(isNumber)) {
                                // FC16
                                let write = {};
                                write.rule = msg.write;

                                write.pkgs = [];
                                let numbers = msg.write.data.length;

                                let idx_start = 0;
                                // For a write command, the limit is 1968 coils or 123 registers.
                                while (numbers > 123) {
                                    let addr = msg.write.address + idx_start;
                                    let values = msg.write.data.slice(idx_start, idx_start + 123);
                                    let pkg = {};
                                    pkg.bytes = modbus_rtu.MutiWriteByteStatus(slave_id, addr, values.length, values);
                                    pkg.response = {};

                                    pkg.slave_id = slave_id;
                                    pkg.fc_code = 16;
                                    pkg.addr_start = addr;
                                    pkg.regs_num = 123;
                                    pkg.values = values;

                                    write.pkgs.push(pkg);

                                    idx_start += 123;
                                    numbers -= 123;
                                }
                                let addr = msg.write.address + idx_start;
                                let values = msg.write.data.slice(idx_start);
                                let pkg = {};
                                pkg.bytes = modbus_rtu.MutiWriteByteStatus(slave_id, addr, values.length, values);
                                pkg.response = {};

                                pkg.slave_id = slave_id;
                                pkg.fc_code = 16;
                                pkg.addr_start = addr;
                                pkg.regs_num = values.length;
                                pkg.values = values;

                                write.pkgs.push(pkg);
                                write_request_list.push(write);
                            }
                        }
                    }
                    else {
                        if (isBool(msg.write.data)) {
                            // FC05
                            let write = {};
                            write.rule = msg.write;
                            write.pkgs = [];
                            let pkg = {};
                            pkg.bytes = modbus_rtu.WriteBitStatus(slave_id, msg.write.address, msg.write.data);
                            pkg.response = {};

                            pkg.slave_id = slave_id;
                            pkg.fc_code = 5;
                            pkg.addr_start = msg.write.address;
                            pkg.regs_num = 1;
                            pkg.values = msg.write.data;

                            write.pkgs.push(pkg);
                            write_request_list.push(write);
                        }
                        else if (isNumber(msg.write.data)) {
                            // FC06
                            let write = {};
                            write.rule = msg.write;
                            write.pkgs = [];
                            let pkg = {};
                            pkg.bytes = modbus_rtu.WriteByteStatus(slave_id, msg.write.address, msg.write.data);
                            pkg.response = {};

                            pkg.slave_id = slave_id;
                            pkg.fc_code = 6;
                            pkg.addr_start = msg.write.address;
                            pkg.regs_num = 1;
                            pkg.values = msg.write.data;

                            write.pkgs.push(pkg);
                            write_request_list.push(write);
                        }
                    }
                }
            }
            //node.send([null, msg, null]);
        });

        this.on('close', function (removed, done) {
            if (removed) {
                // This node has been deleted
                //console.log("This node has been deleted");
            }
            else {
                // This node is being restarted
                //console.log("This node is being restarted");
            }
            clearInterval(loop_handle);
            done();
        });

        // --------------------------------------
        // make 規則的細節 from rules;
        // --------------------------------------
        var slave_id = 1;
        var rule_detail = []; // 規則的細節    

        for (let index = 0; index < this.rules.length; index++) {
            const element = this.rules[index];
            let request = {};
            request.rule = element;

            let fc_code = 0;
            switch (element.access) {
                case "RW_Bits":
                    fc_code = 0x01;
                    break;
                case "RO_Bits":
                    fc_code = 0x02;
                    break;
                case "RW_Regs":
                    fc_code = 0x03;
                    break;
                case "RO_Regs":
                    fc_code = 0x04;
                    break;
                default:
                    fc_code = 0xFF;
                    break;
            }

            // 因為modbus有規定一筆存取記憶體數量的上限
            let tmp_start_addr = parseInt(element.regs_addr);
            let tmp_regs_num = parseInt(element.regs_num);
            let pkgs = []; // 這筆rule轉換成多少的封包

            if (fc_code == 0x1 || fc_code == 0x2) {
                // max bit type regs number is 2000.
                while (tmp_regs_num > 2000) {
                    let pkg = {}; // 封包的內容
                    pkg.slave_id = slave_id;
                    pkg.fc_code = fc_code;

                    pkg.addr_start = tmp_start_addr;
                    pkg.regs_num = 2000;
                    pkg.bytes = modbus_rtu.ReadStatus(pkg.slave_id, pkg.addr_start, pkg.regs_num, pkg.fc_code);
                    pkg.response = {};
                    pkg.response.expected_len = modbus_rtu.getResCount(pkg.regs_num, pkg.fc_code);
                    pkgs.push(pkg);

                    tmp_regs_num -= 2000;
                    tmp_start_addr += 2000;
                }

                let pkg = {}; // 封包的內容
                pkg.slave_id = slave_id;
                pkg.fc_code = fc_code;

                pkg.addr_start = tmp_start_addr;
                pkg.regs_num = tmp_regs_num;
                pkg.bytes = modbus_rtu.ReadStatus(pkg.slave_id, pkg.addr_start, pkg.regs_num, pkg.fc_code);
                pkg.response = {};
                pkg.response.expected_len = modbus_rtu.getResCount(pkg.regs_num, pkg.fc_code);
                pkgs.push(pkg);
            }
            else if (fc_code == 0x3 || fc_code == 0x4) {
                // max Numerical type(int16) regs number is 125.
                while (tmp_regs_num > 125) {
                    let pkg = {}; // 封包的內容
                    pkg.slave_id = slave_id;
                    pkg.fc_code = fc_code;

                    pkg.addr_start = tmp_start_addr;
                    pkg.regs_num = 125;
                    pkg.bytes = modbus_rtu.ReadStatus(pkg.slave_id, pkg.addr_start, pkg.regs_num, pkg.fc_code);
                    pkg.response = {};
                    pkg.response.expected_len = modbus_rtu.getResCount(pkg.regs_num, pkg.fc_code);
                    pkgs.push(pkg);

                    tmp_regs_num -= 125;
                    tmp_start_addr += 125;
                }

                let pkg = {}; // 封包的內容
                pkg.slave_id = slave_id;
                pkg.fc_code = fc_code;

                pkg.addr_start = tmp_start_addr;
                pkg.regs_num = tmp_regs_num;
                pkg.bytes = modbus_rtu.ReadStatus(pkg.slave_id, pkg.addr_start, pkg.regs_num, pkg.fc_code);
                pkg.response = {};
                pkg.response.expected_len = modbus_rtu.getResCount(pkg.regs_num, pkg.fc_code);
                pkgs.push(pkg);
            }
            request.pkgs = pkgs;
            rule_detail.push(request);
        }
        // --------------------------------------
        // end of make 規則的細節 from rules;
        // --------------------------------------

        // --------------------------------------
        // node state machine
        // --------------------------------------
        var loop_handle = setInterval(loop_function, 1);
        var task_step = "initial";
        var task_type = "";
        var time_tx = new Date().getTime();
        var time_get_value = new Date().getTime();

        var read_rule_idx = 0;
        var read_pkg_idx = 0;
        var write_pkg_idx = 0;
        var rx_buffer = [];

        var enable_polling = !node.disable_polling;

        function loop_function() {
            //if (node.disable_polling)
            //    enable_polling = false;
            //enable_polling = !node.disable_polling;
            switch (task_step) {
                case "initial":
                    //if (node.disable_polling)
                    //    enable_polling = false;
                    task_step = "prepare_read_tx";
                    break;
                // --------------------------------------------------------------------
                // read state machine
                // --------------------------------------------------------------------
                case "prepare_read_tx":
                    if (enable_polling == false) {
                        read_rule_idx = 0;
                        read_pkg_idx = 0;
                        task_step = "watting_interval";
                        time_get_value = new Date().getTime();
                    }
                    else if (rule_detail.length > 0) {
                        let read_request = rule_detail[read_rule_idx];
                        let read_request_pkg = read_request.pkgs[read_pkg_idx];
                        try {
                            let tx_data = {};
                            tx_data.payload = read_request_pkg.bytes;

                            // clear rx buffer
                            rx_buffer = [];
                            read_request_pkg.response.pkg = [];

                            node.send([tx_data, null, null]);
                            time_tx = new Date().getTime();
                            task_step = "waitting_read_rx";
                        }
                        catch (error) {
                            console.log(error);
                            task_step = "initial";
                        }
                    }
                    else {
                        task_step = "watting_interval";
                        time_get_value = new Date().getTime();
                    }
                    break;

                case "waitting_read_rx":
                    if (new Date().getTime() - time_tx > node.timeouts) {

                        task_step = "read_rx_timeout";

                        let msg = {};
                        msg.payload = rule_detail[read_rule_idx];
                        let error = {};
                        error.msg = "rx_timeout";
                        error.info = {};
                        error.info.pkg_idx = read_pkg_idx;

                        msg.payload.result = error;
                        node.send([null, null, msg]);

                        //if (node.disable_polling == true) {
                        // 如果read write disable 那就暫停 polling
                        //    enable_polling = false;
                        //}
                    }

                    while (rx_buffer.length > 0) {
                        let read_request = rule_detail[read_rule_idx];
                        let read_request_pkg = read_request.pkgs[read_pkg_idx];
                        let response_pkg = read_request_pkg.response.pkg;
                        response_pkg.push(rx_buffer.shift());
                        if (response_pkg.length == read_request_pkg.response.expected_len) {
                            if (modbus_rtu.CheckCRC(response_pkg) === true) { // 檢查CRC
                                if (read_request_pkg.fc_code == 0x03 || read_request_pkg.fc_code == 0x04) {
                                    // 回傳的直接就是polling的數值了
                                    read_request_pkg.response.result = modbus_rtu.ModbusDecoder(response_pkg);
                                }
                                else if (read_request_pkg.fc_code == 0x01 || read_request_pkg.fc_code == 0x02) {
                                    // 回傳的不是直接是polling的bits因為 未滿1byte 的bit會補0
                                    // 所以要比較request的bit數量來提取decoder的結果
                                    let tmp_result = modbus_rtu.ModbusDecoder(response_pkg);
                                    let tmp_values = [];
                                    for (let i = 0; i < tmp_result.length; i++) {
                                        tmp_values.push(tmp_result[i]);
                                        if (tmp_values.length == read_request_pkg.regs_num) {
                                            // 數量夠了就跳出
                                            break;
                                        }
                                    }

                                    read_request_pkg.response.result = tmp_values;
                                }

                                // 切換下一個request封包
                                read_pkg_idx++;

                                // 如果這個rule的request封包已經收集完了 切換到下一個rule
                                if (read_pkg_idx == read_request.pkgs.length) {
                                    read_pkg_idx = 0;

                                    // 輸出收集的結果
                                    read_request.result = [];

                                    for (let index = 0; index < read_request.pkgs.length; index++) {
                                        const element = read_request.pkgs[index];

                                        // https://stackoverflow.com/questions/4156101/javascript-push-array-values-into-another-array
                                        read_request.result.push.apply(read_request.result, element.response.result);
                                    }

                                    let result = {};
                                    result.payload = read_request;

                                    node.send([null, result, null]);
                                    read_rule_idx++
                                }

                                // 所有的rule都polling結束了 重第一條rule重新來過
                                if (read_rule_idx >= rule_detail.length) {
                                    read_rule_idx = 0;

                                    if (task_type == "once") {
                                        // 如果read write disable 那就暫停 polling
                                        enable_polling = false;
                                    }
                                }

                                task_step = "watting_interval";
                                time_get_value = new Date().getTime();
                            }
                            else {
                                // 不要整個拋棄可能只是多了一兩byte的雜訊封包
                                response_pkg.shift();
                            }
                        }
                        else if (response_pkg.length == 5) {
                            if (modbus_rtu.CheckCRC(response_pkg) === true) {
                                let ex = modbus_rtu.GetException(response_pkg);
                                if (ex != null) {
                                    // exception 
                                    let msg = {};
                                    msg.payload = read_request;
                                    let error = {};
                                    error.msg = "exception";
                                    error.info = ex;
                                    error.info.pkg_idx = read_pkg_idx;
                                    msg.payload.result = error;
                                    node.send([null, null, msg]);

                                    // 捨棄這條rule換polling下一個
                                    read_rule_idx++;
                                    read_pkg_idx = 0;
                                    if (read_rule_idx >= rule_detail.length) {
                                        read_rule_idx = 0;
                                        if (task_type == "once") {
                                            // 如果read write disable 那就暫停 polling
                                            enable_polling = false;
                                        }
                                    }
                                    task_step = "watting_interval";

                                    time_get_value = new Date().getTime();
                                }
                            }
                        }
                    }
                    break;
                case "read_rx_timeout":
                    // 捨棄這條rule換pollinng下一個
                    read_rule_idx++;
                    read_pkg_idx = 0;
                    if (read_rule_idx >= rule_detail.length) {
                        read_rule_idx = 0;
                        if (task_type == "once") {
                            // 如果read write disable 那就暫停 polling
                            enable_polling = false;
                        }
                    }

                    task_step = "watting_interval";
                    time_get_value = new Date().getTime();
                    break;
                // --------------------------------------------------------------------
                // end of read state machine
                // --------------------------------------------------------------------
                // --------------------------------------------------------------------
                // write state machine
                // --------------------------------------------------------------------
                case "prepare_write_tx":
                    if (write_request_list.length != 0) {
                        let write_request = write_request_list[0];
                        let write_pkg = write_request.pkgs[write_pkg_idx];
                        let tx_data = {};
                        tx_data.payload = write_pkg.bytes;

                        // clear rx buffer
                        rx_buffer = [];
                        write_pkg.response.pkg = [];
                        node.send([tx_data, null, null]);
                        time_tx = new Date().getTime();
                        task_step = "waitting_write_rx";
                    }
                    else {
                        task_step = "prepare_read_tx";
                    }
                    break;
                case "waitting_write_rx":
                    if (new Date().getTime() - time_tx > node.timeouts) {
                        task_step = "write_rx_timout";

                        let msg = {};
                        msg.payload = write_request_list[0];
                        let error = {};
                        error.msg = "rx_timout";
                        error.info = {};
                        error.info.pkg_idx = write_pkg_idx;
                        msg.payload.result = error;
                        node.send([null, null, msg]);
                    }

                    while (rx_buffer.length > 0) {
                        let write_request = write_request_list[0];
                        let write_pkg = write_request.pkgs[write_pkg_idx];
                        let response_pkg = write_pkg.response.pkg
                        response_pkg.push(rx_buffer.shift());

                        // all of writting response pkg length is 8.
                        if (response_pkg.length == 8) {
                            if (modbus_rtu.CheckCRC(response_pkg) === true) { // 檢查CRC
                                if (modbus_rtu.ModbusDecoder(response_pkg) === true) {
                                    // 寫入成功

                                    // 下一筆
                                    write_pkg_idx++;
                                    if (write_request.pkgs.length == write_pkg_idx) {
                                        // 這一條寫入命令完成   
                                        write_pkg_idx = 0;

                                        let result = {};
                                        result.payload = write_request;
                                        write_request.result = "written"
                                        node.send([null, result, null]);
                                        write_request_list.shift();
                                    }

                                    task_step = "watting_interval";
                                    time_get_value = new Date().getTime();
                                }
                            }
                        }
                        else if (response_pkg.length == 5) {
                            if (modbus_rtu.CheckCRC(response_pkg) === true) {
                                let ex = modbus_rtu.GetException(response_pkg);
                                if (ex != null) {
                                    // exception 
                                    let msg = {};
                                    msg.payload = write_request_list[0];
                                    let error = {};
                                    error.msg = "exception";
                                    error.info = ex;
                                    error.info.pkg_idx = write_pkg_idx;
                                    msg.payload.result = error;
                                    node.send([null, null, msg]);

                                    // 捨棄這條rule換下一個寫入
                                    write_pkg_idx = 0;
                                    write_request_list.shift();
                                    task_step = "watting_interval";
                                    time_get_value = new Date().getTime();
                                }
                            }
                        }
                    }

                    break;
                case "write_rx_timout":
                    // 捨棄這條rule換下一個寫入
                    write_pkg_idx = 0;
                    write_request_list.shift();
                    task_step = "watting_interval";
                    time_get_value = new Date().getTime();
                    break;
                // --------------------------------------------------------------------
                // end of write state machine
                // --------------------------------------------------------------------
                case "watting_interval":
                    if ((new Date().getTime() - time_get_value) > node.interval) {
                        if (write_request_list.length > 0)
                            task_step = "prepare_write_tx";
                        else
                            task_step = "prepare_read_tx";
                    }
                    break;

                default:
                    console.log("opps!! task: " + task_step);
                    break;
            }

        }

        // --------------------------------------
        // end of node state machine
        // --------------------------------------
    }
    RED.nodes.registerType("arc-modbus-polling", PollingNode);
}
