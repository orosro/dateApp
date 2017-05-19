## Dating Application BETA v1.0.0

## Pre-requisites
Node version: 7.6.0

## Quick start

2. Run `npm install` to install dependencies and clean the git repo.<br />
3. Run `gulp` to run the example development server.
4. Run `gulp deploy` to run the deploy

## Npm install
Before running npm install, please install the latest versions of nodejs and npm and delete the folder node_modules

### Update npm ###
npm install npm@latest -g

### Update node ###
sudo npm cache clean -f
sudo npm install -g n
sudo n stable


### RUN ###
gulp -> for development purposes, run the build with browsersync
gulp deploy -> deploy the build


### WHAT TO DO IN THE FUTURE ###
The application is a very basic demo created to present what can be done using:
1. `npm` in order to install dependencies
2. `Gulp` as a task runner
3. `JsLint` for having the same dev. rules through all js files
4. Tried to use `bower` but because of proxy & SSL errors this made it impossible
5. `SASS` for css purposes
6. `HammerJs` for handling user panning inside the app
7. `Jquery` for certain elemnts selection
8. `ES6` was used and the compiling was done using `babel`
9. `autoprefixer` in order to add prefixes to css rules


For a production app the gulp file should be organized and use bower for dependencies
Create more interactions with the user
Create a mock nodeJs Server
 
