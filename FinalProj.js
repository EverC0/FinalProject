// and the need to use "stop" to stiop our webserver
const express = require("express"); /* Accessing express module */
const axios = require("axios")
const app = express();
const path = require("path");

// const fs = require("fs");

const portNumber = process.argv[2] || 5001;

const prompt = "Type stop to shutdown the server: ";
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

async function insertAcc(client, databaseAndCollection, NewStu) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(NewStu);

    }

app.get('/application', (req, res) => {
    res.render('applyApp'); 
});


app.post("/application", async (request, response) => {

    let {name, email, Amo, orderInformation } = request.body

    try {
        await client.connect();
        // console.log("***** Inserting one student *****");
        let Student = {name: name, Email: email, Amount: parseInt(Amo), item: `${orderInformation}<br>`, URL_list:[]};
        await insertAcc(client, databaseAndCollection, Student);

    } catch (e) {

        console.error(e);
    } finally {
        await client.close();
    }

    let answer = `<link rel="stylesheet" href="style.css"></link>` 
    answer += `<h1>Account Created</h1>`;
    answer += `<Strong>Name: </Strong> ${name}<br>`;
    answer += `<Strong>Email Address: </Strong>${email} <br> `
    answer += `<Strong>Age: </Strong> ${Amo} <br>`    
    answer += `<Strong>Status Information: </Strong> <br> ${orderInformation} <br><hr>`
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
       return null
   }
}

app.get("/review", (req, res) => {
    // const port = portNumber
    res.render('reviewApp');
});

async function appendToURLList(client, databaseAndCollection, email, newURL) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).updateOne(
        { Email: email },
        { $push: { URL_list: newURL } }
    );
    console.log(`URL appended. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
}

app.post("/review", async (request, response) => {
    let { email, URL } = request.body;

    const options = {
      method: 'GET',
      url: 'https://article-extractor-and-summarizer.p.rapidapi.com/summarize',
      params: {
        url: `${URL}`,
        length: '3'
      },
      headers: {
        'X-RapidAPI-Key': process.env.MY_APIS,
        'X-RapidAPI-Host': 'article-extractor-and-summarizer.p.rapidapi.com'
      }
    };

    try {
        await client.connect();

        let s = await lookUpOneEntry(client, databaseAndCollection, email);

        if (s == null) {
            return response.status(404).send("Account not found `<a href="/">HOME</a>` ");
        }

        await appendToURLList(client, databaseAndCollection, email, URL);

        // Summarize the article content
        const summarizeResponse = await axios.request(options);
        const summary = summarizeResponse.data.summary;

        let answer = `<link rel="stylesheet" href="style.css">`;
        answer += `<h1>Article Searched</h1>`;
        answer += `<div><strong>Summary:</strong> <p>${summary}</p></div>`;
        answer += `<a href="/">HOME</a>`;

        response.send(answer);

    } catch (error) {
        console.error(error);
        response.status(500).send("An error occurred while processing the request.");
    } finally {
        await client.close();
    }
});


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

app.get("/myAmount", (req, res) => {
        // const port = portNumber
        res.render('CurAmount');
    });
    
app.post("/myAmount", async (req, res) => {
    try {
        await client.connect();
        let { email } = req.body;

        if (!email) {
            return res.status(400).send("Email is required");
        }

        let s = await lookUpOneEntry(client, databaseAndCollection, email);

        if (!s) {
            return res.status(404).send("No records found");
        }

        const generateHtmlResponse = (s) => {
            let answer = `
                <link rel="stylesheet" href="style.css">
                <h1>Articles Searched</h1>
                <strong>Name: </strong>${s.name}<br>
                <strong>Email Address: </strong>${s.Email}<br>`;

            if (s.URL_list && s.URL_list.length > 0) {
                answer += `<strong>URLs:</strong><ul>`;
                s.URL_list.forEach(url => {
                    answer += `<li><a href="${url}" target="_blank">${url}</a></li>`;
                });
                answer += `</ul>`;
            } else {
                answer += `<strong>URLs:</strong> No URLs found.<br>`;
            }

            answer += `<a href="/">HOME</a>`;
            return answer;
        };

        res.send(generateHtmlResponse(s));
    } catch (error) {
        console.error("Error fetching data: ", error);
        res.status(500).send("Internal Server Error");
    } finally {
        await client.close();
    }
});


app.listen(portNumber);


