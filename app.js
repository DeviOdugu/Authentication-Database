const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB error : ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectedQuery = `
          select * from user
          where username='${username}';
    `;
  const dbUser = await db.get(selectedQuery);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const createRegistrationQuery = `
              insert into user(username, name, password , gender, location)
              values('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');
        `;
    await db.run(createRegistrationQuery);
    response.status(200);
    response.send("User created successfully");
  }
});

//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectedUserQuery = `
           select * from user 
           where username='${username}';
     `;
  const userDetails = await db.get(selectedUserQuery);

  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userDetails.password
    );
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const selectUserQuery = `
      select * from user 
      where username='${username}';
  `;
  const userInfo = await db.get(selectUserQuery);
  const checkingPassword = await bcrypt.compare(oldPassword, userInfo.password);
  if (checkingPassword === false) {
    response.status(400);
    response.send("Invalid current password");
  } else if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const updatePasswordQuery = `
          update user set
          password='${hashedNewPassword}'
          where username='${username}';
      `;
    await db.run(updatePasswordQuery);
    response.status(200);
    response.send("Password updated");
  }
});

module.exports = app;
