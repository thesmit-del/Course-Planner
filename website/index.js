import express from "express";
import axios from "axios";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function isValidUrl(str) {
    try {
        const u = new URL(str);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

app.get("/", (req, res) => {
    res.render("index.ejs", { result: null });
});

app.post("/geturl", async (req, res) => {
    const url = req.body.url;
    if (!isValidUrl(url)) {
        // render with an explicit “error” flag rather than an empty object
        return res.render("index.ejs", { result: null, error: "INVALID_URL" });
    }
    try {
        const response = await axios.post("http://localhost:5000/geturl", {
            url,
        });
        const result = response.data;
        return res.render("index.ejs", { result });
    } catch (err) {
        console.error(err.message);
        return res.status(502).json({ error: "Python service unreachable" });
    }
});

app.listen(3000, () => {
    console.log("listening on port 3000");
});
