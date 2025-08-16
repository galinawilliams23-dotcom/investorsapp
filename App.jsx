// app.js — Graham Formula calculator
function grahamIntrinsicValue(eps, g, currentAAA) {
  const avgAAA = 4.4; // Graham’s baseline constant
  return eps * (8.5 + 2 * g) * (avgAAA / currentAAA);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("graham-form");
  const result = document.getElementById("result");

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const eps = parseFloat(document.getElementById("eps").value);
    const g = parseFloat(document.getElementById("growth").value);
    const y = parseFloat(document.getElementById("aaa").value);

    if ([eps, g, y].some(isNaN)) {
      result.textContent = "Please enter valid numbers.";
      return;
    }

    const value = grahamIntrinsicValue(eps, g, y);
    result.textContent = `Intrinsic Value per Share: $${value.toFixed(2)}`;
  });
});
