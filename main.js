const baseAPI = "https://pokeapi.co/api/v2/";
const flexContainer = document.getElementById("flex-container");
const placeholder = document.getElementById("placeholder");
const totalPokemon = document.getElementById("total-pokemon");
const modalBackdrop = document.getElementById("backdrop");
const modalTitle = document.getElementById("modal-title");
const modalImage = document.getElementById("modal-image");
const compareList = document.getElementById("compare-list");

let page = 0;
let pokemonArray = [];
let currentChart;
let foundPokemon;

const POKEMON_STATS = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Special Attach",
  "special-defense": "Special Defense",
  speed: "Speed",
};

const showModal = (pokemonId) => {
  while (compareList.firstChild) {
    compareList.removeChild(compareList.lastChild);
  }

  pokemonArray.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.id;

    let firstLetter = p.name.charAt(0);
    firstLetter = firstLetter.toUpperCase();
    const restOfOption = p.name.substring(1);

    option.innerText = `${firstLetter}${restOfOption}`;

    if (p.id === pokemonId) {
      option.selected = true;
    }

    compareList.appendChild(option);
  });

  foundPokemon = pokemonArray.find((p) => p.id === pokemonId);

  modalTitle.innerText = foundPokemon.name;
  modalImage.src = foundPokemon.sprites.front_default;

  renderChart(foundPokemon);

  modalBackdrop.classList.remove("hidden");
};

const addCard = (pokemon) => {
  const newCard = placeholder.cloneNode(true);
  const loadingSpinner = newCard.querySelector(".lds-ring");

  loadingSpinner.remove();

  const title = newCard.querySelector(".title");
  title.innerText = pokemon.name;

  const image = newCard.querySelector("img");
  image.src = pokemon.sprites.front_default;

  const typesDiv = newCard.querySelector(".types");
  const types = pokemon.types.map((type) => type.type.name);
  typesDiv.innerText = types.join(", ");

  const weightDiv = newCard.querySelector(".weight");
  weightDiv.innerText = `${pokemon.weight} kg`;

  newCard.id = pokemon.id;

  newCard.onclick = () => showModal(pokemon.id);

  flexContainer.appendChild(newCard);
};

const getPokemonList = () => {
  fetch(`${baseAPI}pokemon?limit=20&offset=${page * 20}`)
    .then((res) => res.json())
    .then((data) => {
      const fetchedPokemon = data.results;

      const requests = fetchedPokemon.map((pokemon) => {
        return fetch(pokemon.url)
          .then((res) => res.json())
          .then((data) => {
            pokemonArray.push(data);
            console.log(pokemonArray);
            addCard(data);
          });
      });

      return Promise.all(requests);
    })
    .finally(() => {
      placeholder.classList.add("hidden");
    });
};

const showAndMovePlaceholder = () => {
  placeholder.classList.remove("hidden");
  placeholder.remove();
  flexContainer.appendChild(placeholder);
};

const nextPage = () => {
  showAndMovePlaceholder();
  page++;
  getPokemonList();
  totalPokemon.innerText = (page + 1) * 20;
};

const dismissModal = (e) => {
  if (e.currentTarget === e.target) {
    modalBackdrop.classList.add("hidden");
    currentChart.destroy();
  }
};

modalBackdrop.onclick = dismissModal;

const renderChart = (pokemon) => {
  const chartCanvas = document.getElementById("statsChart");

  const statsData = pokemon.stats.reduce(
    (accumulator, stat) => {
      accumulator.names.push(POKEMON_STATS[stat.stat.name]);
      accumulator.values.push(stat.base_stat);
      return accumulator;
    },
    { names: [], values: [] }
  );

  currentChart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels: statsData.names,
      datasets: [
        {
          label: pokemon.name,
          data: statsData.values,
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 255,
        },
      },
    },
  });
};

const compare = (e) => {
  const newPokemonId = e.target.value;
  const comparisonPokemon = pokemonArray.find((p) => p.id === +newPokemonId);

  const newPokemonStats = comparisonPokemon.stats.map((stat) => stat.base_stat);

  const newDataset = {
    label: comparisonPokemon.name,
    data: newPokemonStats,
    borderWidth: 1,
  };

  if (
    foundPokemon.id === +newPokemonId &&
    currentChart.data.datasets.length === 2
  ) {
    currentChart.data.datasets.pop();
  } else if (currentChart.data.datasets.length === 2) {
    currentChart.data.datasets[1] = newDataset;
  } else {
    currentChart.data.datasets.push(newDataset);
  }

  currentChart.update();
};

compareList.onchange = compare;

getPokemonList();
