Creation of a Apache+webviewer Docker image
-----------------------------------

make sure you are logged in Docker

```
docker login
Username: visus
Password: XXXX
```


Once we have a working server, we can now create an image that only contains the compiled server instead of all the code and libraries necessary for compilation. This results in a Docker image that is only around 1/10 the size and is suitable for deployment. The properties of the new image, such as number of processors or availble memory, can easily be modified.

Returning to your local source tree

```
# CMAKE_SOURCE_DIR is where you have pulled the visus repository
cd ${CMAKE_SOURCE_DIR}/docker
```

Copy the binaries compiled in the previous step

```
VISUS_BIN=/home/build/visus
docker cp $DOCKER_ID:$VISUS_BIN/libVisusKernel.so                 ./libVisusKernel.so
docker cp $DOCKER_ID:$VISUS_BIN/libVisusDb.so                     ./libVisusDb.so
docker cp $DOCKER_ID:$VISUS_BIN/libVisusIdx.so                    ./libVisusIdx.so
docker cp $DOCKER_ID:$VISUS_BIN/libmod_visus.so                   ./libmod_visus.so
docker cp $DOCKER_ID:/etc/apache2/mods-available/visus.load       ./visus.load
docker cp $DOCKER_ID:/etc/apache2/sites-enabled/000-default.conf  ./000-default.conf
```

Build a new Docker image with Apache server+precompiled mod_visus

```
docker build -t visus/mod_visus .
``` 
   
Push the Docker Visus Image to Docker hub (OPTIONAL) 

```
docker push visus/mod_visus
```

Get the Docker Visus Image from Docker hub (OPTIONAL) 

```
docker pull visus/mod_visus
```

# Run and test

Run the virtual machine in interactive mode (including a virtual terminal)

```
# Typically, you will run the server with one or more local volumes mapped into the Docker instance (for data or cache):
docker run -t -i -d -p 8080:80 -v /scratch/datasets/cached:/visus_cache visus/mod_visus

# Otherwise, run with the following command:
docker run -t -i -d -p 8080:80 visus/mod_visus
```

This will run the server in the background, but include an interactive session
Take note of the IP of the Docker VM when it starts:

```
DOCKER_IP=$(docker-machine ip) 
```

From another host check the Visus Web server is working

```
curl -v "http://$DOCKER_IP:8080/mod_visus?action=list"
```

If you want to debug a running container, get the CONTAINER_ID and use

```
docker exec -i -t <CONTAINER_ID> /bin/bash
```

Once attached, the log files can be examined, or the server can be restarted with

```
service apache2 restart
```

After you are finished inspecting, it is okay to simply 'exit' from this terminal.

Build a new Docker image with Apache server+precompiled mod_visus

```
docker build -t visus/mod_visus .
``` 
   
Push the Docker Visus Image to Docker hub (OPTIONAL) 

```
docker push visus/mod_visus
```

Get the Docker Visus Image from Docker hub (OPTIONAL) 

```
docker pull visus/mod_visus
```

# Run and test

Run the virtual machine in interactive mode (including a virtual terminal)

```
# Typically, you will run the server with one or more local volumes mapped into the Docker instance (for data or cache):
docker run -t -i -d -p 8080:80 -v /scratch/datasets/cached:/visus_cache visus/mod_visus

# Otherwise, run with the following command:
docker run -t -i -d -p 8080:80 visus/mod_visus
```

This will run the server in the background, but include an interactive session
Take note of the IP of the Docker VM when it starts:

```
DOCKER_IP=$(docker-machine ip) 
```

From another host check the Visus Web server is working

```
curl -v "http://$DOCKER_IP:8080/mod_visus?action=list"
```

If you want to debug a running container, get the CONTAINER_ID and use

```
docker exec -i -t <CONTAINER_ID> /bin/bash
```

Once attached, the log files can be examined, or the server can be restarted with

```
service apache2 restart
```

After you are finished inspecting, it is okay to simply 'exit' from this terminal.
Create and enter in the Linux virtual machine
    
```
#if you change the linux version, remember to change the DockerFile too
docker run -t -i ubuntu:16.04 /bin/bash
```
    
Change the prompt if you want to

```
export PS1="\[\033[49;1;34m\][\t] [\u@webviewer_develop] [\w]  \[\033[49;1;0m\] \n"
```
    
make sure you have an updated OS with all the components needed for compilation

