# Task Manager - Backend

This is the codebase for task manager app written in NodeJS, ExpressJS. The database used is MongoDB. The [backend](https://task-manager-app-api.azurewebsites.net/) using the WebApp service. The database is as hosted on Azure using CosmosDB.
This application uses ```mongoose``` package to connect with the MongoDB.

## Features

1. Authentication
    Using the ```jsonwebtoken``` package, we generate the JWT tokens verified by the secret key.
    - JWT token generation
    - JWT token verification: This is done using the ```SECRET_KEY```
    - Refresh token: This is done so as to maintain the sessions
    
2. APIs:
    
    * USERS:
      - ```/users```: POST method to allow user to signup to the application
      - ```/users/login```: POST method to allow user to login to the application
    
    * LISTS:
      - ```/lists```: GET all the lists
      - ```/lists```: POST method to create a new list
          ```body: {title:'', _userId: _userId}```
      - ```/lists/:listId```: PATCH method to update a specified list
      - ```/lists/:listId```: DELETE method to delete a specified list
    
    * TASKS
      - ```/lists/:listId/tasks/:taskId```: GET method to get a task based on the taskId
      - ```/lists/:listId/tasks```: GET method to get all the tasks
      - ```/lists/:listId/tasks```: POST method to create a new task under a list specified in the URI
        ```body: {title: '', _listId: _listId}```
      - ```/lists/:listId/tasks/:taskId```: PATCH method to update a task under a specified list
      - ```/lists/:listId/tasks/:taskId```: DELETE method to delete a task under a specified list
