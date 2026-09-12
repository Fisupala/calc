const display = document.querySelector("#display");
const expression = document.querySelector("#calculation-text");
const modal = document.querySelector("#payment-modal");
const paymentForm = document.querySelector("#payment-form");
const closeModal = document.querySelector("#close-modal");

let currentValue = "0";
let storedValue = null;
let operator = null;
let waitingForValue = false;
let calculation = null;
let resultUnlocked = false;
let lastExpression = "";
let percentPending = false;

function closePaymentModal() {
    if (!modal.open || modal.classList.contains("is-closing")) return;
    modal.classList.add("is-closing");
    window.setTimeout(() => {
        modal.close();
        modal.classList.remove("is-closing");
    }, 190);
}

function updateDisplay() {
    let expressionValue = "0";
    if (calculation && resultUnlocked) expressionValue = calculation.text;
    else if (storedValue !== null && operator && !waitingForValue) expressionValue = `${storedValue} ${operator} ${currentValue}${percentPending ? "%" : ""}`;
    else if (storedValue !== null && operator) expressionValue = `${storedValue} ${operator}`;
    else if (!calculation) expressionValue = currentValue;
    const displayValue = resultUnlocked ? currentValue : (calculation || storedValue !== null ? "-" : "0");
    display.textContent = displayValue;
    const availableWidth = display.clientWidth;
    const characterCount = Math.max(displayValue.length, 1);
    const fittedSize = availableWidth / (characterCount * .62);
    display.style.fontSize = `${Math.max(18, Math.min(76, fittedSize))}px`;
    display.classList.toggle("compact", displayValue.length > 8);
    display.classList.toggle("result-reveal", resultUnlocked);
    if (expressionValue !== lastExpression) {
        const characters = [...expressionValue].map((character, index) => {
            const characterElement = document.createElement("span");
            characterElement.className = "expression-character";
            characterElement.classList.add(index === expressionValue.length - 1 ? "new-character" : "shift-character");
            characterElement.textContent = character;
            return characterElement;
        });
        expression.replaceChildren(...characters);
        lastExpression = expressionValue;
    }
}
function enterValue(value) { resultUnlocked = false; calculation = null; percentPending = false; if (waitingForValue) { currentValue = value === "." ? "0." : value; waitingForValue = false; } else if (value === "." && currentValue.includes(".")) return; else if (currentValue === "0" || currentValue === "LOCKED") currentValue = value; else currentValue += value; updateDisplay(); }
function calculate(first, second, selectedOperator) { if (selectedOperator === "+") return first + second; if (selectedOperator === "-") return first - second; if (selectedOperator === "*") return first * second; if (selectedOperator === "/") return second === 0 ? 0 : first / second; return second; }
function chooseOperator(nextOperator) { const inputValue = Number(currentValue); if (operator && waitingForValue) { operator = nextOperator; updateDisplay(); return; } if (storedValue === null) storedValue = inputValue; else storedValue = calculate(storedValue, inputValue, operator); operator = nextOperator; waitingForValue = true; updateDisplay(); }
function applyPercent() { const inputValue = Number(currentValue); currentValue = storedValue !== null && operator ? String(storedValue * inputValue / 100) : String(inputValue / 100); waitingForValue = false; updateDisplay(); }
function finishCalculation() { if (storedValue === null || !operator) return; const first = storedValue; const typedValue = Number(currentValue); const second = percentPending ? first * typedValue / 100 : typedValue; const answer = calculate(first, second, operator); calculation = { answer, text: `${first} ${operator} ${percentPending ? `${typedValue}%` : second}` }; currentValue = String(answer); storedValue = null; operator = null; waitingForValue = true; percentPending = false; resultUnlocked = false; updateDisplay(); modal.showModal(); }

document.querySelectorAll(".key").forEach((key) => {
    key.addEventListener("click", () => {
        const { value, action } = key.dataset;
        if (action === "clear") { currentValue = "0"; storedValue = null; operator = null; waitingForValue = false; calculation = null; percentPending = false; resultUnlocked = false; }
        else if (action === "backspace") currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : "0";
        else if (action === "equals") { finishCalculation(); return; }
        else if (["+", "-", "*", "/"].includes(value)) chooseOperator(value);
        else if (value === "%") { percentPending = true; updateDisplay(); }
        else enterValue(value);
        updateDisplay();
        if (action === "clear") {
            display.classList.remove("display-reset");
            void display.offsetWidth;
            display.classList.add("display-reset");
        }
        if (action === "backspace") {
            display.classList.remove("display-delete");
            void display.offsetWidth;
            display.classList.add("display-delete");
        }
    });
});

closeModal.addEventListener("click", closePaymentModal);
modal.addEventListener("cancel", (event) => { event.preventDefault(); closePaymentModal(); });
paymentForm.addEventListener("submit", (event) => { event.preventDefault(); if (!paymentForm.checkValidity() || !calculation) return; currentValue = String(calculation.answer); resultUnlocked = true; updateDisplay(); closePaymentModal(); });
updateDisplay();
