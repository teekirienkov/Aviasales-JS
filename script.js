// Получение html элементов со страницы
const formSearch = document.querySelector('.form-search'),
    inputCitiesFrom = document.querySelector('.input__cities-from'),
    dropdownCitiesFrom = document.querySelector('.dropdown__cities-from'),
    inputCitiesTo = document.querySelector('.input__cities-to'),
    dropdownCitiesTo = document.querySelector('.dropdown__cities-to'),
    inputDateDepart = document.querySelector('.input__date-depart'),
    buttonSearch = document.querySelector('.button__search'),
    cheapestTicket = document.getElementById('cheapest-ticket'),
    otherCheapTickets = document.getElementById('other-cheap-tickets');


// API в json формате (города) и прокси
const CITY_API = 'database/cities.json',
    PROXY = 'https://cors-anywhere.herokuapp.com/',
    API_KEY = '08a9b8938caabf0028f4b5d8a7064b7e',
    calendar = 'http://min-prices.aviasales.ru/calendar_preload';

// Массив с городами (создан через let так как в дальнейшем туда записываются города)
let city = [];

// Функция получения данных с сервера (запросы) УНИВЕРСАЛЬНАЯ ФУНКЦИЯ!
const getData = (url, callback) => {
    const request = new XMLHttpRequest();

    request.open('GET', url);

    request.addEventListener('readystatechange', ()=>{
        if(request.readyState !== 4) {return;} // Сделал так потому что JSHint ругается
        
        if(request.status === 200) {
            callback(request.response);
        } else {
            console.error(request.status);
        }
    });
    request.send();
};
// Функция с алгоритмом живого поиска
const showCity = (input, list) => {
    list.textContent = '';
    if (input.value !== '') {
        const filterCity = city.filter((item)=> {      
            const fixItem = item.name.toLowerCase();
            return fixItem.startsWith(input.value.toLowerCase());
        });
        filterCity.forEach((item) => {
            const li = document.createElement('li');
            li.classList.add('dropdown__city');   // добавления класса в DOM 
            li.textContent = item.name;
            list.append(li);
        });
    }
};
// Функция выбора города из выпадающего списка (и удаление списка после выбора)
const selectCity = (event, input, list) => {
    const target = event.target;
    if (target.tagName.toLowerCase() === 'li') {
        input.value = target.textContent;
        list.textContent = '';
    }
};

const getNameCity = (code) => {
    const objCity = city.find((item) => item.code === code);
    return objCity.name;
}; 

// Функция которая вызывается в createCard (в html коде) которая выводит кол-во пересадок
const getChanges = (n) => {
    if (n) {
        return n === 1 ? 'С одной пересадкой' : 'С двумя пересадками';
    } else {
        return 'Без пересадок';
    }
};
const createCard = (data) => {
    const ticket = document.createElement('article');      // создание элемента
    ticket.classList.add('ticket');

    let deep = '';

    if (data) {
        deep = `
        <h3 class="agent">${data.gate}</h3>
        <div class="ticket__wrapper">
	        <div class="left-side">
		        <a href="https://www.aviasales.ru/search/SVX2905KGD1" class="button button__buy">Купить
			            за ${data.value}₽</a>
	    </div>
	    <div class="right-side">
		    <div class="block-left">
			    <div class="city__from">Вылет из города
				    <span class="city__name">${getNameCity(data.origin)}</span>
			    </div>
			<div class="date">${data.depart_date} г.</div>
		    </div>

		    <div class="block-right">
			    <div class="changes">${getChanges(data.number_of_changes)}</div>
			    <div class="city__to">Город назначения:
				    <span class="city__name">${getNameCity(data.destination)}</span>
			    </div>
		    </div>
	        </div>
        </div>
        `;
    } else {
        deep = '<h3>К сожалению билетов на эту дату не нашлось</h3>';
    }

    ticket.insertAdjacentHTML('afterbegin', deep);

    return ticket;
};

// Функция билета
const renderCheapDay = (cheapTicket) => {
    const ticket = createCard(cheapTicket[0]); // так как получаем массив, чтобы получить самый дешевый билет получаем самый первый через индекс 0

    cheapestTicket.append(ticket); // добавление в форму "самый дешевый билет на выбранную дату"

    console.log(ticket);
};
// Функция билетов
const renderCheapYear = (cheapTickets) => {
    
    cheapTickets.sort((a, b)=> a.value - b.value); // сортировка по ценам (работает только с числами)

    console.log(cheapTickets);
};

// Функция рендеринга билетов (ticket) получает сразу best_prices
const renderCheap = (data, date) => {
    const cheapTicketYear = JSON.parse(data).best_prices;
    
    const cheapTicketDay = cheapTicketYear.filter((item) => {
        return item.depart_date === date;
    });

    renderCheapDay(cheapTicketDay);
    renderCheapYear(cheapTicketYear);
};



// Обработчики событий ввода названия города (функция с живым поиском)
inputCitiesFrom.addEventListener('input', ()=>{
    showCity(inputCitiesFrom, dropdownCitiesFrom);
});
inputCitiesTo.addEventListener('input', ()=>{
    showCity(inputCitiesTo, dropdownCitiesTo);
});
// Обработчики событий выбора города (функция с выбором из списка и удалением списка)
dropdownCitiesFrom.addEventListener('click', (event) => {
    selectCity(event, inputCitiesFrom, dropdownCitiesFrom);
});
dropdownCitiesTo.addEventListener('click', (event) => {
    selectCity(event, inputCitiesTo, dropdownCitiesTo);
});


// Обработчик событий формы поиска
formSearch.addEventListener('submit', (event)=>{
    event.preventDefault();
    
    const cityFrom = city.find((item) => {
            return inputCitiesFrom.value === item.name;
        }), // получение города из которого летим
    
    cityTo = city.find((item) => {
            return inputCitiesTo.value === item.name;
        }); // получение города в который летим

    const formData = {
        from: cityFrom,       // получение кода города (обращение к объекту)
        to: cityTo,           // тоже самое
        when: inputDateDepart.value
    };

    if (formData.from && formData.to) {
        const requestData = `?depart_date=${formData.when}&origin=${formData.from.code}`+
        `&destination=${formData.to.code}&one_way=true`;
    
        getData(calendar + requestData, (response)=> {
            renderCheap(response, formData.when);
        });
    } else {
        alert('Введите корректное название города!');
    }
});

// Получение списка городов и присваивание в массив city
getData(CITY_API, (data) => {
    city = JSON.parse(data).filter((item) => {
        return item.name;    // filter(item) нужен для того чтобы убрать null в городах!
    });                      // return item.name - переводит в булев тип
});