```
apt-get -y update
apt-get -y upgrade
apt-get -y install \
  git gcc build-essential curl \
  vim apache2 apache2-dev wget unzip cmake \
  swig python python-dev libpng-dev nano \
  openssl libssl-dev libcurl4-openssl-dev \
  zlib1g-dev libfreeimage-dev libzmq3-dev \
  emacs24-nox cmake-curses-gui libcurl4-openssl-dev \
  libssl-dev iputils-ping
```

Generate an ssh key for use with github (optional)

```
ssh-keygen -t rsa
# accept all defaults
cat ~/.ssh/id_rsa.pub
# navigate to http://github.com and go to your account settings -> SSH keys -> Add key
# copy and paste key into github dialog
```

Clone ViSUS code and compile it


```
mkdir -p /home/code/visus
cd /home/code/visus
# if you registered an ssh key above...
git clone git@github.com:sci-visus/visus.git ./
# otherwise...
git clone https://github.com/sci-visus/visus ./
mkdir -p /home/build/visus && cd /home/build/visus
cmake /home/code/visus \
  -DCMAKE_BUILD_TYPE=Release \
  -DVISUS_GUI=0 \
  -DVISUS_BUILD_MODVISUS=1 \
  -DVISUS_SERVER_LOG_FILE=/home/visus/server.log \
  -DVISUS_SERVER_CONFIG_FILE=/home/visus/server.config \
  -DVISUS_CACHE_PATH=/visus_cache 
  
# or "make -j 8" if you want to run in parallel, but you may get a segmentation fault
make 
```

Configure Apache and mod_visus module.
    

```
# type 'sudo -i' if you are not root
VISUS_SRC=/home/code/visus
VISUS_BIN=/home/build/visus
mkdir -p /home/visus
touch /home/visus/server.log
chmod a+rw /home/visus/server.log # otherwise httpd process can't log

cp -r $VISUS_SRC/docker/dataset        /home/visus/dataset
cp $VISUS_SRC/docker/server.config     /home/visus/server.config
chmod -R u+rwX,go+rX,go-w /home/visus

cat <<EOF >/etc/apache2/mods-available/visus.load
LoadModule visus_module $VISUS_BIN/libmod_visus.so
EOF
    
rm /etc/apache2/sites-enabled/000-default.conf
cat <<\EOF >/etc/apache2/sites-enabled/000-default.conf
<VirtualHost *:80>
  ServerAdmin scrgiorgio@gmail.com
  DocumentRoot /var/www
  
  <Directory /var/www>
    Options Indexes FollowSymLinks MultiViews
    AllowOverride All
    Order deny,allow
    Allow from all
  </Directory> 
    
  <Location /mod_visus>
    SetHandler visus
    DirectorySlash Off
    Header set Access-Control-Allow-Origin "*"
  </Location>
  
  ErrorLog ${APACHE_LOG_DIR}/error.log
  CustomLog ${APACHE_LOG_DIR}/access.log combined 
  
</VirtualHost>
EOF
```

Create VisusUserDirectory and set permissions for www-data (user that runs apache)

```
mkdir /var/www/visus
chown www-data /var/www/visus
chmod g+w /var/www/visus
```

Enable mod_visus and run Apache server

```
a2enmod headers 
a2enmod visus
source /etc/apache2/envvars 
mkdir -p $APACHE_RUN_DIR $APACHE_LOCK_DIR $APACHE_LOG_DIR
/usr/sbin/apache2 -DFOREGROUND
```

Check the message from Visus server, the dataset list should show at least one
dataset. Press CTRL+C to kill the server

Exit Docker VM, check the Docker ID

```
exit
docker ps -a
DOCKER_ID=<here_your_number>
```

Commit the Virtual machine locally

```
docker commit $DOCKER_ID visus/my_mod_visus
docker images
```

Test the visus server (OPTIONAL) 

```
docker run -i -t -p 8080:80 visus/my_mod_visus /bin/bash
export PS1="\[\033[49;1;31m\][\t] [\u@\h] [\w]  \[\033[49;1;0m\] \n"
source /etc/apache2/envvars 
mkdir -p $APACHE_RUN_DIR $APACHE_LOCK_DIR $APACHE_LOG_DIR
/usr/sbin/apache2 -DFOREGROUND
```

Use CTRL-p CTRL-q to detach without stopping the container.
Later, you can attach to the Docker container to examine its current state. Get the container id from

```
docker ps
```

and attach using 

```
docker attach <CONTAINER_ID>
```

In another docker you can get the IP address of the machine:

```
docker-machine ls
```

and test it:

```
alias more=less
curl -o output.txt -v "http://<machine_ip_here>/mod_visus?action=readdataset&dataset=cat"
more output.txt
```

