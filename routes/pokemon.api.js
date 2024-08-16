const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Allowed filter fields for validation
const allowedFilter = ["name", "type", "page", "limit"];

// Load the Pokémon data from the pokemons.json file
const loadPokemons = () => {
    const data = fs.readFileSync(path.join(__dirname, "../db.json"), "utf-8");
    return JSON.parse(data);
};


// API for getting all Pokémons with optional search by type or name, and pagination
router.get("/", (req, res, next) => {
    try {
        const search = req.query.search ? req.query.search.toLowerCase() : "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const db = loadPokemons();
        const pokemons = db.data || [];

        if (!Array.isArray(pokemons) || pokemons.length === 0) {
            const exception = new Error("No Pokémon data available");
            exception.statusCode = 500;
            throw exception;
        }

        // Filter Pokémon based on the search term in both name and types
        const filteredPokemons = pokemons.filter(pokemon => {
            const nameMatches = pokemon.name.toLowerCase().includes(search);
            const typeMatches = pokemon.types.some(type => type.toLowerCase().includes(search));
            return nameMatches || typeMatches;
        });

        // Paginate results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedPokemons = filteredPokemons.slice(startIndex, endIndex);

        res.status(200).json({
            count: paginatedPokemons.length,
            data: paginatedPokemons,
            totalPokemons: filteredPokemons.length,
        });
    } catch (error) {
        next(error);
    }
});



// API for getting a single Pokémon with previous and next Pokémon
router.get("/:id", (req, res, next) => {
    try {
        const id = parseInt(req.params.id); // Convert the ID from the URL parameter to an integer
        const db = loadPokemons();

        // Ensure that db.data exists and is an array
        const pokemons = db.data || [];

        if (!Array.isArray(pokemons) || pokemons.length === 0) {
            const exception = new Error("No Pokémon data available");
            exception.statusCode = 500;
            throw exception;
        }

        // Find the requested Pokémon
        const pokemon = pokemons.find((p) => p.id === id);
        if (!pokemon) {
            const exception = new Error("Pokemon not found");
            exception.statusCode = 404;
            throw exception;
        }

        // Find the previous and next Pokémon based on ID
        const previousPokemon = pokemons.find((p) => p.id === (id === 1 ? pokemons.length : id - 1));
        const nextPokemon = pokemons.find((p) => p.id === (id === pokemons.length ? 1 : id + 1));

        // Return the result as a JSON object
        res.status(200).json({
            data: {
                pokemon,
                previousPokemon,
                nextPokemon,
            },
        });
    } catch (error) {
        next(error);
    }
});
const pokemonTypes = [
    "bug", "dragon", "fairy", "fire", "ghost",
    "ground", "normal", "psychic", "steel", "dark",
    "electric", "fighting", "flying", "grass", "ice",
    "poison", "rock", "water"
];

router.post("/", (req, res, next) => {
    try {
        const { name, id, types, url } = req.body;

        // Validate required fields
        if (!name || !id || !types || !url) {
            const exception = new Error("Missing required data.");
            exception.statusCode = 400;
            throw exception;
        }

        // Validate number of types
        if (types.length > 2) {
            const exception = new Error("Pokémon can only have one or two types.");
            exception.statusCode = 400;
            throw exception;
        }

        // Validate types
        const invalidTypes = types.filter(type => !pokemonTypes.includes(type));
        if (invalidTypes.length > 0) {
            const exception = new Error("Pokémon's type is invalid.");
            exception.statusCode = 400;
            throw exception;
        }

        // Read data from db.json then parse to JS object
        let db = fs.readFileSync("db.json", "utf-8");
        db = JSON.parse(db);

        // Initialize the data array if it doesn't exist
        if (!db.data) {
            db.data = [];
        }
        const { data } = db;

        // Parse the id as an integer for comparison
        const parsedId = parseInt(id, 10);

        // Check if Pokémon already exists
        const existingPokemon = data.find(pokemon => parseInt(pokemon.id, 10) === parsedId || pokemon.name.toLowerCase() === name.toLowerCase());
        if (existingPokemon) {
            const exception = new Error("The Pokémon already exists.");
            exception.statusCode = 409;
            throw exception;
        }

        // Create new Pokémon object
        const newPokemon = {
            name, id: parsedId, types, url
        };

        // Add new Pokémon to the data array
        data.push(newPokemon);

        // Save updated data to db.json
        db.data = data;
        fs.writeFileSync("db.json", JSON.stringify(db), "utf-8");

        // Send response
        res.status(201).send(newPokemon);
    } catch (error) {
        next(error);
    }
});


// Serve images from the images folder
router.use("/images", express.static(path.join(__dirname, "images")));

module.exports = router;