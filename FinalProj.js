// so will take in port number for our hosting our applications

// and the need to use "stop" to stiop our webserver
const OpenAI = require('openai').default
const express = require("express"); /* Accessing express module */
const axios = require("axios")
const app = express();
const path = require("path");

// const fs = require("fs");

const portNumber = process.argv[2];

const prompt = "Type stop to shutdown the server: ";
console.log(`Web server started and running at http://localhost:${portNumber}/`);
process.stdout.write(prompt);

process.stdin.setEncoding("utf8");
process.stdin.on("readable", function () {
  const dataInput = process.stdin.read();
  if (dataInput !== null) {
    const command = dataInput.trim();
    if (command === "stop") {
      process.stdout.write("Shutting down the server\n");
      process.exit(0);
    }
    else{
        process.stdout.write("Invalid Command: " + command + "\n");
    }
    process.stdout.write(prompt);
    // console.log(`\n main URL http://localhost:${portNumber}/`);
    process.stdin.resume();
  }
});


const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));

app.set("views", path.resolve(__dirname, "templates"));
app.use(express.static(path.join(__dirname, 'templates')));

app.set("view engine", "ejs");

require("dotenv").config({ path: path.resolve(__dirname, 'credentials_s/.env') }) 
const uri = process.env.MONGO_CONNECTION_STRING;
 /* Our database and collection */
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
/****** DO NOT MODIFY FROM THIS POINT ONE ******/
const { MongoClient, ServerApiVersion } = require('mongodb');
const { stringify } = require("querystring");
// const client = new MongoClient(uri);
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const client = new MongoClient(uri);


app.get("/", (request, response) => {
    response.render("MainPage") //index is name of index.ejs
});

app.get('/MainPage', (req, res) => {
    res.render('MainPage'); // Assuming you're rendering a template named "MainPage"
});

async function insertMovie(client, databaseAndCollection, NewStu) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(NewStu);

    }


app.get('/application', (req, res) => {
    const port = portNumber
    res.render('applyApp', {port, port}); // Assuming you're using a templating engine like EJS
});



app.post("/application", async (request, response) => {

    let {name, email, Amo, orderInformation } = request.body

    try {
        await client.connect();
        /* Inserting one movie */
        // console.log("***** Inserting one student *****");
        let Student = {name: name, Email: email, Amount: parseInt(Amo), item: `${orderInformation}<br>`};
        await insertMovie(client, databaseAndCollection, Student);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    let answer = `<h1>Purchases Reciept</h1>`;
    answer += `<Strong>Name: </Strong> ${name}<br>`;
    answer += `<Strong>Email Address: </Strong>${email} <br> `
    answer += `<Strong>Amount: </Strong> $${Amo} <br>`    
    answer += `<Strong>Purchase Information: </Strong> <br> ${orderInformation} <br><hr>`
    answer += `<a href="/">HOME</a>`

    response.send(answer)

});

async function lookUpOneEntry(client, databaseAndCollection, emailName) {
    let filter = {Email: emailName};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);

   if (result) {
       return result
   } else {
       console.log(`No movie found with name ${movieName}`);
   }
}

app.get("/review", (req, res) => {
    const port = portNumber
    res.render('reviewApp', {port, port});
});

app.post("/review", async (req, res) => {
    const { email, Amo, orderInformation } = req.body;

    try {
        await client.connect();

        const query = { Email: email };  // Using the correct case as per your schema
        let inc = parseInt(Amo)

        // Assuming 'collection' is already defined in your scope as per the environment variables
        const updateResult =  await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection).updateOne(query,
            [
                { $set: { 
                    item: { $concat: [`$item`, `${orderInformation}`] },
                    Amount: { $add: ["$Amount", inc] }
                } }
            ]
        );
    
        if (updateResult.modifiedCount === 0) {
            throw new Error("No document was updated");
        }

        // Retrieve updated data
        let s = await lookUpOneEntry(client, databaseAndCollection, email);
        if (!s) {
            throw new Error("Failed to retrieve updated document.");
        }

        let answer = `<h1>Applicants Data</h1>`;
        answer += `<Strong>Name: </Strong> ${s.name}<br>`;
        answer += `<Strong>Email Address: </Strong>${s.Email} <br> `
        answer += `<Strong>Amount: </Strong>${s.Amount} <br> `
        answer += `<Strong>Background Information: </Strong> <br> ${s.item} <br><hr>`
        answer += `<a href="/">HOME</a>`

        res.send(answer);
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while processing your request.");
    } 
});

app.get("/myAmount", (req, res) => {
    const port = portNumber
    res.render('CurAmount', {port, port});
});


app.post("/myAmount", async (req, res) => {
        await client.connect();
        let { email } = req.body;
        let s = await lookUpOneEntry(client, databaseAndCollection, email);

        let answer = `<h1>Current Semester Amount</h1>`;
        answer += `<Strong>Name: </Strong> ${s.name}<br>`;
        answer += `<Strong>Email Address: </Strong>${s.Email} <br> `
        answer += `<Strong>Amount: </Strong>${s.Amount} <br> `
        answer += `<Strong>Background Information: </Strong> <br> ${s.item} <br><hr>`
        answer += `<a href="/">HOME</a>`

        if (answer.length > 0) {
            res.send(answer);
        } else {
            res.status(404).send("No records found");
        }
    
});

async function lookUpOneEntry(client, databaseAndCollection, emailName) {
    let filter = {Email: emailName};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);

   if (result) {
       return result
   } else {
       return 0
   }
}

async function lookUpGPA(client, databaseAndCollection, gpa) {
    let filter = {gpa: { $gte: gpa} };
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);

    const results = await cursor.toArray();
    return results;
}




async function clearAll() {
    try {
        await client.connect();
        // console.log("***** Clearing Collection *****");
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
        // console.log(`Deleted documents ${result.deletedCount}`);
        return result.deletedCount;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

// app.get("/create", (request, response) => { 

//     const port = portNumber
//     response.render('Submission', {port, port});

// });

// QELKCESWHECVZF8PFEQ75BXJ
// api:key: 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

// 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 2nd key

app.get("/create", async (request, response) => {

    const axios = require('axios');

    const options = {
    method: 'GET',
    url: 'https://captcha-generator.p.rapidapi.com/',
    params: {
        noise_number: '10',
        fontname: 'sora'
    },
    headers: {
        'X-RapidAPI-Key': '81f0933c8cmsh18448ea0e047c71p1f99ffjsnecddd4921002',
        'X-RapidAPI-Host': 'captcha-generator.p.rapidapi.com'
    }
    };

try {
	const res = await axios.request(options);
    let ans = res.data.solution
    let img_url = res.data.image_url  
	response.render('Submission', {names: img_url, pass: ans})

} catch (error) {
	console.error(error);
}

});




app.listen(portNumber);
