document.addEventListener("DOMContentLoaded", async function () {
    const inputField = document.getElementById("pokemonInput");
    const searchButton = document.getElementById("searchButton");

    let allPokemonNames = [];

    // Fetch all Pokemon names once when the page loads
    try {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
        const data = await response.json();
        allPokemonNames = data.results.map(pokemon => pokemon.name);
    } catch (error) {
        console.error("Failed to fetch Pokémon list:", error);
    }

    // trigger search when Enter key is pressed
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            fetchPokemon(allPokemonNames);
        }
    });

    searchButton.addEventListener("click", function () {
        fetchPokemon(allPokemonNames);
    });
});



function showToast(message, suggestedName = null) {
    const toastContainer = document.getElementById("toast-container");
    const toastMessage = document.getElementById("toastMessage");
    const toastElement = document.getElementById("custom-toast");
    const closeToastBtn = document.getElementById("closeToast");

    if (!toastContainer || !toastMessage || !toastElement) {
        console.error("Toast elements not found.");
        return;
    }

     if (suggestedName) {
        toastMessage.innerHTML = `Pokémon not found. Did you mean: 
            <span id="suggestion" class="suggestion">${suggestedName}</span>?`;
    } else {
        toastMessage.textContent = message;
    }

    // show the toast
    toastContainer.classList.remove("d-none");
    setTimeout(() => {
        toastElement.style.opacity = "1";
    }, 10); // small delay for fade-in

    // hide after 9 seconds
    setTimeout(() => {
        hideToast();
    }, 9000);

    // Close button functionality
    closeToastBtn.onclick = hideToast;

    // attach event listener to suggestion after it's created
    if (suggestedName) {
        setTimeout(() => {
            const suggestionElement = document.getElementById("suggestion");
            if (suggestionElement) {
                suggestionElement.addEventListener("click", function () {
                    document.getElementById("pokemonInput").value = suggestedName;
                    hideToast();
                });
            } else {
                console.error("Suggestion element not found.");
            }
        }, 100); // small delay to ensure its loaded
    }
}

function hideToast() {
    const toastContainer = document.getElementById("toast-container");
    const toastElement = document.getElementById("custom-toast");

    if (toastElement) {
        toastElement.style.opacity = "0";
        setTimeout(() => {
            toastContainer.classList.add("d-none");
        }, 300); // Wait for fadeout animation
    }
}

async function fetchPokemon(allPokemonNames) {
    const input = document.getElementById("pokemonInput").value.toLowerCase().trim();
    const pokemonInfo = document.getElementById("pokemonInfo");
    const loading = document.getElementById("loading");

    if (!input) {
        showToast("Please enter a Pokémon name or ID.");
        return;
    } 
    loading.classList.replace("d-none", "d-block");

   


    const pokemonName = isNaN(input) ? getValidPokemonName(input, allPokemonNames) : input;

    if (!pokemonName) { 
        loading.classList.replace("d-block", "d-none");
        return;
    }

    try {
        const data = await getPokemonData(pokemonName);
        updatePokemonInfo(data);
    } catch (error) {
        showToast("Pokémon not found. Please try again.");
    } finally { 
        loading.classList.replace("d-block", "d-none");
        pokemonInfo.classList.replace("d-none", "d-block");
    }
}
function getValidPokemonName(input, allPokemonNames) {

    const closestMatch = findClosestMatch(input, allPokemonNames);
    if (closestMatch !== input ? suggestClosestMatch(closestMatch) : input) {
        return closestMatch
    }

}

function suggestClosestMatch(closestMatch) {
    if (closestMatch !== null) {
        showToast("Pokémon not found.", closestMatch);
        return null; // prevents fetchPokemon from continuing until user confirms
    } else {
        showToast("Pokémon not found.");
        return null;
    }
}

// Fetch Pokemon data from the API
async function getPokemonData(pokemonName) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    if (!response.ok) {
        throw new Error("Pokémon not found");
    }
    return await response.json();
}

// Update ui with pokemon info 
function updatePokemonInfo(data) {
    document.getElementById("pokemonName").textContent = data.name.toUpperCase();
    document.getElementById("pokemonImage").src = data.sprites.front_default;

    const types = data.types.map(type => type.type.name).join(", ");
    document.getElementById("pokemonType").textContent = `Type: ${types}`;

    document.getElementById("pokemonHeight").textContent = `Height: ${data.height / 10} m`;
    document.getElementById("pokemonWeight").textContent = `Weight: ${data.weight / 10} kg`;

    const abilities = data.abilities.map(ability => ability.ability.name).join(", ");
    document.getElementById("pokemonAbilities").textContent = `Abilities: ${abilities}`;

    // Make Pokemon info visible
    const pokemonInfo = document.getElementById("pokemonInfo");
    pokemonInfo.classList.toggle("d-none");
    setTimeout(() => pokemonInfo.style.opacity = "1", 100);
}


// search to find the closest match 
function findClosestMatch(input, pokemonList) {
    let bestMatch = null;
    let bestScore = Infinity;

    pokemonList.forEach(pokemon => {
        const score = levenshteinDistance(input, pokemon);
        if (score < bestScore) {
            bestScore = score;
            bestMatch = pokemon;
        }
    });

    return bestScore <= 2 ? bestMatch : null; // typo tolerance
}

// calculate levenshtein distance, found this on stackoverflow
function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[a.length][b.length];
}
