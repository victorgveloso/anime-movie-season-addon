const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 7000;

const UPSTREAM_URL = "https://victorgveloso.github.io/animes-season-addon";

app.use(cors());

// Handle manifest.json specifically
app.get('/manifest.json', async (req, res) => {
    try {
        const response = await axios.get(`${UPSTREAM_URL}/manifest.json`);
        let json = response.data;

        // 1. Overwrite ID and Name
        json.id = "animes-movie-season-addon";
        json.name = "Anime movie's season";

        // 2. Remove types[1]
        if (json.types && json.types.length > 1) {
            json.types.splice(1, 1); // Removes the second element
        }

        // 3. Remove catalogs[2] and catalogs[0]
        // IMPORTANT: Remove higher index first to avoid shifting issues
        if (json.catalogs) {
            if (json.catalogs.length > 2) json.catalogs.splice(2, 1);
            if (json.catalogs.length > 0) json.catalogs.shift();
        }

        res.json(json);
    } catch (error) {
        console.error(error);
        res.status(502).send('Bad Gateway');
    }
});

// Proxy everything else
app.use(async (req, res) => {
    try {
        const url = UPSTREAM_URL + req.originalUrl;
        const response = await axios({
            method: req.method,
            url: url,
            responseType: 'stream'
        });

        // FIX: Remove headers that conflict with the decompressed stream
        delete response.headers['content-length'];
        delete response.headers['content-encoding'];
        delete response.headers['transfer-encoding'];

        res.set(response.headers);
        response.data.pipe(res);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).send(error.response.statusText);
        } else {
            console.error(error); // Good to log the actual error for debugging
            res.status(502).send('Bad Gateway');
        }
    }
});

app.listen(PORT, () => {
    console.log(`Addon active on port ${PORT}`);
});