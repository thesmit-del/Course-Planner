import express from "express";
import axios from "axios";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.post("/geturl", async (req, res) => {
    const url = req.body.url;

    try {
        const response = await axios.post("http://localhost:5000/geturl", {
            url,
        });
        console.log(response);
    } catch (err) {
        console.error(err.message);
        return res.status(502).json({ error: "Python service unreachable" });
    }
});

app.listen(3000, () => {
    console.log("listening on port 3000");
});
