# base image
FROM node:12.2.0

# install chrome for protractor tests
# RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
# RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
# RUN apt-get update && apt-get install -yq google-chrome-stable

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /app/package.json
RUN npm install
RUN npm install -g @angular/cli@~8.1.2
RUN ng version
# add app
COPY . /app

EXPOSE 4200
# start app
# CMD ["ng","serve","--host", "0.0.0.0"]

# https://help.crossbrowsertesting.com/faqs/testing/invalid-host-header-error/
# https://github.com/angular/angular-cli/issues/8487
CMD ng serve --configuration=dev --host 0.0.0.0 --disable-host-check --public-host
# CMD ng serve