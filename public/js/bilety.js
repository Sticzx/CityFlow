document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ticketForm');
    const paymentForm = document.getElementById('paymentForm');
    const loadCardButton = document.getElementById('loadCard');
    const historyList = document.getElementById('purchaseHistory');
    const ticketPriceElement = document.getElementById('ticketPrice');
    const saveCardCheckbox = document.getElementById('saveCard');

    let selectedPrice = 0; // Przechowuje cenę aktualnego biletu

    const prices = {
        ulgowy: { '24h': 5.00, '7dni': 20.00, 'miesiąc': 50.00 },
        normalny: { '24h': 10.00, '7dni': 40.00, 'miesiąc': 100.00 }
    };

    // Aktualizuj cenę biletu
    const updatePrice = () => {
        const type = form.ticketType.value;
        const period = form.ticketPeriod.value;
        selectedPrice = prices[type][period];
        ticketPriceElement.textContent = `Cena: ${selectedPrice.toFixed(2)} zł`;
    };

    form.ticketType.addEventListener('change', updatePrice);
    form.ticketPeriod.addEventListener('change', updatePrice);

    // Załaduj zapisane dane karty
    const loadSavedCard = () => {
        const cardData = JSON.parse(localStorage.getItem('creditCard'));
        if (cardData) {
            document.getElementById('cardNumber').value = cardData.cardNumber;
            document.getElementById('cardExpiry').value = cardData.cardExpiry;
            document.getElementById('cardCVC').value = cardData.cardCVC;
            alert('Dane karty zostały załadowane.');
        } else {
            alert('Brak zapisanej karty. Wprowadź dane ręcznie.');
        }
    };

    loadCardButton.addEventListener('click', loadSavedCard);

    // Obsługa formularza płatności
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cardNumber = document.getElementById('cardNumber').value;
        const cardExpiry = document.getElementById('cardExpiry').value;
        const cardCVC = document.getElementById('cardCVC').value;

        if (!cardNumber || !cardExpiry || !cardCVC) {
            alert('Proszę wypełnić wszystkie pola płatności.');
            return;
        }

        // Symulacja płatności
        const isPaymentSuccessful = Math.random() > 0.1; // 90% szans na powodzenie
        if (isPaymentSuccessful) {
            alert(`Płatność w wysokości ${selectedPrice.toFixed(2)} zł zakończona sukcesem!`);

            // Zapisz dane karty, jeśli zaznaczono checkbox
            if (saveCardCheckbox.checked) {
                const cardData = { cardNumber, cardExpiry, cardCVC };
                localStorage.setItem('creditCard', JSON.stringify(cardData));
                alert('Dane karty zostały zapisane.');
            }

            // Dodaj bilet do historii
            const type = form.ticketType.value;
            const period = form.ticketPeriod.value;
            const date = new Date().toLocaleString();

            const newPurchase = { type, period, date, price: selectedPrice, active: false, activationTime: null };
            let history = JSON.parse(localStorage.getItem('ticketHistory')) || [];
            history.unshift(newPurchase);
            if (history.length > 5) {
                history.pop();
            }

            localStorage.setItem('ticketHistory', JSON.stringify(history));
            loadHistory();
            form.reset();
            ticketPriceElement.textContent = 'Cena: -';
            paymentForm.reset();
        } else {
            alert('Płatność nie powiodła się. Spróbuj ponownie.');
        }
    });

    // Załaduj historię zakupów
    const loadHistory = () => {
        const history = JSON.parse(localStorage.getItem('ticketHistory')) || [];
        historyList.innerHTML = '';
        history.slice(0, 5).forEach(item => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                ${item.type} - ${item.period} (${item.date}) - Cena: ${item.price.toFixed(2)} zł
                ${item.active ? `<strong>(Aktywowany: ${item.activationTime})</strong>` : `<button>Aktywuj</button>`}
            `;
            historyList.appendChild(listItem);

            // Dodaj obsługę aktywacji biletu
            if (!item.active) {
                const activateButton = listItem.querySelector('button');
                activateButton.addEventListener('click', () => activateTicket(item, history));
            }
        });
    };

    // Aktywuj bilet
    const activateTicket = (ticket, history) => {
        const now = new Date().toLocaleString();
        ticket.active = true;
        ticket.activationTime = now;

        // Zapisz zaktualizowaną historię
        localStorage.setItem('ticketHistory', JSON.stringify(history));
        loadHistory();
        alert('Bilet został aktywowany!');
    };

    // Inicjalizacja
    loadHistory();
    updatePrice();
});
