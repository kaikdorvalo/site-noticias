


document.addEventListener("DOMContentLoaded", () => {
    const baseApi = 'https://servicodados.ibge.gov.br/api/v3/noticias/';
    const imageUrl = 'https://agenciadenoticias.ibge.gov.br/'
    let modalOpen = false;

    const defaultParams = [
        {
            name: "quantity",
            value: '10'
        }
    ]

    loadFunctions();


    async function loadFunctions() {
        loadDefaultParams(defaultParams);
        loadSearchValueInput();
        loadModalListeners();

        changeFilters();
        filterSubmit();

        addDataToDOM();
        searchButtonListener();
    }

    function loadSearchValueInput() {
        const params = new URLSearchParams(window.location.href);
        const param = params.get('busca');
        if (param !== null) {
            const input = document.getElementById('search-input');
            input.value = param;
        }
    }

    function searchButtonListener() {
        const btn = document.getElementById("btn-search");
        const input = document.getElementById("search-input");
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            let a = 'aa';
            let value = input.value.trim();

            addOrUpdateSearchParams([{ name: 'busca', value: value }]);
        })
    }

    function getUrlWithQueryStrings() {
        const params = new URLSearchParams(window.location.href);
        const page = params.get('page');
        const searchTerm = params.get('busca');
        let search = '?'
        const filters = getFiltersByQueryString();
        for (let filter of filters) {
            if (filter.value !== null) {
                if (filter.type == 'date') {
                    const date = filter.value.split('-');
                    filter.value = date[1] + "-" + date[0] + "-" + date[2];
                }

                if (search !== '?') {
                    search = search + "&" + filter.apiName + "=" + filter.value;
                } else {
                    search = search + filter.apiName + "=" + filter.value;
                }
            }
        }

        //adicionar os queries de paginação na search

        if (search === '?') {
            if (searchTerm !== null) {
                search = 'busca=' + searchTerm;
            } else {
                search = '';
            }
        } else {
            if (searchTerm !== null) {
                search = search + '&busca=' + searchTerm;
            }
        }


        if (search === '?') {
            if (page !== null) {
                search = 'page=' + page;
            } else {
                search = '';
            }
        } else {
            if (page !== null) {
                search = search + '&page=' + page;
            }
        }
        return baseApi + search;
    }

    async function getApiData() {
        try {

            const fetchUrl = getUrlWithQueryStrings();
            console.log(fetchUrl);
            let data = await fetch(fetchUrl);
            data = await data.json();

            return data;

        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async function addDataToDOM() {
        const list = document.getElementById('list');
        list.innerHTML = "";
        const data = await getApiData();
        for (let item of data.items) {
            const image = await getImageOfItem(item)

            const li = document.createElement('li');
            li.classList.add('list-item');

            const divImage = document.createElement('div');
            divImage.classList.add('box-img');
            divImage.style = `background-image:url("${image}");`

            const divContent = document.createElement('div');

            const h2 = document.createElement('h2');
            h2.classList.add('content-title');
            h2.textContent = item.titulo;

            const pDesc = document.createElement('p');
            pDesc.classList.add('content-desc')
            pDesc.textContent = item.introducao;

            const divPubli = document.createElement('div');
            divPubli.classList.add('box-publi');

            const a = document.createElement('a');
            a.href = item.link;
            a.target = '_blank'

            const btnMore = document.createElement('button');
            btnMore.classList.add('read-more-btn')
            btnMore.textContent = 'Leia Mais'

            const pPubli = document.createElement('p');
            pPubli.textContent = '#' + item.editorias;

            const pData = document.createElement('p');

            const splittedDate = item.data_publicacao.split(" ")[0].split("/")
            console.log(splittedDate)
            const publiDate = new Date(`${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`);
            console.log(publiDate)
            const dateNow = new Date();

            const ms = dateNow - new Date(publiDate);
            const days = Math.floor(ms / (1000 * 60 * 60 * 24));

            // pData.textContent = days

            switch (days) {
                case 0:
                    pData.textContent = 'Publicado hoje';
                    break;
                case 1:
                    pData.textContent = 'Publicado ontem';
                    break;
                default:
                    pData.textContent = `Publicado há ${days} dias`

            }

            divPubli.appendChild(pPubli);
            divPubli.appendChild(pData);

            a.appendChild(btnMore)

            divContent.appendChild(h2);
            divContent.appendChild(pDesc);
            divContent.appendChild(divPubli);
            divContent.appendChild(a);

            const line = document.createElement('div');
            line.classList.add('line')


            li.appendChild(divImage);
            li.appendChild(divContent);

            list.appendChild(li);
            list.appendChild(line)

        }

        loadPagination(data.totalPages)
    }

    async function getImageOfItem(item) {
        if (item.imagens) {
            const imagensObj = await JSON.parse(item.imagens)
            if (imagensObj.image_intro != '') {
                return imageUrl + imagensObj.image_intro
            }
        }

        return 'https://camo.githubusercontent.com/70937ab1109ce0ebdfc41538a3064ae7ee51592867f08e4ce5c4b4a920f3fc20/68747470733a2f2f7a7562652e696f2f66696c65732f706f722d756d612d626f612d63617573612f33363664616462316461323032353338616531333332396261333464393030362d696d6167652e706e67'

        // return imageUrl + imagensObj.image_intro
    }


    function loadDefaultParams(params) {
        let paramsString = '?';
        if (!window.location.search) {
            if (params.length === 0) {
                paramsString = ""
            }

            switch (params.length) {
                case 0:
                    paramsString = "";
                    break;
                default:
                    let i = 0;
                    for (i; i < params.length - 1; i++) {
                        paramsString = paramsString + params[i].name.toString() + "=" + params[i].value.toString() + "&";
                    }
                    paramsString = paramsString + params[i].name.toString() + "=" + params[i].value.toString();
                    break;
            }

            window.history.replaceState({}, document.title, window.location.pathname + paramsString);
        }

    }

    function changeFilters() {
        const counterFilterElement = document.getElementById('counter-filter');
        const filters = getFiltersByQueryString();

        let count = 0;

        for (let filter of filters) {
            if (filter.value !== null) {
                const element = document.getElementById(filter.id);
                if (filter.type === 'string') {
                    element.value = filter.value;
                } else if (filter.type === 'date') {
                    const dateArray = filter.value.split('-');
                    const formatedDate = dateArray[2] + '-' + dateArray[1] + '-' + dateArray[0];
                    element.value = formatedDate;
                }

                count++;
            }
        }

        counterFilterElement.innerHTML = count;

    }

    function getFiltersByQueryString() {
        const params = new URLSearchParams(window.location.search);

        const filters = [
            {
                type: 'string',
                id: 'select-type',
                apiName: 'tipo',
                value: params.get('tipo')
            },
            {
                type: 'string',
                id: 'select-quantity',
                apiName: 'qtd',
                value: params.get('quantity')
            },
            {
                type: 'date',
                id: 'dialog-filter-start-date',
                apiName: 'de',
                value: params.get('de')
            },
            {
                type: 'date',
                id: 'dialog-filter-end-date',
                apiName: 'ate',
                value: params.get('ate')
            }
        ]

        return filters;
    }

    function loadPagination(numberOfPages) {
        console.log(numberOfPages)
        const params = new URLSearchParams(window.location.href);
        let page = params.get('page');
        if (page == null) {
            page = '1';
        }
        let paginationArray = [];
        if (page !== null) {
            if (Number(page) < 6) {
                for (let i = 1; i < numberOfPages + 1 && i < 10 + 1; i++) {
                    paginationArray.push(i)
                }
            } else {
                let left = Number(page);
                let right = Number(page);
                let rightMax = numberOfPages - Number(page)
                console.log("right-max: " + rightMax)
                paginationArray = [Number(page)];



                if (rightMax < 4) {
                    for (let i = 0; i < 10 - rightMax - 1; i++) {
                        paginationArray.unshift(--left);
                    }

                    for (let i = 0; i < rightMax; i++) {
                        paginationArray.push(++right);
                    }
                } else {
                    for (let i = 0; i < 5; i++) {
                        paginationArray.unshift(--left);
                    }
                    for (let i = 0; i < 4; i++) {
                        paginationArray.push(++right);
                    }
                }
            }
        } else {
            for (let i = 1; i < 11; i++) {
                paginationArray.push(i);
            }
        }

        const paginationUl = document.getElementById('pagination-list');

        for (let i = 0; i < paginationArray.length; i++) {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.classList.add('pagination-buttom');
            button.textContent = paginationArray[i];
            li.appendChild(button)
            if (Number(page) === paginationArray[i]) {
                button.classList.add('pagination-buttom-active');
            }

            if (page === null && paginationArray[0] == 1 && i == 0) {
                button.classList.add('pagination-buttom-active');
            }


            button.addEventListener('click', () => {
                addOrUpdateSearchParams([{ name: 'page', value: button.textContent }])
            })

            paginationUl.appendChild(li);
        }
    }

    function addOrUpdateSearchParams(params) {
        var searchParams = new URLSearchParams(window.location.search);
        for (let param of params) {
            if (param.value !== '' || param.name == 'busca') {
                searchParams.set(param.name.toString(), param.value.toString());
            }
        }
        window.location.search = searchParams.toString();
    }

    function openModal(openElement) {
        if (!modalOpen) {
            openElement.showModal();
            modalOpen = true;
        }
    }

    function closeModal(closeElement) {
        if (modalOpen) {
            closeElement.close();
            modalOpen = false;
        }
    }

    function filterSubmit() {
        const filterSubmit = document.getElementById('filter-form');
        filterSubmit.addEventListener('submit', (event) => {
            event.preventDefault();
            let formatedStartDate = '';
            let formatedEndDate = '';

            const startDate = document.getElementById('dialog-filter-start-date').value;
            const endDate = document.getElementById('dialog-filter-end-date').value;

            if (startDate !== '') {
                let partes = startDate.split('-');
                formatedStartDate = partes[2] + '-' + partes[1] + '-' + partes[0];
            }

            if (endDate !== '') {
                let partes = endDate.split('-');
                formatedEndDate = partes[2] + '-' + partes[1] + '-' + partes[0];
            }

            let form = [
                { name: 'tipo', value: document.getElementById('select-type').value },
                { name: 'quantity', value: document.getElementById('select-quantity').value },
                { name: 'de', value: formatedStartDate },
                { name: 'ate', value: formatedEndDate },
            ]

            addOrUpdateSearchParams(form);
        })
    }

    function loadModalListeners() {
        const modalList = [
            {
                elementOpen: document.getElementById('filter'),
                elementModal: document.getElementById('filter-modal'),
                elementClose: document.getElementById('filter-close'),
            }
        ]

        for (let modal of modalList) {
            modal.elementOpen.addEventListener('click', () => {
                openModal(modal.elementModal);
            })

            modal.elementClose.addEventListener('click', () => {
                closeModal(modal.elementModal);
            })
        }
    }

})

