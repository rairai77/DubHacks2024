const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
let counter = 0;
app.get("/", (req, res) => {
    counter++;
    res.send("Howdy Neighbor " + counter);
});
app.post("/", (req, res) => {

});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
