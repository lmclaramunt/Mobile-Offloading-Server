# CSE535 Mobile offloading project
This is a node.js server based on socket.io which enables distributed computing accross Android devices. 

## Requirement
* Node.js version: 14+
* Android API level: 29

## Initialization
Download the source code and go to the root directory in the terminal. You can start running the following scripts.
```
npm install
node server users
```
Now your socket.io server will listening on `localhost:3000`

Now open another terminal. Type in the two commands. The first command install the module to get local ip address. The second command print out the local ip address
```
$ npm install -g my-local-ip
$ my-local-ip
```
Now you have the local ip address. It usually start with 192.168.*.*
