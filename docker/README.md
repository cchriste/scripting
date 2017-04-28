Creation of a Apache+webviewer Docker image
-----------------------------------

make sure you are logged in Docker

```
docker login
Username: visus
Password: XXXX
```

```
# CMAKE_SOURCE_DIR is where you have pulled the webviewer repository
cd ${CMAKE_SOURCE_DIR}/docker
```

Build a new Docker image with Apache server + webviwer

```
docker build -t visus/webviewer .
``` 
   
Push the Docker Web Viewer Image to Docker hub (OPTIONAL) 

```
docker push visus/webviewer
```

Installation of Web Viewer from Docker Hub
-----------------------------

Get the Docker Visus Web Viewer Image from Docker hub

```
docker pull visus/webviewer
```

# Run and test

Run the virtual machine in interactive mode (including a virtual terminal)

```
docker run -t -i -d -p 8080:80 visus/webviewer
```

This will run the server in the background, but include an interactive session
Take note of the IP of the Docker VM when it starts:

```
DOCKER_IP=$(docker-machine ip) 
```

From a browser check the Visus Web Viewer is working by loading

```
http://localhost:8080/webviewer
```

If you want to modify a running container, get the CONTAINER_ID and use

```
docker exec -i -t <CONTAINER_ID> /bin/bash
```

Once attached, the configuration can be changed, and the server can be restarted with

```
service apache2 restart
```

After you are finished inspecting, it is okay to simply 'exit' from this terminal.

