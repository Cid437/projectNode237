Steps done to create this repo.

-- Used to check if Node.js is installed
node -v
npm -v

-- Create the folder and go there
mkdir projNode237
cd projNode237

-- create package.json, index file and modules
git init -y
ni index.js (new item, ni is used for windows)
npm install express

-- Install dependencies
npm install express mysql2 dotenv cors bcrypt jsonwebtoken multer nodemailer pdfkit
npm install -D nodemon

-- Create empty folders for structure and server.js
mkdir routes,controllers,models,middleware,config,public,views,utils
ni server.js

-- add codes and run
node server.js

-- dotenv
npm install dotenv