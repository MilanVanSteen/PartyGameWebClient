const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the root
app.use(express.static(path.join(__dirname)));

// Catch-all route for client-side routing
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => console.log(`Frontend server running on port ${PORT}`));