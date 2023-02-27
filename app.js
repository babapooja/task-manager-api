const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("./DB/mongoose");
const jwt = require("jsonwebtoken");

// Load mongoose models
const { List, Task, User } = require("./DB/models");

//CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, HEAD, OPTIONS, PUT"
  );
  res.header(
    "Access-Control-Expose-Headers",
    "x-access-token, x-refresh-token"
  );
  next();
});

// check whether the request has a valid JWT token
let authenticate = (req, res, next) => {
  let token = req.header("x-access-token");

  // verify
  jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
    if (err) {
      // jwt invalid - do not authenticate
      res.status(401).send(err);
    } else {
      // valid jwt
      req.user_id = decoded._id;
      next();
    }
  });
};

/* MIDDLEWARE */
let verifySession = (req, res, next) => {
  let refreshToken = req.header("x-refresh-token");
  let _id = req.header("_id");

  User.findByIdAndToken(_id, refreshToken)
    .then((user) => {
      if (!user) {
        return Promise.reject({
          error:
            "User not found. Make sure refresh token and user id are valid",
        });
      }

      // found user - valid session
      // therefore refresh token exists in db - but we need to check if it has expired or not
      req.user_id = user._id;
      req.refreshToken = refreshToken;
      let isSessionValid = false;
      req.userObject = user;

      user.sessions.forEach((session) => {
        if (session.token === refreshToken) {
          if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
            isSessionValid = true;
          }
        }
      });
      if (isSessionValid) {
        // session is valid. continue with processing the web request
        next();
      } else {
        return Promise.reject({
          error: " Refresh token expired or invalid session",
        });
      }
    })
    .catch((err) => {
      res.status(401).send(err);
    });
};

// load middleware
app.use(bodyParser.json());

/* end of MIDDLEWARE */
/* 
GET LISTS:
Purpose: Get all lists
*/
app.get("/lists", authenticate, (req, res) => {
  // return lists that belong to the authenticated user
  List.find({
    _userId: req.user_id,
  })
    .then((lists) => {
      res.send(lists);
    })
    .catch((e) => {
      res.send(e);
    });
});

/* 
Post lists:
Purpose: Create a list
*/
app.post("/lists", authenticate, (req, res) => {
  let title = req.body.title;
  let newList = new List({
    title,
    _userId: req.user_id,
  });
  console.log(newList);
  newList.save().then((listDoc) => {
    res.send(listDoc);
  });
});

/* 
Patch /lists/:id
Purpose: Update a specified list
*/
app.patch("/lists/:id", authenticate, (req, res) => {
  List.findOneAndUpdate(
    { _id: req.params.id, _userId: req.user_id },
    {
      $set: req.body,
    }
  ).then(() => {
    res.send({ status: 200, message: "Updated successfully!" });
  });
});

/* 
Delete /lists/:id
Purpose: Update a specified list
*/
app.delete("/lists/:id", authenticate, (req, res) => {
  List.findOneAndRemove({ _id: req.params.id, _userId: req.user_id }).then(
    (removedList) => {
      res.send(removedList);

      // delete all the tasks that belong to the list id provided
      deleteTasksFromList(removedList._id);
    }
  );
});

/* ********************************************** TASKS ************************************************/
/* 
GET /lists/:listId/tasks
Purpose: to get all the tasks under a specific list
*/
app.get("/lists/:listId/tasks", authenticate, (req, res) => {
  Task.find({
    _listId: req.params.listId,
  }).then((tasks) => {
    res.send(tasks);
  });
});

/* 
GET /lists/:listId/tasks/:taskId
Purpose: to get a task based on the taskId
*/
app.get("/lists/:listId/tasks/:taskId", authenticate, (req, res) => {
  Task.findOne({
    _id: req.params.taskId,
    _listId: req.params.listId,
  }).then((task) => {
    res.send(task);
  });
});

