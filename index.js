import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "postgres",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;


async function allUsers() {
  const result = await db.query("SELECT * FROM users");
  return result.rows;
}

async function checkVisisted(user_id) {
  const result = await db.query("SELECT * FROM users JOIN visited_countries ON users.id = user_id WHERE users.id = $1",[user_id]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries_data = await checkVisisted(currentUserId);
  const users = await allUsers()
  // TODO FIX COLOR later
  const color = users.find((user) => user.id == currentUserId);

  res.render("index.ejs", {
    countries: countries_data,
    total: countries_data.length,
    users: users,
    color: "teal",
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        // TODO Fix insert
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode,currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add === 'new') {
    res.render('new.ejs')
  };
  const user_id = req.body.user;
  console.log(user_id, ' user id line 89');

  //console.log(user_id);
  //SELECT country_code FROM visited_countries
  try {
    //const result = await db.query("SELECT * FROM users WHERE id = $1",[user_id])
    currentUserId = user_id;
    res.redirect('/')

  } catch (error) {
    
  }

});


// It works
app.post("/new", async (req, res) => {
  
  console.log(req.body, 'body /new route');
  try {
    const result = await db.query(
      "INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id",
      [req.body.name, req.body.color]
    );
    currentUserId = result.rows[0].id;
    console.log(currentUserId,' current ID line 108');
    res.redirect('/')
  } catch (error) {
    
  }
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
