const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializedbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running...");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializedbAndServer();
//api 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `select username from user where username="${username}";`;
  const userResponse = await db.get(userQuery);
  if (userResponse === undefined) {
    const createUser = `insert into user 
      values("${username}","${name}","${hashedPassword}","${gender}","${location}");
      `;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserResponse = await db.run(createUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send(`User already exists`);
  }
});
//api 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `select * from user where username="${username}";`;
  const userResponse = await db.get(userQuery);
  if (userResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(
      password,
      userResponse.password
    );
    if (comparePassword) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//api 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `select * from user where username = '${username}';`;
  const userResponse = await db.get(userQuery);

  if (userResponse !== undefined) {
    const checkPassword = await bcrypt.compare(
      oldPassword,
      userResponse.password
    );
    if (checkPassword) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateQuery = `
        update user 
        set password="${hashedPassword}"
        where username="${username}";
        `;
        const updateResponse = await db.run(updateQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  } else {
    response.status(400);
    response.send("Invalid User");
  }
});
module.exports = app;