/* 
POST /lists/:listId/tasks
Purpose: add new tasks under a specific listId
*/
app.post("/lists/:listId/tasks", authenticate, (req, res) => {
  console.log(req);
  List.findOne({ _id: req.params.listId, _userId: req.user_id })
    .then((list) => {
      if (list) {
        // list object with specific user related details confirmed
        // authenticated user can create new tasks
        return true;
      }
      return false;
    })
    .then((canCreateTasks) => {
      if (canCreateTasks) {
        let newTask = new Task({
          title: req.body.title,
          _listId: req.params.listId,
        });
        newTask.save().then((newTask) => {
          res.send(newTask);
        });
      } else {
        res.sendStatus(404);
      }
    });
});

/* 
PATCH /lists/:listId/tasks/:taskId
Purpose: update a task under a specific listId
*/
app.patch("/lists/:listId/tasks/:taskId", authenticate, (req, res) => {
  List.findOne({ _id: req.params.listId, _userId: req.user_id })
    .then((list) => {
      if (list) {
        // authenticated user can update new tasks
        return true;
      }
      return false;
    })
    .then((canUpdateTasks) => {
      if (canUpdateTasks) {
        Task.findOneAndUpdate(
          { _id: req.params.taskId, _listId: req.params.listId },
          {
            $set: req.body,
          }
        ).then(() => {
          res.send({ status: 200, message: "Task updated successfully!" });
        });
      } else {
        res.sendStatus(404);
      }
    });
});

/* 
DELETE /lists/:listId/tasks/:taskId
Purpose: delete a task under a specific listId
*/
app.delete("/lists/:listId/tasks/:taskId", authenticate, (req, res) => {
  List.findOne({ _id: req.params.listId, _userId: req.user_id })
    .then((list) => {
      if (list) {
        // list object with specific user related details confirmed
        // authenticated user can create new tasks
        return true;
      }
      return false;
    })
    .then((canDeleteTasks) => {
      if (canDeleteTasks) {
        Task.findByIdAndRemove({
          _id: req.params.taskId,
          _listId: req.params.listId,
        }).then((removedTask) => {
          res.send(removedTask);
        });
      } else {
        res.sendStatus(404);
      }
    });
});

// USER ROUTES
/* 
POST /users
Purpose: signup
*/
app.post("/users", (req, res) => {
  // here we will signup
  let body = req.body;
  let newUser = new User(body);

  newUser
    .save()
    .then(() => {
      return newUser.createSession();
    })
    .then((refreshToken) => {
      console.log(refreshToken);
      // session created - refreshtoken returned
      // now we generate access auth token for the user
      return newUser.generateAccessAuthToken().then((accessToken) => {
        return { accessToken, refreshToken };
      });
    })
    .then((authToken) => {
      res
        .header("x-refresh-token", authToken.refreshToken)
        .header("x-access-token", authToken.accessToken)
        .send(newUser);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

/* 
POST /users/login
Purpose: login
*/
app.post("/users/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  User.findByCredentials(email, password)
    .then((user) => {
      return user
        .createSession()
        .then((refreshToken) => {
          return user.generateAccessAuthToken().then((accessToken) => {
            return { accessToken, refreshToken };
          });
        })
        .then((authToken) => {
          res
            .header("x-refresh-token", authToken.refreshToken)
            .header("x-access-token", authToken.accessToken)
            .send(user);
        });
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

/* 
GET /users/me/access-token
Purpose: generates and return an access token
*/
app.get("/users/me/access-token", verifySession, (req, res) => {
  //user is authenticated and user id is available to us
  req.userObject
    .generateAccessAuthToken()
    .then((accessToken) => {
      res.header("x-access-token", accessToken).send({
        accessToken,
      });
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

// HELPER METHODS
let deleteTasksFromList = (_listId) => {
  Task.deleteMany({
    _listId: _listId,
  }).then(() => {
    console.log("Tasks from " + _listId + " were deleted");
  });
};

app.get("/", (req, res) => {
  res.send({ message: "Hello World!!!" });
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on ${port}...`);
});
