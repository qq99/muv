# qq99/muv docker file
# A work in progress!
#
# To build this docker image:
# $> sudo docker build -t qq99/echoplexus-dev .
#
# To use this docker image:
#
# $> sudo docker run -i -v /your/tv/folder:/TV:rw -v /muv/folder:/muv:rw -p :8080 -t qq99/muv
# $> sudo docker ps | grep 8080
#
# inside:
# $> service redis-server start
# $> cd /muv/test
# $> PORT=8080 sails lift


FROM ubuntu
RUN apt-get update
RUN apt-get install -y build-essential git redis-server nodejs phantomjs npm
RUN npm install -g coffee-script grunt grunt-cli supervisor bower sails
RUN ln -sf /usr/bin/nodejs /usr/bin/node
RUN apt-get install -y tmux
EXPOSE 8080
VOLUME ["/muv", "/TV"]
ENTRYPOINT ["/usr/bin/tmux"]
