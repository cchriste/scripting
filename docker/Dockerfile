FROM ubuntu:16.04

MAINTAINER Cameron Christensen <scicameron@gmail.com>

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y install apache2 

RUN echo "PS1=\"\[\033[49;1;34m\][\t] [\u@webviewer_develop] [\w]  \[\033[49;1;0m\] \n\"" >> /root/.bashrc

RUN mkdir -p /home/webviewer

RUN ln -s /home/webviewer /var/www/webviewer


ADD  000-default.conf  /etc/apache2/sites-enabled/000-default.conf 
COPY ../index.html     /home/webviewer
COPY ../README.md      /home/webviewer
COPY ../css            /home/webviewer
COPY ../code           /home/webviewer
COPY ../openseadragon  /home/webviewer
COPY ../images         /home/webviewer

EXPOSE 80

ENTRYPOINT [ "/bin/bash" ]
CMD ["-c", "source /etc/apache2/envvars && mkdir -p $APACHE_RUN_DIR $APACHE_LOCK_DIR $APACHE_LOG_DIR && exec /usr/sbin/apache2 -DFOREGROUND"]






