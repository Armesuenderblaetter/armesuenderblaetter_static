// Paste the actual content from the downloaded witness_switcher.js file here
const witnesses = ["wmW", "wmR"];
let selectedWitness = null;

if (hash.startsWith("#witness=")) {
    const witnessFromHash = hash.replace("#witness=", "");
    if (witnesses.includes(witnessFromHash)) {
        selectedWitness = witnessFromHash;
    }
}

// Remove any existing witness data attribute from the body
document.body.removeAttribute('data-active-witness');

if (selectedWitness) {
    // Add the data attribute for the selected witness
    document.body.setAttribute('data-active-witness', selectedWitness);
}

document.addEventListener("DOMContentLoaded", updateWitnessView);
window.addEventListener("hashchange", updateWitnessView);

// Also run immediately in case the script is loaded after DOM is ready
if (document.readyState !== 'loading') {
    updateWitnessView();
}
    updateWitnessView();
}
