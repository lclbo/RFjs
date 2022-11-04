# RFjs - Wireless Microphone Status Monitor 

This project implements a client-server architecture for providing status monitoring of wireless microphones that support the *Sennheiser Media Control Protocol* (MCP) via UDP port 53212, as described in Sennheiser documents *[Media control protocol description](https://assets.sennheiser.com/global-downloads/file/12379/ewG3_2000_MediaControlProtocolDescription_120122.pdf)* and *[TI 1254 v1.0](https://assets.sennheiser.com/global-downloads/file/12478/TI_1254_MetroMediensteuerung_ewG4_EN.pdf)*.  
It was tested using 2000 series, EM300 G3, EM500 G3 and EM300-500 G4 receivers.  

**This project is in no way affiliated with Sennheiser.**  
The Sennheiser brand, Media Control Protocol, as well as the listed product names are property of Sennheiser electronic GmbH & Co. KG and are only used to reference the devices and publicly available protocol information.  


## Quickstart
The [rfjs_server.js](rfjs_server.js) file provides all server-side components, including transmission of periodic status requests, handling the receiver's responses, receiving annotation texts and providing the web server.

The quickest way to run it is to execute:
```
chmod +x rfjs_server.js
./rfjs_server.js
```

Beware that the web interface by default tries to bind to port 80. 
On many *nix systems, non-privileged (i.e. non-root) users are not allowed to bind to the *well-known ports* 1...1023. 
As a solution, you can either:
* move the web interface to a different port >1023 (e.g. 8080) using the ```httpServerPort``` variable
* allow the ```node``` executable to bind to these ports: ```sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node```
* execute the software as root (**not** recommended)

Once the server is running, navigate to ```http://<address>```, and you should see the web view. 
If the server is running and the web interface can not be reached, check your firewall rules to allow incoming requests for the desired port (80 by default).

## Installation
For a more permanent installation, environments such as ```pm2``` can be used to invoke the script at startup and restart it if errors occur.

## Configuration
The server needs to know to which address or interface it should bind its listening interfaces to.
By default, the web server does not bind to a specific interface and instead listens at port 80 of all available interfaces.  
In contrast, the MCP and annotation UDP servers try to bind to a specific interface.
The ```findSuitableNetworkAddressForUDP()``` method iterates all interfaces while skipping local and IPv6 ones, and tries to find a matching interface. 
This function most probably should be adjusted to meet your individual requirements.  
If no matching interface was found, the server tries to bind to ports ```53210``` (annotation) and ```53212``` (MCP) on all available interfaces.


## Naming / Annotating devices
This is useful if you want to annotate your channels, for example by adding an actor or role name to the view.
The naming can for example be done from within a QLab *Network* cue, sending plain text via UDP.

Each received name string is kept as long as the server is running, irrespective of whether that specific receiver is already known.
Therefore, the comments can be set even before all receivers are connected.

Technically, the server listens for UDP packets on port ```53210``` containing a JSON map data structure for naming individual channels. 
Each individual receiver is identified by its IPv4 address, so the expected data structure could be something like this:
```
[
  ["10.10.10.1","Mic 1"],
  ["10.10.10.2","Mic 2"]
]
```


## Browser compatibility
The project was tested on all popular current browsers.  
In addition, the web view is limited to ES5 JavaScript style and is designed to be compatible down to iOS9, so everything from an iPad2 onwards should be compatible. 

If the website is stored to an iOS device's home screen, it can be launched as a fullscreen web app.