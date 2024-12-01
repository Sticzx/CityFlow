document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ticketPaymentForm');
    const loadCardButton = document.getElementById('loadCard');
    const ticketPriceElement = document.getElementById('ticketPrice');
    const historyList = document.getElementById('purchaseHistory');
    const saveCardCheckbox = document.getElementById('saveCard');

    let selectedPrice = 0;

    const prices = {
        ulgowy: { '24h': 5.00, '7dni': 20.00, 'miesiąc': 50.00 },
        normalny: { '24h': 10.00, '7dni': 40.00, 'miesiąc': 100.00 }
    };

    const updatePrice = () => {
        const type = form.ticketType.value;
        const period = form.ticketPeriod.value;
        selectedPrice = prices[type][period];
        ticketPriceElement.textContent = `Cena: ${selectedPrice.toFixed(2)} zł`;
    };

    form.ticketType.addEventListener('change', updatePrice);
    form.ticketPeriod.addEventListener('change', updatePrice);

    loadCardButton.addEventListener('click', () => {
        const cardData = JSON.parse(localStorage.getItem('creditCard'));
        if (cardData) {
            form.cardNumber.value = cardData.cardNumber;
            form.cardExpiry.value = cardData.cardExpiry;
            form.cardCVC.value = cardData.cardCVC;
            alert('Dane karty zostały załadowane.');
        } else {
            alert('Brak zapisanej karty.');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const cardNumber = form.cardNumber.value;
        const cardExpiry = form.cardExpiry.value;
        const cardCVC = form.cardCVC.value;

        if (!cardNumber || !cardExpiry || !cardCVC) {
            alert('Wypełnij wszystkie pola płatności.');
            return;
        }

        const isPaymentSuccessful = Math.random() > 0.1;
        if (isPaymentSuccessful) {
            alert(`Płatność w wysokości ${selectedPrice.toFixed(2)} zł zakończona sukcesem!`);

            if (saveCardCheckbox.checked) {
                const cardData = { cardNumber, cardExpiry, cardCVC };
                localStorage.setItem('creditCard', JSON.stringify(cardData));
            }

            const type = form.ticketType.value;
            const period = form.ticketPeriod.value;
            const date = new Date().toLocaleString();

            const newPurchase = { type, period, date, price: selectedPrice, active: false, activationTime: null };
            const history = JSON.parse(localStorage.getItem('ticketHistory')) || [];
            history.unshift(newPurchase);

            // Ogranicz historię do 5 biletów
            if (history.length > 5) {
                history.pop();
            }

            localStorage.setItem('ticketHistory', JSON.stringify(history));
            loadHistory();
        } else {
            alert('Płatność nie powiodła się. Spróbuj ponownie.');
        }

        form.reset();
        ticketPriceElement.textContent = 'Cena: -';
    });

    const loadHistory = () => {
        const history = JSON.parse(localStorage.getItem('ticketHistory')) || [];
        historyList.innerHTML = '';
        history.slice(0, 5).forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                ${item.type} - ${item.period} (${item.date}) - Cena: ${item.price.toFixed(2)} zł
                ${item.active 
                    ? `<strong>(Aktywowany: ${item.activationTime})</strong>` 
                    : `<button class="activate-button" data-index="${index}">Aktywuj</button>`}
            `;
            historyList.appendChild(listItem);

            // Obsługa aktywacji przycisku
            const activateButton = listItem.querySelector('.activate-button');
            if (activateButton) {
                activateButton.addEventListener('click', () => activateTicket(index));
            }
        });
    };

    const activateTicket = (index) => {
        const history = JSON.parse(localStorage.getItem('ticketHistory')) || [];
        const ticket = history[index];
        if (!ticket.active) {
            ticket.active = true;
            ticket.activationTime = new Date().toLocaleString();

            localStorage.setItem('ticketHistory', JSON.stringify(history));
            loadHistory();
            alert('Bilet został aktywowany!');
        }
    };

    // Inicjalizacja
    loadHistory();
    updatePrice();
});
