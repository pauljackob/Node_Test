const express = require("express");
const server = express();
const PORT = process.env.PORT || 8000;
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const uuidv4 = require("uuid/v4");
const compression = require ("compression");
const helmet = require('helmet');
const {SHA256} = require ("crypto-js");

const {
  connection
} = require("./Connection");

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

server.use(express.static("public"));
server.use(bodyParser.json());
server.use(
  cors({
    origin: "http://localhost:3000"
  })
);
server.use(compression());
server.use(helmet());

server.get("/", (request, response)=> {
  response.send("on the master branch");
});

server.get("/password", (request, response)=> {
  const stupidPassword = "password123";
  const hashPassword = SHA256(stupidPassword);
  console.log({hashPassword});
});


server.get("/get/jokes", (req, res) => {
  connection.query("SELECT * FROM joke order by id desc", (error, results) => {
    if (error) {
      showError(error, res);
    }
    res.json(results);
  });
});

server.get("/get/joke/:id", (req, res) => {
  const sql = "SELECT * FROM joke where id = ?";
  const values = [req.params.id];
  connection.query(sql, values, (error, results) => {
    if (error) {
      showError(error, res);
    }
    res.json(results[0]);
  });
});

server.get(`/get/comments/:jokeId`, (req, res) => {
  const {
    body
  } = req;
  if (body) {
    const sql = `SELECT * FROM comment where joke_id = ?`;
    const values = [req.params.jokeId];
    connection.query(sql, values, (error, results) => {
      if (error) {
        showError(error, res);
      }
      res.json(results);
    });
  }
});

server.post("/post/comment", (req, res) => {
  const {
    body
  } = req;
  if (body) {
    const {
      text,
      username,
      joke_id
    } = body;
    const sql = "INSERT INTO comment SET text = ?, username = ?, joke_id = ?";
    const values = [text, username, joke_id];
    connection.query(sql, values, (error, results) => {
      if (error) {
        showError(error, res);
      }
      console.log(results);
      res.json({
        status: "succes",
        message: "comment posted"
      });
    });
  }
});

server.post("/update/joke/:votes", vote);

function vote(req, res) {
  const {
    body
  } = req;
  if (body) {
    const {
      id
    } = body;
    if (id) {
      let table = "";
      if (req.params.votes === "upvote") {
        table = "up_votes = up_votes + 1";
      } else if (req.params.votes === "downvote") {
        table = "down_votes = down_votes + 1";
      }
      const sql = `update joke set ${table} where id = ?`;
      const values = [id];
      connection.query(sql, values, (error, results) => {
        if (error) {
          showError(error, res);
        }
        console.log(results);
        res.json({
          status: "succes",
          message: "Joke vote updated"
        });
      });
    }
  }
}

function showError(error, res) {
  console.log(error);
  res.json({
    status: "error",
    message: "Something went wrong"
  });
}

server.post("/post/joke", (req, res) => {
  const {
    body
  } = req;
  if (body) {
    const {
      title,
      file
    } = body;
    if (file) {
      const {
        base64
      } = file;
      const fileName = uuidv4();
      fs.writeFile(`./public/images/${fileName}.jpeg`, base64, "base64", (error) => {
        if (error) {
          console.log(error);
        }
      });
      const sql = "INSERT into joke set ?";
      const values = {
        image_location: `./images/${fileName}.jpeg`,
        title
      };
      connection.query(sql, values, (error, results) => {
        if (error) {
          showError(error, results);
        } else {
          console.log(results);
          res.json({
            status: "succes",
            message: "joke uploaded"
          });
        }
      });
    }
  }
});