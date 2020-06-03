# README #

# node-red-node-arc-modbus

This is a **modbus polling tool** base on Modbus RTU protocol. The node were able to send modbus requests according to the established rule table. And collects responses to make the final result. It can be switched polling behavior by input `msg.poll`. It can send "write request" command by input `msg.write`. It can handle modbus exception code. The modbus function code `01 02 03 04 05 06 15 16` has been implementation.

## arc modbus polling

## 1.Example

![example](https://bitbucket.org/HowardCheng/nodered-node-arc-modbus/raw/73dbffe09a20f9548cba510f892da02ee23f90a2/pic/example_flow.png)

```json
[{"id":"c1839961.6e41c8","type":"arc-modbus-polling","z":"e7ca081.068c0f8","timeouts":"1000","interval":"50","rules":[{"access":"RW_Regs","regs_addr":"0","regs_num":"10"},{"access":"RW_Regs","regs_addr":"10","regs_num":"150"},{"access":"RW_Bits","regs_addr":"0","regs_num":"50"}],"disable_polling":false,"name":"","x":690,"y":900,"wires":[["da916d29.d84b9"],["18eb5449.277f0c","b24d29f.d9fbcd8"],["332103d3.e913dc"]]},{"id":"da916d29.d84b9","type":"tcp request","z":"e7ca081.068c0f8","server":"127.0.0.1","port":"502","out":"sit","splitc":" ","name":"","x":580,"y":780,"wires":[["3ec5564f.e1c79a"]]},{"id":"3ec5564f.e1c79a","type":"change","z":"e7ca081.068c0f8","name":"payload -> response","rules":[{"t":"move","p":"payload","pt":"msg","to":"response","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":810,"y":780,"wires":[["c1839961.6e41c8","7a33efc8.fa863"]]},{"id":"7a33efc8.fa863","type":"debug","z":"e7ca081.068c0f8","name":"response","active":false,"tosidebar":true,"console":false,"tostatus":false,"complete":"response","x":1030,"y":780,"wires":[]},{"id":"18eb5449.277f0c","type":"debug","z":"e7ca081.068c0f8","name":"","active":false,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":890,"y":900,"wires":[]},{"id":"b24d29f.d9fbcd8","type":"debug","z":"e7ca081.068c0f8","name":"result","active":false,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload.result","x":870,"y":940,"wires":[]},{"id":"6adecef4.800db","type":"inject","z":"e7ca081.068c0f8","name":"write bits (FC15)","topic":"","payload":"{\"address\":20,\"data\":[false,true,true,true]}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":820,"wires":[["506aa932.aba248"]]},{"id":"faf8573b.97de28","type":"inject","z":"e7ca081.068c0f8","name":"write value (FC16)","topic":"","payload":"{\"address\":40,\"data\":[99,88,77,666]}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":220,"y":900,"wires":[["506aa932.aba248"]]},{"id":"229804ec.da124c","type":"inject","z":"e7ca081.068c0f8","name":"write value (FC06)","topic":"","payload":"{\"address\":30,\"data\":123}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":220,"y":860,"wires":[["506aa932.aba248"]]},{"id":"506aa932.aba248","type":"change","z":"e7ca081.068c0f8","name":"payload -> write","rules":[{"t":"move","p":"payload","pt":"msg","to":"write","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":480,"y":900,"wires":[["c1839961.6e41c8"]]},{"id":"96e684f0.cb0ed8","type":"inject","z":"e7ca081.068c0f8","name":"write bit (FC05)","topic":"","payload":"{\"address\":10,\"data\":false}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":230,"y":780,"wires":[["506aa932.aba248"]]},{"id":"332103d3.e913dc","type":"debug","z":"e7ca081.068c0f8","name":"exception msg","active":false,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","x":900,"y":980,"wires":[]},{"id":"1c6edf03.18e9f1","type":"inject","z":"e7ca081.068c0f8","name":"once","topic":"","payload":"once","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":250,"y":1080,"wires":[["dbd3c9e3.d8f368"]]},{"id":"dbd3c9e3.d8f368","type":"change","z":"e7ca081.068c0f8","name":"","rules":[{"t":"set","p":"poll","pt":"msg","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":470,"y":1040,"wires":[["c1839961.6e41c8"]]},{"id":"5a924938.8a75e8","type":"inject","z":"e7ca081.068c0f8","name":"","topic":"","payload":"start","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":250,"y":1120,"wires":[["dbd3c9e3.d8f368"]]},{"id":"dbd1d4b7.418cc8","type":"inject","z":"e7ca081.068c0f8","name":"","topic":"","payload":"stop","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":250,"y":1040,"wires":[["dbd3c9e3.d8f368"]]},{"id":"3c69506.230b3b","type":"comment","z":"e7ca081.068c0f8","name":"example of write","info":"","x":230,"y":740,"wires":[]},{"id":"53f259b3.c6c3d8","type":"comment","z":"e7ca081.068c0f8","name":"example of control polling behavior","info":"","x":160,"y":1000,"wires":[]}]
```



## 2. Node msg

### 2.1 Outputs

`Output 1` (`buffer`) Request packets

- `payload` The request of modbus packets.

`Output 2` (`JSON`) Result

- `payload.result` The infomation of modbus slave response result.
- `payload.rule` The rule of this result.
- `payload.pkg` Request and response of this result.

`Output 3` (`JSON`) Exception

- `payload.result` The infomation of exception (e.g. exception code).
- `payload.rule` The rule of this exception.
- `payload.pkg` Request and response of this exception.



### 2.2 Inputs

`msg.response` (`buffer`)

- Packets response from the Modbus device.

`msg.write` (`JSON`)

- This command can be used to trigger a write request. Please refer to the example region `example of write`.

`msg.poll` (`string`)

- You can switch to continue or stop polling by string (**"start"**, **"stop"**, **"once"**). As long as msg contains this property, it node will trigger to poll once.



### 2.3 Parameters

![para](https://bitbucket.org/HowardCheng/nodered-node-arc-modbus/raw/2e3403842a1c21ff8670bd12e70967f6cb2441a2/pic/example_para.png)

`Timeouts` (`millisecond`)

- The timeout for waiting receive response.

`Interval` (`millisecond`)

- The waiting time before next request.

`Polling Disable` (`checkbox`)

- This can set the initial polling behavior of the node. It also can be changed by `msg.poll` during process  is running.

`Rules` (`table`)

- `Polling Request type` (`combobox`) 
  - RW Bits, [Read Coil Status (FC=01)](http://www.simplymodbus.ca/FC01.htm)
  - RO Bits, [Read Input Status (FC=02)](http://www.simplymodbus.ca/FC02.htm)
  - RW Regs, [Read Holding Registers (FC=03)](http://www.simplymodbus.ca/FC03.htm)
  - RO Regs, [Read Input Registers (FC=04)](http://www.simplymodbus.ca/FC04.htm)

- `Start Address` (`uint`) 
  - The data address of the first regs to read.
- `Polling Number` (`uint`) 
  - The total number of regs requested.

### 2.4 References

- [NodeRed Documentation](https://nodered.org/docs/creating-nodes/)
- [Simply Modbus](http://www.simplymodbus.ca/index.html)



## arc modbus slave

It is still in chaos...