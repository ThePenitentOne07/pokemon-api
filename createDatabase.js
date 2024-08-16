const fs = require("fs");
const path = require("path");
const csv = require("csvtojson");

const createDatabase = async () => {
    try {
        // Read and parse the CSV file
        let newData = await csv().fromFile("pokemon.csv");

        // Initialize an ID counter
        let idCounter = 1;

        // Map the CSV data to the desired format
        newData = newData.map((e) => {
            const imageName = `${e.Name.toLowerCase()}.png`;
            const imagePath = path.join("images", imageName); // Update with your actual images folder path

            // Check if the image file exists
            const imageExists = fs.existsSync(imagePath);

            // Only include Pokémon with an existing image file
            if (!imageExists) return null;

            const types = [];
            if (e.Type1) types.push(e.Type1.toLowerCase());
            if (e.Type2) types.push(e.Type2.toLowerCase());

            return {
                id: idCounter++,            // Increment the ID for each Pokémon
                name: e.Name,               // Pokémon name
                types: types,               // Array containing type1 and type2 if available
                url: imagePath              // URL to the image
            };
        }).filter((e) => e !== null); // Filter out any entries without a corresponding image

        // Read and parse the db.json file, or create a new object if the file is empty or doesn't exist
        let data;
        try {
            const fileContent = fs.readFileSync("db.json", "utf-8");
            data = fileContent ? JSON.parse(fileContent) : { data: [] };
        } catch (error) {
            console.error("Error reading or parsing db.json. Creating a new database object.", error);
            data = { data: [] }; // Initialize a new object if db.json doesn't exist or is empty
        }

        // Update the pokemons field with new data
        data.data = newData;

        // Write the updated data back to db.json
        fs.writeFileSync("db.json", JSON.stringify(data, null, 2));
        console.log("Database updated successfully with detailed Pokémon data:", newData);

    } catch (error) {
        console.error("An error occurred while creating the database:", error);
    }
}

createDatabase();
